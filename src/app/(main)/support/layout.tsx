'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SupportIcon } from '@/icons'

export default function SupportLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="font-pretendard mx-auto max-w-5xl px-4 pt-8 pb-3">
      {/* 헤더 */}
      <header className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-12">
        {/* 아이콘 */}
        <div className="flex flex-shrink-0 items-center justify-center">
          <SupportIcon className="block h-40 w-36 overflow-visible" />
        </div>

        {/* 텍스트 */}
        <div className="flex flex-col justify-center">
          <h1 className="text-[60px] leading-none font-extrabold text-blue-600">고객지원</h1>
          <p className="mt-2 hidden text-[32px] leading-snug font-semibold text-blue-400 md:block">
            자주 묻는 질문과 1:1 문의
          </p>
        </div>
      </header>

      {/* 탭 */}
      <nav className="mb-6">
        <div className="relative flex border-b border-gray-200">
          <Link
            href="/support/faq"
            className={`flex-1 pb-2 text-center text-[24px] font-bold ${
              pathname.startsWith('/support/faq')
                ? 'border-b-2 border-black text-black'
                : 'text-gray-300 hover:text-black'
            }`}
          >
            FAQ
          </Link>
          <Link
            href="/support/inquiry"
            className={`flex-1 pb-2 text-center text-[24px] font-bold ${
              pathname.startsWith('/support/inquiry')
                ? 'border-b-2 border-black text-black'
                : 'text-gray-300 hover:text-black'
            }`}
          >
            1:1 문의하기
          </Link>
        </div>
      </nav>

      {/* 탭별 콘텐츠 */}
      <section className="min-h-[400px]">{children}</section>
    </div>
  )
}
