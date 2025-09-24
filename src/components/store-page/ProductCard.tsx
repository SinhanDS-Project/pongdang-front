'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PongIcon } from '@/icons'
import Image from 'next/image'
import { useCallback } from 'react'
import { Product } from '../../types/store'

export default function ProductCard({ product, onClick }: { product: Product; onClick?: (p: Product) => void }) {
  const fmt = useCallback((v: number) => v.toLocaleString('ko-KR'), [])

  const handleClick = () => onClick?.(product)
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(product)
    }
  }

  // 이미지 없을 때 플레이스홀더
  const imgSrc = product.img || '/placeholder-banner.png'

  return (
    <Card
      className="hover:shadow-badge block rounded-xl p-2.5 transition-shadow"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <CardContent className="flex flex-col gap-y-2 p-0">
        {/* 이미지 */}
        <div className="bg-placeholder relative aspect-[2/1] w-full overflow-hidden rounded">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={false}
          />
        </div>

        {/* 상품명 */}
        <div className="line-clamp-1 text-base font-semibold sm:text-lg">{product.name}</div>

        {/* 가격 */}
        <div className="flex w-full items-center justify-end gap-x-3 sm:gap-x-4">
          <PongIcon />
          <div className="flex items-center gap-x-1 sm:gap-x-2">
            <span className="text-secondary-royal text-sm font-semibold tabular-nums sm:text-base md:text-lg">
              {fmt(product.price as number)} 퐁
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
