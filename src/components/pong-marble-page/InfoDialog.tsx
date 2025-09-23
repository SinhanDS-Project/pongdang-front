import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function InfoDialog({
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
          <AlertDialogTitle className="text-center text-2xl">{title}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col items-center gap-y-8 font-semibold">
          <div className="text-muted-foreground text-base">{message}</div>
          <Button
            className="bg-secondary-royal hover:bg-secondary-sky w-full py-2.5 text-base font-semibold text-white"
            onClick={onClose}
          >
            확인
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
