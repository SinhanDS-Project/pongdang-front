'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { useMe } from '@/hooks/use-me' // 로그인 여부 확인용

type Props = { title: string; rows: string[][]; ctaHref: string; ctaLabel: string }

export function CtaSection({ title, rows, ctaHref, ctaLabel }: Props) {
  const router = useRouter()
  const { user, status } = useMe()
  const [loginNoticeOpen, setLoginNoticeOpen] = useState(false)

  const delays = [0, 0.2, 0.4, 0.6, 0.8]

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (status !== 'authenticated' || !user) {
      // 로그인 안 되어있으면 모달 오픈
      setLoginNoticeOpen(true)
    } else {
      // 로그인 되어있으면 원래 경로로 이동
      router.push(ctaHref)
    }
  }

  return (
    <section className="bg-bubble mb-3 flex w-full flex-col items-center gap-y-10 py-16 sm:gap-y-12 sm:py-20 md:mb-6 md:gap-y-16 md:py-24">
      {/* 제목 */}
      <h2 className="text-primary-shinhan text-center text-2xl font-extrabold sm:text-3xl md:text-4xl lg:text-5xl dark:text-white">
        {title}
      </h2>

      {/* 카테고리 라벨들 */}
      <div className="flex flex-col items-center gap-y-6 text-lg font-medium sm:text-xl md:text-2xl lg:text-3xl">
        {rows.map((row, ri) => (
          <div key={ri} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-10 md:gap-x-16">
            {row.map((label, i) => (
              <div
                key={label}
                className="animate-bounce"
                style={{ animationDelay: `${(delays[i % delays.length] + ri * 0.1).toFixed(1)}s` }}
              >
                {label}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* CTA 버튼 */}
      <button
        onClick={handleClick}
        className="text-foreground hover:text-foreground/70 mt-4 text-xl font-bold underline sm:text-2xl md:text-3xl"
      >
        {ctaLabel}
      </button>

      {/* 로그인 안내 모달 */}
      <AlertDialog open={loginNoticeOpen} onOpenChange={setLoginNoticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
            <AlertDialogDescription>해당 메뉴는 로그인 후 이용할 수 있습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel onClick={() => router.push('/')}>취소하기</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/signin')}
              className="bg-secondary-royal hover:bg-secondary-navy"
            >
              로그인하러 가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
