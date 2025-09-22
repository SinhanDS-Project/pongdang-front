'use client'

import { Client, IMessage } from '@stomp/stompjs'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import SockJS from 'sockjs-client'

import { api } from '@/lib/net/client-axios'
import { tokenStore } from '@/stores/token-store'

import { CreateRoomDialog } from '@/components/play-page/room/CreateRoomDialog'
import { EmptyRoomCard } from '@/components/play-page/room/EmptyRoomCard'
import { GameRoomCard } from '@/components/play-page/room/GameRoomCard'
import { PongPagination } from '@/components/PongPagination'
import { Button } from '@/components/ui/button'
import { GameIcon } from '@/icons'

type GameRoom = {
  id: number
  title: string
  entry_fee: number
  status: 'WAITING' | 'PLAYING'
  level: 'HARD' | 'NORMAL' | 'EASY'
  game_name: string
  game_type: string
  count: number
}

const PAGE_SIZE = 6

export default function PlayRoomsHome() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const [createOpen, setCreateOpen] = useState(false)
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ---------- 1) 초기 목록 로드 (HTTP) ----------
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        // 백엔드 응답 포맷 예시:
        // { game_rooms: { content: GameRoom[] }, total_pages: number }
        const { data } = await api.get(`/api/gameroom?page=${page}`)
        if (!alive) return
        setRooms(data.game_rooms?.content ?? [])
        setTotalPages(Math.max(1, data.total_pages ?? 1))
      } catch (e: any) {
        if (!alive) return
        setError(e?.message ?? '게임방 목록을 불러오지 못했습니다.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [page])

  // ---------- 2) 실시간 갱신 (STOMP over SockJS) ----------
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    if (!wsUrl) {
      console.error('NEXT_PUBLIC_WEBSOCKET_URL 환경변수가 없습니다.')
      return
    }

    const access = tokenStore.get() // 필요 시 Authorization 헤더로 전달
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl), // ★ 반드시 "새" 인스턴스 반환
      connectHeaders: access ? { Authorization: `Bearer ${access}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {}, // 필요시 콘솔 로깅
      onStompError: (frame) => {
        console.error('[STOMP ERROR]', frame.headers['message'], frame.body)
      },
      onWebSocketError: (e) => {
        console.error('[WS ERROR]', e)
      },
    })

    client.onConnect = () => {
      // 서버가 브로드캐스트하는 토픽 경로에 맞춰주세요.
      const sub = client.subscribe('/topic/gameroom', (msg: IMessage) => {
        try {
          const body = JSON.parse(msg.body)

          // 예시1) 전체 리스트 브로드캐스트
          // { type: 'list', data: GameRoom[] }
          if (body?.type === 'list' && Array.isArray(body.data)) {
            const start = (page - 1) * PAGE_SIZE
            const sliced = body.data.slice(start, start + PAGE_SIZE)
            setRooms(sliced)
            setTotalPages(Math.max(1, Math.ceil(body.data.length / PAGE_SIZE)))
          }

          // 예시2) 단일 방 변경 patch
          // { type: 'patch', room: GameRoom }
          if (body?.type === 'patch' && body.room?.id) {
            setRooms((prev) => prev.map((r) => (r.id === body.room.id ? { ...r, ...body.room } : r)))
          }

          // 예시3) 방 생성/삭제 이벤트 시 현재 페이지 재요청(간단)
          if (body?.type === 'created' || body?.type === 'deleted') {
            router.refresh?.() // (선택) next/cache 갱신
            // 혹은 fetch 한 번 더:
            // api.get(`/api/gameroom?page=${page}`).then(({ data }) => {
            //   setRooms(data.game_rooms.content); setTotalPages(data.total_pages)
            // })
          }
        } catch (err) {
          console.error('소켓 메시지 파싱 실패:', err, msg.body)
        }
      })

      // 필요 시 서버로 초기 요청 publish (서버가 page별로 push 해줄 때)
      client.publish({ destination: '/app/gameroom', body: JSON.stringify({ page }) })
    }

    client.activate()
    return () => {
      client.deactivate()
    }
  }, [page, router])

  // 3) 6칸 유지용 placeholder
  const roomsWithPlaceholders = useMemo(() => {
    const placeholders = Array.from({ length: Math.max(0, PAGE_SIZE - rooms.length) }, () => null)
    return [...rooms, ...placeholders]
  }, [rooms])

  // 4) 페이지 이동
  const goPage = (next: number) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set('page', String(next))
    router.push(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between text-3xl font-extrabold">
        <div className="flex items-center gap-2">
          <div className="text-foreground/70">
            다같이 퐁!<span className="text-secondary-royal">게임방</span>
          </div>
          <GameIcon />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-secondary-royal hover:bg-secondary-sky">
          방만들기
        </Button>
      </div>

      {/* 목록 상태 */}
      {loading ? (
        <div className="text-muted-foreground py-10 text-center">불러오는 중…</div>
      ) : error ? (
        <div className="py-10 text-center text-red-600">{error}</div>
      ) : (
        <>
          {/* 2×3 고정 그리드 */}
          <div className="grid grid-cols-2 grid-rows-3 gap-2">
            {roomsWithPlaceholders.map((room, idx) =>
              room ? (
                <GameRoomCard key={(room as GameRoom).id} {...(room as GameRoom)} />
              ) : (
                <EmptyRoomCard key={`empty-${idx}`} />
              ),
            )}
          </div>

          {/* 페이지네이션 */}
          <div className="mt-6 flex justify-center">
            <PongPagination page={page} totalPages={totalPages} onChange={goPage} />
          </div>
        </>
      )}

      {/* 방 만들기 모달 */}
      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
