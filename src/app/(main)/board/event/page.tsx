'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EventCard from '@/components/board-page/EventCard'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import BoardTabs from '@/components/board-page/BoardTabs'
import { useMe } from '@/hooks/use-me'

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
  const router = useRouter()
  const { user } = useMe()
  const [selected, setSelected] = useState<(typeof EVENTS)[number] | null>(null)

  return (
    <section className="space-y-4">
      <BoardTabs activeCategory="EVENT" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EVENTS.map((e) => (
          <EventCard
            key={e.slug}
            e={e}
            onClick={() => {
              if (user) {
                // ✅ 로그인 상태 → 바로 이동
                router.push(e.href)
              } else {
                // ❌ 비로그인 상태 → 모달 오픈
                setSelected(e)
              }
            }}
          />
        ))}
      </div>

      {/* 모달 */}
      <AlertDialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {user ? (
              <>
                <AlertDialogTitle>이벤트 시작</AlertDialogTitle>
                <AlertDialogDescription>{selected?.title} 이벤트를 시작하시겠습니까?</AlertDialogDescription>
              </>
            ) : (
              <>
                <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
                <AlertDialogDescription>
                  이벤트를 진행하려면 로그인해야 합니다. 로그인하시겠습니까?
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelected(null)}>취소하기</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (user && selected) {
                  router.push(selected.href) // 로그인 상태 → 이벤트 시작
                } else {
                  router.push('/signin') //  비로그인 상태 → 로그인으로
                }
              }}
              className="bg-secondary-royal hover:bg-secondary-navy"
            >
              {user ? '참여하기' : '로그인하러 가기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
