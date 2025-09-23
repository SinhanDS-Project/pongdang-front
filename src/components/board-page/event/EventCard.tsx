'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type EventMeta = {
  slug: string
  title: string
  tagline: string
  thumb?: string
  href: string
}

export default function EventCard({ e }: { e: EventMeta }) {
  return (
    <Link href={`/event/${e.slug}`} aria-label={`${e.title} 이벤트 상세보기`}>
      <Card className={cn('hover:shadow-badge cursor-pointer rounded-xl transition-shadow duration-300')}>
        <CardHeader className="flex flex-col items-center justify-center gap-6 py-10">
          {e.thumb ? (
            <Image
              src={e.thumb}
              alt={`${e.title} 썸네일`}
              width={160}
              height={160}
              className="h-24 w-24 object-contain"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100 text-gray-400">?</div>
          )}
          <CardTitle className="text-center text-2xl font-extrabold text-gray-900">{e.title}</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center px-6 pb-10 text-center">
          <p className="line-clamp-3 text-base leading-relaxed text-gray-600">{e.tagline}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
