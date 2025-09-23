'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, CheckCircle, Eye, EyeOff, Loader2, UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { changeNickname, changePassword, checkNicknameDup, unregisterAccount } from '@/features/auth'

import { useMe } from '@/hooks/use-me'

// 내부 화면 타입
type Panel = 'overview' | 'nickname' | 'password' | 'success' | 'withdraw'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function ProfileEditModal({ open, onOpenChange }: Props) {
  const { mutate } = useMe()

  const [panel, setPanel] = useState<Panel>('overview')

  // 닫히면 내부 상태 초기화
  const handleOpenChange = async (v: boolean) => {
    setPanel('overview')
    onOpenChange(v)
    mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-0 shadow-xl">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-extrabold tracking-tight">
              {panel === 'overview'
                ? '내 프로필'
                : panel === 'nickname'
                  ? '닉네임 변경'
                  : panel === 'password'
                    ? '비밀번호 변경'
                    : panel === 'withdraw'
                      ? '경고문'
                      : '알림'}
            </DialogTitle>
          </DialogHeader>
          {panel === 'overview' && (
            <Overview
              onEditNickname={() => setPanel('nickname')}
              onEditPassword={() => setPanel('password')}
              onWithdrawDone={() => setPanel('withdraw')}
            />
          )}
          {panel === 'nickname' && (
            <NicknameForm onCancel={() => handleOpenChange(!open)} onSaved={() => setPanel('success')} />
          )}
          {panel === 'password' && (
            <PasswordForm onCancel={() => handleOpenChange(!open)} onSaved={() => setPanel('success')} />
          )}
          {panel === 'withdraw' && <Withdraw onClose={() => handleOpenChange(!open)} />}
          {panel === 'success' && <Success onClose={() => handleOpenChange(!open)} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Overview({
  onEditNickname,
  onEditPassword,
  onWithdrawDone,
}: {
  onEditNickname: () => void
  onEditPassword: () => void
  onWithdrawDone: () => void
}) {
  
  const { user } = useMe()

  return (
    <div className="flex flex-col gap-y-8">
      <div className="space-y-2">
        <div className="flex flex-col gap-y-1.5">
          <div className="text-base font-bold">이름</div>
          <div className="border-secondary-light rounded border-2 p-2 text-start text-sm">{user?.user_name}</div>
        </div>
        <div className="flex flex-col gap-y-1.5">
          <div className="text-base font-bold">아이디(이메일)</div>
          <div className="border-secondary-light rounded border-2 p-2 text-start text-sm">{user?.email}</div>
        </div>
        <div className="flex flex-col gap-y-1.5">
          <div className="text-base font-bold">전화번호</div>
          <div className="border-secondary-light rounded border-2 p-2 text-start text-sm">{user?.phone_number}</div>
        </div>
        <div className="flex flex-col gap-y-1.5">
          <div className="text-base font-bold">생년월일</div>
          <div className="border-secondary-light rounded border-2 p-2 text-start text-sm">{user?.birth_date}</div>
        </div>
        <div className="flex flex-col gap-y-1.5">
          <div className="text-base font-bold">닉네임</div>
          <div className="border-secondary-light rounded border-2 p-2 text-start text-sm">{user?.nickname}</div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onWithdrawDone}
            className="text-muted-foreground cursor-pointer text-xs underline underline-offset-4"
          >
            회원탈퇴
          </button>
        </div>
      </div>

      <DialogFooter className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="default"
          onClick={onEditPassword}
          className="bg-secondary-sky hover:bg-secondary-royal rounded text-lg font-bold"
        >
          비밀번호 수정하기
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={onEditNickname}
          className="bg-secondary-sky hover:bg-secondary-royal rounded text-lg font-bold"
        >
          닉네임 수정하기
        </Button>
      </DialogFooter>
    </div>
  )
}

// ---------- 닉네임 변경 스키마 ----------
const NicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .regex(/^[A-Za-z0-9가-힣_]+$/, '한글/영문/숫자/언더스코어(_)만 사용할 수 있습니다.'),
  nicknameChecked: z.boolean().refine((val) => val === true, { message: '닉네임 중복 확인이 필요합니다' }),
})

type NicknameFormData = z.infer<typeof NicknameSchema>

function NicknameForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<NicknameFormData>({
    resolver: zodResolver(NicknameSchema),
    defaultValues: {
      nickname: '',
      nicknameChecked: false,
    },
    mode: 'onChange',
  })

  const nickname = form.watch('nickname')

  // 닉네임이 바뀌면 중복확인 상태 리셋
  useEffect(() => {
    form.setValue('nicknameChecked', false, { shouldValidate: true })
  }, [nickname, form])

  /** 닉네임 중복 확인 */
  async function onDupCheck() {
    setServerError(null)
    const ok = await form.trigger('nickname')
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

  /** 닉네임 저장 */
  async function onSubmit(values: NicknameFormData) {
    try {
      setSubmitting(true)

      await changeNickname(values.nickname)

      onSaved()
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? '저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* 닉네임 필드 */}
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>닉네임</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <div className="relative w-full">
                      <UserIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input {...field} placeholder="닉네임을 입력하세요 (2~20자)" className="pl-9" maxLength={20} />
                    </div>
                  </FormControl>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onDupCheck}
                    disabled={checking || !field.value.trim()}
                    className="min-w-28"
                  >
                    {checking ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        확인중
                      </>
                    ) : (
                      <>
                        <Check className="mr-1 size-4" />
                        중복확인
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">한글/영문/숫자/밑줄(_) 가능, 2~20자</p>
                {form.getValues('nicknameChecked') && (
                  <p className="mt-1 text-xs text-emerald-600">사용 가능한 닉네임입니다.</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 숨김 필드: 중복확인 여부 */}
          <FormField
            control={form.control}
            name="nicknameChecked"
            render={({ field }) => <input type="hidden" {...field} value={String(field.value)} />}
          />

          {/* 서버 에러 */}
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded">
              취소
            </Button>
            <Button type="submit" className="bg-secondary-royal hover:bg-secondary-navy rounded" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  처리중
                </>
              ) : (
                '닉네임 변경'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

// ---------- 비밀번호 변경 스키마 ----------
const PasswordSchema = z
  .object({
    password: z.string(),
    newPassword: z
      .string()
      .min(6, '비밀번호는 최소 6자 이상이어야 합니다.')
      .regex(/[A-Z]/, '비밀번호에는 대문자가 최소 1개 포함되어야 합니다.')
      .regex(/[a-z]/, '비밀번호에는 소문자가 최소 1개 포함되어야 합니다.')
      .regex(/[0-9]/, '비밀번호에는 숫자가 최소 1개 포함되어야 합니다.')
      .regex(/[^A-Za-z0-9]/, '비밀번호에는 특수문자가 최소 1개 포함되어야 합니다.'),
    newPasswordConfirm: z.string().min(1, '비밀번호 확인을 입력하세요'),
  })
  .refine((v) => v.newPassword === v.newPasswordConfirm, {
    path: ['newPasswordConfirm'],
    message: '',
  })

type PasswordFormData = z.infer<typeof PasswordSchema>

function PasswordForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [showPw, setShowPw] = useState(false)
  const [showPwConfirm, setShowPwConfirm] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      password: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
    mode: 'onChange',
  })

  const pw = form.watch('newPassword')
  const pwc = form.watch('newPasswordConfirm')
  const passwordsMatch = pw && pwc && pw === pwc

  async function onSubmit(values: PasswordFormData) {
    setSubmitting(true)
    try {
      await changePassword({ oldPassword: values.password, newPassword: values.newPassword })

      onSaved()
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? '저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
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
                      type={'password'}
                      placeholder="영문 대/소문자, 숫자, 특수문자 포함 6자 이상"
                      autoComplete="new-password"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 새 비밀번호 */}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>새 비밀번호</FormLabel>
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
            name="newPasswordConfirm"
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

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded">
              취소
            </Button>
            <Button type="submit" className="bg-secondary-royal hover:bg-secondary-navy rounded" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  처리중
                </>
              ) : (
                '비밀번호 변경'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

function Success({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <CheckCircle className="text-secondary-sky h-12 w-12" />
      <h3 className="text-2xl font-bold">회원 정보가 변경되었습니다!</h3>
      <p className="text-muted-foreground">이제 변경된 정보로 서비스를 이용해보세요.</p>

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

function Withdraw({ onClose }: { onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false)

  const onClick = async () => {
    setSubmitting(true)
    try {
      await unregisterAccount()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-foreground space-y-4">
        <p className="text-xl font-semibold">정말로 회원 탈퇴를 진행하시겠습니까?</p>

        <div className="flex flex-col">
          <p className="mb-1 text-base font-medium">탈퇴 시 아래 내용이 적용됩니다:</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>적립된 퐁 및 이용 내역은 복구가 불가능합니다.</li>
            <li>작성하신 게시글 및 댓글은 삭제되지 않고 유지될 수 있습니다.</li>
          </ul>
        </div>

        <p className="font-bold">탈퇴 후에는 동일 계정으로 다시 복구가 불가하므로, 신중히 결정해 주시기 바랍니다.</p>
      </div>
      {/* 버튼 */}
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" disabled={submitting} variant="outline" className="rounded" onClick={onClick}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              처리중
            </>
          ) : (
            '탈퇴하기'
          )}
        </Button>
        <Button type="button" className="bg-secondary-royal hover:bg-secondary-navy rounded" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  )
}

export default ProfileEditModal
