'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Product } from './types'

export default function ProductModal({
  product,
  onClose,
  onPay,
  paying = false,
}: {
  product: Product
  onClose: () => void
  onPay: (p: Product) => void
  paying?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[90vw] max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-2xl">
        <div className="overflow-hidden rounded-lg border">
          <img src={product.img || '/images/gift.jpg'} alt={product.name} className="h-48 w-full object-cover" />
        </div>
        <h2 className="text-xl font-bold">{product.name}</h2>
        <p className="text-lg font-semibold text-blue-600">{product.price.toLocaleString('ko-KR')} 퐁</p>
        {product.description && <p className="whitespace-pre-wrap text-gray-600">{product.description}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => onPay(product)}
            disabled={paying}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {paying ? '결제 중...' : '결제하기'}
          </button>
          <button onClick={onClose} className="rounded border px-4 py-2">
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
