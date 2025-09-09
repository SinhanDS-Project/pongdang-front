'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { cn } from '@lib/utils'

import { login } from '@features/auth'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.') // 공백 검사
    .email('올바른 이메일 주소를 입력해주세요.'), // 이메일 형식 검사

  password: z
    .string()
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.') // 길이 검사
    .regex(/[A-Z]/, '비밀번호에는 대문자가 최소 1개 포함되어야 합니다.') // 대문자
    .regex(/[a-z]/, '비밀번호에는 소문자가 최소 1개 포함되어야 합니다.') // 소문자
    .regex(/[0-9]/, '비밀번호에는 숫자가 최소 1개 포함되어야 합니다.') // 숫자
    .regex(/[^A-Za-z0-9]/, '비밀번호에는 특수문자가 최소 1개 포함되어야 합니다.'), // 특수문자
})

type LoginFormData = z.infer<typeof LoginSchema>

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  })

  const loading = form.formState.isSubmitting

  async function onSubmit(formData: LoginFormData) {
    setError(null)

    try {
      await login(formData)

      router.push('/') // 로그인 성공 시 메인 페이지로 이동
    } catch (err) {
      setError((err as Error).message || '로그인에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className={cn('flex w-full flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Link href="/" className="text-primary-shinhan text-2xl font-extrabold">
                    퐁당퐁당
                  </Link>
                  <p className="text-muted-foreground text-balance">건강한 금융 습관, 퐁당퐁당과 시작하세요</p>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">아이디 (Email)</Label>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="email"
                            type="email"
                            placeholder="pongdang@example.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">비밀번호</Label>
                    <Link href="#" className="ml-auto text-sm underline-offset-2 hover:underline">
                      비밀번호를 잊으셨나요?
                    </Link>
                  </div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input id="password" type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="min-h-5">{error ? <p className="text-sm text-red-600">{error}</p> : null}</div>
                <Button type="submit" className="bg-secondary-royal hover:bg-secondary-navy w-full" disabled={loading}>
                  {loading ? '로그인 중…' : '로그인'}
                </Button>
                <div className="text-center text-sm">
                  계정이 없으신가요?{' '}
                  <Link href="/signup" className="underline underline-offset-4">
                    회원가입
                  </Link>
                </div>
              </div>
            </form>
          </Form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/auth-background.png"
              alt="Image"
              fill
              content='"cover'
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
