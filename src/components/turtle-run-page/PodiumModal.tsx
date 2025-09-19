import { useMemo } from 'react'
import { useAuthStore } from '@stores/auth-store'

type FinishRow = {
  userId: number
  nickname: string
  rank: 'FIRST' | 'SECOND' | 'THIRD' | 'LOSE' | string
  winAmount?: number
  pointChange?: number
}

type Props = {
  open: boolean
  onClose: () => void
  results: FinishRow[]
  title?: string
  subtitle?: string
  countdownSec?: number
}

const ORDER: Array<'FIRST' | 'SECOND' | 'THIRD' | 'LOSE'> = [
  'FIRST', 'SECOND', 'THIRD', 'LOSE',
]

const RANK_LABEL: Record<string, string> = {
  FIRST: '1등',
  SECOND: '2등',
  THIRD: '3등',
  LOSE: 'LOSE',
}

const weight = (rank: string) => {
  const i = ORDER.indexOf(String(rank).toUpperCase() as any)
  return i >= 0 ? i : 999
}

const rankIcon = (rank: string) => {
  const k = String(rank).toUpperCase()
  return k === 'FIRST' || k === 'SECOND' || k === 'THIRD' ? '🏆' : '👤'
}

export function PodiumModal({
  open,
  onClose,
  results = [],
  countdownSec,
}: Props) {
  // --- hooks (항상 최상단) ---
  const myId = useAuthStore((s) => s.user?.id)
  const myRow = useMemo(
    () => results.find((r) => r.userId === myId),
    [results, myId]
  )
  const myRankLabel = useMemo(() => {
    const key = String(myRow?.rank ?? '').toUpperCase()
    return RANK_LABEL[key] ?? '-'
  }, [myRow])

  const sorted = useMemo(() => {
    return results
      .map((row, idx) => ({ row, idx }))
      .sort((a, b) => {
        const dw = weight(a.row.rank) - weight(b.row.rank)
        return dw !== 0 ? dw : a.idx - b.idx
      })
      .map((x) => x.row)
  }, [results])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div
        className="
          relative w-[min(420px,92vw)] overflow-hidden rounded-3xl
          shadow-2xl
          bg-gradient-to-b from-[#76B6FF] to-[#5AA2FF]
          text-white
        "
      >
        {/* 상단 큰 등수 */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="text-[92px] leading-none font-black tracking-tight drop-shadow">
            {myRankLabel}
          </div>
        </div>

        {/* 리스트 */}
        <div className="px-8 pb-6 space-y-4">
          {sorted.map((r, i) => {
            const key = String(r.rank).toUpperCase()
            const isTop3 = key === 'FIRST' || key === 'SECOND' || key === 'THIRD'
            const isMe = r.userId === myId
            return (
              <div
                key={r.userId ?? i}
                className={`
                  flex items-center justify-between rounded-xl px-3 py-2
                  ${isMe ? 'bg-white/10 ring-1 ring-white/20' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{rankIcon(key)}</span>
                  <span className="w-10 text-right text-sm text-white/80">
                    {RANK_LABEL[key] ?? ''}
                  </span>
                  <span className="font-medium">{r.nickname}</span>
                </div>
                <div
                  className={[
                    'tabular-nums font-extrabold',
                    isTop3 ? 'text-[#1E56FF]' : 'text-white/70',
                  ].join(' ')}
                >
                  {(r.winAmount ?? r.pointChange ?? 0)} 퐁
                </div>
              </div>
            )
          })}
        </div>

        {/* 하단 안내/버튼 영역 */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/10">
          <div className="text-sm text-white/80">
            {typeof countdownSec === 'number' && (
              <span>{countdownSec}초 후 대기방으로 이동합니다.</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium hover:bg-white/30"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
