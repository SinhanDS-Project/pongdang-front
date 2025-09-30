// ResultDialog.tsx
'use client'

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { PlayerIcon, TrophyIcon } from '@/icons'
import { cn } from '@/lib/utils'
import type { Player } from '@/types/pongMarble'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

type ResultDialogProps = {
  open: boolean
  players: Player[]
  roomId: number
  meUserId: number
  initialSeconds?: number // 기본 5
  end?: () => void
}

export function ResultDialog({ open, players, roomId, meUserId, initialSeconds = 5, end }: ResultDialogProps) {
  const router = useRouter()

  // 화면에 보여줄 숫자만 로컬에서 관리
  const [displaySec, setDisplaySec] = useState<number>(initialSeconds)

  // 중복 세팅 방지 & 타이머 핸들 보관
  const armedRef = useRef(false)
  const tickRef = useRef<number | null>(null) // setInterval id
  const timeoutRef = useRef<number | null>(null) // setTimeout id

  // 열릴 때만 정확히 1개의 interval + 1개의 timeout을 건다
  useEffect(() => {
    // 닫히면 정리
    if (!open) {
      armedRef.current = false
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // 이미 무장되어 있으면(StrictMode 두 번 호출 방지) 아무 것도 안 함
    if (armedRef.current) return
    armedRef.current = true

    // 즉시 초기표시값 세팅
    setDisplaySec(initialSeconds)

    // 1) 디스플레이용 1초 간격 감소
    tickRef.current = window.setInterval(() => {
      setDisplaySec((s) => (s > 0 ? s - 1 : 0))
    }, 1000)

    // 2) 정확히 initialSeconds 뒤에 이동
    timeoutRef.current = window.setTimeout(() => {
      // 정리
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      armedRef.current = false

      end?.() // 서버 정리 등 필요하면 호출
      router.push(`/play/rooms/${roomId}`)
    }, initialSeconds * 1000)

    // 안전 정리
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      armedRef.current = false
    }
  }, [open, initialSeconds, roomId, router, end])

  // 정렬/내 등수
  const myRank = useMemo(
    () => players.find((p) => Number(p.user_id) === Number(meUserId))?.rank ?? null,
    [players, meUserId],
  )

  const isWinner = myRank === 1 || myRank === 2
  const bgClass = isWinner ? 'bg-secondary-royal' : 'bg-stone-400'

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className={cn('rounded p-1 text-white shadow-2xl sm:max-w-md md:rounded-xl md:p-6', bgClass)}>
        <AlertDialogHeader className="gap-y-4">
          <div className="text-end text-[10px] md:text-sm">{displaySec}초 후 대기방으로 이동합니다</div>
          <AlertDialogTitle className="text-center text-xl font-extrabold md:text-7xl">
            {myRank ? `${myRank}등` : '결과'}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-full space-y-2 text-sm font-semibold">
            {players.map((p) => {
              const winnerRow = p.rank === 1 || p.rank === 2
              return (
                <div key={p.user_id} className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    {winnerRow ? <TrophyIcon /> : <PlayerIcon />}
                    <span className="text-sm md:text-lg">{p.rank ?? '-'}등</span>
                  </div>
                  <div className="truncate">{p.nickname}</div>
                  {(p.reward ?? 0) > 0 ? (
                    <div className="text-secondary-navy w-12 text-right text-xs font-bold md:text-base">
                      {p.reward}퐁
                    </div>
                  ) : (
                    <div className="w-6 md:w-12" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
