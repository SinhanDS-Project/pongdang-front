'use client'

import { useState } from 'react'
import ReportForm from '@/components/report-page/ReportForm'
import ReportModal from '@/components/report-page/ReportModal'
import type { ReportPayload, FinanceReport } from '@/components/report-page/types'
import { api } from '@/lib/net/client-axios'

export default function FinanceReportPage() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<FinanceReport | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleSubmit = async (payload: ReportPayload) => {
    try {
      setLoading(true)
      const { data } = await api.post<FinanceReport>('/api/finance/report', payload)
      setReport(data)
      setModalOpen(true)
    } catch {
      alert('리포트 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="rounded-2xl bg-blue-50 p-6 ring-1 ring-blue-100">
        <h1 className="text-xl font-bold text-blue-700"> 💡금융 리포트 설문</h1>
        <p className="text-sm text-blue-500">내용을 입력하고 맞춤형 리포트를 생성하세요.</p>
      </header>

      <ReportForm onSubmit={handleSubmit} loading={loading} />

      {/* 결과 모달 */}
      <ReportModal open={modalOpen} onClose={() => setModalOpen(false)} report={report} />
    </main>
  )
}
