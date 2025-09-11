'use client'

import { CreateRoomDialog, type CreateRoomValues } from '@/components/play-page/room/CreateRoomDialog'
import { EmptyRoomCard } from '@/components/play-page/room/EmptyRoomCard'
import { GameRoomCard } from '@/components/play-page/room/GameRoomCard'
import { PongPagination } from '@/components/PongPagination'
import { Button } from '@/components/ui/button'
import { GameIcon } from '@/icons'
import { api } from '@/lib/net/client-axios'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

type GameRoom = {
  id: number
  title: string
  entry_fee: number
  status: 'WAITING' | 'PLAYING'
  level: 'HARD' | 'NORMAL' | 'EASY'
  game_name: string
  count: number
}

const PAGE_SIZE = 6
const TOTAL_ROOMS = 17 // demo

export default function PlayRoomsHome() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [createOpen, setCreateOpen] = useState(false)
  const [roomsThisPage, setRooms] = useState<GameRoom[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1️⃣ API 호출
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)

    api.get(`/api/gameroom?page=${page}`)
      .then(({ data }) => {
        if (!alive) return
        setRooms(data.game_rooms.content)
        setTotalPages(data.total_pages)
      })
      .catch((e: any) => {
        if (!alive) return
        setError(e?.message ?? '게임방 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => { alive = false }
  }, [page])

  // 2️⃣ 웹소켓 연결
  useEffect(() => {
    const socket = new SockJS(process.env.NEXT_PUBLIC_WEBSOCKET_URL as string) // 서버 WebSocket 엔드포인트
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    })

    client.onConnect = () => {

      // 게임방 리스트 구독
      client.subscribe('/topic/gameroom', (msg) => {
        const body = JSON.parse(msg.body)
        if (body.type === 'list') {
          const start = (page - 1) * PAGE_SIZE
          const slicedRooms = body.data.slice(start, start + PAGE_SIZE)

          setRooms(slicedRooms)
          setTotalPages(Math.ceil(body.data.length / PAGE_SIZE));
        }
      })
    }

    client.activate()

    return () => { client.deactivate() }
  }, [page])

  const roomsWithPlaceholders = useMemo(() => {
    const placeholders = Array.from({ length: Math.max(0, PAGE_SIZE - roomsThisPage.length) }, () => null)
    return [...roomsThisPage, ...placeholders]
  }, [roomsThisPage])

  const goPage = (next: number) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set('page', String(next))
    router.push(`${pathname}?${p.toString()}`)
  }

  // 실제 생성 API 연결 위치
  async function handleCreate(data: CreateRoomValues) {
    // 예시: entry_fee, status, count 등 서버에서 결정
    // await api.post('/api/rooms', {
    //   title: data.title,
    //   game_name: data.game === 'TURTLE' ? 'Turtle Run' : 'Mugunghwa',
    //   level: data.level,
    // })
    await api.post(`/api/gameroom`, {
      title: data.title,
      game_level_id: data.level,
    })
    console.log('create room:', data)
    // 생성 후 목록 새로고침/데이터 refetch
    router.refresh?.()
    setCreateOpen(false)
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

      <div className="grid grid-cols-2 grid-rows-3 gap-2">
        {roomsWithPlaceholders.map((room, idx) =>
          room ? <GameRoomCard key={room.id} {...room} /> : <EmptyRoomCard key={`empty-${idx}`} />,
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <PongPagination page={page} totalPages={totalPages} onChange={goPage} />
      </div>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
    </div>
  )
}
