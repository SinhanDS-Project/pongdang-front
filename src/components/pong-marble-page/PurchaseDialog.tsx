'use client'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { Land } from '@/types/pongMarble'

export function PurchaseDialog({
  open,
  land,
  onConfirm,
  onCancel,
}: {
  open: boolean
  land: Land | undefined
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl">{land?.name ?? '-'} 구매</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col items-center gap-y-4 font-semibold">
          <div className="text-base">
            가격: <span className="text-red-500">{land?.price ?? 0}G</span> / 통행료:{' '}
            <span className="text-game-normal">{land?.toll ?? 0}G</span>
          </div>
          <div className="grid w-full grid-cols-2 gap-x-4">
            <Button variant="secondary" onClick={onCancel} className="hover:bg-gray-300">
              아니오
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-secondary-sky hover:bg-secondary-royal text-base font-semibold text-white"
            >
              구매
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
