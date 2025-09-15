'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { PongIcon } from '@/icons'
import { useCallback } from 'react'
import { Product } from './types'

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
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${product.name} 상세 보기`}
      className="hover:shadow-badge block rounded-xl transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-black/20"
    >
      <Card className="p-3 sm:p-4">
        <CardContent className="flex flex-col gap-y-3 p-0 sm:gap-y-4">
          {/* 이미지 */}
          <div className="bg-placeholder relative aspect-[6/5] w-full overflow-hidden rounded-lg">
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
          <h3 className="line-clamp-1 text-base font-bold sm:text-lg md:text-xl">{product.name}</h3>

          {/* 가격 */}
          <div className="flex w-full items-center justify-end gap-x-3 sm:gap-x-4">
            <PongIcon />
            <div className="flex items-center gap-x-1 sm:gap-x-2">
              <span className="text-sm tabular-nums sm:text-base md:text-lg">{fmt(product.price as number)}</span>
              <span className="text-primary-shinhan text-base font-bold sm:text-lg md:text-xl">퐁</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
