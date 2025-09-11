'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { HostIcon, PlayerIcon } from '@/icons'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

type Player = {
  id: number
  name: string
  ready: boolean
  isHost?: boolean
}

type RoomDetail = {
  id: number
  title: string
  entry_fee: number
  status: 'WAITING' | 'PLAYING'
  host_id: number
  level: 'HARD' | 'NORMAL' | 'EASY'
  game_name: 'Turtle Run' | 'Pong Marble'
}

const GAME_CONFIG: Record<RoomDetail['game_name'], number> = {
  'Turtle Run': 8,
  'Pong Marble': 4,
}

const TOTAL_SLOTS = 8

type Slot =
  | { type: 'player'; player: Player }
  | { type: 'empty'; id: number } // 활성(참여 가능) 빈 자리
  | { type: 'locked'; id: number } // 규칙상 잠금 자리

export default function GameRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  // ---- 서버 데이터 상태 ----
  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 데모용 내 유저 id (실제엔 auth-store에서 가져와 주세요)
  // const userId = useAuthStore((s) => s.user?.id)
  const userId = 15 // 데모

  // --- 데모 상태 (실제에선 서버/소켓에서 주입) ---
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: '암신한', ready: false, isHost: true },
    { id: 2, name: '플레이어1', ready: false },
    { id: 3, name: '플레이어2', ready: false },
    { id: 4, name: '플레이어3', ready: true },
  ])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        // 실제 호출 예:
        // const { data } = await api.get<RoomDetail>(`/api/rooms/${id}`)
        // if (!alive) return
        // setRoom(data)

        // --- 데모 응답 ---
        const demo: RoomDetail =
          Number(id) % 2 === 0
            ? {
                id: Number(id),
                title: '거북이 게임하기',
                entry_fee: 10,
                status: 'WAITING',
                host_id: 15,
                level: 'HARD',
                game_name: 'Turtle Run',
              }
            : {
                id: Number(id),
                title: '무궁화 꽃이 피었습니다',
                entry_fee: 5,
                status: 'WAITING',
                host_id: 15,
                level: 'NORMAL',
                game_name: 'Pong Marble',
              }

        if (!alive) return
        setRoom(demo)

        // 호스트 표시 동기화(데모용)
        setPlayers((prev) => prev.map((p) => ({ ...p, isHost: p.id === demo.host_id })))
      } catch (e: any) {
        setError(e?.message ?? '방 정보를 불러오지 못했습니다.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  const maxPlayers = room ? GAME_CONFIG[room.game_name] : 8

  // 본인/호스트
  const me = useMemo(() => players.find((p) => p.id === userId), [players, userId])
  const isHost = !!me?.isHost

  const slots = useMemo(() => {
    const playable = Math.min(maxPlayers, TOTAL_SLOTS)

    // 1) 활성 슬롯 안에서: 플레이어 채우고, 남으면 empty
    const filledPlayers = players.slice(0, playable).map<Slot>((p) => ({ type: 'player', player: p }))
    const empties: Slot[] = Array.from({ length: Math.max(0, playable - filledPlayers.length) }, (_, i) => ({
      type: 'empty',
      id: i + 1,
    }))

    // 2) 나머지 비활성(locked) 슬롯
    const locked: Slot[] = Array.from({ length: Math.max(0, TOTAL_SLOTS - playable) }, (_, i) => ({
      type: 'locked',
      id: i + 1,
    }))

    return [...filledPlayers, ...empties, ...locked] // 항상 길이 8 보장
  }, [players, maxPlayers])

  function toggleReady() {
    if (!me) return
    setPlayers((prev) => prev.map((p) => (p.id === me.id ? { ...p, ready: !p.ready } : p)))
  }

  function startGame() {
    if (!room) return
    const allOk = players.length > 1 && players.every((p) => p.ready || p.isHost)
    if (!allOk) return
    // 실제 시작 요청 -> 성공 시 이동
    router.push(`/rooms/${room.id}/play`)
  }

  if (loading) return <div className="container mx-auto p-6">불러오는 중…</div>
  if (error || !room)
    return <div className="container mx-auto p-6 text-red-600">{error ?? '방을 찾을 수 없습니다.'}</div>

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between text-3xl font-extrabold">
        <div className="flex items-center gap-2">
          <div className="text-foreground/70">게임방 이름이 들어갑니다</div>
        </div>
        <Button onClick={() => router.back()} className="bg-secondary-royal hover:bg-secondary-sky">
          뒤로가기
        </Button>
      </div>

      <div className="grid h-full grid-cols-4 gap-4">
        <div className="col-span-3 flex flex-col gap-6">
          <div className="grid grid-cols-4 gap-3">
            {slots.map((slot, idx) => {
              if (slot.type === 'locked') {
                return (
                  <Card key={`locked-${idx}`} className="bg-muted/50 aspect-square opacity-60">
                    <CardContent className="flex h-full items-center justify-center p-0">
                      <div className="text-muted-foreground text-xs">사용 불가</div>
                    </CardContent>
                  </Card>
                )
              }
              if (slot.type === 'empty') {
                return (
                  <Card key={`empty-${idx}`} className="bg-muted/60 aspect-square">
                    <CardContent className="text-muted-foreground flex h-full items-center justify-center text-sm">
                      <X className="h-10 w-10" />
                    </CardContent>
                  </Card>
                )
              }
              // player
              return <PlayerTile key={slot.player.id} player={slot.player} />
            })}
          </div>
          {/* 채팅/알림 영역 (placeholder) */}
          <Card className="grow gap-0 py-2">
            <CardContent className="text-muted-foreground flex h-full min-h-5 items-center justify-center text-sm"></CardContent>
            <CardFooter className="px-2">
              <Input placeholder="채팅/알림 영역 (추후 구현 예정)" className="" />
            </CardFooter>
          </Card>
        </div>
        <div className="col-span-1 flex flex-col justify-between">
          {/* 3×3 플레이 모드/맵 프리뷰 Placeholder */}
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-muted aspect-square rounded-md shadow-inner" />
            ))}
          </div>

          {/* 시작 버튼 */}
          <div className="mt-8">
            {!isHost ? (
              <Button
                className="bg-secondary-royal hover:bg-secondary-navy h-14 w-full text-lg font-extrabold"
                disabled={!isHost || players.length < 2 || !players.every((p) => p.ready || p.isHost)}
                onClick={startGame}
                aria-disabled={!isHost}
                title={!isHost ? '방장만 시작할 수 있습니다' : undefined}
              >
                게임시작
              </Button>
            ) : (
              <Button
                onClick={() => toggleReady()}
                className={cn(
                  'h-14 w-full text-lg font-extrabold',
                  me.ready ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-secondary-royal hover:bg-secondary-navy',
                )}
              >
                {me.ready ? '준비 해제' : '준비하기'}
              </Button>
            )}

            <p className="text-muted-foreground mt-2 text-xs">
              {isHost ? '모든 인원이 준비되면 시작할 수 있어요.' : '방장만 게임을 시작할 수 있습니다.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 단일 플레이어 카드 */
function PlayerTile({ player }: { player: Player }) {
  return (
    <Card className="relative aspect-square overflow-hidden p-4">
      {/* 왕관 아이콘(방장) */}
      {player.isHost ? (
        <HostIcon className="absolute top-2 left-2 z-10" />
      ) : (
        <PlayerIcon className="absolute top-2 left-2 z-10" />
      )}
      <CardContent className="flex h-full flex-col justify-between gap-2 p-0">
        <div className="bg-primary-black/10 grow"></div>
        <div className="flex items-center justify-between">
          <div className="max-w-[70%] truncate font-bold">{player.name}</div>
          <div className={cn('font-medium', player.ready ? 'text-emerald-600' : 'text-muted-foreground')}>
            {player.ready ? '준비완료' : '대기중'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
