import type { ReactNode } from 'react'
import { BoardIcon } from '@/icons'

export default function BoardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="font-pretendard mx-auto max-w-5xl px-4 pt-8 pb-3">
      {/* 헤더 */}
      <header className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-12">
        {/* 아이콘 → 모바일에서는 숨기기 */}
        <div className="hidden flex-shrink-0 items-center justify-center sm:flex">
          <BoardIcon className="block h-40 w-36 overflow-visible" />
        </div>

        {/* 텍스트 */}
        <div className="flex flex-col justify-center">
          <h1 className="text-[60px] leading-none font-extrabold text-blue-600">게시판</h1>
          <p className="mt-2 hidden text-[32px] leading-snug font-semibold text-blue-400 md:block">
            우리의 생각과 소식이 모이는 곳
          </p>
        </div>
      </header>

      {children}
    </div>
  )
}
