'use client'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { findEmailByNamePhone } from '@/features/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const FindIdSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  phone: z.string().min(7, '휴대폰 번호를 입력하세요'),
})
type FindIdFormData = z.infer<typeof FindIdSchema>

// --- 휴대폰 포맷/검증 유틸 ----
const onlyDigits = (v: string) => v.replace(/\D/g, '')

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

export function FindIdForm({ onBack }: { onBack: () => void }) {
  const form = useForm<FindIdFormData>({
    resolver: zodResolver(FindIdSchema),
    defaultValues: { name: '', phone: '' },
    mode: 'onChange',
  })
  const [error, setError] = useState<string | null>(null)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const loading = form.formState.isSubmitting

  function mask(email: string) {
    const [id, domain] = email.split('@')
    if (!id || !domain) return email
    const keep = Math.min(2, id.length)
    return `${id.slice(0, keep)}${'*'.repeat(Math.max(1, id.length - keep))}@${domain}`
  }

  async function onSubmit(values: FindIdFormData) {
    setError(null)
    setMaskedEmail(null)
    try {
      const res = await findEmailByNamePhone({ user_name: values.name.trim(), phone_number: values.phone.trim() })

      setMaskedEmail(mask(res.email))
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '일치하는 회원 정보가 없습니다.')
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <Label>이름</Label>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <Label>휴대폰 번호</Label>
              <FormControl>
                <Input
                  placeholder="010-1234-5678"
                  {...field}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="h-5">
          {error && <p className="text-sm text-red-600">{error}</p>}

          {maskedEmail && (
            <p className="text-sm text-emerald-600">
              가입 이메일: <strong>{maskedEmail}</strong>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="w-1/2" onClick={onBack}>
            뒤로
          </Button>
          <Button type="submit" className="w-1/2" disabled={loading}>
            {loading ? '조회중…' : '조회'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
