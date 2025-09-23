'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SupportLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-3">
      {/* 헤더 */}
      <header className="mb-6">
        <h1 className="text-[60px] font-bold text-[#0045FF]" style={{ fontFamily: 'Pretendard' }}>
          고객지원
        </h1>
        <p className="mt-5 hidden text-[32px] font-bold text-[#6AADEF] md:block" style={{ fontFamily: 'Pretendard' }}>
          자주 묻는 질문과 1:1 문의
        </p>
      </header>

      {/* 탭 */}
      <nav className="mb-6" style={{ fontFamily: 'Pretendard' }}>
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
