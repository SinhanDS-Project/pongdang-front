'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import ReportView from './ReportView'
import type { FinanceReport } from './types'

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        style={{ maxHeight: '80vh' }} //  세로 길이 제한,스크롤
      >
        {/* 출력할 리포트 영역 */}
        <div ref={reportRef}>
          <ReportView data={report} />
        </div>

        {/* 버튼 */}
        <div className="sticky bottom-0 mt-6 flex justify-end gap-3 bg-white pt-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            PDF로 저장
          </button>
          <button onClick={onClose} className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
