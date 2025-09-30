import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function BankruptcyDialog({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  onClose: () => void
}) {
  if (!open) return null

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-base md:text-2xl">{title}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col items-center gap-y-8 font-semibold">
          <div className="text-sm text-red-700 md:text-base">{message}</div>
          <Button
            className="w-full rounded bg-red-500 py-2.5 text-base font-semibold text-white hover:bg-red-600 md:rounded-lg"
            onClick={onClose}
          >
            파산
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
