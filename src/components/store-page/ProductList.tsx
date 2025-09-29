'use client'

import ProductCard from './ProductCard'
import { Product } from '../../types/store'

export default function ProductList({ products, onSelect }: { products: Product[]; onSelect?: (p: Product) => void }) {
  if (!products?.length) {
    return <div className="text-sm text-gray-500">상품이 없습니다.</div>
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={String(p.id)} product={p} onClick={onSelect} />
      ))}
    </div>
  )
}
