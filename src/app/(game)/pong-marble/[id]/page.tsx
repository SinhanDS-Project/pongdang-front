'use client'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'

import { useMarbleSocket } from '@/lib/socket/useMarbleSocket'

import { useMe } from '@/hooks/use-me'

import { Game, Land, Player, Quiz, RoomState } from '@/types/pongMarble'

import {
  DiceCard,
  GameBoard,
  InfoDialog,
  PlayerCard,
  PurchaseDialog,
  QuizDialog,
  ResultDialog,
  TollDialog,
} from '@/components/pong-marble-page'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

import { api } from '@/lib/net/client-axios'
import { Bell } from 'lucide-react'

type Room = {
  title: string
  game_type: 'turtle' | 'board'
}

interface GameState {
  game: Game
  messages: string[]
  quiz?: Quiz
  quizResult?: { is_correct: boolean; correct_idx: number; explanation?: string }
  quizOwnerUserId?: number | null
}

type GameAction =
  | { type: 'START_GAME'; game: Game }
  | { type: 'ROLL'; players?: Player[]; roomState?: RoomState; message?: string }
  | { type: 'PURCHASE'; land: Land; players?: Player[]; message?: string }
  | { type: 'TOLL'; lands: Land[]; players?: Player[]; message?: string }
  | { type: 'TAX'; game: Game; message?: string }
  | { type: 'SALARY'; players?: Player[]; roomState?: RoomState; message?: string }
  | { type: 'QUIZ'; quiz?: Quiz; turnOrder?: number | null }
  | {
      type: 'QUIZ_CHECK'
      select_idx: number
      is_correct: boolean
      lands: Land[]
      players: Player[]
      explanation?: string
      message?: string
    }
  | { type: 'QUIZ_CLEAR' }
  | { type: 'PRISON'; players?: Player[]; message?: string }
  | { type: 'BANKRUPTCY'; roomState: RoomState; lands: Land[]; players: Player[]; message: string }
  | { type: 'EXIT'; players?: Player[]; message?: string }
  | { type: 'TURN_END'; roomState: RoomState; message?: string }
  | { type: 'GAME_END'; players?: Player[] }

const initialState: GameState = {
  game: {
    roomState: {
      current_turn: 0,
      round: 1,
      max_round: 10,
      pot: 0,
      double_count: 0,
      double: false,
    },
    lands: [], // ← 빈 배열
    players: [], // ← 빈 배열
  },
  messages: [],
  quiz: undefined,
  quizResult: undefined,
}

function appendCapped(list: string[], incoming?: string | string[], cap = 50): string[] {
  if (!incoming) return list
  const add = Array.isArray(incoming) ? incoming : [incoming]
  const next = [...list, ...add]
  return next.length > cap ? next.slice(next.length - cap) : next
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, game: action.game }
    case 'ROLL': {
      const { players, roomState, message } = action
      return {
        ...state,
        game: {
          ...state.game,
          players: players ?? state.game.players,
          roomState: roomState ?? state.game.roomState,
          lands: state.game.lands, // 유지
        },
        messages: appendCapped(state.messages, message), // 👈
      }
    }
    case 'PURCHASE': {
      const { land, message } = action

      const updated = land
      const nextLands = (() => {
        const idx = state.game.lands.findIndex((l) => l.land_id === updated.land_id)
        if (idx === -1) return [...state.game.lands, updated] // 없으면 추가(방어)
        return state.game.lands.map((l) => (l.land_id === updated.land_id ? { ...l, ...updated } : l))
      })()
      return {
        ...state,
        game: {
          ...state.game,
          lands: nextLands,
          players: action.players ?? state.game.players, // 서버가 players 갱신 주면 반영
        },
        messages: appendCapped(state.messages, message),
      }
    }
    case 'TOLL': {
      const { lands, players, message } = action

      return {
        ...state,
        game: {
          ...state.game,
          players: players ?? state.game.players,
          lands: lands ?? state.game.lands, // 유지
        },
        messages: appendCapped(state.messages, message),
      }
    }
    case 'TAX': {
      const { game, message } = action

      return {
        ...state,
        game: {
          ...state.game,
          ...game,
          roomState: game.roomState ?? state.game.roomState,
          players: game.players ?? state.game.players,
          lands: game.lands ?? state.game.lands,
        },
        messages: appendCapped(state.messages, message),
      }
    }
    case 'SALARY': {
      const { roomState, players, message } = action

      return {
        ...state,
        game: {
          ...state.game,
          roomState: roomState ?? state.game.roomState,
          players: players ?? state.game.players,
        },
        messages: appendCapped(state.messages, message),
      }
    }
    case 'QUIZ': {
      return {
        ...state,
        quiz: action.quiz,
        quizResult: undefined,
        quizOwnerUserId: action.turnOrder ?? state.quizOwnerUserId,
      }
    }
    case 'QUIZ_CHECK': {
      const patchById = new Map((action.lands ?? []).map((l) => [l.land_id, l]))
      const nextLands = state.game.lands.map((l) =>
        patchById.has(l.land_id) ? { ...l, ...patchById.get(l.land_id)! } : l,
      )
      patchById.forEach((v, k) => {
        if (!state.game.lands.some((l) => l.land_id === k)) nextLands.push(v)
      })

      return {
        ...state,
        game: { ...state.game, lands: nextLands, players: action.players ?? state.game.players },
        quizResult: { is_correct: action.is_correct, correct_idx: action.select_idx, explanation: action.explanation },
        messages: appendCapped(state.messages, action.message ?? (action.is_correct ? '퀴즈 정답!' : '퀴즈 오답…')),
      }
    }
    case 'QUIZ_CLEAR': {
      return {
        ...state,
        quiz: undefined,
        quizResult: undefined,
        quizOwnerUserId: null,
      }
    }
    case 'PRISON': {
      const { players, message } = action

      return {
        ...state,
        game: { ...state.game, players: players ?? state.game.players },
        messages: appendCapped(state.messages, message),
      }
    }
    case 'BANKRUPTCY': {
      const { roomState, lands, players, message } = action

      return {
        ...state,
        game: {
          ...state.game,
          roomState: roomState ?? state.game.roomState,
          lands: lands ?? state.game.lands,
          players: players ?? state.game.players,
        },
        messages: appendCapped(state.messages, message),
      }
    }
    case 'EXIT': {
      const { players, message } = action

      return {
        ...state,
        game: { ...state.game, players: players ?? state.game.players },
        messages: appendCapped(state.messages, message),
      }
    }
    case 'TURN_END': {
      const { roomState, message } = action

      return {
        ...state,
        game: { ...state.game, roomState: roomState },
        messages: appendCapped(state.messages, message),
      }
    }
    case 'GAME_END': {
      return { ...state, game: { ...state.game, players: action.players ?? state.game.players } }
    }
    default:
      return state
  }
}

export default function PongMarblePage() {
  const { id } = useParams<{ id: string }>()

  const { user, status } = useMe()

  const [state, dispatch] = useReducer(gameReducer, initialState)

  const { players, roomState, lands } = state.game

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 모달 상태
  const [purchaseModal, setPurchaseModal] = useState<null | { land_id: number; price: number }>(null)
  const [tollModal, setTollModal] = useState<null | { land: Land }>(null)
  const [infoModal, setInfoModal] = useState<null | { title: string; message: string }>(null)
  const [gameEnded, setGameEnded] = useState<boolean>(false)

  const [animPositions, setAnimPositions] = useState<Record<number, number> | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const moveTimersRef = useRef<number[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingQuizForRef = useRef<number | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [state.messages])

  const clearMoveTimers = () => {
    moveTimersRef.current.forEach((t) => clearTimeout(t))
    moveTimersRef.current = []
  }
  useEffect(() => () => clearMoveTimers(), [])

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const pickMessage = (m: any): string | undefined => {
    return m?.message ?? m?.data?.message ?? m?.data?.messages ?? m?.payload?.message
  }

  const { connected, start, roll, purchase, toll, tax, salary, quiz, quizCheck, turn, end } = useMarbleSocket(
    id,
    {
      onStart: (m) => {
        const response = (m as any)?.data as Game | undefined

        if (response) dispatch({ type: 'START_GAME', game: response })
      },
      onDice: (m) => {
        const response = (m as any)?.data as Game | undefined
        const msg = pickMessage(m)

        if (!response) return

        // 최신 state로 prev/next 비교 (stale 방지)
        const prevPlayers = stateRef.current.game.players
        const nextPlayers = response.players
        const prevById = new Map(prevPlayers.map((p) => [p.user_id, p.position]))
        const changed = nextPlayers.find((np) => prevById.get(np.user_id) !== np.position)
        if (changed) {
          const boardSize = Math.max(stateRef.current.game.lands.length || 24, 24)
          playDiceAndMove({
            userId: changed.user_id,
            prevPos: prevById.get(changed.user_id) ?? changed.position,
            nextPos: changed.position,
            boardSize,
          })
        }

        dispatch({ type: 'ROLL', players: response.players, roomState: response.roomState, message: msg })
      },
      onPurchase: (m) => {
        const payload = (m as any)?.data as { lands: Land; players?: Player[]; message?: string } | undefined
        const msg = pickMessage(m)

        if (!payload) return
        dispatch({ type: 'PURCHASE', land: payload.lands, players: payload.players, message: msg })
      },
      onToll: (m) => {
        const payload = (m as any)?.data as { lands?: Land[]; players?: Player[]; message?: string } | undefined
        const msg = pickMessage(m)

        if (!payload) return
        dispatch({ type: 'TOLL', lands: payload.lands ?? [], players: payload.players, message: msg })
      },
      onTax: (m) => {
        const response = (m as any)?.data as Game | undefined
        const msg = pickMessage(m)

        if (!response) return
        dispatch({
          type: 'TAX',
          game: response,
          message: msg,
        })
      },
      onSalary: (m) => {
        const payload = (m as any)?.data as { players?: Player[]; roomState?: RoomState } | undefined
        const msg = pickMessage(m)

        if (!payload) return
        dispatch({ type: 'SALARY', players: payload.players, roomState: payload.roomState, message: msg })
      },
      onQuiz: (m) => {
        const q = (m as any)?.data as { quiz: Quiz; turnOrder: number } | undefined
        if (!q) return
        dispatch({ type: 'QUIZ', quiz: q.quiz, turnOrder: q.turnOrder })
      },
      onQuizCheck: (m) => {
        const p = (m as any)?.data as
          | { select_idx: number; is_correct: boolean; lands: Land[]; players: Player[]; explanation?: string }
          | undefined
        const msg = pickMessage(m)
        pendingQuizForRef.current = null

        if (!p) return
        dispatch({
          type: 'QUIZ_CHECK',
          select_idx: p.select_idx,
          is_correct: p.is_correct,
          lands: p.lands ?? [],
          players: p.players ?? [],
          explanation: p.explanation,
          message: msg,
        })
      },
      onPrison: (m) => {
        const payload = (m as any)?.data as { players?: Player[] } | undefined
        const msg = pickMessage(m) ?? '플레이어가 무인도에 갇혔습니다'

        if (!payload) return
        dispatch({ type: 'PRISON', players: payload.players, message: msg })
      },
      onBankruptcy: (m) => {
        const payload = (m as any)?.data as
          | { roomState: RoomState; lands: Land[]; players: Player[]; message: string }
          | undefined

        if (!payload) return
        dispatch({
          type: 'BANKRUPTCY',
          roomState: payload.roomState,
          lands: payload.lands,
          players: payload.players,
          message: payload.message,
        })
        turn()
      },
      onExit: (m) => {
        const payload = (m as any)?.data as { players?: Player[] } | undefined
        const msg = pickMessage(m) ?? '플레이어가 퇴장했습니다'

        if (!payload) return
        dispatch({ type: 'EXIT', players: payload.players, message: msg })
        turn()
      },
      onTurnEnd: (m) => {
        const payload = (m as any)?.data as { roomState: RoomState } | undefined
        const msg = pickMessage(m)

        if (payload) dispatch({ type: 'TURN_END', roomState: payload.roomState, message: msg })
      },
      onEnd: (m) => {
        const payload = (m as any)?.data as Player[] | undefined

        if (!payload) return
        dispatch({ type: 'GAME_END', players: payload })

        setGameEnded(true)
      },
    },
    { gameType: 'board' },
  )

  // ---- 방 정보 로드 ----
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const { data } = await api.get<Room>(`/api/gameroom/${id}`)

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

  useEffect(() => {
    if (!connected || !room) return
    start()
  }, [connected, start])

  const slots = useMemo<(Player | null)[]>(() => [0, 1, 2, 3].map((i) => players[i] ?? null), [players])

  const myId = user?.id == null ? null : Number(user.id)
  const me = useMemo(() => players.find((p) => Number(p.user_id) === myId) ?? null, [players, myId])

  const isMyTurn = useMemo(
    () => !!me && me.turn_order === roomState.current_turn,
    [me?.turn_order, roomState.current_turn],
  )

  const canRoll = connected && isMyTurn && !isMoving && !state.quiz

  function playDiceAndMove({
    userId,
    prevPos,
    nextPos,
    boardSize = Math.max(lands.length || 24, 24),
    stepMs = 220,
  }: {
    userId: number
    prevPos: number
    nextPos: number
    boardSize?: number
    stepMs?: number
  }) {
    const steps = (nextPos - prevPos + boardSize) % boardSize

    clearMoveTimers()
    if (steps === 0) {
      setIsMoving(false)
      handleLanded({ user_id: userId, land_id: nextPos })
      return
    }

    setIsMoving(true)
    setAnimPositions((prev) => ({ ...(prev ?? {}), [userId]: prevPos }))

    let cur = prevPos
    for (let i = 0; i < steps; i++) {
      const tid = window.setTimeout(
        () => {
          cur = (cur + 1) % boardSize
          setAnimPositions((prev) => ({ ...(prev ?? {}), [userId]: cur }))
          if (i === steps - 1) {
            window.setTimeout(() => {
              setAnimPositions((prev) => {
                const copy = { ...(prev ?? {}) }
                delete copy[userId]
                return Object.keys(copy).length ? copy : null
              })
              setIsMoving(false)
              handleLanded({ user_id: userId, land_id: cur })
            }, 300)
          }
        },
        (i + 1) * stepMs,
      )
      moveTimersRef.current.push(tid)
    }
  }

  function handleLanded({ user_id, land_id }: { user_id: number; land_id: number }) {
    if (user_id !== user?.id) return

    const land = lands[land_id]
    const my = players.find((p) => Number(p.user_id) === user_id)

    if (!land || land.price === 0) {
      if (land_id === 0) {
        turn()
        return
      }
      if (land_id === 12) {
        if (roomState.pot === 0) {
          setInfoModal({ title: '금고', message: '금고에 쌓인 금액이 없습니다' })
          turn()
          return
        }

        salary(12)
        setInfoModal({ title: '금고', message: '금고에 쌓인 금액을 수령했습니다' })
        return
      }
      if (land_id === 10 || land_id === 3) {
        pendingQuizForRef.current = me?.user_id ?? null
        quiz()
        return
      }
      if (land_id === 15) {
        tax(15)
        setInfoModal({ title: '저금', message: '저금 칸 도착! 5G 금고에 저금했습니다' })
        return
      }
      if (land_id === 22) {
        tax(22)
        setInfoModal({ title: '세금', message: '세금 칸 도착! 세금 10G 납부했습니다' })
        return
      }
      return
    }

    // 일반 땅
    if (land.owner_id == null) {
      if (my && land.price > my.balance) {
        setInfoModal({ title: '알림', message: '보유하신 금액이 부족합니다' })
        turn()
        return
      }
      setPurchaseModal({ land_id: land.land_id, price: land.price })
      return
    } else if (land.owner_id !== me?.user_id) {
      setTollModal({ land: land })
      return
    } else {
      turn()
      return
    }
  }

  const landForModal = useMemo(
    () => (purchaseModal ? lands.find((l) => l.land_id === purchaseModal.land_id) : undefined),
    [purchaseModal, lands],
  )

  if (loading || status === 'loading') return <div className="container mx-auto p-6">불러오는 중…</div>
  if (error || !room || !user)
    return <div className="container mx-auto p-6 text-red-600">{error ?? '게임을 찾을 수 없습니다.'}</div>

  return (
    <div className="grid h-full w-full grid-cols-5 gap-4">
      <div className="grid grid-rows-5 gap-4">
        <Card className="flex items-center justify-center">
          <CardContent className="flex justify-between gap-2 text-xl font-extrabold">
            <div>Round</div>
            <div className="text-primary-shinhan w-8 text-center">{roomState.round}</div>
            <div>/ {roomState.max_round}</div>
          </CardContent>
        </Card>
        <PlayerCard player={slots[0]!} isTurn={roomState.current_turn} />
        <PlayerCard player={slots[2]!} isTurn={roomState.current_turn} />
        <Card className="row-span-2">
          <CardHeader className="flex items-center gap-x-4 text-base font-bold">
            <Bell />
            <span>알림</span>
          </CardHeader>
          <CardContent className="grow">
            <div ref={scrollRef} className="max-h-40 grow space-y-2 overflow-y-auto">
              {state.messages.map((m, i) => (
                <div
                  key={i}
                  className="bg-muted text-muted-foreground border-secondary-sky rounded border-l-2 px-2 py-1 text-sm"
                >
                  {m}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 중앙 보드 */}
      <div className="col-span-3 flex flex-col items-center justify-center">
        <GameBoard
          players={players.map((p) => ({
            id: p.user_id,
            nickname: p.nickname,
            balance: p.balance,
            position: animPositions?.[p.user_id] ?? p.position,
            turtle_id: p.turtle_id, // 서버 값에 맞춰 매핑
          }))}
          lands={lands}
          vault={roomState.pot}
          message={state.messages.at(-1)}
        />
      </div>

      {/* 우측 */}
      <div className="grid grid-rows-5 gap-4">
        <Card className="flex items-center justify-center">
          <CardContent className="text-xl font-extrabold">{room?.title || ''}</CardContent>
        </Card>
        <PlayerCard player={slots[1]!} isTurn={roomState.current_turn} />
        <PlayerCard player={slots[3]!} isTurn={roomState.current_turn} />
        <DiceCard canRoll={canRoll} isInJail={!!me?.skip_turn} onRequestRoll={roll} />
      </div>
      <PurchaseDialog
        open={!!purchaseModal}
        land={landForModal}
        onConfirm={() => {
          if (!purchaseModal) return

          purchase(purchaseModal.land_id)
          setPurchaseModal(null)
        }}
        onCancel={() => {
          setPurchaseModal(null)

          turn()
        }}
      />
      <TollDialog
        open={!!tollModal}
        land={tollModal?.land ?? { land_id: 1, name: '땅이름', price: 10, toll: 15, owner_id: 45, color: 'orange' }}
        myInfo={
          me ?? {
            user_id: 12,
            nickname: '닉네임',
            room_id: 1,
            ready: true,
            turtle_id: 'green',
            balance: 30,
            position: 4,
            turn_order: 1,
            skip_turn: false,
            active: true,
            rank: null,
            reward: null,
          }
        }
        onConfirmPay={() => {
          if (!tollModal) return
          toll(tollModal.land.land_id) // 서버에 통행료 지불 publish
          setTollModal(null)
          // 메시지 누적하고 싶으면 dispatch({ type: 'ROLL', message: '통행료를 지불했습니다.' })
        }}
      />
      <InfoDialog
        open={!!infoModal}
        title={infoModal?.title ?? ''}
        message={infoModal?.message ?? ''}
        onClose={() => setInfoModal(null)}
      />
      <QuizDialog
        open={!!state.quiz} // 모두에게 모달을 띄움
        quiz={state.quiz ?? undefined}
        turnOrder={state.quizOwnerUserId} // 서버에서 내려준 퀴즈 당첨자 turn_order (latch된 값)
        meOrder={me?.turn_order} // 내 turn_order
        onAnswer={(select_idx, is_correct) => quizCheck(select_idx, is_correct)}
        onClose={() => dispatch({ type: 'QUIZ_CLEAR' })}
      />
      <ResultDialog
        open={gameEnded}
        players={players}
        roomId={Number(id)}
        meUserId={Number(user.id)}
        initialSeconds={10}
        end={end}
      />
    </div>
  )
}
