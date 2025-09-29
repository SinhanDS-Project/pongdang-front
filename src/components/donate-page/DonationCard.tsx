'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export type DonationInfo = {
  id: number
  title: string
  content: string
  goal: number
  current: number | null
  img?: string | null
}

type DonationCardProps = {
  donation: DonationInfo
}

export default function DonationCard({ donation }: DonationCardProps) {
  const router = useRouter()

  const fmt = useCallback(
    (v?: number | null) => (typeof v === 'number' && !isNaN(v) ? v.toLocaleString('ko-KR') : '0'),
    [],
  )

  const goalPong = Math.floor(donation.goal / 100)
  const currentPong = donation.current ?? 0
  const percent = goalPong > 0 ? Math.min(100, Math.round((currentPong / goalPong) * 100)) : 0

  const imgSrc = donation.img || '/placeholder-banner.png'

  return (
    <Card
      className="hover:shadow-badge block rounded-xl p-2.5 transition-shadow"
      onClick={() => router.push(`/donation/${donation.id}`)}
    >
      <CardContent className="flex flex-col gap-y-2 p-0">
        {/* 이미지 */}
        <div className="bg-placeholder relative aspect-[4/3] w-full overflow-hidden rounded">
          <Image
            src={imgSrc}
            alt={donation.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className="line-clamp-1 text-base font-semibold sm:text-lg">{donation.title}</div>

        <div className="flex items-center justify-between text-sm text-blue-600">
          <span className="font-semibold">모인 기부퐁</span>
          <span className="text-gray-600">
            {fmt(currentPong)} / {fmt(goalPong)} 퐁
          </span>
        </div>

        <Progress value={percent} className="mb-2 h-2 bg-gray-200" />
      </CardContent>
    </Card>
  )
}
