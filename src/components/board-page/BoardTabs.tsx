'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/board/notice', label: '공지사항', category: 'NOTICE' },
  { href: '/board/free', label: '자유게시판', category: 'FREE' },
  { href: '/board/event', label: '이벤트', category: 'EVENT' },
]

export default function BoardTabs({ activeCategory }: { activeCategory?: string }) {
  const pathname = usePathname()
  const effectiveCategory = activeCategory ?? (tabs.find((t) => pathname.startsWith(t.href))?.category || 'FREE')

  return (
    <nav className="mb-6">
      {/* PC/태블릿: 모든 탭 */}
      <div className="relative hidden border-b border-gray-200 sm:flex">
        {tabs.map((t) => {
          const active = effectiveCategory === t.category
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'relative -mb-[1px] flex-1 pb-2 text-center text-[20px] font-bold',
                active ? 'text-black' : 'text-[#D9D9D9]',
              ].join(' ')}
            >
              {t.label}
              {active && <span className="absolute inset-x-0 -bottom-[1px] h-[3px] rounded-full bg-black" />}
            </Link>
          )
        })}
      </div>

      {/* 모바일: 현재 탭만 */}
      <div className="relative flex border-b border-gray-200 sm:hidden">
        {tabs
          .filter((t) => t.category === effectiveCategory)
          .map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current="page"
              className="relative -mb-[1px] w-full pb-2 text-center text-[20px] font-bold text-black"
            >
              {t.label}
              <span className="absolute inset-x-0 -bottom-[1px] h-[3px] rounded-full bg-black" />
            </Link>
          ))}
      </div>
    </nav>
  )
}
