'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/board/notice', label: '공지사항', category: 'NOTICE' },
  { href: '/board/free', label: '자유게시판', category: 'FREE' },
  { href: '/board/event', label: '이벤트', category: 'EVENT' },
] as const

type Category = (typeof TABS)[number]['category']

type Props = {
  /** 상세 페이지 등에서 상단 탭을 올바르게 표시하고 싶을 때 외부에서 카테고리를 지정 */
  activeCategory?: Category | string
}

export default function BoardTabs({ activeCategory }: Props) {
  const pathname = usePathname()

  // /board/[category]/... 에서 [category] 추출
  // pathname: /board/free/123 -> "FREE"
  const segs = pathname.split('/').filter(Boolean) // ["board","free","123"]
  const fromPath: Category | undefined = (() => {
    const cat = segs[1]?.toUpperCase()
    return TABS.some((t) => t.category === cat) ? (cat as Category) : undefined
  })()

  const effectiveCategory: Category =
    (activeCategory && (activeCategory.toUpperCase() as Category)) || fromPath || 'FREE'

  return (
    <div className="mb-6">
      {/* 모바일도 모든 탭이 보이도록 가로 스크롤 */}
      <div
        role="tablist"
        aria-label="게시판 카테고리"
        className="relative flex gap-2 overflow-x-auto border-b border-gray-200"
      >
        {TABS.map((t) => {
          const active = effectiveCategory === t.category
          return (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative -mb-[1px] shrink-0 pb-2 text-center text-3xl font-bold sm:flex-1',
                active ? 'text-black' : 'text-[#D9D9D9]',
              )}
            >
              {t.label}
              {active && (
                <span className="pointer-events-none absolute inset-x-0 -bottom-[1px] z-10 h-1 rounded-full bg-black" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
