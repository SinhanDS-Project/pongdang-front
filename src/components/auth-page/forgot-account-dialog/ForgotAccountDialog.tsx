'use client'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FindIdForm } from './FindIdForm'
import { ResetPasswordForm } from './ResetPasswordForm'

type Mode = 'menu' | 'findId' | 'resetPw'

export function ForgotAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<Mode>('menu')

  // 모달 닫힐 때 모드 초기화
  function handleOpenChange(v: boolean) {
    if (!v) setMode('menu')
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'menu' ? '무엇을 도와드릴까요?' : mode === 'findId' ? '아이디(이메일) 찾기' : '비밀번호 찾기'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'menu' && (
          <div className="grid gap-3">
            <Button variant="secondary" onClick={() => setMode('findId')} className="hover:bg-primary-black/10">
              아이디(이메일) 찾기
            </Button>
            <Button onClick={() => setMode('resetPw')} className="bg-secondary-royal hover:bg-secondary-navy">
              비밀번호 찾기
            </Button>
          </div>
        )}

        {mode === 'findId' && <FindIdForm onBack={() => setMode('menu')} />}

        {mode === 'resetPw' && (
          <ResetPasswordForm open onBack={() => setMode('menu')} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
