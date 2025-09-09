'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { step2Schema, type Step2 } from '@lib/auth/signup-schemas'
import { useVerifyTimer } from '@lib/auth/use-verify-timer'

import { useSignupStore } from '@/stores/signup-store'

import { requestEmailCode, verifyEmailCode } from '@/features/auth'

import { Button } from '@components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { Input } from '@components/ui/input'

export function StepAccount() {
  const setStep = useSignupStore((s) => s.setStep)
  const patch = useSignupStore((s) => s.patch)

  // ✅ 스토어 스냅샷
  const emailSnap = useSignupStore((s) => s.email ?? '')
  const emailVerifiedSnap = useSignupStore((s) => Boolean(s.emailVerified))
  const emailLockedSnap = useSignupStore((s) => Boolean(s.emailLockedFromBetting))

  const [serverError, setServerError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [showPwConfirm, setShowPwConfirm] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const { seconds, cooldown, running, canResend, start, startCooldown } = useVerifyTimer(180)

  const form = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      email: emailLockedSnap ? emailSnap : emailSnap,
      password: '',
      passwordConfirm: '',
      emailVerified: emailVerifiedSnap,
      emailLockedFromBetting: emailLockedSnap,
      emailCode: '',
    },
    mode: 'onChange',
  })

  // 이메일 인증 버튼 활성화 여부
  const emailLocked = form.watch('emailLockedFromBetting') === true
  const email = form.watch('email')

  const canSend = useMemo(() => /\S+@\S+\.\S+/.test(email ?? ''), [email])

  async function onSendEmailCode() {
    if (emailLocked) return

    setServerError(null)
    const ok = await form.trigger('email')
    if (!ok || !canSend) return
    try {
      setRequesting(true)

      await requestEmailCode(form.getValues('email'))

      start(300)
      startCooldown(30)
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? '인증코드 전송 실패')
    } finally {
      setRequesting(false)
    }
  }

  async function onVerifyEmailCode() {
    setServerError(null)

    const currentEmail = form.getValues('email')
    const code = form.getValues('emailCode')

    if (!currentEmail || !/\S+@\S+\.\S+/.test(currentEmail)) {
      form.setError('email', { message: '올바른 이메일을 입력하세요.' })
      return
    }

    if (!code) {
      form.setError('emailCode' as any, { message: '인증코드를 입력하세요.' })
      return
    }

    try {
      setVerifying(true)
      await verifyEmailCode(currentEmail, code)
      form.setValue('emailVerified', true, { shouldValidate: true })
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? '인증코드 검증 실패')
      form.setValue('emailVerified', false, { shouldValidate: true })
    } finally {
      setVerifying(false)
    }
  }

  function onSubmit(values: Step2) {
    console.log("🚀 ~ onSubmit ~ values:", values)
    patch({
      email: values.email,
      password: values.password,
      passwordConfirm: values.passwordConfirm,
      emailVerified: values.emailVerified,
      emailLockedFromBetting: emailLocked,
    })

    setStep(3)
  }

  const pw = form.watch('password')
  const pwc = form.watch('passwordConfirm')
  const passwordsMatch = pw && pwc && pw === pwc

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {/* 이메일 */}
        {emailLocked ? (
          // ✅ 베팅포인트 연동으로 이메일 고정 (읽기 전용)
          <div>
            <FormLabel>이메일</FormLabel>
            <div className="relative">
              <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input value={emailSnap} disabled className="pl-9" />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              베팅포인트에서 가져온 이메일입니다. 이 단계에서는 이메일 변경/인증이 생략됩니다.
            </p>

            {/* 스키마 만족을 위한 hidden 필드 */}
            <input type="hidden" value="true" {...form.register('emailVerified')} />
          </div>
        ) : (
          <>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <div className="relative w-full">
                        <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input placeholder="user@example.com" className="pl-9" autoComplete="email" {...field} />
                      </div>
                    </FormControl>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onSendEmailCode}
                      disabled={!canResend || !canSend || requesting}
                      className="min-w-28"
                    >
                      {requesting ? (
                        '전송중…'
                      ) : canResend ? (
                        <>
                          <Send className="mr-1 size-4" /> 인증요청
                        </>
                      ) : (
                        `재전송 ${cooldown}s`
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 인증 코드 입력 */}
            <div className="mb-2 flex items-center gap-2">
              <Input placeholder="인증코드 6자리" inputMode="numeric" autoComplete="one-time-code" />
              <Button
                type="button"
                onClick={onVerifyEmailCode}
                className="bg-secondary-sky hover:bg-secondary-royal"
                disabled={verifying}
              >
                {verifying ? '확인중…' : '확인'}
              </Button>
              <span className="text-muted-foreground min-w-12 text-center text-sm">{running && `${seconds}s`}</span>
            </div>

            {/* 이메일 인증 완료 플래그 */}
            <FormField
              control={form.control}
              name="emailVerified"
              render={({ field }) => (
                <FormItem className="mb-2">
                  <Input type="hidden" {...field} value={String(field.value)} />
                  <p className="h-4 text-xs text-emerald-600">
                    {form.getValues('emailVerified') && '이메일 인증 완료'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* 비밀번호 */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    placeholder="영문 대/소문자, 숫자, 특수문자 포함 6자 이상"
                    autoComplete="new-password"
                    {...field}
                  />
                  <button
                    type="button"
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              <ul className="text-muted-foreground mt-2 list-inside list-disc text-xs leading-5">
                <li>최소 6자 이상</li>
                <li>대/소문자, 숫자, 특수문자 각각 1개 이상</li>
              </ul>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 비밀번호 확인 */}
        <FormField
          control={form.control}
          name="passwordConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호 확인</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPwConfirm ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    autoComplete="new-password"
                    {...field}
                  />
                  <button
                    type="button"
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowPwConfirm((v) => !v)}
                    aria-label={showPwConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPwConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              {/* 실시간 일치 안내 (선택) */}
              {pwc && (
                <p className={`mt-1 text-xs ${passwordsMatch ? 'text-emerald-600' : 'text-red-600'}`}>
                  {passwordsMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        {/* 서버 에러 */}
        <div className="min-h-5">{serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}</div>

        <Button type="submit" className="bg-secondary-royal hover:bg-secondary-navy w-full">
          다음
        </Button>
      </form>
    </Form>
  )
}
