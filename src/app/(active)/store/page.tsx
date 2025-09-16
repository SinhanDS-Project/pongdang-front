'use client'

import { PongPagination } from '@/components/PongPagination'
import ErrorModal from '@/components/store-page/ErrorModal'
import LoadingModal from '@/components/store-page/LoadingModal'
import ProductList from '@/components/store-page/ProductList'
import ProductModal from '@/components/store-page/ProductModal'
import SuccessModal from '@/components/store-page/SuccessModal'
import { BackendProduct, Category, mapProducts, Product, PRODUCT_TYPE, SpringPage } from '@/components/store-page/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/net/client-axios'
import { useAuthStore, useCurrentUser } from '@/stores/auth-store'
import type { AxiosError } from 'axios'
import { Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

// ── 디바운스 ───────────────────────────────
function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── 로딩 스켈레톤 ─────────────────────────
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 h-40 w-full rounded-xl bg-gray-200" />
      <div className="mb-2 h-4 w-3/5 rounded bg-gray-200" />
      <div className="h-4 w-2/5 rounded bg-gray-200" />
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────
export default function StorePage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)

  const [activeCat, setActiveCat] = useState<Category>('ALL')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [size] = useState(12)
  const [totalPages, setTotalPages] = useState(1)

  // 모달 상태
  const [selected, setSelected] = useState<Product | null>(null)
  const [paying, setPaying] = useState(false)

  // 모달 상태들
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingOpen, setLoadingOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  // 유저 상태
  const user = useCurrentUser()
  const setUser = useAuthStore((s) => s.setUser)

  // 검색/카테고리 바뀌면 1페이지부터
  useEffect(() => setPage(1), [activeCat, debouncedQuery])

  // 서버 호출
  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        let url = '/api/store/product'
        const params: Record<string, unknown> = { page, size }

        const kw = debouncedQuery.trim()
        if (kw) {
          url = '/api/store/product/search'
          params.keyword = kw
        } else if (activeCat !== 'ALL') {
          url = '/api/store/product/category'
          params.type = activeCat
        }

        const { data } = await api.get<SpringPage<BackendProduct>>(url, { params })
        setProducts(mapProducts(data.content ?? []))
        setTotalPages(Math.max(1, data.total_pages ?? 1))
      } catch (e) {
        console.error(e)
        setProducts([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [activeCat, page, size, debouncedQuery])

  const list = useMemo(() => products, [products])

  // ProductList에서 올라오는 클릭 → 모달 오픈
  const openModal = useCallback((p: Product) => setSelected(p), [])
  const closeModal = useCallback(() => setSelected(null), [])

  // 결제 버튼 핸들러
  const handlePay = useCallback(
    async (p: Product) => {
      if (!user) {
        setErrorMessage('로그인이 필요합니다.')
        setErrorOpen(true)
        return
      }

      if (user.pong_balance < p.price) {
        setErrorMessage('보유 포인트가 부족합니다.')
        setErrorOpen(true)
        return
      }

      try {
        setPaying(true)
        setLoadingOpen(true) // 이메일 발송중 모달 열기

        const payload = { product_id: p.id, price: p.price }
        await api.post('/api/store/purchase', payload)

        // 결제 성공 시 포인트 차감
        setUser({ ...user, pong_balance: user.pong_balance - p.price })

        // 로딩 모달 닫기 + 1.5초 후 성공 모달 열기
        setTimeout(() => {
          setLoadingOpen(false)
          setSuccessOpen(true)
        }, 1500)
      } catch (err) {
        setLoadingOpen(false)
        const error = err as AxiosError<{ message?: string }>
        const msg = error.response?.data?.message ?? error.message ?? '결제 중 오류가 발생했습니다.'
        setErrorMessage(msg)
        setErrorOpen(true)
      } finally {
        setPaying(false)
      }
    },
    [user, setUser],
  )

  const handlePageChange = (p: number) => {
    setPage(p)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="container mx-auto flex grow flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* 상단 타이틀 */}
      <div className="flex w-full items-center justify-between gap-2 text-3xl font-extrabold">
        <div className="text-foreground/70">
          퐁! <span className="text-secondary-royal">스토어</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-base font-medium text-gray-800">
          <span className="hidden font-bold sm:inline">내 보유 포인트</span>
          <span className="rounded-full bg-gray-800 px-4 py-0.5 font-bold text-white">
            {user && user.pong_balance} 퐁
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-x-8">
        {/* 카테고리 탭 */}
        <nav className="grow">
          <div className="flex w-full gap-1">
            {PRODUCT_TYPE.map((cat) => {
              const active = activeCat === cat

              return (
                <Button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  size={'sm'}
                  className={[
                    'grow rounded border font-bold',
                    active
                      ? 'border-secondary-royal bg-secondary-royal hover:border-secondary-sky hover:bg-secondary-sky text-white'
                      : 'border-primary-black/20 text-primary-black/10 hover:border-secondary-sky hover:bg-secondary-sky hover:text-primary-white bg-white',
                  ].join(' ')}
                >
                  {cat}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* 검색 */}
        <div className="relative w-full max-w-md">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상품명으로 검색"
            className="focus:border-primary-black focus:ring-primary-black w-full rounded-lg border border-gray-300 bg-white/90 pr-4 pl-10 text-sm transition outline-none"
          />
          <Search className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* 결과 영역 */}
      <section className="">
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && list.length > 0 && <ProductList products={list} onSelect={openModal} />}

        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="rounded-2xl border bg-white px-3 py-1 text-xs font-semibold text-gray-500">결과 없음</div>
            <h3 className="text-lg font-bold">조건에 맞는 상품이 없어요</h3>
            <p className="max-w-md text-sm text-gray-500">검색어를 바꾸거나 다른 카테고리를 선택해보세요.</p>
          </div>
        )}
      </section>

      {/* 페이지네이션 */}
      <PongPagination
        page={page}
        totalPages={totalPages}
        onChange={handlePageChange}
        disabled={loading}
        siblingCount={1}
        className="justify-center"
      />

      {/* 상품 모달 */}
      {selected && <ProductModal product={selected} onClose={closeModal} onPay={handlePay} paying={paying} />}

      {/* 모달들 */}
      <ErrorModal open={errorOpen} message={errorMessage} onClose={() => setErrorOpen(false)} />
      <LoadingModal open={loadingOpen} message="이메일로 상품을 발송중입니다." />
      <SuccessModal
        open={successOpen}
        message="✅ 결제가 완료되었습니다."
        onClose={() => {
          setSuccessOpen(false)
          closeModal() //  성공 모달 닫을 때 ProductModal도 닫기
        }}
      />
    </div>
  )
}
