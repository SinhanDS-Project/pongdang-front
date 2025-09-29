'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMe } from '@/hooks/use-me'
import { cn } from '@/lib/utils'
import { Dices } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type GameRoom = {
  id: number
  title: string
  entry_fee: number
  status: 'WAITING' | 'PLAYING'
  level: 'HARD' | 'NORMAL' | 'EASY'
  game_name: string
  game_type: string
  count: number
}

export function GameRoomCard({ id, title, entry_fee, status, level, game_name, count, game_type }: GameRoom) {
  const { user } = useMe()
  const [noticeOpen, setNoticeOpen] = useState(false)

  const levelLabel: Record<GameRoom['level'], string> = {
    EASY: '하',
    NORMAL: '중',
    HARD: '상',
  }
  const levelColors: Record<GameRoom['level'], string> = {
    EASY: 'bg-game-easy',
    NORMAL: 'bg-game-normal',
    HARD: 'bg-game-hard',
  }

  const statusLabel = status === 'WAITING' ? '대기중' : '게임중'
  const statusColor = status === 'WAITING' ? 'text-emerald-600' : 'text-rose-600'

  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      return
    }

    // 보유 퐁 체크
    if ((user.pong_balance ?? 0) < entry_fee) {
      e.preventDefault()
      setNoticeOpen(true)
    }
  }

  const card = (
    <Card className="hover:shadow-badge h-44 rounded-xl transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4">
        {game_type === 'turtle' ? (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white',
              levelColors[level],
            )}
          >
            {levelLabel[level]}
          </div>
        ) : (
          <div className="bg-primary-shinhan flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white">
            <Dices />
          </div>
        )}

        <div className="grow text-start text-xl font-extrabold">{title}</div>
        <span className={cn('text-xs font-bold', statusColor)}>{statusLabel}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="text-muted-foreground text-sm">{game_name}</div>
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className="text-muted-foreground">참가비:</span>
            <span className="font-sm">{entry_fee} 퐁</span>
          </div>
        </div>

        {/* 참가 인원 */}
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">참가 인원:</span>
          <span className="font-medium">
            {count}/{game_type === 'turtle' ? 8 : 4}명
          </span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      {status === 'WAITING' ? (
        <Link href={`/play/rooms/${id}`} className="block" onClick={handleClick}>
          {card}
        </Link>
      ) : (
        card
      )}

      {/* 참가 불가 안내 모달 */}
      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>참가할 수 없습니다</DialogTitle>
            <DialogDescription>보유한 퐁이 부족하여 참가할 수 없습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setNoticeOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
