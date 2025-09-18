'use client'

import { X } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

import BlueTurtleIcon from '@public/blue_turtle.png'
import BrownTurtleIcon from '@public/brown_turtle.png'
import DefaultTurtleIcon from '@public/default_turtle.png'
import GrayTurtleIcon from '@public/gray_turtle.png'
import GreenTurtleIcon from '@public/green_turtle.png'
import OrangeTurtleIcon from '@public/orange_turtle.png'
import PinkTurtleIcon from '@public/pink_turtle.png'
import PurpleTurtleIcon from '@public/purple_turtle.png'
import RandomTurtleIcon from '@public/random_turtle.png'
import YellowTurtleIcon from '@public/yellow_turtle.png'

import { HostIcon, PlayerIcon } from '@/icons'

import { tokenStore } from '@/lib/auth/token-store' // ✅ 통일
import { api } from '@/lib/net/client-axios'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { useAuthStore } from '@/stores/auth-store'
import { Client } from '@stomp/stompjs'

type Player = {
  user_id: number
  nickname: string
  ready: boolean
  room_id: number
  turtle_id?: string
}

type RoomDetail = {
  id: number
  title: string
  entry_fee: number
  status: 'WAITING' | 'PLAYING'
  host_id: number
  level: 'HARD' | 'NORMAL' | 'EASY'
  game_name: 'Turtle Run' | 'Pong Marble'
  game_type: 'turtle' | 'board'
}

type ChatMsg = {
  sender: string
  message: string
  system: boolean
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

// 아이콘 매핑 → 이미지 매핑
const TURTLE_IMAGES: Record<string, StaticImageData> = {
  default: DefaultTurtleIcon,
  green: GreenTurtleIcon,
  orange: OrangeTurtleIcon,
  pink: PinkTurtleIcon,
  yellow: YellowTurtleIcon,
  brown: BrownTurtleIcon,
  purple: PurpleTurtleIcon,
  gray: GrayTurtleIcon,
  blue: BlueTurtleIcon,
  random: RandomTurtleIcon,
}

export default function GameRoomPage() {
  const sentJoinMsgRef = useRef(false)
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  // ---- 서버 데이터 상태 ----
  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [chatMsg, setChatMsg] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const chatBoxRef = useRef<HTMLDivElement | null>(null)

  // ✅ STOMP client 재사용
  const clientRef = useRef<Client | null>(null)

  // ---- 방 정보 로드 ----
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await api.get<RoomDetail>(`/api/gameroom/${id}`)
        console.log('🚀 ~ GameRoomPage ~ data:', data)
        if (!alive) return
        setRoom(data)
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

  // ---- 소켓 연결 ----
  useEffect(() => {
    if (!id || !room?.game_type) return
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL as string
    const token = tokenStore.get()

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    })
    clientRef.current = client

    client.onConnect = () => {
      // 구독
      client.subscribe(`/topic/gameroom/${room.game_type}/${id}`, (message) => {
        const body = JSON.parse(message.body)
        switch (body.type) {
          case 'enter':
          case 'exit':
          case 'ready':
          case 'choice': {
            // ✅ 플레이어 리스트 갱신
            const list = (body.data.players ?? body.data) as Player[]
            setPlayers(
              list.map((p) => ({
                user_id: p.user_id,
                nickname: p.nickname,
                ready: p.ready,
                turtle_id: p.turtle_id ?? 'default',
                room_id: p.room_id,
              })),
            )

            // ✅ 새 방장 id가 오면 room.host_id 갱신
            const nextHostId = body.data.host_id ?? body.host_id ?? body.data.next_host_id ?? null

            if (typeof nextHostId === 'number') {
              setRoom((prev) => (prev ? { ...prev, host_id: nextHostId } : prev))
            } else {
              // 🔁 서버가 host_id를 안 보내는 경우(임시 보정):
              // 현재 host가 리스트에 없으면 첫 플레이어를 방장으로 가정 (서버에서 정해주는 게 최선입니다)
              setRoom((prev) => {
                if (!prev) return prev
                const hostStillHere = list.some((p) => p.user_id === prev.host_id)
                if (!hostStillHere && list[0]) {
                  return { ...prev, host_id: list[0].user_id }
                }
                return prev
              })
            }
            break
          }
          case 'start': {
            router.push(`/game/${id}`)

            break
          }
          case 'chat': {
            setMessages((prev) => [...prev, body.data as ChatMsg])
            break
          }
          default:
            console.warn('Unhandled WS event', body)
        }
      })

      // 입장 알림
      if (client.connected) {
        client.publish({
          destination: `/app/gameroom/enter/${id}`,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      }

      // ✅ 입장 시스템 채팅 (연결된 뒤, 한 번만)
      if (client.connected && !sentJoinMsgRef.current) {
        const nickname = useAuthStore.getState().user?.nickname ?? '알 수 없음'
        client.publish({
          destination: `/app/gameroom/chat/${id}`,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: JSON.stringify({ msg: `${nickname} 님이 입장했습니다.`, system: true }),
        })
        sentJoinMsgRef.current = true
      }
    }

    client.activate()

    // ✅ 같은 effect의 cleanup에서 퇴장 처리 + 이후 deactivate
    return () => {
      if (client.connected) {
        const t = tokenStore.get()
        const nickname = useAuthStore.getState().user?.nickname ?? ''
        client.publish({
          destination: `/app/gameroom/chat/${id}`,
          headers: t ? { Authorization: `Bearer ${t}` } : {},
          body: JSON.stringify({ msg: `${nickname} 님이 퇴장했습니다.`, system: true }),
        })
        client.publish({
          destination: `/app/gameroom/exit/${id}`,
          headers: t ? { Authorization: `Bearer ${t}` } : {},
        })
      }
      client.deactivate()
      clientRef.current = null
    }
  }, [id, router, room?.game_type, room?.game_name])

  // 새 메시지 오면 스크롤 맨 아래로
  useEffect(() => {
    const el = chatBoxRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const maxPlayers = room ? GAME_CONFIG[room.game_name] : 8

  const hostId = room?.host_id ?? null
  const userId = useAuthStore((s) => s.user?.id)
  const userNickname = useAuthStore((s) => s.user?.nickname)
  const me = useMemo(() => players.find((p) => p.user_id === userId), [players, userId])
  const isHostMe = !!(userId && hostId && userId === hostId)

  // 시작 가능 여부 계산 (호스트만 시작 가능 + 호스트는 ready 제외)
  const canStart = isHostMe && players.length >= 2 && players.filter((p) => p.user_id !== hostId).every((p) => p.ready)

  // 남이 고른 (고유하게 막아야 하는) 거북이들
  const takenByOthers = useMemo(() => {
    const s = new Set<string>()
    for (const p of players) {
      if (!p.turtle_id) continue
      if (p.user_id === userId) continue // 나는 예외
      // 'random'은 중복 허용하려면 제외
      if (p.turtle_id === 'random') continue
      s.add(p.turtle_id)
    }
    return s
  }, [players, userId])

  const myChoice = me?.turtle_id ?? null

  // 8칸 고정: 활성 수만 empty, 나머지 locked
  const slots = useMemo(() => {
    const playable = Math.min(maxPlayers, TOTAL_SLOTS)
    const filledPlayers = players.slice(0, playable).map<Slot>((p) => ({ type: 'player', player: p }))
    const empties: Slot[] = Array.from({ length: Math.max(0, playable - filledPlayers.length) }, (_, i) => ({
      type: 'empty',
      id: i + 1,
    }))
    const locked: Slot[] = Array.from({ length: Math.max(0, TOTAL_SLOTS - playable) }, (_, i) => ({
      type: 'locked',
      id: i + 1,
    }))
    return [...filledPlayers, ...empties, ...locked]
  }, [players, maxPlayers])

  // ✅ 준비 토글 → 서버 publish
  function toggleReady() {
    if (!me || !clientRef.current) return
    const token = tokenStore.get()
    clientRef.current.publish({
      destination: `/app/gameroom/ready/${id}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ isReady: !me.ready }),
    })
  }

  // ✅ 게임 시작 → 서버 publish (서버에서 start broadcast)
  function startGame() {
    if (!room || !clientRef.current || !isHostMe || !canStart) return
    const token = tokenStore.get()
    clientRef.current.publish({
      destination: `/app/gameroom/start/${id}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }

  // ✅ 채팅 전송
  function sendChat() {
    if (!clientRef.current || !chatMsg.trim()) return
    const token = tokenStore.get()
    clientRef.current.publish({
      destination: `/app/gameroom/chat/${id}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ msg: chatMsg, system: false }),
    })
    setChatMsg('')
  }

  function chooseTurtle(turtleId: string) {
    if (!clientRef.current || !id) return

    // 남이 이미 선택한 거북이면 막기 (random은 예외적으로 허용 중)
    if (takenByOthers.has(turtleId)) return

    const token = tokenStore.get()
    clientRef.current.publish({
      destination: `/app/gameroom/choice/${id}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ turtle_id: turtleId }),
    })

    // 낙관적 업데이트
    setPlayers((prev) => {
      const uid = useAuthStore.getState().user?.id
      return prev.map((p) => (p.user_id === uid ? { ...p, turtle_id: turtleId } : p))
    })
  }

  if (loading) return <div className="container mx-auto p-6">불러오는 중…</div>
  if (error || !room)
    return <div className="container mx-auto p-6 text-red-600">{error ?? '방을 찾을 수 없습니다.'}</div>

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between text-3xl font-extrabold">
        <div className="flex items-center gap-2">
          <div className="text-foreground/70">{room.title}</div>
        </div>
        <Button onClick={() => router.back()} className="bg-secondary-royal hover:bg-secondary-sky">
          뒤로가기
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 flex flex-col justify-between gap-6">
          {/* 플레이어 슬롯 */}
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
              if (slot.type === 'player')
                return <PlayerTile key={`player-${idx}`} player={slot.player} hostId={hostId} />
            })}
          </div>

          {/* 채팅/알림 영역 */}
          <Card className="relative h-36 gap-0 py-2">
            <CardContent
              className="mb-9 flex max-h-20 grow items-center justify-center overflow-y-scroll text-sm"
              ref={chatBoxRef}
            >
              {messages.length === 0 ? (
                <div className="text-muted-foreground flex h-full items-center justify-center">채팅/알림 영역</div>
              ) : (
                <div className="item flex w-full flex-col space-y-2">
                  {messages.map((m, idx) =>
                    m.system ? (
                      <div key={idx} className="text-muted-foreground text-center text-xs">
                        {m.message}
                      </div>
                    ) : (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="font-bold">{m.sender === userNickname ? '나' : `#${m.sender}`}</span>:
                        <span className="break-words">{m.message}</span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
            <div className="absolute bottom-2 flex w-full gap-2 px-2">
              <Input
                placeholder="메시지를 입력하세요"
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendChat()
                }}
              />
              <Button className="bg-secondary-royal hover:bg-secondary-navy" onClick={sendChat}>
                전송
              </Button>
            </div>
          </Card>
        </div>

        <div className="col-span-1 flex flex-col justify-between">
          <TurtleSelectGrid onSelect={chooseTurtle} taken={takenByOthers} myChoice={myChoice} level={room.level} />
          {/* 시작 / 준비 버튼 */}
          <div className="mt-8">
            {isHostMe ? (
              <Button
                className="bg-secondary-royal hover:bg-secondary-navy h-14 w-full text-lg font-extrabold"
                disabled={!canStart || me?.turtle_id === 'default'}
                onClick={startGame}
                aria-disabled={!isHostMe}
                title={!isHostMe ? '방장만 시작할 수 있습니다' : undefined}
              >
                게임시작
              </Button>
            ) : (
              <Button
                onClick={toggleReady}
                className={cn(
                  'h-14 w-full text-lg font-extrabold',
                  me?.ready ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-secondary-royal hover:bg-secondary-navy',
                )}
                disabled={me?.turtle_id === 'default'}
              >
                {me?.ready ? '준비 해제' : '준비하기'}
              </Button>
            )}

            <p className="text-muted-foreground mt-2 text-xs">
              {isHostMe ? '모든 인원이 준비되면 시작할 수 있어요.' : '방장만 게임을 시작할 수 있습니다.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 단일 플레이어 카드 */
function PlayerTile({ player, hostId }: { player: Player; hostId: number | null }) {
  const isHost = hostId != null && player.user_id === hostId
  const img = player.turtle_id ? TURTLE_IMAGES[player.turtle_id] : null

  return (
    <Card className="relative aspect-square overflow-hidden p-4">
      {isHost ? (
        <HostIcon className="absolute top-2 left-2 z-10" />
      ) : (
        <PlayerIcon className="absolute top-2 left-2 z-10" />
      )}

      <CardContent className="flex h-full flex-col justify-between gap-2 p-0">
        {/* 거북이 이미지 영역 */}
        <div className="relative w-full flex-1 overflow-hidden rounded-md">
          {img && (
            <Image
              src={img}
              alt={`${player.nickname}의 거북이`}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 40vw, 180px"
              priority={false}
            />
          )}
        </div>

        {/* 닉네임/상태 */}
        <div className="flex items-center justify-between">
          <div className="max-w-[70%] truncate font-bold">{player.nickname}</div>
          <div
            className={cn(
              'font-medium',
              isHost ? 'text-primary-black' : player.ready ? 'text-emerald-600' : 'text-muted-foreground',
            )}
          >
            {isHost ? '방장' : player.ready ? '준비완료' : '대기중'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TurtleSelectGrid({
  onSelect,
  taken,
  myChoice,
  level,
}: {
  onSelect: (id: string) => void
  taken: Set<string> // 다른 사람들이 점유한 turtle_id 집합 (내 선택은 제외 권장)
  myChoice: string | null
  level: 'HARD' | 'NORMAL' | 'EASY'
}) {
  const turtleOrder = ['green', 'orange', 'pink', 'yellow', 'brown', 'purple', 'gray', 'blue', 'random'] as const
  const baseOrder = turtleOrder.filter((t) => t !== 'random') // 난이도 제한이 적용되는 8마리
  const activeCount = level === 'HARD' ? 8 : level === 'NORMAL' ? 6 : 4

  return (
    <div className="grid grid-cols-3 gap-3">
      {turtleOrder.map((tid) => {
        const img = TURTLE_IMAGES[tid]
        const baseIdx = baseOrder.indexOf(tid as any)

        // 난이도에 따른 활성화 여부: random은 항상 활성 / 그 외는 activeCount보다 앞쪽만 활성
        const isActiveByLevel = tid === 'random' || (baseIdx !== -1 && baseIdx < activeCount)

        // 다른 유저가 이미 선택한 경우 (내 선택은 예외)
        const isTakenByOther = taken.has(tid) && myChoice !== tid

        const isMine = myChoice === tid
        const disabledByLevel = !isActiveByLevel
        const disabledByTaken = isTakenByOther
        const disabled = disabledByLevel || disabledByTaken

        return (
          <button
            key={tid}
            type="button"
            onClick={() => {
              if (!disabled) onSelect(tid)
            }}
            disabled={disabled}
            aria-disabled={disabled}
            aria-pressed={isMine}
            title={
              disabledByTaken
                ? '다른 플레이어가 이미 선택했어요'
                : disabledByLevel
                  ? '이 난이도에서는 선택할 수 없어요'
                  : isMine
                    ? '내가 선택한 거북이'
                    : undefined
            }
            className={cn(
              'relative aspect-square overflow-hidden rounded-md border p-0 ring-offset-2 transition',
              disabled
                ? 'cursor-not-allowed opacity-40 blur-[1px] grayscale-[60%]'
                : isMine
                  ? 'border-secondary-royal ring-secondary-royal/40 ring-2'
                  : 'border-muted hover:border-secondary-royal',
            )}
          >
            <Image
              src={img}
              alt={`${tid} turtle`}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 30vw, 120px"
            />
          </button>
        )
      })}
    </div>
  )
}
