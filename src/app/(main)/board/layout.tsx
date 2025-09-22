import BoardTabs from '@/components/board-page/BoardTabs'
import { BoardIcon } from '@/icons'
import type { ReactNode } from 'react'

export const metadata = { title: '게시판' }

export default function BoardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      {/* 상단 헤더 */}
      <div className="mb-8 flex flex-col items-center sm:mb-12 sm:flex-row sm:items-end sm:gap-x-8">
        {/* 아이콘 영역 */}
        <div className="bg-bubble rounded-full p-8 sm:p-12 md:p-16 lg:p-20">
          <BoardIcon />
        </div>

        {/* 타이틀 영역 */}
        <div className="flex grow flex-col items-center sm:mb-8 sm:items-start sm:justify-end sm:gap-y-4">
          <div className="text-primary-shinhan text-3xl font-extrabold sm:text-4xl md:text-5xl lg:text-6xl">게시판</div>
          <div className="text-secondary-sky text-lg font-semibold sm:text-2xl md:text-3xl lg:text-4xl">
            우리의 생각과 소식이 모이는 곳
          </div>
        </div>
      </div>

      {/* 탭 */}
      <BoardTabs />

      {/* 컨텐츠 */}
      {children}
    </div>
  )
}
