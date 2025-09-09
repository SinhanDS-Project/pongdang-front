'use client'

import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'

import { cn } from '@/lib/utils'

import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export type Banner = {
  id: string
  title: string
  image_path: string
  banner_link_url: string
  description: string
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }))

  return (
    <Carousel
      className="mb-3 w-full md:mb-6"
      plugins={[autoplay.current]}
      role="region"
      aria-roledescription="carousel"
      aria-label="메인 배너"
    >
      <CarouselContent>
        {banners.map((item, index) => (
          <CarouselItem key={item.id} aria-label={`슬라이드 ${index + 1} / ${banners.length}`}>
            <div className="p-1">
              <Link href={item.banner_link_url ?? '#'} className="block">
                <Card className="overflow-hidden rounded-xl p-0 md:rounded-2xl">
                  <CardContent
                    className={cn(
                      // ✅ 반응형 비율 + 최소 높이 가드
                      'relative flex aspect-3/1 items-center justify-center p-0',
                      'min-h-[180px] sm:min-h-[220px] md:min-h-[260px]',
                      item.banner_link_url === '#' && 'bg-placeholder',
                    )}
                  >
                    <Image
                      src={item.image_path}
                      alt={item.description || item.title}
                      fill
                      className="object-contain"
                      // ✅ 브레이크포인트별 예상 렌더 폭 힌트
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1024px"
                      // ✅ LCP 최적화: 첫 슬라이드만 eager
                      priority={index === 0}
                    />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  )
}
