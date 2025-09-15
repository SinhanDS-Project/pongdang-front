'use client'

import type { FinanceReport } from './types'

export default function ReportView({ data }: { data: FinanceReport }) {
  const r = data.report ?? {}
  const products = r.products ?? r.strategy?.products ?? []

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-3 rounded-2xl border p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="space-y-2 text-[15px] leading-relaxed whitespace-pre-wrap">{children}</div>
    </section>
  )

  return (
    <article id="finance-report-result" className="space-y-6 bg-white text-black">
      <div className="rounded-2xl bg-indigo-50 p-6 ring-1 ring-blue-100">
        <h2 className="text-xl font-bold text-blue-700">{data.title ?? '금융 리포트'}</h2>
      </div>

      {r.summary && r.summary.title && <Card title={r.summary.title}>{r.summary.content}</Card>}

      {r.analysis && (
        <section className="space-y-5 rounded-2xl border p-5 shadow-sm">
          {r.analysis.title && <h3 className="text-lg font-semibold">{r.analysis.title}</h3>}
          {r.analysis.content && (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{r.analysis.content}</p>
          )}
        </section>
      )}

      {products.length > 0 && (
        <section className="space-y-3 rounded-2xl border p-4 shadow-sm">
          <h3 className="text-lg font-semibold">추천 상품</h3>
          <ul className="grid gap-3 md:grid-cols-2">
            {products.map((p) => (
              <li key={`${p.name}-${p.institution}`} className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.name}</div>
                  <span className="text-sm text-gray-500">{p.institution}</span>
                </div>
                <p className="mt-2 text-sm">{p.recommendation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.conclusion && <Card title={r.conclusion.title}>{r.conclusion.content}</Card>}
    </article>
  )
}
