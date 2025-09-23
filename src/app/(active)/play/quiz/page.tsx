'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/net/client-axios'
import { AxiosError } from 'axios'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Fireworks from '@/components/quiz-page/Firework'
import { Button } from '@/components/ui/button'

/* ── API 타입 ───────────────────────── */
type ApiQuizRaw = {
  position?: number | string
  question?: string
  choice1?: string
  choice2?: string
  choice3?: string
  choice4?: string
  answer_idx?: number | string
  explanation?: string
}

type MappedQuiz = {
  position: number
  question: string
  choices: string[]
  answerIdx: number
  explanation?: string
}

/* ── 유틸 ───────────────────────── */
const toNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

const normalizeQuiz = (q: ApiQuizRaw, idxFallback: number): MappedQuiz => {
  const position = toNumber(q.position, idxFallback + 1)
  const question = q.question ?? ''
  const choices = [q.choice1, q.choice2, q.choice3, q.choice4].filter((c): c is string => typeof c === 'string')
  const answerIdx = Math.max(0, Math.min(choices.length - 1, toNumber(q.answer_idx, 0)))
  return { position, question, choices, answerIdx, explanation: q.explanation }
}

/* ── 골든벨 컴포넌트 ───────────────────────── */
function GoldenBell() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <FlashOverlay />
      <Fireworks />

      <motion.div
        initial={{ scale: 0 }}
        animate={{
          scale: [0, 1.2, 1],
          rotate: [0, -35, 35, -20, 20, 0],
          scaleY: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      >
        <Image src="/goldenbell.png" alt="골든벨" width={300} height={300} className="mx-auto drop-shadow-2xl" />
        <p className="relative mt-6 animate-bounce text-5xl font-extrabold drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]">
          <span className="text-white">🎉</span>
          <span className="bg-gradient-to-r from-gray-100 via-white to-gray-200 bg-clip-text text-transparent">
            골든벨 성공!
          </span>
          <span className="text-white">🎉</span>
        </p>
      </motion.div>
    </div>
  )
}

function FlashOverlay() {
  return <div className="animate-flash pointer-events-none fixed inset-0 z-40 bg-yellow-300/40" />
}

/* ── 메인 컴포넌트 ───────────────────────── */
export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<MappedQuiz[]>([])
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(true) // 생성중 상태
  const [message, setMessage] = useState('')
  const [showBell, setShowBell] = useState(false)
  const [rewarded, setRewarded] = useState(false) // 퐁 지급 여부 상태

  // 오늘의 퀴즈 조회
  useEffect(() => {
    ;(async () => {
      try {
        setGenerating(true)
        await api.post('/api/quiz')

        // 2초 생성중 모달 유지
        await new Promise((res) => setTimeout(res, 2000))
        setGenerating(false)

        const { data } = await api.get<ApiQuizRaw[]>('/api/quiz')
        const mapped = (Array.isArray(data) ? data : []).map((q, i) => normalizeQuiz(q, i))
        setQuizzes(mapped)
      } catch (err) {
        console.error(err)
        setMessage('퀴즈를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const current = quizzes[step]

  const isCorrect: boolean | null = useMemo(() => {
    if (!showResult || !current || selected === null) return null
    return selected === current.answerIdx
  }, [showResult, current, selected])

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current || selected === null) return

    try {
      //  1번 문제 제출시 오늘 푼 기록 체크
      if (step === 0) {
        try {
          await api.post('/api/quiz/check')
        } catch (err) {
          if (err instanceof AxiosError && err.response?.status === 409) {
            setMessage('⚠️ 오늘은 이미 퀴즈에 참여하셨습니다.')
            setFinished(true) // 더 진행 못하게 종료 처리
            return
          }
          throw err // 다른 에러는 기존 로직으로
        }
      }

      //  정답 체크
      if (selected === current.answerIdx) {
        setCorrectCount((c) => c + 1)
      }
      setShowResult(true)
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error(err)
        setMessage('퀴즈 진행 중 오류가 발생했습니다.')
      }
    }
  }

  // 다음 문제
  const handleNext = () => {
    if (step + 1 < quizzes.length) {
      setStep((s) => s + 1)
      setSelected(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  // 퐁 지급
  const savePong = async () => {
    try {
      await api.post('/api/quiz/submit', { correctCount })
      setMessage(`🎉 축하합니다! ${correctCount}퐁이 지급되었습니다.`)
      setRewarded(true) //  지급 완료 상태로 전환
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (err.response?.data?.error === 'ALREADY_TODAY_QUIZ_FINISHED') {
          setMessage('⚠️ 오늘은 이미 퀴즈에 참여하셨습니다.')
          setRewarded(true) // 이미 지급된 상태로 처리
        } else {
          setMessage('❌ 지급 요청에 실패했습니다. 잠시 후 다시 시도해주세요.')
        }
      } else {
        setMessage('❌ 알 수 없는 오류가 발생했습니다.')
      }
    }
  }

  // 골든벨 자동 닫기
  useEffect(() => {
    if (finished && correctCount === quizzes.length) {
      setShowBell(true)
      const timer = setTimeout(() => setShowBell(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [finished, correctCount])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6">
      <h1 className="mb-6 text-2xl font-bold">🔔 도전! 금융 골든벨 🔔</h1>

      {generating ? (
        //  생성중 모달
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="rounded-2xl bg-white p-10 text-center shadow-2xl"
          >
            <motion.div
              className="mb-6 text-6xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🤖
            </motion.div>
            <p className="mb-3 animate-pulse text-2xl font-extrabold text-indigo-700">
              AI가 오늘의 금융 퀴즈를 생성중입니다...
            </p>
            <p className="text-gray-500">잠시만 기다려주세요.</p>
          </motion.div>
        </div>
      ) : loading ? (
        //  로딩 상태
        <p className="text-gray-600">퀴즈 불러오는 중...</p>
      ) : finished && quizzes.length === 0 ? (
        //  퀴즈 없거나 에러 메시지
        <p>{message}</p>
      ) : quizzes.length === 0 ? (
        <p>퀴즈가 없습니다.</p>
      ) : !finished ? (
        // 퀴즈 진행중
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          {/* 문제 */}
          <div className="mb-3 text-lg font-semibold">
            Q{current.position}. {current.question}
          </div>

          {/* 보기 */}
          <div className="mb-4 space-y-2">
            {current.choices.map((c, idx) => {
              const isChosen = selected === idx
              const correct = showResult && idx === current.answerIdx
              const wrongChosen = showResult && isChosen && idx !== current.answerIdx

              return (
                <button
                  type="button"
                  key={idx}
                  disabled={showResult}
                  onClick={() => setSelected(idx)}
                  className={[
                    'w-full rounded-md border px-3 py-2 text-left transition',
                    isChosen && !showResult ? 'border-blue-500 bg-blue-50' : 'border-gray-200',
                    correct ? 'border-green-500 bg-green-50' : '',
                    wrongChosen ? 'border-red-500 bg-red-50' : '',
                    showResult ? 'cursor-default opacity-80' : 'hover:bg-gray-50',
                  ].join(' ')}
                >
                  <span className="mr-2 font-mono">{idx + 1}.</span>
                  {c}
                </button>
              )
            })}
          </div>

          {/* 제출 / 다음 */}
          {!showResult ? (
            <button
              type="submit"
              disabled={selected === null}
              className="w-full rounded bg-blue-600 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              제출
            </button>
          ) : (
            <div className="space-y-3">
              {isCorrect ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 font-semibold text-green-700">
                  ✅ 정답입니다!
                </div>
              ) : (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-700">
                  ❌ 오답입니다. 정답은 {current.answerIdx + 1}번 입니다.
                </div>
              )}

              {current.explanation && (
                <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">💡 {current.explanation}</p>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="w-full rounded bg-blue-600 py-2 font-bold text-white"
              >
                {step + 1 < quizzes.length ? '다음 문제' : '결과 보기'}
              </button>
            </div>
          )}
        </form>
      ) : (
        //  퀴즈 끝
        <div className="text-center">
          <p className="mb-2 text-xl font-bold">
            퀴즈 완료! 맞힌 개수: {correctCount} / {quizzes.length}
          </p>

          {correctCount === 0 ? (
            <p className="mt-4 rounded px-4 py-2 text-lg font-semibold text-blue-600">
              아쉽습니다 😢 내일 다시 도전하세요!
            </p>
          ) : (
            <button
              onClick={savePong}
              disabled={rewarded}
              className={`mt-4 w-full rounded px-4 py-2 text-lg font-bold text-white transition ${rewarded ? 'cursor-not-allowed bg-green-500 opacity-50' : 'bg-green-500 hover:bg-green-600'} `}
            >
              퐁 받기
            </button>
          )}

          {message && <p className="mt-3 text-lg font-semibold text-indigo-700">{message}</p>}
          {showBell && <GoldenBell />}
        </div>
      )}
    </main>
  )
}
