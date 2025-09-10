'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { step3Schema, type Step3 } from '@/lib/auth/signup-schemas'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

import { checkNicknameDup, register } from '@/features/auth'

export function StepNickName() {
  const setStep = useSignupStore((s) => s.setStep)
  const patch = useSignupStore((s) => s.patch)

  const nameSnap = useSignupStore((s) => s.name ?? '')
  const birthSnap = useSignupStore((s) => s.birth ?? '') // YYYY-MM-DD
  const phoneSnap = useSignupStore((s) => s.phone ?? '') // 하이픈 포함 상태일 수 있음
  const emailSnap = useSignupStore((s) => s.email ?? '')
  const passwordSnap = useSignupStore((s) => s.password ?? '')
  const emailVerifiedSnap = useSignupStore((s) => Boolean(s.emailVerified))
  const nicknameSnap = useSignupStore((s) => s.nickname ?? '')
  const nicknameCheckedSnap = useSignupStore((s) => Boolean(s.nicknameChecked))
  const emailLockedFromBettingSnap = useSignupStore((s) => Boolean(s.emailLockedFromBetting))

  const [checking, setChecking] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      nickname: nicknameSnap,
      nicknameChecked: nicknameCheckedSnap,
      termsAgreed: false, // 기본 비동의
    },
    mode: 'onChange',
  })

  const nickname = form.watch('nickname')

  // 닉네임이 바뀌면 중복확인 상태 리셋
  useEffect(() => {
    form.setValue('nicknameChecked', false, { shouldValidate: true })
  }, [nickname, form])

  async function onDupCheck() {
    setServerError(null)
    const ok = await form.trigger('nickname') // 닉네임 형식 선검증
    if (!ok) return

    try {
      setChecking(true)
      const available = await checkNicknameDup(form.getValues('nickname').trim())
      form.setValue('nicknameChecked', available, { shouldValidate: true })
      if (!available) {
        form.setError('nickname', { message: '이미 사용 중인 닉네임입니다.' })
      }
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? '중복 확인 중 오류가 발생했습니다.')
      form.setValue('nicknameChecked', false, { shouldValidate: true })
    } finally {
      setChecking(false)
    }
  }

  async function onSubmit(values: Step3) {
    setServerError(null)

    // 1) 1~2단계 유효성 보강(안전망)
    if (!emailVerifiedSnap) {
      setServerError('이메일 인증이 완료되지 않았습니다.')
      return
    }
    if (!passwordSnap) {
      setServerError('비밀번호가 유효하지 않습니다. 이전 단계로 돌아가 다시 입력해주세요.')
      return
    }

    // 2) 최종 페이로드 구성 (백엔드 스펙 매핑)
    const payload = {
      email: emailSnap,
      password: passwordSnap,
      password_check: passwordSnap, // 별도 확인값 필요 시 여기에 매핑
      user_name: nameSnap,
      nickname: values.nickname,
      birth_date: birthSnap, // YYYY-MM-DD
      phone_number: phoneSnap, // 하이픈 포함 → 필요시 .replace(/-/g, '')
      agree_privacy: values.termsAgreed,
      linked_with_betting: emailLockedFromBettingSnap, // 필요 시 체크박스 추가하여 form 값으로 매핑
    } as const

    try {
      setSubmitting(true)

      await register(payload)

      setStep(4) // 완료 화면으로
    } catch (e: any) {
      setServerError(e?.response?.data ?? '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {/* 닉네임 */}
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>닉네임</FormLabel>
              </div>
              <div className="flex gap-2">
                <FormControl>
                  <div className="relative w-full">
                    <UserIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input placeholder="닉네임을 입력하세요 (2~12자)" className="pl-9" maxLength={12} {...field} />
                  </div>
                </FormControl>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onDupCheck}
                  disabled={checking || (nickname ?? '').trim().length < 2}
                  className="min-w-28"
                >
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      확인중…
                    </>
                  ) : (
                    <>
                      <Check className="mr-1 size-4" />
                      중복확인
                    </>
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">한글/영문/숫자/밑줄(_) 가능, 2~12자</p>
              <p className="mt-1 h-4 text-xs text-emerald-600">
                {form.getValues('nicknameChecked') && '사용 가능한 닉네임입니다.'}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 숨김 필드: 닉네임 중복확인 통과 여부 (스키마 refine용) */}
        <FormField
          control={form.control}
          name="nicknameChecked"
          render={({ field }) => <input type="hidden" {...field} value={String(field.value)} />}
        />

        {/* 약관 동의 (필수) */}
        <FormField
          control={form.control}
          name="termsAgreed"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                    aria-label="서비스 약관 및 개인정보 처리방침 동의(필수)"
                  />
                </FormControl>
                <div className="text-sm leading-6">
                  <FormLabel className="cursor-pointer">
                    서비스 이용약관 및 개인정보 처리방침에 동의합니다 (필수)
                  </FormLabel>
                  <div className="text-muted-foreground mt-1">
                    <AlertDialog>
                      <AlertDialogTrigger className="underline underline-offset-4">전체 약관 보기</AlertDialogTrigger>
                      <AlertDialogContent className="max-w-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>서비스 이용약관 & 개인정보 처리방침</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <ScrollArea className="h-72 w-full space-y-4 rounded-md border p-4 text-sm leading-6">
                              <p>
                                개인정보보호법에 따라 퐁당퐁당에 회원가입 신청하시는 분께 수집하는 개인정보의 항목,
                                개인정보의 수집 및 이용목적, 개인정보의 보유 및 이용기간, 동의 거부권 및 동의 거부 시
                                불이익에 관한 사항을 안내 드리오니 자세히 읽은 후 동의하여 주시기 바랍니다.
                              </p>

                              <div>
                                <h3 className="text-base font-semibold">1. 수집하는 개인정보</h3>
                                <p className="mt-1">
                                  이용자는 회원가입을 하지 않아도 게시글 보기 등 대부분의 퐁당퐁당 서비스를 회원과
                                  동일하게 이용할 수 있습니다. 이용자가 게임 등 개인화 혹은 회원제 서비스를 이용하기
                                  위해 회원가입을 할 경우, 퐁당퐁당는 서비스 이용을 위해 필요한 최소한의 개인정보를
                                  수집합니다.
                                </p>
                                <ul className="text-muted-foreground list-inside list-disc pl-2">
                                  <li>회원 가입 시 필수항목: 이메일, 비밀번호, 이름, 생년월일, 휴대전화번호</li>
                                </ul>
                              </div>

                              <div>
                                <h3 className="text-base font-semibold">2. 서비스 이용 과정에서 수집하는 개인정보</h3>
                                <ul className="text-muted-foreground list-inside list-disc pl-2">
                                  <li>IP 주소, 쿠키, 서비스 이용 기록, 기기정보</li>
                                </ul>
                              </div>

                              <div>
                                <h3 className="text-base font-semibold">3. 개인정보 보관기간</h3>
                                <ul className="text-muted-foreground list-inside list-disc pl-2">
                                  <li>계약 또는 청약철회 등에 관한 기록: 5년 보관</li>
                                  <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 보관</li>
                                  <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 보관</li>
                                  <li>로그인 기록: 3개월 보관</li>
                                </ul>
                              </div>

                              <div>
                                <h3 className="text-base font-semibold">4. 개인정보 수집 및 이용 동의 거부 권리</h3>
                                <p className="mt-1">
                                  이용자는 개인정보의 수집 및 이용 동의를 거부할 권리가 있습니다. 다만, 회원가입 시
                                  수집하는 필수 항목에 대한 동의를 거부할 경우 서비스 이용이 어려울 수 있습니다.
                                </p>
                              </div>
                            </ScrollArea>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>닫기</AlertDialogCancel>
                          <AlertDialogAction>확인</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </FormItem>
          )}
        />

        {/* 서버 에러 */}
        <div className="min-h-5">
          {serverError ? (
            <p className="text-sm text-red-600">
              {typeof serverError === 'string' ? serverError : JSON.stringify(serverError)}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="bg-secondary-royal hover:bg-secondary-navy w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리중…
              </>
            ) : (
              '회원가입'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
