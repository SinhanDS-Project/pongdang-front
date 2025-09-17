'use client'

import { useState } from 'react'
import { api } from '@/lib/net/client-axios'
import axios from 'axios'

type Bubble = {
  id: number
  top: string
  left: string
  size: number
  amount: number //  0~5퐁
}

export default function RandomPongPage() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [result, setResult] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  //  물방울 생성 (8개 고정)
  const generateBubbles = (container: HTMLDivElement | null) => {
    if (!container) return

    const { clientWidth, clientHeight } = container

    //  1~5퐁, 꽝 3개
    const values = [1, 2, 3, 4, 5, 0, 0, 0]

    // 배열을 랜덤하게 섞기
    const shuffled = values.sort(() => Math.random() - 0.5)

    const randomBubbles: Bubble[] = shuffled.map((amount, i) => {
      const size = Math.floor(Math.random() * 60) + 50
      const topPx = Math.random() * (clientHeight - size)
      const leftPx = Math.random() * (clientWidth - size)

      return {
        id: i,
        top: `${topPx}px`,
        left: `${leftPx}px`,
        size,
        amount, // 각 물방울에 값 지정
      }
    })

    setBubbles(randomBubbles)
    setResult(null)
    setMessage('💧 마음에 드는 물방울을 하나 골라보세요!')
  }

  //  클릭 → 당첨 처리
  const handleClick = async (bubble: Bubble) => {
    if (bubble.amount === 0) {
      setResult(0)
      setMessage('😢 아쉽습니다! 꽝이에요.')
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id))
      return
    }

    try {
      await api.put('/api/wallet/add', {
        amount: bubble.amount,
        wallet_type: 'PONG',
        event_type: 'BUBBLE',
      })

      setResult(bubble.amount)
      setMessage(`🎉 축하합니다! ${bubble.amount}퐁이 적립되었습니다.`)
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id))
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const errorCode = err.response?.data?.error
        const errorMessage = err.response?.data?.message

        if (status === 409) {
          // 서버에서 충돌(오늘 이미 참여한 이벤트)
          setMessage(errorMessage ?? '⚠️ 오늘 이미 이벤트 참여가 완료되었습니다.')
        } else if (errorCode === 'ALREADY_BUBBLE_FINISHED') {
          setMessage(`⚠️ ${errorMessage}`)
        } else {
          setMessage('적립에 실패했습니다. 잠시 후 다시 시도해주세요.')
        }
      } else {
        setMessage('알 수 없는 오류가 발생했습니다.')
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      {/* 제목 */}
      <h1 className="mb-4 bg-gradient-to-r from-sky-500 to-indigo-400 bg-clip-text text-center text-5xl font-extrabold tracking-tight text-transparent drop-shadow-lg">
        랜덤 퐁 터뜨리기
      </h1>
      <p className="mb-6 text-center text-lg text-gray-600">물방울 속 퐁을 찾아보세요!</p>

      {/* 물방울  영역 */}
      <div
        id="bubble-zone"
        className="relative h-[500px] w-full max-w-2xl overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-b from-white to-sky-50 shadow-lg"
      >
        {bubbles.map((bubble) => (
          <button
            key={bubble.id}
            onClick={() => handleClick(bubble)}
            className="absolute rounded-full shadow-lg transition hover:scale-110 hover:brightness-110"
            style={{
              top: bubble.top,
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              background: 'radial-gradient(circle at 30% 30%, #ffffffaa, #60a5fa)',
            }}
          >
            <span className="pointer-events-none absolute top-1 left-2 h-1/3 w-1/3 rounded-full bg-white/50 blur-md"></span>
          </button>
        ))}
      </div>

      {/* 버튼 */}
      <button
        onClick={() => generateBubbles(document.getElementById('bubble-zone') as HTMLDivElement)}
        className="mt-8 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 px-8 py-3 text-lg font-bold text-white shadow-md transition hover:scale-105 hover:from-sky-600 hover:to-indigo-600"
      >
        💧 랜덤 물방울 뿌리기
      </button>

      {/* 결과 */}
      {message && <p className="mt-6 text-center text-xl font-semibold text-indigo-700">{message}</p>}
      {result !== null && result > 0 && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-white/90 px-6 py-4 text-center shadow-md">
          <p className="text-2xl font-bold text-indigo-600">{result} 퐁 적립되었습니다!</p>
        </div>
      )}
    </main>
  )
}
