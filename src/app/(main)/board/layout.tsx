import type { ReactNode } from 'react'
import { BoardIcon } from '@/icons'

export default function BoardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-3">
      <header className="mb-6">
        {/* sm 이상에서는 row, 모바일에서는 col */}
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-10">
          {/* 아이콘: 모바일에서는 숨기고 sm 이상에서만 보임 */}
          <div className="relative hidden shrink-0 sm:block sm:w-28 md:w-36 lg:w-44">
            <BoardIcon />
          </div>

          {/* 텍스트 */}
          <div className="mt-2 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-[#0045FF] sm:text-5xl md:text-6xl">게시판</h1>
            <p className="mt-1 hidden text-base font-semibold text-[#6AADEF] sm:block sm:text-lg md:mt-2 md:text-xl">
              우리의 생각과 소식이 모이는 곳
            </p>
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
