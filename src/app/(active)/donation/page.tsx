'use client'

import { api } from '@/lib/net/client-axios'
import type { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { PongPagination } from '@/components/PongPagination'
import ErrorModal from '@/components/store-page/ErrorModal'
import SuccessModal from '@/components/store-page/SuccessModal'

import DonationCard, { type DonationInfo } from '@/components/donate-page/DonationCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HeartIcon } from '@/icons'

/* ── 카드 스켈레톤 ─────────────────────── */
function CardSkeleton() {
  return (
    <Card className="hover:shadow-badge block rounded-xl p-2.5 transition-shadow">
      <CardContent className="flex flex-col gap-y-2 p-0">
        <div className="bg-placeholder relative aspect-[4/3] w-full overflow-hidden rounded" />
        <div className="h-8 w-1/2 rounded bg-gray-200" />
        <div className="h-8 w-full rounded bg-gray-200" />
      </CardContent>
    </Card>
  )
}

/* ── 메인 ───────────────────────────────── */
export default function DonationPage() {
  const router = useRouter()

  const [donations, setDonations] = useState<DonationInfo[]>([])
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [size] = useState(12)
  const [totalPages, setTotalPages] = useState(1)

  // 모달 상태
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successOpen, setSuccessOpen] = useState(false) // (기부 완료 시 쓰일 수 있어 유지)

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true)
      try {
        const { data } = await api.get<{ content: DonationInfo[]; total_pages: number }>('/api/donation', {
          params: { page, size },
        })
        setDonations(data.content ?? [])
        setTotalPages(Math.max(1, data.total_pages ?? 1))
      } catch (e) {
        const err = e as AxiosError
        console.error('❌ 기부 리스트 조회 오류:', err.response?.data ?? err.message)
        setDonations([])
        setTotalPages(1)
        setErrorMessage('목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.')
        setErrorOpen(true)
      } finally {
        setLoading(false)
      }
    }
    void fetchList()
  }, [page, size])

  const list = useMemo(() => donations, [donations])

  const handlePageChange = (p: number) => {
    setPage(p)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* 타이틀 */}
      <div className="mb-6 flex items-center justify-between text-3xl font-extrabold">
        <div className="flex items-center gap-2">
          <div className="text-foreground/70">
            <span className="text-secondary-royal">퐁! </span>기부하기
          </div>
          <HeartIcon />
        </div>
        <Button onClick={() => router.back()} className="bg-secondary-royal hover:bg-secondary-sky">
          뒤로가기
        </Button>
      </div>

      {/* 결과 영역 */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : list.map((d) => <DonationCard key={d.id} donation={d} />)}
        </div>

        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="rounded-2xl border bg-white px-3 py-1 text-xs font-semibold text-gray-500">결과 없음</div>
            <h3 className="text-lg font-bold">조건에 맞는 기부처가 없어요</h3>
            <p className="max-w-md text-sm text-gray-500">다시 시도해보세요.</p>
          </div>
        )}
      </div>

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
      <SuccessModal open={successOpen} message="✅ 기부가 완료되었습니다." onClose={() => setSuccessOpen(false)} />
    </div>
  )
}
