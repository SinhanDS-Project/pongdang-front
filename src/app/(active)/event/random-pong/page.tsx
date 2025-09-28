'use client'

import { useState } from 'react'
import { api } from '@/lib/net/client-axios'
import axios from 'axios'
import { Jua } from 'next/font/google'
import { AnimatePresence, motion } from 'framer-motion'

const jua = Jua({
  subsets: ['latin'],
  weight: ['400'],
})

type Bubble = {
  id: number
  top: string
  left: string
  size: number
  amount: number
  revealed?: boolean
}

export default function RandomPongPage() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [result, setResult] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [showCelebration, setShowCelebration] = useState(false) // 🎉 모달 상태

  // 물방울 생성
  const generateBubbles = (container: HTMLDivElement | null) => {
    if (!container) return
    const { clientWidth, clientHeight } = container
    const values = [1, 2, 3, 4, 5, 0, 0, 0]
    const shuffled = values.sort(() => Math.random() - 0.5)

    const randomBubbles: Bubble[] = shuffled.map((amount, i) => {
      const size = Math.floor(Math.random() * 60) + 80
      const topPx = Math.random() * (clientHeight - size)
      const leftPx = Math.random() * (clientWidth - size)
      return { id: i, top: `${topPx}px`, left: `${leftPx}px`, size, amount, revealed: false }
    })

    setBubbles(randomBubbles)
    setResult(null)
    setMessage('💧 마음에 드는 물방울을 하나 골라보세요!')
  }

  // 클릭 시 처리
  const handleClick = async (bubble: Bubble) => {
    try {
      // 🎯 꽝이라도 무조건 API 호출 (참여 여부 서버에서 체크)
      await api.put('/api/wallet/add', {
        amount: bubble.amount,
        wallet_type: 'PONG',
        event_type: 'BUBBLE',
      })

      // ✅ 성공했으면 결과 반영
      setResult(bubble.amount)
      setMessage(bubble.amount === 0 ? '😢 아쉽습니다! 꽝이에요.' : '🎉 축하합니다!')
      setBubbles((prev) => prev.map((b) => ({ ...b, revealed: true })))

      if (bubble.amount > 0) {
        setShowCelebration(true)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const errorCode = err.response?.data?.error
        const errorMessage = err.response?.data?.message

        if (status === 409 && errorCode === 'ALREADY_BUBBLE_FINISHED') {
          // ✅ 이미 참여했을 때
          setResult(null)
          setMessage('⚠️ 오늘 이미 퐁 터트리기 이벤트 참여가 완료되었습니다.')
          setBubbles([]) // 물방울 초기화
        } else if (status === 401) {
          setMessage('🔑 로그인 후 이용해주세요.')
        } else {
          setMessage(errorMessage ?? '적립에 실패했습니다. 잠시 후 다시 시도해주세요.')
        }
      } else {
        setMessage('알 수 없는 오류가 발생했습니다.')
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-sky-50 p-6">
      <div className="mt-8 flex flex-col items-center">
        {/* 제목 */}
        <h1
          className={`mb-8 text-center text-6xl font-extrabold tracking-tight text-sky-600 drop-shadow ${jua.className}`}
        >
          💧랜덤 퐁 터트리기💧
        </h1>

        {/* 시작 버튼 */}
        <button
          onClick={() => generateBubbles(document.getElementById('bubble-zone') as HTMLDivElement)}
          className="group relative mb-8 overflow-hidden rounded-full bg-sky-500 px-12 py-4 text-xl font-bold text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <span className="absolute inset-0 bg-sky-400 opacity-0 transition-opacity duration-500 group-hover:opacity-40"></span>
          <span className="relative z-10 flex items-center gap-2">
            <span>랜덤 물방울 뿌리기</span>
          </span>
        </button>
      </div>

      {/* 물방울 영역 */}
      <div
        id="bubble-zone"
        className="relative h-[500px] w-full max-w-2xl overflow-hidden rounded-3xl border bg-white shadow-xl"
      >
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`absolute flex items-center justify-center rounded-full shadow-md transition-all ${
              bubble.revealed ? 'pointer-events-none' : 'hover:scale-110 active:scale-95'
            }`}
            style={{
              top: bubble.top,
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              background: bubble.revealed ? 'transparent' : 'radial-gradient(circle at 30% 30%, #ffffffdd, #60a5fa)',
            }}
            onClick={() => !bubble.revealed && handleClick(bubble)}
          >
            {!bubble.revealed && (
              <span className="pointer-events-none absolute top-1 left-2 h-1/3 w-1/3 rounded-full bg-white/60 blur-md"></span>
            )}
            {bubble.revealed && (
              <span className="animate-pop z-10 text-xl font-bold text-sky-700">
                {bubble.amount === 0 ? '꽝' : `${bubble.amount} 퐁`}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 결과 메시지 */}
      {message && result === 0 && (
        <div className="mt-8 w-full max-w-md rounded-2xl border bg-white px-6 py-5 text-center shadow-md">
          <p className="text-xl font-semibold text-sky-700">{message}</p>
        </div>
      )}

      {message && result === null && (
        <div className="mt-8 w-full max-w-md rounded-2xl border bg-white px-6 py-5 text-center shadow-md">
          <p className="text-xl font-semibold text-sky-700">{message}</p>
        </div>
      )}

      {/* 퐁 적립 축하 모달 */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.8 }}
              className="flex h-40 w-40 items-center justify-center rounded-full bg-blue-500 shadow-2xl"
            >
              <span className="text-5xl">🤍</span>
            </motion.div>

            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg"
            >
              {result} 퐁 적립 완료! 🎉
            </motion.h2>

            <motion.button
              onClick={() => setShowCelebration(false)}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 rounded-full bg-sky-500 px-8 py-3 font-semibold text-white shadow-lg hover:bg-sky-600"
            >
              확인
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
