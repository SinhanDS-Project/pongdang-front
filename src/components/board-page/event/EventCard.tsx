'use client'
import Link from 'next/link'
import Image from 'next/image'
import type { EventMeta } from './EventList'

export default function EventCard({ e }: { e: EventMeta }) {
  return (
    <Link href={`/board/event/${e.slug}`} className="group block">
      {/* 정확한 CSS 스펙에 맞는 카드 디자인 */}
      <div
        className="flex-shrink-0 bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_6px_30px_0_rgba(0,0,0,0.20)]"
        style={{
          width: '384px',
          height: '340px',
          borderRadius: '8px',
          boxShadow: '0 4px 25px 0 rgba(0, 0, 0, 0.16)',
        }}
      >
        <div className="flex h-full flex-col items-center justify-center p-8">
          {/* 썸네일: 큰 아이콘 스타일로 중앙 정렬 */}
          <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
            {e.thumb ? (
              <Image src={e.thumb} alt="" width={80} height={80} className="object-contain" priority={false} />
            ) : (
              <div className="grid h-full w-full place-items-center text-gray-400">
                <div className="h-16 w-16 rounded-lg bg-gray-100"></div>
              </div>
            )}
          </div>

          {/* 제목: 중앙 정렬, 더 굵은 폰트 */}
          <h3 className="mb-4 line-clamp-1 px-4 text-center text-lg font-bold text-gray-900">{e.title}</h3>

          {/* 설명: 중앙 정렬, 더 작은 폰트 */}
          <p className="line-clamp-3 px-4 text-center text-sm leading-relaxed text-gray-500">{e.tagline}</p>
        </div>
      </div>
    </Link>
  )
}
