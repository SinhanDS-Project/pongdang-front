'use client'

import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { SingleBellIcon, SingleBombIcon, SingleCoinIcon } from '@/icons'

import { cn } from '@/lib/utils'

// 카드 데이터 정의
const GAMES = [
  {
    href: '/play/coin',
    title: (
      <>
        <span className="text-secondary-royal">퐁! </span>던지기
      </>
    ),
    subtitle: (
      <>
        <span className="text-secondary-royal">오늘의 운세는?</span>
        <span className="text-secondary-light">동전 한 번에 퐁 GET!!</span>
      </>
    ),
    icon: <SingleCoinIcon />,
  },
  {
    href: '/play/bomb',
    title: (
      <>
        터진다..
        <span className="text-secondary-royal">퐁!</span>
      </>
    ),
    subtitle: (
      <>
        <span className="text-secondary-royal">지뢰를 피해 생존하라!</span>
        <span className="text-secondary-light">끝까지 버티면 퐁 보상!</span>
      </>
    ),
    icon: <SingleBombIcon />,
  },
  {
    href: '/play/quiz',
    title: (
      <>
        <span className="text-secondary-royal">도전! </span>금융 골든벨
      </>
    ),
    subtitle: (
      <>
        <span className="text-secondary-royal">오늘의 금융 퀴즈</span>
        <span className="text-secondary-light">정답 맞히고 퐁을 모아보세요!</span>
      </>
    ),
    icon: <SingleBellIcon />,
  },
] as const

export default function PlayHomePage() {
  return (
    <div className="container mx-auto flex grow flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* 상단 타이틀 */}
      <div className="flex items-center gap-2 text-3xl font-extrabold">
        <div className="text-foreground/70">
          퐁! <span className="text-secondary-royal">게임 플레이어 존</span>
        </div>
      </div>

      {/* 카드 리스트 */}
      <div className="grid grow grid-cols-1 items-center gap-8 lg:grid-cols-3">
        {GAMES.map((game) => (
          <Link key={game.href} href={game.href} aria-label={`${game.title} 바로가기`}>
            <Card className={cn('hover:shadow-badge cursor-pointer gap-12 rounded-xl py-16 transition-shadow')}>
              <CardHeader className="flex flex-col items-center justify-center gap-8">
                {game.icon}
                <CardTitle className="text-center text-3xl font-extrabold">{game.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center text-base font-medium">
                {game.subtitle}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
