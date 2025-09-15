// ── 프론트에서 쓰는 Product ──────────────────────────────
export type Product = {
  id: number | string
  name: string
  price: number
  img: string
  description: string
  product_type: string
}

// ── 백엔드 원본 ───────────────────────────────────────────
export type BackendProduct = {
  id: number
  name: string
  price: number
  img: string | null
  description: string
  type: string // ← 백엔드는 'type' 필드
}

// ── Spring Page 응답 ─────────────────────────────────────
export type SpringPage<T> = {
  content: T[]
  total_pages: number
  total_elements: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

// ── 카테고리 상수 & 타입 ─────────────────────────────────
export const PRODUCT_TYPE = ['ALL', 'GIFT', 'CARD', 'SHOP', 'ACCOUNT', 'INVESTMENT', 'OTT'] as const

export type Category = (typeof PRODUCT_TYPE)[number]

// ── 매핑 함수: Backend → Front ──────────────────────────
export function mapProducts(raw: BackendProduct[], fallbackImg = '/images/placeholder.png'): Product[] {
  return raw.map((d) => ({
    id: d.id,
    name: d.name,
    price: d.price,
    img: d.img ?? fallbackImg, // null 이면 대체 이미지
    description: d.description,
    product_type: d.type, // 백엔드 'type' → 프론트 'product_type'
  }))
}
