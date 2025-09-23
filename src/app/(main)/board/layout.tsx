import type { ReactNode } from 'react'
import { BoardIcon } from '@/icons'
import BoardTabs from '@/components/board-page/BoardTabs'

export default function BoardLayout({ children, activeCategory }: { children: ReactNode; activeCategory?: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-3">
      <header className="mb-2">
        <div className="gap- flex items-center">
          <div className="relative mt-4 aspect-[35/31] w-40 shrink-0 sm:w-56 md:w-[242px] lg:w-80">
            <BoardIcon />
          </div>

          <div className="text-left">
            <h1 className="text-[60px] leading-none font-bold tracking-tight text-[#0045FF]">게시판</h1>
            <p className="mt-5 hidden text-[32px] font-bold text-[#6AADEF] md:block">우리의 생각과 소식이 모이는 곳</p>
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
