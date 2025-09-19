import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

const DICE_ICONS: Record<number, ReactNode> = {
  1: <Dice1 className="h-8 w-8" />,
  2: <Dice2 className="h-8 w-8" />,
  3: <Dice3 className="h-8 w-8" />,
  4: <Dice4 className="h-8 w-8" />,
  5: <Dice5 className="h-8 w-8" />,
  6: <Dice6 className="h-8 w-8" />,
}

function randFace() {
  return Math.floor(Math.random() * 6) + 1 // 1~6
}

export function DiceCard({
  canRoll,
  currentPlayer,
  onRolled, // optional: 최종 주사위 값 전달받아 다음 로직 수행하고 싶으면 사용
}: {
  canRoll: boolean
  currentPlayer?: { isInJail?: boolean; jailTurns?: number }
  onRolled?: (d1: number, d2: number) => void
}) {
  const [dice, setDice] = useState<[number, number]>([1, 1])
  const [rolling, setRolling] = useState(false)

  // 타이머 정리를 위한 ref
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (ivRef.current) clearInterval(ivRef.current)
    if (toRef.current) clearTimeout(toRef.current)
    ivRef.current = null
    toRef.current = null
  }

  useEffect(() => {
    return () => clearTimers() // 언마운트 시 정리
  }, [])

  const onRollDice = useCallback(() => {
    if (rolling || !canRoll) return

    setRolling(true)

    // 1~2초 사이로 지속
    const duration = 1000 + Math.random() * 1000
    const tick = 80 // 얼굴 바뀌는 간격(ms)

    // 빠르게 랜덤 얼굴로 교체
    ivRef.current = setInterval(() => {
      setDice([randFace(), randFace()])
    }, tick)

    // 종료 시점에 최종 값 확정
    toRef.current = setTimeout(() => {
      clearTimers()
      const final1 = randFace()
      const final2 = randFace()
      setDice([final1, final2])
      setRolling(false)
      onRolled?.(final1, final2)
    }, duration)
  }, [rolling, canRoll, onRolled])

  const sum = dice[0] + dice[1]
  const isDouble = dice[0] === dice[1]

  return (
    <Card className="row-span-3">
      <CardHeader className="pb-3">
        <CardTitle className="text-center">🎲 주사위</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-4">
          <div
            className={[
              'flex h-14 w-14 transform items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-2xl font-bold shadow-lg transition-transform',
              rolling ? 'animate-pulse' : 'hover:scale-105',
            ].join(' ')}
            aria-label={`주사위 1: ${dice[0]}`}
          >
            {DICE_ICONS[dice[0]]}
          </div>
          <div
            className={[
              'flex h-14 w-14 transform items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-2xl font-bold shadow-lg transition-transform',
              rolling ? 'animate-pulse' : 'hover:scale-105',
            ].join(' ')}
            aria-label={`주사위 2: ${dice[1]}`}
          >
            {DICE_ICONS[dice[1]]}
          </div>
        </div>

        <div className="text-muted-foreground text-center text-sm">
          합계: {sum}칸 {isDouble && '🎯 더블!'}
        </div>

        <Button
          onClick={onRollDice}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
          disabled={!canRoll || rolling}
        >
          {rolling ? '🎲 굴리는 중...' : canRoll ? '🎲 주사위 굴리기' : '⏳ 대기 중...'}
        </Button>

        {currentPlayer?.isInJail && (
          <div className="rounded bg-red-50 p-2 text-center text-sm font-medium text-red-600">
            🏝️ 무인도에 갇혀있습니다 ({(currentPlayer.jailTurns ?? 0) + 1}/2턴)
          </div>
        )}
      </CardContent>
    </Card>
  )
}
