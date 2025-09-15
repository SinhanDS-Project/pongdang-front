'use client'

import { tokenStore } from '@/lib/auth/token-store'
import { useTurtleStore } from '@/stores/turtle-store'
import { Client, IMessage } from '@stomp/stompjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

export type WSMessage =
  | { type: 'race_update'; positions?: number[]; data?: number[] }
  | { type: 'race_finish'; data: { winner: number; results: any[] } }
  | Record<string, any>

type UseTurtleSocketOpts = {
  /** 레이스 종료 알림 */
  onFinish?: (msg: Extract<WSMessage, { type: 'race_finish' }> | any) => void
  /** 플레이어 목록 갱신 알림 (서버 payload 그대로 또는 원하는 형태로 매핑해서 넘겨도 OK) */
  onPlayers?: (players: any[]) => void
  /** 토픽 경로 커스터마이즈 (기본값을 바꾸고 싶을 때) */
  topics?: {
    race?: (roomId: string) => string // 진행/결과
    players?: (roomId: string) => string // 플레이어 목록
  }
}

export function useTurtleSocket(roomId: string, userId: number | null, opts?: UseTurtleSocketOpts) {
  const clientRef = useRef<Client | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!roomId || !userId) return

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    if (!wsUrl) {
      console.error('NEXT_PUBLIC_WEBSOCKET_URL 환경변수가 없습니다.')
      return
    }

    // 중복 활성화 방지
    if (clientRef.current?.active) return

    const token = tokenStore.get()
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {}, // 디버그 필요하면 콘솔로 바꿔도 됨
      onConnect: () => {
        setConnected(true)

        // ---- 토픽 경로 결정 (기본값 제공) ----
        const raceTopic = opts?.topics?.race?.(roomId) ?? `/topic/game/turtle/${roomId}`
        const playersTopic = opts?.topics?.players?.(roomId) ?? `/topic/game/turtle/${roomId}`

        // ---- (A) 레이스 진행/결과 ----
        client.subscribe(raceTopic, (message: IMessage) => {
          let pkt: WSMessage
          try {
            pkt = JSON.parse(message.body)
          } catch {
            return
          }

          // 진행률 (positions 또는 data)
          const positions = Array.isArray((pkt as any)?.positions)
            ? (pkt as any).positions
            : Array.isArray((pkt as any)?.data)
              ? (pkt as any).data
              : null

          if ((pkt as any).type === 'race_update' || positions) {
            // Track 루프에서 setPositions + tickLerp 하게 하려고 여기서는 버퍼에만 저장
            const positionsPercent = (positions ?? []).map((p: number) => p * 100);
            // raceStream 사용 x
            useTurtleStore.getState().setPositions(positionsPercent)
            return
          }

          // 결승/결과
          const looksLikeFinish =
            (pkt as any)?.type === 'race_finish' ||
            (typeof (pkt as any)?.winner !== 'undefined' && Array.isArray((pkt as any)?.results))

          if (looksLikeFinish) {
            console.log('[race_finish]', pkt)
            opts?.onFinish?.(pkt as any)
          }
        })

        // ---- (B) 플레이어 목록 ----
        client.subscribe(playersTopic, (message: IMessage) => {
          if (!opts?.onPlayers) return
          try {
            const payload = JSON.parse(message.body)
            // 서버 예시: { type: 'game_start', data: Player[] }
            if (payload?.type === 'game_start' && Array.isArray(payload.data)) {
              opts.onPlayers(payload.data)
            }
          } catch (e) {
            console.error('[players parse error]', e)
          }
        })
      },
      onStompError: (frame) => {
        console.error('[STOMP ERROR]', frame.headers['message'], frame.body)
      },
      onWebSocketError: (e) => {
        console.error('[WS ERROR]', e)
      },
      onDisconnect: () => setConnected(false),
    })

    client.activate()
    clientRef.current = client

    return () => {
      clientRef.current?.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [roomId, userId]) // opts 내부 콜백은 최신 참조로 캡처되고, 연결은 roomId/userId 기준

  /** 서버 publish 도우미 */
  const send = useCallback((destination: string, payload?: unknown, headers?: Record<string, string>) => {
    const c = clientRef.current
    if (!c?.connected) {
      console.warn('[STOMP] not connected, skip publish:', destination)
      return
    }
    try {
      c.publish({
        destination,
        body: payload != null ? JSON.stringify(payload) : '',
        headers,
      })
    } catch (e) {
      console.error('[STOMP publish error]', destination, e)
    }
  }, [])

  return { send, connected }
}
