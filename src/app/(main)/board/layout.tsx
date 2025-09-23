import type { ReactNode } from 'react'
import { BoardIcon } from '@/icons'
import BoardTabs from '@/components/board-page/BoardTabs'

export const metadata = { title: '게시판' }

export default function BoardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-3">
      <header className="mb-2">
        <div className="gap- flex items-center">
          <div className="relative mt-4 aspect-[35/31] w-40 shrink-0 sm:w-56 md:w-[242px] lg:w-80">
            <BoardIcon />
          </div>

          {/* 텍스트 */}
          <div className="text-left">
            <h1
              className="text-[60px] leading-none font-bold tracking-tight text-[#0045FF]"
              style={{ fontFamily: 'Pretendard' }}
            >
              게시판
            </h1>

            <p
              className="mt-5 hidden text-[32px] leading-none font-bold text-[#6AADEF] md:block"
              style={{ fontFamily: 'Pretendard' }}
            >
              우리의 생각과 소식이 모이는 곳
            </p>
          </div>
        </div>
      </header>

      {/* 공통 탭 */}
      <BoardTabs />

      {/* 개별 페이지 */}
      {children}
    </div>
  )
}
