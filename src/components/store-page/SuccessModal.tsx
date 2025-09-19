'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function SuccessModal({
  open,
  message,
  onClose,
}: {
  open: boolean
  message: string
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-black-600 flex items-center gap-2">🎉 결제 완료</DialogTitle>
          <DialogDescription className="mt-4 text-gray-700">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center">
          <Button onClick={onClose} className="bg-blue-500 text-white hover:bg-[#0036CC]">
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
