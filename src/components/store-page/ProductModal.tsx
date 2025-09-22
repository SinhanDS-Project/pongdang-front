'use client'

import Image from 'next/image'
import { Product } from './types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PongIcon } from '@/icons'

type Props = {
  product: Product
  onClose: () => void
  onPay: (p: Product) => void
  paying?: boolean
}

export default function ProductModal({ product, onClose, onPay, paying = false }: Props) {
  const price = Number(product.price || 0)

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : void 0)}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
        {/* 헤더 */}
        <DialogHeader className="p-4">
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
          <DialogDescription className="sr-only">상품 상세 정보 및 결제</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-80 max-h-96 px-4 pb-4">
          {/* 이미지 */}
          <div className="relative mb-4 aspect-[2/1]">
            <Image
              src={product.img || '/placeholder-banner.png'}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="rounded-lg object-contain"
              priority
            />
          </div>

          {/* 본문 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-secondary-light text-primary-white rounded-full px-3 py-1">
                {product.product_type}
              </Badge>
              <div className="text-secondary-royal flex items-center gap-2 text-lg font-semibold">
                <PongIcon />
                <span>{price.toLocaleString('ko-KR')} 퐁</span>
              </div>
            </div>

            <Separator />

            <div className="relative aspect-[4/3] w-full rounded-lg">
              <Image
                src={product.description}
                alt={`${product.name} 설명 이미지`}
                width={800}
                height={600}
                className="h-auto w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </ScrollArea>

        {/* 푸터 */}
        <DialogFooter className="grid grid-cols-2 gap-2 px-4 py-2">
          <Button
            type="button"
            variant="default"
            className="bg-secondary-royal hover:bg-secondary-navy rounded"
            onClick={() => onPay(product)}
            disabled={paying}
          >
            {paying ? '결제 중…' : '결제하기'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="rounded">
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
