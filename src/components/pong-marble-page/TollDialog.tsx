import { cn } from '@/lib/utils'

import { Land, Player } from '@/types/pongMarble'

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function TollDialog({
  open,
  land,
  myInfo,
  onConfirmPay,
}: {
  open: boolean
  land: Land
  myInfo: Player
  onConfirmPay: () => void
}) {
  if (!open) return
  const insufficient = myInfo.balance < land.toll

  // 소유자 색상 지정
  const colorMap: Record<string, string> = {
    orange: 'text-orange-500',
    green: 'text-emerald-500',
    yellow: 'text-yellow-500',
    pink: 'text-pink-500',
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl">통행료 지불</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col items-center gap-y-4 font-semibold">
          <div className="text-base">
            <span className={cn(land.color ? colorMap[land.color] : 'text-card-foreground')}>"{land.name}"</span>의
            통행료를 <span className="text-red-500">{land.toll}G</span> 지불해야합니다.
          </div>
          {insufficient ? (
            <>
              <div className="mb-4 text-sm">
                <span className={cn(colorMap[myInfo.turtle_id])}>{myInfo.nickname}</span>
                <span className="text-red-700">님의 잔액이 {land.toll - myInfo.balance}G 부족합니다</span>
              </div>
              <Button
                className="w-full bg-red-500 py-2.5 text-base font-semibold text-white hover:bg-red-600"
                onClick={onConfirmPay}
              >
                파산
              </Button>
            </>
          ) : (
            <>
              <div className="mb-4 text-sm">
                통행료를 지불하고 <span className={cn(colorMap[myInfo.turtle_id])}>{myInfo.nickname}</span>님의 잔액이
                <span className="text-game-normal">{myInfo.balance - land.toll}G</span>남습니다
              </div>
              <Button
                className="bg-secondary-sky hover:bg-secondary-royal w-full py-2.5 text-base font-semibold text-white"
                onClick={onConfirmPay}
              >
                지불하기
              </Button>
            </>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
