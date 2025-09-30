'use client'

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'

export type ServerQuiz = {
  position: number
  question: string
  choice1: string
  choice2: string
  choice3: string
  choice4: string
  answer_idx: number // 0-based
  explanation: string
}

type QuizDialogProps = {
  open: boolean
  quiz?: ServerQuiz
  /** 퀴즈 당첨자의 turn_order (서버가 내려준 값) */
  turnOrder?: number | null
  /** 내 turn_order */
  meOrder?: number | null
  /** 정답 제출 시 호출: (선택 인덱스, 정답 여부) */
  onAnswer: (select_idx: number, is_correct: boolean) => void
  /** 모달 닫기 */
  onClose: () => void
}

export function QuizDialog({ open, quiz, turnOrder, meOrder, onAnswer, onClose }: QuizDialogProps) {
  // 보기/정답 정규화
  const data = useMemo(() => {
    if (!quiz) return null
    const choices = [quiz.choice1, quiz.choice2, quiz.choice3, quiz.choice4].filter((c) => c != null && c !== '')
    const answerIndex = Number.isFinite(quiz.answer_idx) ? quiz.answer_idx : -1
    return {
      question: quiz.question,
      choices,
      answerIndex,
      explanation: quiz.explanation,
    }
  }, [quiz])

  const isMine = !!quiz && turnOrder != null && meOrder != null && turnOrder === meOrder

  // 로컬 상태
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // 새 퀴즈/다시 열릴 때 상태 초기화
  useEffect(() => {
    setSelected(null)
    setSubmitted(false)
  }, [open, quiz?.position])

  if (!data) {
    return (
      <AlertDialog open={open} onOpenChange={(o) => (!o ? onClose() : void 0)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-base md:text-2xl">금융 퀴즈</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex flex-col items-center gap-y-8 py-6 font-semibold">
            <div className="text-muted-foreground text-sm md:text-base">퀴즈 데이터를 불러오는 중입니다</div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  const isCorrect = selected !== null && selected === data.answerIndex

  const handlePrimaryClick = () => {
    if (!isMine) {
      // 관전자는 확인만
      onClose()
      return
    }
    if (!submitted) {
      if (selected === null) return
      onAnswer(selected, isCorrect)
      setSubmitted(true)
      return
    }
    onClose()
  }

  const buttonLabel = isMine ? (submitted ? '확인' : '정답 제출') : '확인'

  return (
    <AlertDialog open={open} onOpenChange={(o) => (!o ? onClose() : void 0)}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-base md:text-2xl">금융 퀴즈</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex flex-col gap-y-1 font-semibold md:gap-y-4">
          {/* 상단 안내 (누가 푸는지) */}
          {turnOrder != null && (
            <div className="text-muted-foreground text-center text-[10px] md:text-xs">
              {isMine ? '당신의 문제입니다. 정답을 선택하세요!' : `현재 ${turnOrder}번 플레이어가 문제를 풉니다.`}
            </div>
          )}

          <div className="w-full text-sm md:text-base">Q. {data.question}</div>

          <RadioGroup
            value={selected !== null ? String(selected) : undefined}
            onValueChange={(v) => {
              if (isMine && !submitted) setSelected(Number(v))
            }}
            className={cn('w-full space-y-2 px-2', !isMine && 'pointer-events-none')}
          >
            {data.choices.map((c, idx) => {
              const isRight = idx === data.answerIndex
              const isMyPick = idx === selected

              // 상태별 스타일
              const base = 'flex items-center gap-2 rounded-md border p-3 transition'
              const preSubmitClass =
                !submitted && isMine ? (isMyPick ? 'border-blue-300 bg-blue-50' : 'hover:bg-muted/40') : ''

              const postSubmitClass = submitted
                ? isRight
                  ? 'border-emerald-400 bg-emerald-50'
                  : isMyPick
                    ? 'border-red-300 bg-red-50'
                    : 'opacity-70'
                : ''

              const spectatorClass =
                !isMine && !submitted ? (isRight ? 'border-emerald-400 bg-emerald-50' : 'opacity-80') : ''

              return (
                <div key={idx} className={cn(base, preSubmitClass || postSubmitClass || spectatorClass)}>
                  <RadioGroupItem id={`q-${idx}`} value={String(idx)} disabled={!isMine || submitted} />
                  <Label htmlFor={`q-${idx}`} className="flex-1 cursor-pointer text-xs md:text-sm">
                    {idx + 1}. {c}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>

          {/* 해설 노출 규칙:
              - 당첨자: 제출 후 노출
              - 관전자: 처음부터 노출
          */}
          {(submitted || !isMine) && data.explanation && (
            <div
              className={cn(
                'mx-2 mt-1 rounded p-4 text-[10px] md:text-xs',
                (!isMine && 'bg-emerald-50 text-emerald-900') ||
                  (isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'),
              )}
            >
              정답: {data.answerIndex + 1}번
              <br />
              해설: {data.explanation}
            </div>
          )}

          <Button onClick={handlePrimaryClick} disabled={isMine && !submitted && selected === null} className="mt-2">
            {buttonLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
