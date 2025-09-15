'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/board/notice', label: '공지사항', category: 'NOTICE' },
  { href: '/board/free', label: '자유게시판', category: 'FREE' },
  { href: '/board/event', label: '이벤트', category: 'EVENT' },
]

type Props = {
  activeCategory?: string
}

export default function BoardTabs({ activeCategory }: Props) {
  const pathname = usePathname()

  // 상세보기 같은 경우 activeCategory 있으면 그걸 우선
  const effectiveCategory = activeCategory ?? (tabs.find((t) => pathname.startsWith(t.href))?.category || 'FREE')

  return (
    <nav className="mb-6" style={{ fontFamily: 'Pretendard' }}>
      <div className="relative flex border-b border-gray-200">
        {tabs.map((t) => {
          const active = effectiveCategory === t.category
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'relative -mb-[1px] flex-1 pb-2 text-center text-[24px] leading-normal font-bold',
                active ? 'text-black' : 'text-[#D9D9D9]',
                active ? 'block' : 'hidden sm:block',
              ].join(' ')}
            >
              {t.label}
              {active && (
                <span className="pointer-events-none absolute inset-x-0 -bottom-[1px] z-10 h-[3px] rounded-full bg-black" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
