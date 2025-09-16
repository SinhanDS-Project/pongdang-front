'use client'

import { Client, IMessage } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

export function AlertBar() {
  const [message, setMessage] = useState('작은 퐁 하나가 내일의 큰 혜택이 됩니다')
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    if (!wsUrl) return

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 2000,
      debug: () => {},
      onConnect: () => {
        client.subscribe('/topic/notice', (msg: IMessage) => {
          try {
            const payload = JSON.parse(msg.body)
            if (payload?.type === 'donation' && payload?.data) {
              setMessage(String(payload.data))
            }
          } catch (e) {
            console.error('STOMP parse error', e)
          }
        })
      },
      onStompError: (frame) => console.error('STOMP ERROR', frame.headers['message'], frame.body),
    })
    client.activate()
    clientRef.current = client

    return () => {
      clientRef.current?.deactivate()
      clientRef.current = null
    }
  }, [])

  return (
    <div
      className="shadow-badge mb-3 w-full rounded-full px-4 py-2 md:mb-6 md:px-8 md:text-base"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
