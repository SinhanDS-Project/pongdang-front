'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Sparkles } from 'lucide-react'
import type { FinanceReport } from '../../types/report'

export default function ReportModal({
  open,
  onClose,
  report,
}: {
  open: boolean
  onClose: () => void
  report: FinanceReport | null
}) {
  const reportRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: 'finance_report',
  })

  if (!open || !report) return null

  const handleClose = () => {
    onClose()
    window.location.reload()
  }

  const r = report.report ?? {}
  const products = r.products ?? r.strategy?.products ?? []

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-700">
        <Sparkles className="h-5 w-5 text-indigo-400" />
        {title}
      </h3>
      <div className="space-y-2 text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700">{children}</div>
    </section>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="animate-fadeIn w-full max-w-4xl overflow-y-auto bg-white shadow-2xl transition-all"
        style={{ maxHeight: '85vh' }}
      >
        {/* 안쪽 컨텐츠 round (PDF 대상) */}
        <div
          className="space-y-6 rounded-2xl bg-gray-50 px-16 py-14"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 8px)',
          }}
        >
          {/* PDF 저장될 영역 */}
          <div ref={reportRef}>
            <article id="finance-report-result" className="space-y-8 bg-transparent text-black">
              {/* 상단 타이틀 */}
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-gray-800">{report.title ?? '맞춤 금융 리포트'}</h2>
                <p className="mt-1 text-sm text-gray-500">당신의 입력을 기반으로 AI가 분석한 결과입니다.</p>
                <div className="mx-auto mt-3 h-1 w-112 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400" />
              </div>

              {/* 요약 */}
              {r.summary && r.summary.title && <Card title={r.summary.title}>{r.summary.content}</Card>}

              {/* 분석 */}
              {r.analysis && (
                <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                  {r.analysis.title && (
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-700">
                      <Sparkles className="h-5 w-5 text-indigo-400" />
                      {r.analysis.title}
                    </h3>
                  )}
                  {r.analysis.content && (
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700">
                      {r.analysis.content}
                    </p>
                  )}
                </section>
              )}

              {/* 추천 상품 */}
              {products.length > 0 && (
                <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-700">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    추천 금융 상품
                  </h3>
                  <ul className="grid gap-4 md:grid-cols-2">
                    {products.map((p) => (
                      <li
                        key={`${p.name}-${p.institution}`}
                        className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-900">{p.name}</div>
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                            {p.institution}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">{p.recommendation}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 결론 */}
              {r.conclusion && <Card title={r.conclusion.title}>{r.conclusion.content}</Card>}
            </article>
          </div>

          {/* 버튼  */}
          <div className="mt-10 flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md transition hover:scale-105 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              PDF로 저장
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg bg-gray-300 px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-400"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
