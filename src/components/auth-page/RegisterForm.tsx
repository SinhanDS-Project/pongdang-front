'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'

import { useSignupStore } from '@/stores/signup-store'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// ✅ 단계 별 폼 컴포넌트 (경로는 프로젝트에 맞게 조정)
import { StepAccount, StepComplete, StepIdentity, StepNickName } from '@/components/auth-page/signup-steps'

export function RegisterForm({ className, ...props }: React.ComponentProps<'div'>) {
  const step = useSignupStore((s) => s.step)

  // 진행률
  const progress = useMemo(() => (step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100), [step])

  return (
    <div className={cn('flex w-full flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* 좌측: 폼 콘텐츠 */}
          <div className="flex flex-col gap-6 p-6 md:p-8">
            {/* 헤더 */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <Link href="/" className="text-primary-black/50 text-2xl font-extrabold">
                  퐁당퐁당
                </Link>
                <div className="text-primary-shinhan text-2xl font-extrabold">회원가입</div>
              </div>
              <p className="text-muted-foreground text-balance">건강한 금융 습관, 퐁당퐁당 가입으로 시작해보세요</p>
            </div>

            {/* 진행률 */}
            <section aria-label="회원가입 진행률" className="mt-2">
              <div className="text-muted-foreground mb-2 text-end text-sm">{step}/4</div>
              <Progress value={progress} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
            </section>

            {/* 단계별 콘텐츠 */}
            <section className="mt-2" role="group" aria-roledescription="signup-steps" aria-label="회원가입 단계">
              {step === 1 && <StepIdentity />}
              {step === 2 && <StepAccount />}
              {step === 3 && <StepNickName />}
              {step === 4 && <StepComplete />}
            </section>
          </div>

          {/* 우측: 이미지 */}
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/auth-background.png"
              alt="회원가입 안내 이미지"
              fill
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              priority
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
