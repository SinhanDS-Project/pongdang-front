'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export type Banner = { id: string; title: string; image_path: string; banner_link_url: string; description: string }

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  return (
    <Carousel className="mb-4 w-full">
      <CarouselContent>
        {banners.map((item) => (
          <CarouselItem key={item.id}>
            <div className="p-1">
              <Link href={item.banner_link_url}>
                <Card className="overflow-hidden p-0">
                  <CardContent
                    className={cn(
                      'relative flex aspect-[3/1] items-center justify-center',
                      item.banner_link_url === '#' && 'bg-placeholder',
                    )}
                  >
                    <Image src={item.image_path} alt={item.description} fill className="object-contain" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
