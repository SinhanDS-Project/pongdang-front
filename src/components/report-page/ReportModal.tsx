'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CircleCheckBig, ClipboardList, HandCoins, Pin, ShoppingCart } from 'lucide-react'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import type { FinanceReport } from '../../types/report'

type Props = {
  open: boolean
  onClose: () => void
  report: FinanceReport | null
}

export default function ReportModal({ open, onClose, report }: Props) {
  const reportRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: 'finance_report',
  })

  if (!open || !report) return null

  const r = report.report ?? {}
  const products = r.products ?? r.strategy?.products ?? []

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="gap-0 rounded p-0" aria-describedby={undefined}>
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-xl font-bold">AI 금융 리포트</DialogTitle>
          </DialogHeader>

          {/* 스크롤 가능 본문 (인쇄 영역은 reportRef 안쪽만) */}
          <ScrollArea className="max-h-[75vh]">
            <div ref={reportRef} className="space-y-4 p-4">
              <div className="flex items-center gap-x-2">
                <ClipboardList />
                <span className="text-3xl font-bold">{report.title}</span>
              </div>
              <Separator />

              {/* 상단 요약 카드 */}
              {(r.summary?.title || r.summary?.content) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-x-2">
                    <Pin className="text-primary-shinhan" />
                    <span className="text-secondary-navy text-xl font-bold">{r.summary?.title ?? '요약'}</span>
                  </div>
                  <Card className="shadow-lg">
                    <CardContent className="text-accent-foreground leading-relaxed whitespace-pre-wrap">
                      {r.summary?.content}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 분석 카드 */}
              {(r.analysis?.title || r.analysis?.content) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-x-2">
                    <HandCoins className="text-primary-shinhan" />
                    <span className="text-secondary-navy text-xl font-bold">{r.analysis.title}</span>
                  </div>
                  <Card className="shadow-lg">
                    <CardContent className="text-accent-foreground leading-relaxed whitespace-pre-wrap">
                      {r.analysis?.content}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 추천 상품 */}
              {products.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-x-2">
                    <ShoppingCart className="text-primary-shinhan" />
                    <span className="text-secondary-navy text-xl font-bold">추천 금융 상품</span>
                  </div>
                  <Card className="shadow-lg">
                    <CardContent className="space-y-4">
                      {products.map((p, idx) => (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-gray-900">
                                {idx + 1}. {p.name}
                              </div>
                              <Badge variant="secondary" className="text-indigo-700">
                                {p.institution}
                              </Badge>
                            </div>
                            {p.recommendation && <div className="text-muted-foreground">{p.recommendation}</div>}
                          </div>
                          {products.length - 1 !== idx && <Separator />}
                        </>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 결론 */}
              {(r.conclusion?.title || r.conclusion?.content) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-x-2">
                    <CircleCheckBig className="text-primary-shinhan" />
                    <span className="text-secondary-navy text-xl font-bold">{r.conclusion?.title ?? '결론'}</span>
                  </div>
                  <Card className="shadow-lg">
                    <CardContent className="text-accent-foreground leading-relaxed whitespace-pre-wrap">
                      {r.conclusion?.content}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 하단 구분선 (화면 전용) */}
              <Separator className="print:hidden" />
              <div className="text-end text-xs font-medium text-red-600 print:hidden">
                AI 금융 리포트는 따로 저장되지 않습니다. 필요하다면 PDF로 저장해 주세요.
              </div>
            </div>
          </ScrollArea>

          {/* 하단 버튼 바 (인쇄에도 출력 X) */}
          <div className="grid w-full grid-cols-2 items-center gap-x-4 border-t p-4 print:hidden">
            <Button variant="secondary" onClick={onClose} className="">
              닫기
            </Button>
            <Button onClick={handlePrint} className="bg-secondary-royal hover:bg-secondary-sky">
              PDF로 저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
