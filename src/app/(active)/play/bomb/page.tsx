'use client'

import { Button } from '@/components/ui/button'
import { BombIcon } from '@/icons'
import { api } from '@/lib/net/client-axios'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Status = 'playing' | 'win' | 'lose'

const GRID = 5
const TARGET_SAFE = 5
const BOMB_COUNT = 6

function makeBombSet(size = GRID * GRID, bombs = BOMB_COUNT) {
  const set = new Set<number>()
  while (set.size < bombs) set.add(Math.floor(Math.random() * size))
  return set
}

export default function BoomPongGame() {
  const router = useRouter()

  // 보드 상태
  const [bombs, setBombs] = useState<Set<number>>(() => makeBombSet())
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [status, setStatus] = useState<Status>('playing')

  // ▶ 게임이 진행 중인가? (대기/종료 = true, 진행중 = false)
  const [isFinished, setIsFinished] = useState<boolean>(true)

  const safeCount = picked.size

  // 게임 시작(재도전) 버튼
  const startGame = useCallback(() => {
    setBombs(makeBombSet())
    setPicked(new Set())
    setStatus('playing')
    setIsFinished(false) // 진행 시작
  }, [])

  // 셀 클릭
  const handlePick = (idx: number) => {
    if (isFinished || status !== 'playing') return // 대기/종료 or 이미 끝난 게임 차단
    if (bombs.has(idx)) {
      setStatus('lose')
      return
    }
    if (picked.has(idx)) return
    const next = new Set(picked)
    next.add(idx)
    setPicked(next)
    if (next.size >= TARGET_SAFE) {
      setStatus('win')
    }
  }

  // 종료 후 처리 (API 호출 + 버튼 활성화로 전환)
  useEffect(() => {
    if (status === 'playing') return
    ;(async () => {
      try {
        if (status === 'win') {
          const res = await api.post<{ reward: number; message: string }>('/api/game/success')
          alert(res.data?.message ?? '게임 성공! 보상이 지급되었습니다.')
        } else {
          alert('다음 기회에 다시 도전해요!')
        }
      } catch (err) {
        console.error('보상 처리 실패', err)
        alert('보상 처리 중 문제가 발생했어요. 나중에 다시 시도해주세요.')
      } finally {
        setIsFinished(true) // 종료 상태로 전환 → 버튼 “도전하기” 활성화
      }
    })()
  }, [status])

  // UX 문구
  const hint = useMemo(() => {
    if (status === 'win') return { text: '대단해요! 위험을 뚫고 퐁을 모았어요.', cls: 'text-green-600' }
    if (status === 'lose') return { text: '조심한다고 했는데… 아쉽게 터졌어요!', cls: 'text-red-600' }
    return null
  }, [status])

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* 타이틀 */}
      <div className="mb-6 flex items-center justify-between text-3xl font-extrabold">
        <div className="flex items-center gap-2">
          <div className="text-foreground/70">
            터진다... <span className="text-secondary-royal">퐁!</span>
          </div>
          <BombIcon />
        </div>
        <Button onClick={() => router.push('/play')} className="bg-secondary-royal hover:bg-secondary-sky">
          뒤로가기
        </Button>
      </div>

      <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-y-6">
        {/* 진행 상황 */}
        <div className="text-sm text-gray-500">
          성공 {safeCount} / {TARGET_SAFE}
        </div>

        {/* 보드 */}
        <div className="shadow-badge rounded-lg bg-white p-4">
          <div className="grid gap-2 sm:gap-4" style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}>
            {Array.from({ length: GRID * GRID }).map((_, i) => {
              const isPicked = picked.has(i)
              const isBomb = bombs.has(i)
              const showBomb = status === 'lose' && isBomb // 실패 시 지뢰 전체 노출
              const showSafe = isPicked

              return (
                <button
                  key={i}
                  onClick={() => handlePick(i)}
                  disabled={isFinished || status !== 'playing'} // 시작 전/종료 후 비활성화
                  aria-label={`cell-${i}`}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded border transition-all sm:h-12 sm:w-12',
                    'border-secondary-royal bg-white shadow-md',
                    !(isFinished || status !== 'playing') && 'hover:border-2 hover:shadow-xl',
                    showSafe && 'border-2 border-transparent bg-emerald-300',
                    showBomb && 'border-2 border-transparent bg-red-300',
                  )}
                >
                  <span className="text-xl">{showBomb ? <BombIcon /> : ''}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 결과/힌트 */}
        <p className={cn('h-5 text-center text-lg font-bold', hint && hint.cls)}>{hint?.text || ''}</p>

        {/* 도전 버튼 */}
        <Button
          size="lg"
          className="bg-secondary-royal hover:bg-secondary-navy h-12 w-72 text-4xl font-extrabold"
          onClick={startGame}
          disabled={!isFinished} // 진행 중에는 비활성화
          aria-label="퐁 피하기 도전"
        >
          {isFinished ? '도전하기' : '도전 중..'}
        </Button>
      </div>
    </div>
  )
}
