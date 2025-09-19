export type EventMeta = {
  slug: string
  title: string
  tagline: string
  thumb?: string
}

export const EVENTS: EventMeta[] = [
  {
    slug: 'attendance',
    title: '퐁당퐁당 출석체크',
    tagline: '매일 출석하고 퐁 받기!',
    thumb: '/attendance.png',
  },
  {
    slug: 'quiz',
    title: '도전! 금융 골든벨',
    tagline: '금융 퀴즈 풀고 퐁 모으기!',
    thumb: '/bell2.png',
  },
  {
    slug: 'random',
    title: '랜덤 물방울 터뜨리기',
    tagline: '물방울을 골라 터뜨리고 퐁 얻기!',
    thumb: '/bubble2.png',
  },
]
