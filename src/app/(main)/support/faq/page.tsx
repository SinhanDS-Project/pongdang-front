'use client'

import { useEffect, useState } from 'react'
import { apiPublic } from '@/lib/net/client-axios'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

/* ── 타입 정의 ───────────────────────── */
type FaqItem = { id: number; title: string; createdAt?: string }
type BoardBackend = {
  id: number
  title: string
  content?: string
  created_at?: string | null
}

const toFaqItem = (b: BoardBackend): FaqItem => ({
  id: b.id,
  title: b.title,
  createdAt: (typeof b.created_at === 'string' && b.created_at) || undefined,
})

type DetailState = { html?: string; loading?: boolean; error?: string | null }

/* ── 컴포넌트 ───────────────────────── */
export default function FaqPage() {
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])
  const [faqLoading, setFaqLoading] = useState(false)
  const [faqError, setFaqError] = useState<string | null>(null)
  const [detailMap, setDetailMap] = useState<Record<number, DetailState>>({})

  /* ── FAQ 리스트 조회 ───────────────── */
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setFaqLoading(true)
        setFaqError(null)

        const { data } = await apiPublic.get<BoardBackend[]>('/api/support/list/FAQ')
        const items = data.map(toFaqItem)

        if (alive) {
          setFaqItems(items)
        }
      } catch (e) {
        console.error('FAQ 불러오기 실패:', e)
        if (alive) setFaqError('FAQ를 불러오지 못했어요.')
      } finally {
        if (alive) setFaqLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  /* ── FAQ 상세 불러오기 ───────────────── */
  const loadDetail = async (id: number) => {
    if (detailMap[id]?.html || detailMap[id]?.loading) return
    setDetailMap((prev) => ({ ...prev, [id]: { loading: true, error: null } }))

    try {
      const { data } = await apiPublic.get<BoardBackend>(`/api/support/detail/${id}`)
      const html: string = data?.content || ''
      setDetailMap((prev) => ({
        ...prev,
        [id]: { html, loading: false, error: null },
      }))
    } catch (e) {
      console.error('FAQ 상세 불러오기 실패:', e)
      setDetailMap((prev) => ({
        ...prev,
        [id]: { loading: false, error: '내용을 불러오지 못했어요.' },
      }))
    }
  }

  /* ── 렌더링 ───────────────────────── */
  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      {faqLoading && <p className="text-gray-500">FAQ 불러오는 중…</p>}
      {faqError && <p className="text-sm text-red-600">{faqError}</p>}

      {!faqLoading && !faqError && (
        <>
          {faqItems.length === 0 ? (
            <p className="text-sm text-gray-500">등록된 FAQ가 없습니다.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full divide-y rounded-lg border bg-white shadow-sm">
              {faqItems.map((it, idx) => {
                const detail = detailMap[it.id]
                return (
                  <AccordionItem key={it.id} value={`faq-${it.id}`} onClick={() => loadDetail(it.id)} className="px-4">
                    <AccordionTrigger className="flex w-full items-center justify-between py-4 text-lg font-medium text-gray-800 no-underline hover:bg-gray-100 hover:text-gray-800 hover:no-underline focus:ring-0 focus:outline-none">
                      <span className="truncate">{`Q${idx + 1}. ${it.title}`}</span>
                    </AccordionTrigger>

                    <AccordionContent className="pb-4 pl-2 text-gray-600">
                      {detail?.loading && <p className="text-sm text-gray-500">내용 불러오는 중…</p>}
                      {detail?.error && (
                        <p className="text-sm text-red-600">
                          {detail.error}{' '}
                          <button
                            className="underline"
                            onClick={() => {
                              setDetailMap((prev) => ({ ...prev, [it.id]: {} }))
                              void loadDetail(it.id)
                            }}
                          >
                            다시 시도
                          </button>
                        </p>
                      )}
                      {!detail?.loading && !detail?.error && (
                        <article
                          className="prose prose-sm max-w-none leading-relaxed text-gray-700"
                          dangerouslySetInnerHTML={{
                            __html: detail?.html || "<p class='text-sm text-gray-500'>내용이 없습니다.</p>",
                          }}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </>
      )}
    </main>
  )
}
