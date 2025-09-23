'use client'

import EventCard from '@/components/board-page/event/EventCard'

const EVENTS = [
  {
    slug: 'attendance',
    title: '퐁당퐁당 출석체크',
    tagline: '매일 출석하고 퐁 받기!',
    thumb: '/attendance.png',
    href: '/event/attendance',
  },
  {
    slug: 'quiz',
    title: '도전! 금융 골든벨',
    tagline: '금융 퀴즈 풀고 퐁 받기!',
    thumb: '/bell2.png',
    href: '/play/quiz',
  },
  {
    slug: 'random',
    title: '랜덤 물방울 터트리기',
    tagline: '물방울을 골라 터트리고 퐁 받기!',
    thumb: '/bubble2.png',
    href: '/event/random-pong',
  },
] as const

export default function EventPage() {
  return (
    <section className="space-y-4">
      <h2 className="sr-only">이벤트 선택</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EVENTS.map((e) => (
          <EventCard key={e.slug} e={e} />
        ))}
      </div>
    </section>
  )
}
