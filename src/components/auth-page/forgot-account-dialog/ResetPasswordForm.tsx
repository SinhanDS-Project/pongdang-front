'use client'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { findPasswordRequestEmailCode, sendTempPassword, verifyEmailCode } from '@/features/auth'
import { useVerifyTimer } from '@/lib/auth/use-verify-timer'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const ResetPwSchema = z.object({
  email: z.string().trim().email('올바른 이메일 주소를 입력하세요'),
  code: z.string().min(1, '인증코드를 입력하세요'),
})
type ResetPwFormData = z.infer<typeof ResetPwSchema>

export function ResetPasswordForm({ open, onBack, onDone }: { open: boolean; onBack: () => void; onDone: () => void }) {
  const form = useForm<ResetPwFormData>({
    resolver: zodResolver(ResetPwSchema),
    defaultValues: { email: '', code: '' },
    mode: 'onChange',
  })

  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [lastRequestedEmail, setLastRequestedEmail] = useState<string | null>(null)

  const [requesting, setRequesting] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const { cooldown, canResend, start, startCooldown, reset, resetCooldown } = useVerifyTimer(300)

  useEffect(() => {
    if (!open) {
      reset() // 타이머 & 쿨다운 모두 초기화
      setVerified(false)
      setError(null)
      setLastRequestedEmail(null)
      form.reset({ email: '', code: '' })
    }
  }, [open, reset, form])

  const email = form.watch('email')

  useEffect(() => {
    resetCooldown() // 쿨다운만 리셋
    setVerified(false)
    form.setValue('code', '')
  }, [email, resetCooldown, form])

  async function onRequestCode() {
    setError(null)

    const ok = await form.trigger('email')
    const emailTrim = (form.getValues('email') ?? '').trim()
    const canSend = /\S+@\S+\.\S+/.test(emailTrim)
    if (!ok || !canSend) return

    try {
      setRequesting(true)
      await findPasswordRequestEmailCode(form.getValues('email'))
      start(300)
      startCooldown(30)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '인증코드 전송 실패')
    } finally {
      setRequesting(false)
    }
  }

  async function onVerifyCode() {
    setError(null)
    try {
      setVerifying(true)
      await verifyEmailCode(form.getValues('email'), form.getValues('code'))
      setVerified(true)
    } catch (e: any) {
      setVerified(false)
      setError(e?.response?.data?.message ?? '인증코드 검증 실패')
    } finally {
      setVerifying(false)
    }
  }

  async function onSendTempPw() {
    setError(null)
    if (!verified) {
      setError('이메일 인증이 필요합니다.')
      return
    }
    try {
      await sendTempPassword(form.getValues('email'))
      onDone()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '임시 비밀번호 발송 실패')
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-3" onSubmit={(e) => e.preventDefault()} noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <Label>이메일</Label>
              <FormControl>
                <Input
                  placeholder="user@example.com"
                  autoComplete="email"
                  {...form.register('email', {
                    onBlur: (e) => form.setValue('email', e.target.value.trim(), { shouldValidate: true }),
                  })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Input placeholder="인증코드 6자리" inputMode="numeric" {...form.register('code')} />
          <Button
            type="button"
            variant="secondary"
            onClick={onRequestCode}
            disabled={
              requesting || (lastRequestedEmail === email && !canResend) // 같은 이메일이면 쿨다운 적용
            }
          >
            {requesting ? '전송중…' : lastRequestedEmail !== email || canResend ? '인증요청' : `재전송 ${cooldown}s`}
          </Button>
          <Button type="button" onClick={onVerifyCode} disabled={verifying}>
            {verifying ? '확인중…' : '확인'}
          </Button>
        </div>
        <div className="h-10">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {verified && <p className="text-xs text-emerald-600">이메일 인증이 완료되었습니다.</p>}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="w-1/2" onClick={onBack}>
            뒤로
          </Button>
          <Button type="button" className="w-1/2" onClick={onSendTempPw} disabled={!verified}>
            임시 비밀번호 발송
          </Button>
        </div>
      </form>
    </Form>
  )
}
