import Image from 'next/image'
import Link from 'next/link'

import { SectionTitle } from '@/components/SectionTitle'
import { Card, CardContent } from '@/components/ui/card'
import { PongIcon } from '@/icons'

export type StoreItem = { id: number; name: string; price: number; img: string | null; product_type: string }

export function StoreSection({ items }: { items: StoreItem[] }) {
  return (
    <section className="mb-8">
      <SectionTitle href="#" title="퐁당퐁당 스토어"></SectionTitle>
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {items.map((item) => (
          <Link key={item.id} href={`/store/${item.id}`} className="hover:shadow-badge block rounded-xl">
            <Card className="p-4">
              <CardContent className="flex flex-col gap-y-4 p-0">
                <div className="bg-placeholder relative aspect-6/5 w-full">
                  <Image
                    src={item.img ?? '/placeholder-banner.png'}
                    alt={item.name}
                    objectFit="cover"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-xl font-bold">{item.name}</div>
                <div className="flex w-full items-center justify-end gap-x-4">
                  <PongIcon />
                  <div className="flex items-center gap-x-2">
                    <div className="text-lg">{item.price}</div>
                    <div className="text-primary-shinhan text-xl font-bold">퐁</div>
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
