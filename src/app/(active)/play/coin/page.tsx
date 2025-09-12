'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { api } from '@/lib/net/client-axios'
import { cn } from '@/lib/utils'

import { BackCoinIcon, DefaultCoinIcon, FailIcon, FrontCoinIcon, SuccessIcon, TitleCoinIcon } from '@/icons'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

// 앞/뒤
type Face = 'heads' | 'tails'
type Trial = 'pending' | Face
const MAX_TRIALS = 3

export default function CoinGamePage() {
  const router = useRouter()

  // 각 시도 결과: pending | heads | tails (길이 3)
  const [trials, setTrials] = useState<Trial[]>(Array(MAX_TRIALS).fill('pending'))
  // 현재 시도 인덱스
  const [idx, setIdx] = useState(0)
  // 큰 코인 상태
  const [flipping, setFlipping] = useState(false)
  const [result, setResult] = useState<Face | null>(null)

  // ✅ 보상 모달
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMsg, setModalMsg] = useState<string>('')

  const isFinished = idx >= MAX_TRIALS
  const successCount = useMemo(() => trials.filter((t) => t === 'heads').length, [trials])

  // 결과 텍스트
  const resultText = useMemo(() => {
    if (result === 'heads') return '퐁! 축하합니다. 앞면이 나왔어요!'
    if (result === 'tails') return '앗! 뒷면이 나왔어요. 다시 도전해요!'
    return ''
  }, [result])

  // ✔️ 완료 후 처리: 모두 성공 시 API 호출, 아니면 실패 메시지
  useEffect(() => {
    if (!isFinished) return
    ;(async () => {
      try {
        if (successCount === MAX_TRIALS) {
          // NOTE: 백엔드 경로가 'succcess'로 전달됨(철자 주의)
          const res = await api.post<{ reward: number; message: string }>('/api/game/success')
          setModalMsg(res.data?.message ?? '게임 성공! 보상이 지급되었습니다.')
        } else {
          setModalMsg('다음 기회에 다시 도전해요!')
        }
      } catch {
        // 실패해도 사용자에게 안내
        setModalMsg('보상 처리 중 문제가 발생했어요. 나중에 다시 시도해주세요.')
      } finally {
        setModalOpen(true)
      }
    })()
  }, [isFinished, successCount])

  const onFlip = useCallback(() => {
    if (flipping || isFinished) return
    setFlipping(true)
    setResult(null)

    // 애니메이션 시간 후 결과 결정
    const t = setTimeout(() => {
      const next: Face = Math.random() < 0.5 ? 'heads' : 'tails'
      setResult(next)

      setTrials((prev) => {
        const copy = [...prev]
        copy[idx] = next
        return copy
      })
      setIdx((i) => i + 1)
      setFlipping(false)
    }, 900)

    return () => clearTimeout(t)
  }, [flipping, isFinished, idx])

  const onReset = () => {
    setTrials(Array(MAX_TRIALS).fill('pending'))
    setIdx(0)
    setResult(null)
    setFlipping(false)
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* 타이틀 */}
      <div className="mb-6 flex items-center justify-between text-3xl font-extrabold">
        <div className="flex items-center gap-2">
          <div className="text-foreground/70">
            <span className="text-secondary-royal">퐁! </span>던지기
          </div>
          <TitleCoinIcon />
        </div>
        <Button onClick={() => router.push('/play')} className="bg-secondary-royal hover:bg-secondary-sky">
          뒤로가기
        </Button>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <div className="mb-20 flex items-center gap-16">
          {trials.map((t, i) => (
            <TrialIcon key={i} state={t} />
          ))}
        </div>

        {/* 결과 코인 */}
        <div className="mb-8 flex min-h-64 items-center justify-center">
          <Coin flipping={flipping} face={result} />
        </div>

        {/* 결과 텍스트 */}
        <div className="h-6 text-center text-lg font-bold">
          {!flipping && resultText ? (
            <span className={cn(result === 'heads' ? 'text-game-normal' : 'text-game-hard')}>{resultText}</span>
          ) : null}
        </div>

        {/* 도전 / 다시하기 */}
        <div className="mt-4">
          {isFinished ? (
            <Button
              size="lg"
              className="hover:bg-secondary-sky bg-secondary-navy h-12 px-24 text-4xl font-extrabold"
              onClick={onReset}
              aria-label="다시 시작"
            >
              다시하기
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-secondary-royal hover:bg-secondary-navy h-12 w-72 text-4xl font-extrabold"
              onClick={onFlip}
              disabled={flipping}
              aria-label="코인 던지기 도전"
            >
              {flipping ? '던지는 중…' : '도전!'}
            </Button>
          )}
        </div>
      </div>

      {/* 간단한 플립 애니메이션 정의 (Next.js에서 바로 사용 가능) */}
      <style jsx global>{`
        @keyframes coin-flip {
          0% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(540deg);
          }
          100% {
            transform: rotateY(720deg);
          }
        }
        .animate-coin-flip {
          animation: coin-flip 0.9s ease-in-out both;
        }
      `}</style>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl">{successCount === MAX_TRIALS ? '성공!' : '실패'}</DialogTitle>
          </DialogHeader>
          <div className="text-center text-lg font-medium">{modalMsg}</div>
          <Button
            size="lg"
            className="hover:bg-secondary-sky bg-secondary-navy h-12 px-24 text-4xl font-extrabold"
            onClick={() => {
              onReset()
              setModalOpen(false)
            }}
            aria-label="다시 시작"
          >
            다시하기
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TrialIcon({ state }: { state: Trial }) {
  if (state === 'heads') return <SuccessIcon />
  if (state === 'tails') return <FailIcon />
  return <DefaultCoinIcon />
}

function Coin({ flipping, face }: { flipping: boolean; face: Face | null }) {
  // face === 'heads'일 때만 앞면
  const isHeads = face === 'heads' || face === null // 초기(null)도 앞면 취급

  // 플립 중에는 항상 앞면 아이콘 회전
  const Icon = flipping ? FrontCoinIcon : isHeads ? FrontCoinIcon : BackCoinIcon

  return (
    <div
      className={cn('inline-flex items-center justify-center', flipping && 'animate-coin-flip')}
      role="img"
      aria-label={face ? (isHeads ? '앞면' : '뒷면') : '코인'}
    >
      <Icon />
    </div>
  )
}
