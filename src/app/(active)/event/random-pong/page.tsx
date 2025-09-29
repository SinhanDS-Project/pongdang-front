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
  const [showCelebration, setShowCelebration] = useState(false)

  // 물방울 생성
  const generateBubbles = (container: HTMLDivElement | null) => {
    if (!container) return

    let { clientWidth, clientHeight } = container
    if (clientWidth < 50) clientWidth = 320
    if (clientHeight < 50) clientHeight = 300

    const values = [1, 2, 3, 4, 5, 0, 0, 0]
    const shuffled = values.sort(() => Math.random() - 0.5)

    const randomBubbles: Bubble[] = shuffled.map((amount, i) => {
      const size = Math.floor(Math.random() * 60) + 80
      const topPx = Math.max(10, Math.random() * (clientHeight - size - 10))
      const leftPx = Math.max(10, Math.random() * (clientWidth - size - 10))
      console.log(`💧 Bubble ${i}`, { size, topPx, leftPx, amount })
      return { id: i, top: `${topPx}px`, left: `${leftPx}px`, size, amount, revealed: false }
    })

    setBubbles(randomBubbles)
    setResult(null)
    setMessage('💧 마음에 드는 물방울을 하나 골라보세요!')
  }

  // 시작 버튼 → 참여 여부 체크
  const handleStart = async (container: HTMLDivElement | null) => {
    if (!container) return
    try {
      // 🎯 서버에 참여 여부 확인 (참여 안 했으면 200, 이미 했으면 409 반환된다고 가정)
      await api.put('/api/wallet/add', {
        amount: 0, // 0 포인트 적립으로 참여 여부만 체크
        wallet_type: 'PONG',
        event_type: 'BUBBLE',
      })

      // 참여 가능 → 버블 생성
      generateBubbles(container)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const errorCode = err.response?.data?.error

        if (status === 409 && errorCode === 'ALREADY_BUBBLE_FINISHED') {
          setMessage('⚠️ 오늘 이미 퐁 터트리기 이벤트 참여가 완료되었습니다.')
          setBubbles([])
          return
        }
        if (status === 401) {
          setMessage('🔑 로그인 후 이용해주세요.')
          return
        }
        setMessage(err.response?.data?.message ?? '❌ 이벤트 참여 확인 실패. 다시 시도해주세요.')
      } else {
        setMessage('알 수 없는 오류가 발생했습니다.')
      }
    }
  }

  // 버블 클릭 시 처리
  const handleClick = async (bubble: Bubble) => {
    try {
      await api.put('/api/wallet/add', {
        amount: bubble.amount,
        wallet_type: 'PONG',
        event_type: 'BUBBLE',
      })

      setResult(bubble.amount)
      setMessage(bubble.amount === 0 ? '😢 아쉽습니다! 꽝이에요.' : '🎉 축하합니다!')
      setBubbles((prev) => prev.map((b) => ({ ...b, revealed: true })))

      if (bubble.amount > 0) setShowCelebration(true)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message ?? '적립에 실패했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        setMessage('알 수 없는 오류가 발생했습니다.')
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-sky-50 p-4 sm:p-6">
      <div className="mt-6 flex flex-col items-center sm:mt-8">
        {/* 제목 */}
        <h1
          className={`mb-6 text-center text-2xl font-extrabold tracking-tight text-sky-600 drop-shadow sm:text-3xl md:text-5xl lg:text-6xl ${jua.className}`}
        >
          💧랜덤 퐁 터트리기💧
        </h1>

        {/* 시작 버튼 */}
        <button
          onClick={() => handleStart(document.getElementById('bubble-zone') as HTMLDivElement)}
          className="group relative mb-6 overflow-hidden rounded-full bg-sky-500 px-6 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-110 active:scale-95 sm:mb-8 sm:px-12 sm:py-4 sm:text-xl"
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
        className="relative min-h-[400px] w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-xl sm:min-h-[500px] sm:max-w-lg md:min-h-[600px] md:max-w-2xl md:rounded-3xl"
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
              <span className="animate-pop z-10 text-sm font-bold text-sky-700 sm:text-base md:text-xl">
                {bubble.amount === 0 ? '꽝' : `${bubble.amount} 퐁`}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 결과 메시지 */}
      {message && (
        <div className="mt-6 w-full max-w-sm rounded-2xl border bg-white px-4 py-4 text-center shadow-md sm:mt-8 sm:max-w-md sm:px-6 sm:py-5">
          <p className="text-base font-semibold text-sky-700 sm:text-xl">{message}</p>
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
              className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-500 shadow-2xl sm:h-36 sm:w-36 md:h-40 md:w-40"
            >
              <span className="text-4xl sm:text-5xl">🤍</span>
            </motion.div>

            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="mt-4 text-center text-2xl font-extrabold text-white drop-shadow-lg sm:mt-6 sm:text-3xl"
            >
              {result} 퐁 적립 완료! 🎉
            </motion.h2>

            <motion.button
              onClick={() => setShowCelebration(false)}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg hover:bg-sky-600 sm:mt-6 sm:px-8 sm:py-3 sm:text-base"
            >
              확인
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
