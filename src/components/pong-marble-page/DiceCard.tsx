'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Dices, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

const DICE_ICONS: Record<number, ReactNode> = {
  1: <Dice1 className="h-12 w-12" />,
  2: <Dice2 className="h-12 w-12" />,
  3: <Dice3 className="h-12 w-12" />,
  4: <Dice4 className="h-12 w-12" />,
  5: <Dice5 className="h-12 w-12" />,
  6: <Dice6 className="h-12 w-12" />,
}

function randFace() {
  return Math.floor(Math.random() * 6) + 1 // 1~6
}

/**
 * DiceCard
 * - canRoll: 버튼 활성화 여부(내 턴/연결/이동중 아님 등)
 * - isInJail: 감옥 여부 (true면 버튼 클릭 시 애니메이션 없이 즉시 턴 스킵: onRequestRoll(0, false))
 * - onRequestRoll: 최종 값 확정 시 호출 (total, isDouble)
 */
export function DiceCard({
  canRoll,
  isInJail,
  onRequestRoll,
}: {
  canRoll: boolean
  isInJail: boolean
  onRequestRoll: (total: number, isDouble: boolean) => void
}) {
  // 애니메이션용 주사위 (화면에서 돌아가는 눈)
  const [dice, setDice] = useState<[number, number]>([1, 1])
  // 최종 확정 주사위 (표시용: 합계/더블 텍스트는 이 값만 사용)
  const [finalDice, setFinalDice] = useState<[number, number]>([1, 1])
  const [rolling, setRolling] = useState(false)

  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (ivRef.current) clearInterval(ivRef.current)
    if (toRef.current) clearTimeout(toRef.current)
    ivRef.current = null
    toRef.current = null
  }

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const onRollDice = useCallback(() => {
    if (rolling || !canRoll) return

    setRolling(true)

    // 1~2초 사이
    const duration = 1000 + Math.random() * 1000
    const tick = 80

    // 프리뷰 애니메이션(돌아가는 눈)
    ivRef.current = setInterval(() => {
      setDice([randFace(), randFace()])
    }, tick)

    // 종료 시점에 최종 값 확정
    toRef.current = setTimeout(() => {
      clearTimers()
      const d1 = randFace()
      const d2 = randFace()
      setDice([d1, d2]) // 애니메이션 마지막 프레임
      setFinalDice([d1, d2]) // ✅ 최종 표시용
      setRolling(false)

      const total = d1 + d2
      const isDouble = d1 === d2

      // 서버 스펙: { dice: total, is_double: isDouble } 로 매핑해 호출
      onRequestRoll(total, isDouble)
    }, duration)
  }, [rolling, canRoll, isInJail, onRequestRoll])

  // ✅ 합계/더블 표시는 오직 최종 확정 값만 사용
  const finalSum = finalDice[0] + finalDice[1]
  const finalIsDouble = finalDice[0] === finalDice[1]

  return (
    <Card className="row-span-2">
      <CardHeader className="flex items-center gap-x-4 text-base font-bold">
        <Dices />
        <span>주사위</span>
      </CardHeader>
      <CardContent className="flex grow flex-col justify-between">
        <div className="flex justify-center gap-4">
          <div
            className={[
              'flex h-20 w-20 transform items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-2xl font-bold shadow-lg transition-transform',
              rolling ? 'animate-pulse' : 'hover:scale-105',
            ].join(' ')}
            aria-label={`주사위 1: ${dice[0]}`}
          >
            {DICE_ICONS[dice[0]]}
          </div>
          <div
            className={[
              'flex h-20 w-20 transform items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-2xl font-bold shadow-lg transition-transform',
              rolling ? 'animate-pulse' : 'hover:scale-105',
            ].join(' ')}
            aria-label={`주사위 2: ${dice[1]}`}
          >
            {DICE_ICONS[dice[1]]}
          </div>
        </div>

        {/* ✅ 최종 값만 보여줌 (롤링 중에도 텍스트는 안 변함) */}
        <div className="mx-2 flex items-center justify-between gap-x-4 text-base font-semibold">
          <span>
            합계: {dice[0]} + {dice[1]} = <span className="text-primary-shinhan">{finalSum}</span>칸
          </span>
          <span className="text-red-500">
            {finalIsDouble && (
              <div className="flex items-center gap-x-0.5">
                <Sparkles />
                더블
              </div>
            )}
          </span>
        </div>

        <Button
          onClick={onRollDice}
          className="bg-secondary-royal hover:bg-secondary-sky w-full"
          size="lg"
          disabled={!canRoll || rolling}
        >
          {rolling ? '굴리는 중...' : canRoll ? (isInJail ? '탈출 도전하기' : '주사위 굴리기') : '대기 중'}
        </Button>
      </CardContent>
    </Card>
  )
}
