'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { step1Schema, type Step1 } from '@/lib/auth/signup-schemas'
import { useVerifyTimer } from '@/lib/auth/use-verify-timer'

import { useSignupStore } from '@/stores/signup-store'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { findBettingUser, sendPhoneCode, verifyPhoneCode, type BettingUser } from '@/features/auth'

// --- 휴대폰 포맷/검증 유틸 ----
const onlyDigits = (v: string) => v.replace(/\D/g, '')

/** 한국 번호 간단 포맷터 (010/011/016/017/018/019, 02 유선 포함) */
function formatPhone(v: string) {
  const d = onlyDigits(v)

  // 서울 02 처리
  if (d.startsWith('02')) {
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`
  }

  // 휴대폰/기타 지역
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
}

/** 간단 유효성: 010-1234-5678 / 02-123-4567 등 하이픈 허용 */
function isValidPhoneHyphen(v: string) {
  const m1 = /^01[016789]-\d{3,4}-\d{4}$/.test(v) // 모바일
  const m2 = /^02-\d{3,4}-\d{4}$/.test(v) // 02 유선
  const m3 = /^0\d{2}-\d{3,4}-\d{4}$/.test(v) // 기타 지역
  return m1 || m2 || m3
}

const maskEmail = (e: string) => {
  const [id, domain] = e.split('@')
  if (!id || !domain) return e
  const keep = Math.min(2, id.length)
  return `${id.slice(0, keep)}${'*'.repeat(Math.max(1, id.length - keep))}@${domain}`
}

const maskPhone = (p: string) =>
  p.replace(/(\d{3})-(\d{2,4})-(\d{4})/, (_, a, b, c) => `${a}-${'*'.repeat(b.length)}-${c}`)

export function StepIdentity() {
  const router = useRouter()

  // ✅ zustand 액션 및 스냅샷
  const setStep = useSignupStore((s) => s.setStep)
  const patch = useSignupStore((s) => s.patch)
  const nameSnap = useSignupStore((s) => s.name ?? '')
  const birthSnap = useSignupStore((s) => s.birth ?? '')
  const phoneSnap = useSignupStore((s) => s.phone ?? '')
  const phoneVerifiedSnap = useSignupStore((s) => Boolean(s.phoneVerified))

  // ✅ 서버 에러 및 타이머
  const [serverError, setServerError] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bpUser, setBpUser] = useState<BettingUser | null>(null)

  // ✅ 이미 가입된 회원 모달 상태
  const [alreadyOpen, setAlreadyOpen] = useState(false)

  const { seconds, cooldown, running, canResend, start, startCooldown } = useVerifyTimer(180)

  // ✅ RHF 인스턴스 + defaultValues (스토어 스냅샷으로 prefill)
  const defaultValues = useMemo<Step1>(
    () => ({
      name: nameSnap,
      birth: birthSnap, // type="date"라면 YYYY-MM-DD 문자열
      phone: phoneSnap,
      phoneVerified: phoneVerifiedSnap,
      phoneCode: '',
    }),
    [nameSnap, birthSnap, phoneSnap, phoneVerifiedSnap],
  )

  const form = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues,
    mode: 'onChange',
  })

  // (선택) 스텝을 왕복할 때도 값 유지하고 싶다면 reset
  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  // ✅ 버튼 활성화 계산
  const name = form.watch('name')
  const birth = form.watch('birth') // YYYY-MM-DD
  const phone = form.watch('phone')

  const canSend = useMemo(() => {
    const hasName = (name ?? '').trim().length > 0
    const hasBirth = /^\d{4}-\d{2}-\d{2}$/.test(birth ?? '')
    const phoneOk = isValidPhoneHyphen(phone ?? '')
    return hasName && hasBirth && phoneOk
  }, [name, birth, phone])

  // ✅ 인증요청
  async function onSendOtp() {
    setServerError(null)
    const ok = await form.trigger(['name', 'birth', 'phone']) // 필수값 오류 먼저 표출
    if (!ok || !canSend) return
    try {
      setRequesting(true)
      const phoneForApi = form.getValues('phone') // 서버가 하이픈 허용 → 그대로 사용
      await sendPhoneCode(phoneForApi)
      start(180)
      startCooldown(30)
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? '인증번호 전송 실패')
    } finally {
      setRequesting(false)
    }
  }

  // ✅ 인증번호 검증
  async function onVerify() {
    setServerError(null)
    const phoneVal = form.getValues('phone')
    const code = form.getValues('phoneCode').trim()

    if (!phoneVal) {
      form.setError('phone', { message: '휴대폰 번호를 입력하세요' })
      return
    }
    if (!code) {
      // RHF에 등록만 되어 있으면 setError 가능
      form.setError('phoneCode' as any, { message: '인증번호를 입력하세요' })
      return
    }

    try {
      setVerifying(true)
      await verifyPhoneCode(phoneVal, code)
      form.setValue('phoneVerified', true, { shouldValidate: true })
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? '인증 실패')
      form.setValue('phoneVerified', false, { shouldValidate: true })
    } finally {
      setVerifying(false)
    }
  }

  // ✅ 다음 스텝
  async function onSubmit(values: Step1) {
    setServerError(null)

    // 스토어 저장
    patch(values)

    if (!values.phoneVerified) {
      form.setError('phoneVerified', { message: '휴대폰 인증이 필요합니다' })
      return
    }

    try {
      setSubmitting(true)
      const response = await findBettingUser({ name: values.name, phone: values.phone })
      setBpUser(response)
      setDialogOpen(true) // 다이얼로그 열어 질문
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.data &&
        (error.response.data as any).error === 'USER_ALREADY_REGISTERED'
      ) {
        setAlreadyOpen(true)
        return
      }

      patch({ emailLockedFromBetting: false, emailVerified: false })
      setStep(2)
    } finally {
      setSubmitting(false)
    }
  }

  // 👉 연결 수락
  function handleAcceptLink() {
    if (!bpUser) return
    patch({
      email: bpUser.email,
      emailVerified: true,
      emailLockedFromBetting: true,
      name: bpUser.user_name ?? nameSnap,
      birth: bpUser.birth_date ?? birthSnap,
      phone: bpUser.phone_number ?? phoneSnap,
    })
    setDialogOpen(false)
    setStep(2)
  }

  // 🙅 연결 건너뛰기
  function handleSkipLink() {
    // 원래 입력 유지, 이메일 수동 인증 플로우
    patch({ emailLockedFromBetting: false, emailVerified: false })
    setDialogOpen(false)
    setStep(2)
  }

  return (
    <>
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* 이름 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름</FormLabel>
                <FormControl>
                  <Input placeholder="홍길동" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 생년월일 */}
          <FormField
            control={form.control}
            name="birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>생년월일</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 휴대폰 + 인증 */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>휴대폰 번호</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="010-1234-5678"
                        inputMode="numeric"
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onSendOtp}
                      disabled={!canResend || !canSend || requesting}
                      className="min-w-28"
                      title={!canSend ? '이름/생년월일/휴대폰 번호를 모두 입력하세요' : undefined}
                    >
                      {requesting ? '전송중…' : canResend ? '인증요청' : `재전송 ${cooldown}s`}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 인증 코드 입력 (running일 때만 카운트다운 노출하고 싶다면 조건부로) */}
            <div className="flex items-center gap-2">
              <Input placeholder="인증번호 6자리" inputMode="numeric" {...form.register('phoneCode')} />
              <Button type="button" onClick={onVerify} className="bg-secondary-sky hover:bg-secondary-royal">
                {verifying ? '확인중…' : '확인'}
              </Button>
              <span className="text-muted-foreground min-w-12 text-center text-sm">{running ? `${seconds}s` : ''}</span>
            </div>

            {/* 인증 완료 플래그 */}
            <FormField
              control={form.control}
              name="phoneVerified"
              render={({ field }) => (
                <FormItem>
                  <Input type="hidden" {...field} value={String(field.value)} />
                  <p className="h-4 text-xs text-emerald-600">
                    {form.getValues('phoneVerified') ? '휴대폰 인증 완료' : ''}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* 서버 에러 */}
          <div className="min-h-5">{serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}</div>

          <Button type="submit" className="bg-secondary-royal hover:bg-secondary-navy w-full" disabled={submitting}>
            {submitting ? '확인중…' : '다음'}
          </Button>
        </form>
      </Form>

      {/* 🔔 연결 여부 확인 다이얼로그 */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>신한 회원 정보와 연결하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {bpUser ? (
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    이름: <strong>{bpUser.user_name}</strong>
                  </div>
                  <div>
                    닉네임: <strong>{bpUser.nickname}</strong>
                  </div>
                  <div>
                    이메일: <strong>{maskEmail(bpUser.email)}</strong>
                  </div>
                  <div>
                    휴대폰: <strong>{maskPhone(bpUser.phone_number)}</strong>
                  </div>
                </div>
              ) : (
                '조회된 사용자 정보가 없습니다.'
              )}
              <p className="text-muted-foreground mt-3">
                연결을 수락하면 이메일이 자동으로 설정되고 이메일 인증 단계가 생략됩니다.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipLink}>건너뛰기</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptLink}>연결하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ 이미 가입된 회원 모달 */}
      <AlertDialog open={alreadyOpen} onOpenChange={setAlreadyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이미 가입된 회원</AlertDialogTitle>
            <AlertDialogDescription>이미 가입된 회원입니다. 로그인 화면으로 이동할까요?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlreadyOpen(false)}>닫기</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setAlreadyOpen(false)
                router.replace('/signin') // 👉 프로젝트 로그인 경로로 변경 가능
              }}
            >
              로그인으로 이동
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
