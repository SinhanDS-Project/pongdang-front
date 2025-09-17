'use client'

import { useAuthStore } from '@/stores/auth-store'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle } from 'lucide-react'
import { useState } from 'react'

type Panel = 'change' | 'success'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function ChangePongModal({ open, onOpenChange }: Props) {
  const [panel, setPanel] = useState<Panel>('change')

  // 닫히면 내부 상태 초기화
  const handleOpenChange = async (v: boolean) => {
    setPanel('change')
    onOpenChange(v)
    await useAuthStore.getState().loadMe()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-0 shadow-xl">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-extrabold tracking-tight">
              {panel === 'change' ? '포인트 전환하기' : '알림'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-y-8">
            {panel === 'success' && <Success onClose={() => handleOpenChange(!open)} />}

            <DialogFooter className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="default"
                className="bg-secondary-sky hover:bg-secondary-royal rounded text-lg font-bold"
              >
                비밀번호 수정하기
              </Button>
              <Button
                type="button"
                variant="default"
                className="bg-secondary-sky hover:bg-secondary-royal rounded text-lg font-bold"
              >
                닉네임 수정하기
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Success({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <CheckCircle className="text-secondary-sky h-12 w-12" />
      <h3 className="text-2xl font-bold">포인트가 전환되었습니다!</h3>
      <p className="text-muted-foreground">이제 전환된 퐁으로 서비스를 이용해보세요.</p>

      <Button
        type="button"
        variant="default"
        onClick={onClose}
        className="bg-secondary-sky hover:bg-secondary-royal w-full rounded text-lg font-bold"
      >
        확인
      </Button>
    </div>
  )
}
