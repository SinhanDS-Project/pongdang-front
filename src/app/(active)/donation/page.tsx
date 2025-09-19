'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/net/client-axios'
import type { AxiosError } from 'axios'

import { PongPagination } from '@/components/PongPagination'
import ErrorModal from '@/components/store-page/ErrorModal'
import LoadingModal from '@/components/store-page/LoadingModal'
import SuccessModal from '@/components/store-page/SuccessModal'

import DonationCard, { DonationInfo } from '@/components/donate-page/DonationCard'

/* ── 카드 스켈레톤 ─────────────────────── */
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 h-32 w-full rounded-xl bg-gray-200" />
      <div className="mb-2 h-4 w-3/5 rounded bg-gray-200" />
      <div className="h-4 w-2/5 rounded bg-gray-200" />
    </div>
  )
}

/* ── 메인 컴포넌트 ─────────────────────── */
export default function DonationPage() {
  const [donations, setDonations] = useState<DonationInfo[]>([])
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [size] = useState(12)
  const [totalPages, setTotalPages] = useState(1)

  // 모달 상태
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingOpen, setLoadingOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const params: Record<string, unknown> = { page, size }
        const { data } = await api.get<{ content: DonationInfo[]; total_pages: number }>('/api/donation', { params })

        setDonations(data.content ?? [])
        setTotalPages(Math.max(1, data.total_pages ?? 1))
      } catch (e) {
        const err = e as AxiosError
        console.error('❌ 기부 리스트 조회 오류:', err.response?.data)
        setDonations([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [page, size])

  const list = useMemo(() => donations, [donations])

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
          퐁! <span className="text-secondary-royal">기부</span>
        </div>
      </div>

      {/* 결과 영역 */}
      <section>
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && list.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((d) => (
              <DonationCard key={d.id} donation={d} />
            ))}
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="rounded-2xl border bg-white px-3 py-1 text-xs font-semibold text-gray-500">결과 없음</div>
            <h3 className="text-lg font-bold">조건에 맞는 기부처가 없어요</h3>
            <p className="max-w-md text-sm text-gray-500">다시 시도해보세요.</p>
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

      {/* 모달들 */}
      <ErrorModal open={errorOpen} message={errorMessage} onClose={() => setErrorOpen(false)} />
      <LoadingModal open={loadingOpen} message="기부를 처리중입니다." />
      <SuccessModal open={successOpen} message="✅ 기부가 완료되었습니다." onClose={() => setSuccessOpen(false)} />
    </div>
  )
}
