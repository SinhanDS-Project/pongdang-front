import Image from 'next/image'
import Link from 'next/link'

import { SectionTitle } from '@/components/SectionTitle'
import { Card, CardContent } from '@/components/ui/card'
import { PongIcon } from '@/icons'

export type StoreItem = {
  id: number
  name: string
  price: number
  img: string | null
  product_type: string
}

export function StoreSection({ items }: { items: StoreItem[] }) {
  return (
    <section className="mb-8">
      <SectionTitle href="#" title="퐁당퐁당 스토어" />

      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/store/${item.id}`}
            className="hover:shadow-badge block rounded-xl transition-shadow"
          >
            <Card className="p-3 sm:p-4">
              <CardContent className="flex flex-col gap-y-3 p-0 sm:gap-y-4">
                {/* 이미지 */}
                <div className="bg-placeholder relative aspect-[6/5] w-full overflow-hidden rounded-lg">
                  <Image
                    src={item.img ?? '/placeholder-banner.png'}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>

                {/* 상품명 */}
                <div className="line-clamp-1 text-base font-bold sm:text-lg md:text-xl">{item.name}</div>

                {/* 가격 */}
                <div className="flex w-full items-center justify-end gap-x-3 sm:gap-x-4">
                  <PongIcon />
                  <div className="flex items-center gap-x-1 sm:gap-x-2">
                    <div className="text-sm sm:text-base md:text-lg">{item.price}</div>
                    <div className="text-primary-shinhan text-base font-bold sm:text-lg md:text-xl">퐁</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
