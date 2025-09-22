'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

import { tokenStore } from '@/stores/token-store'

import { Client, IMessage, StompHeaders } from '@stomp/stompjs'

import { Game, Land, Player, Quiz, RoomState } from '@/types/pongMarble'

/** --- Inbound Message Types (서버 응답) --- */
type StartMsg = { type: 'game_start'; data: Game }
type DiceMsg = { type: 'dice'; data: { roomState: RoomState; players: Player[] } }
type PurchaseMsg = { type: 'purchase'; data: { lands: Land; players: Player[] } }
type TollMsg = { type: 'toll'; data: { lands: Land[]; players: Player[] } }
type TaxMsg = { type: 'tax'; data: Game }
type SalaryMsg = { type: 'salary'; data: { roomState: RoomState; players: Player[] } }
type QuizMsg = { type: 'quiz'; data: { quiz: Quiz; turnOrder: number } }
type QuizCheckMsg = {
  type: 'quiz_check'
  data: { select_idx: number; is_correct: boolean; lands: Land[]; players: Player[] }
}
type BankruptcyMsg = {
  type: 'bankruptcy'
  data: { roomState: RoomState; lands: Land[]; players: Player[]; message: string }
}
type ExitMsg = { type: 'exit'; data: { players: Player[] } }
type TurnEndMsg = { type: 'turn_end'; data: RoomState }
type EndMsg = { type: 'game_end'; data: { players: Player[] } }
type PrisonMsg = { type: 'prison'; data: { players: Player[]; message: string } }

export type MarbleInbound =
  | StartMsg
  | DiceMsg
  | PurchaseMsg
  | TollMsg
  | TaxMsg
  | SalaryMsg
  | QuizMsg
  | QuizCheckMsg
  | BankruptcyMsg
  | ExitMsg
  | TurnEndMsg
  | EndMsg
  | PrisonMsg
  | Record<string, any>

/** --- Optional Handlers --- */
type Handlers = {
  onStart?: (m: StartMsg) => void
  onDice?: (m: DiceMsg) => void
  onPurchase?: (m: PurchaseMsg) => void
  onToll?: (m: TollMsg) => void
  onTax?: (m: TaxMsg) => void
  onSalary?: (m: SalaryMsg) => void
  onQuiz?: (m: QuizMsg) => void
  onQuizCheck?: (m: QuizCheckMsg) => void
  onBankruptcy?: (m: BankruptcyMsg) => void
  onExit?: (m: ExitMsg) => void
  onTurnEnd?: (m: TurnEndMsg) => void
  onEnd?: (m: EndMsg) => void
  onPrison?: (m: PrisonMsg) => void
  /** 예외 & 로깅 */
  onUnknown?: (raw: any) => void
  onConnect?: (headers: StompHeaders) => void
  onDisconnect?: () => void
  onError?: (e: unknown) => void
}

type UseMarbleSocketOptions = {
  /** 기본: 'board' (요구사항의 game_type) */
  gameType?: string
  /** user 개인 큐(/user/queue/...) 구독이 필요하면 true */
  subscribeUserQueue?: boolean
}

/** JSON 안전 파서 */
function safeJsonParse<T = any>(str: string): T | null {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

export function useMarbleSocket(roomId: string | number, handlers?: Handlers, opts: UseMarbleSocketOptions = {}) {
  const { gameType = 'board', subscribeUserQueue = false } = opts

  const clientRef = useRef<Client | null>(null)
  const subIdRef = useRef<string | null>(null)
  const subUserIdRef = useRef<string | null>(null)
  const handlersRef = useRef<Handlers | undefined>(handlers)

  const [connected, setConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  /** 최신 핸들러 참조 유지 (stale closure 방지) */
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    if (!roomId) return
    const wsBase = process.env.NEXT_PUBLIC_WEBSOCKET_URL // 예: https://api.example.com/ws
    if (!wsBase) {
      console.error('NEXT_PUBLIC_WEBSOCKET_URL이 필요합니다.')
      return
    }
    if (clientRef.current?.active) return

    const token = tokenStore.get()
    const client = new Client({
      webSocketFactory: () => new SockJS(wsBase),
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: () => {}, // 필요시 로그 확인
    })

    client.onConnect = (frame) => {
      setConnected(true)
      setSessionId(frame.headers['session'] ?? null)
      handlersRef.current?.onConnect?.(frame.headers)

      // 메인 게임 토픽 (요구사항: /topic/game/{gameType}/{roomId})
      const dest = `/topic/game/${gameType}/${roomId}`
      const sub = client.subscribe(dest, (msg: IMessage) => {
        const data = safeJsonParse<MarbleInbound>(msg.body)
        if (!data || typeof data !== 'object') {
          handlersRef.current?.onUnknown?.(msg.body)
          return
        }

        switch ((data as any).type) {
          case 'game_start':
            handlersRef.current?.onStart?.(data as StartMsg)
            break
          case 'roll':
            handlersRef.current?.onDice?.(data as DiceMsg)
            break
          case 'purchase':
            handlersRef.current?.onPurchase?.(data as PurchaseMsg)
            break
          case 'toll':
            handlersRef.current?.onToll?.(data as TollMsg)
            break
          case 'tax':
            handlersRef.current?.onTax?.(data as TaxMsg)
            break
          case 'salary':
            handlersRef.current?.onSalary?.(data as SalaryMsg)
            break
          case 'quiz':
            handlersRef.current?.onQuiz?.(data as QuizMsg)
            break
          case 'quiz_check':
            handlersRef.current?.onQuizCheck?.(data as QuizCheckMsg)
            break
          case 'bankruptcy':
            handlersRef.current?.onBankruptcy?.(data as BankruptcyMsg)
            break
          case 'exit':
            handlersRef.current?.onExit?.(data as ExitMsg)
            break
          case 'turn_end':
            handlersRef.current?.onTurnEnd?.(data as TurnEndMsg)
            break
          case 'game_end':
            handlersRef.current?.onEnd?.(data as EndMsg)
            break
          case 'prison':
            handlersRef.current?.onPrison?.(data as PrisonMsg)
            break
          default:
            handlersRef.current?.onUnknown?.(data)
            break
        }
      })
      subIdRef.current = sub.id

      // (옵션) 개인 큐 구독
      if (subscribeUserQueue) {
        const userDest = `/user/queue/game/${gameType}/${roomId}`
        const subUser = client.subscribe(userDest, (msg: IMessage) => {
          const data = safeJsonParse<MarbleInbound>(msg.body)
          if (!data) {
            handlersRef.current?.onUnknown?.(msg.body)
            return
          }
          // 개인 큐는 서버 용도에 맞게 재사용(알람/DM 등)
          handlersRef.current?.onUnknown?.(data)
        })
        subUserIdRef.current = subUser.id
      }
    }

    client.onDisconnect = () => {
      setConnected(false)
      setSessionId(null)
      handlersRef.current?.onDisconnect?.()
    }

    client.onStompError = (f) => {
      console.error('[STOMP ERROR]', f.headers['message'], f.body)
      handlersRef.current?.onError?.(new Error(f.headers['message'] || 'STOMP ERROR'))
    }
    client.onWebSocketError = (e) => {
      console.error('[WS ERROR]', e)
      handlersRef.current?.onError?.(e)
    }

    client.activate()
    clientRef.current = client

    return () => {
      // 구독 해제
      try {
        if (clientRef.current?.connected && subIdRef.current) {
          clientRef.current.unsubscribe(subIdRef.current)
        }
        if (clientRef.current?.connected && subUserIdRef.current) {
          clientRef.current.unsubscribe(subUserIdRef.current)
        }
      } catch {}
      subIdRef.current = null
      subUserIdRef.current = null

      // 연결 해제
      clientRef.current?.deactivate()
      clientRef.current = null
      setConnected(false)
      setSessionId(null)
    }
  }, [roomId, gameType, subscribeUserQueue])

  /** --- Publisher Helpers (송신) : send는 나중에 붙일 액션용 --- */
  const publish = useCallback((destination: string, body?: unknown) => {
    const c = clientRef.current
    if (!c?.connected) return
    c.publish({ destination, body: body ? JSON.stringify(body) : '' })
  }, [])

  // 액션 헬퍼
  const start = useCallback(() => publish(`/app/${gameType}/start/${roomId}`), [publish, roomId, gameType])

  const roll = useCallback(
    (dice: number, isDouble: boolean) => {
      publish(`/app/roll/${roomId}`, { dice: dice, is_double: isDouble })
    },
    [publish, roomId],
  )

  const purchase = useCallback((land_id: number) => publish(`/app/purchase/${roomId}`, { land_id }), [publish, roomId])
  const toll = useCallback((land_id: number) => publish(`/app/toll/${roomId}`, { land_id }), [publish, roomId])

  const tax = useCallback((land_id: number) => publish(`/app/tax/${roomId}`, { land_id }), [publish, roomId])

  const salary = useCallback((land_id: number) => publish(`/app/salary/${roomId}`, { land_id }), [publish, roomId])

  const quiz = useCallback(() => publish(`/app/quiz/${roomId}`), [publish, roomId])

  const quizCheck = useCallback(
    (select_idx: number, is_correct: boolean) => publish(`/app/quiz/check/${roomId}`, { select_idx, is_correct }),
    [publish, roomId],
  )

  const turn = useCallback(() => publish(`/app/turn/${roomId}`), [publish, roomId])

  const end = useCallback(() => publish(`/app/game/end/${roomId}`), [publish, roomId])

  return {
    connected,
    sessionId,
    start,
    roll,
    purchase,
    toll,
    tax,
    salary,
    quiz,
    quizCheck,
    turn,
    end,
  }
}
