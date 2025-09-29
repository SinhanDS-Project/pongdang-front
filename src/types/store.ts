// ── 프론트에서 쓰는 Product ──────────────────────────────
export type Product = {
  id: number | string
  name: string
  price: number
  img: string
  description: string
  product_type: 'GIFT' | 'CARD' | 'SHOP' | 'ACCOUNT' | 'INSURANCE' | 'INVESTMENT' | 'SUB'
}

// ── 백엔드 원본 ───────────────────────────────────────────
export type BackendProduct = {
  id: number
  name: string
  price: number
  img: string | null
  description: string | null
  product_type: 'GIFT' | 'CARD' | 'SHOP' | 'ACCOUNT' | 'INSURANCE' | 'INVESTMENT' | 'OTT'
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
export const PRODUCT_TYPE = ['ALL', 'GIFT', 'CARD', 'SHOP', 'ACCOUNT', 'INSURANCE', 'INVESTMENT', 'SUB'] as const

export type Category = (typeof PRODUCT_TYPE)[number]

// ── 매핑 함수: Backend → Front ──────────────────────────
export function mapProducts(raw: BackendProduct[], fallbackImg = '/placeholder-banner.png'): Product[] {
  return raw.map((d) => ({
    id: d.id,
    name: d.name,
    price: d.price,
    img: d.img ?? fallbackImg, // null이면 대체 이미지
    description: d.description ?? '', // null이면 빈 문자열
    product_type: d.product_type === 'OTT' ? 'SUB' : d.product_type, // OTT → SUB 변환
  }))
}
