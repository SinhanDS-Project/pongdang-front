'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/net/client-axios'
import { AxiosError } from 'axios'

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

/* ── 컴포넌트 ───────────────────────── */
export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<MappedQuiz[]>([])
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // 오늘의 퀴즈 생성 + 불러오기 (참여 여부는 아직 체크 X)
  useEffect(() => {
    ;(async () => {
      try {
        await api.post('/api/quiz') // 오늘 퀴즈 생성
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
      // ✅ 1번 문제 제출 시점에만 오늘 퀴즈 참여 여부 체크
      if (step === 0) {
        await api.post('/api/quiz/check')
      }

      if (selected === current.answerIdx) {
        setCorrectCount((c) => c + 1)
      }
      setShowResult(true)
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 409 && err.response?.data?.error === 'ALREADY_TODAY_QUIZ_FINISHED') {
          setFinished(true)
          setMessage('⚠️ 오늘은 이미 퀴즈에 참여하셨습니다.')
        } else {
          console.error(err)
          setMessage('퀴즈 진행 중 오류가 발생했습니다.')
        }
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
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (err.response?.data?.error === 'ALREADY_TODAY_QUIZ_FINISHED') {
          setMessage('⚠️ 오늘은 이미 퀴즈에 참여하셨습니다.')
        } else {
          setMessage('❌ 지급 요청에 실패했습니다. 잠시 후 다시 시도해주세요.')
        }
      } else {
        setMessage('❌ 알 수 없는 오류가 발생했습니다.')
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6">
      <h1 className="mb-6 text-2xl font-bold">🔔 도전! 금융 골든벨 🔔</h1>

      {loading ? (
        <p>퀴즈 불러오는 중...</p>
      ) : finished && quizzes.length === 0 ? (
        <p>{message}</p>
      ) : quizzes.length === 0 ? (
        <p>퀴즈가 없습니다.</p>
      ) : !finished ? (
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
        <div className="text-center">
          <p className="mb-2 text-xl font-bold">
            퀴즈 완료! 맞힌 개수: {correctCount} / {quizzes.length}
          </p>
          <button onClick={savePong} className="mt-4 rounded bg-green-500 px-4 py-2 font-bold text-white">
            퐁 받기
          </button>

          {message && <p className="mt-3 text-lg font-semibold text-indigo-700">{message}</p>}
        </div>
      )}
    </main>
  )
}
