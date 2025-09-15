// src/app/admin/page.tsx
"use client"

import Link from "next/link"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { Progress } from "@components/ui/progress"
import { fetcher } from "@lib/admin/swr"
import { Image, HelpCircle, HandCoins, ShoppingCart, ArrowRight } from "lucide-react"
import type { Donation, Product } from "@/types/admin"

// 간단 타입(서버 응답 필드 최소 가정)
type ChatLog = { id: number; response?: string | null }
type Banner = { id: number }

const fmtWon = (n: number) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) + "원"

export default function AdminHomePage() {
  // ✅ 각 목록 한번씩만 불러와서 카드 지표 계산
  const { data: banners }   = useSWR<Banner[]>("/api/admin/banner", fetcher,   { revalidateOnFocus: false })
  const { data: chatlogs }  = useSWR<ChatLog[]>("/api/admin/chatlogs", fetcher,{ revalidateOnFocus: false })
  const { data: donations } = useSWR<Donation[]>("/api/admin/donation", fetcher,{ revalidateOnFocus: false })
  const { data: products }  = useSWR<Product[]>("/api/admin/product", fetcher, { revalidateOnFocus: false })

  // --- 배너
  const bannerCount = banners?.length ?? 0

  // --- 문의
  const chatlogsTotal = chatlogs?.length ?? 0
  const chatlogsUnanswered = chatlogs?.filter((c) => !c.response || c.response.trim() === "").length ?? 0

  // --- 기부 (진행중/총액 진행률)
  const now = new Date()
  const donationTotal = donations?.length ?? 0
  const donationOpen =
    donations?.filter((d) => {
      const s = new Date(d.start_date)
      const e = new Date(d.end_date)
      const reached = (d.current ?? 0) >= (d.goal ?? 0)
      return s <= now && now <= e && !reached
    }).length ?? 0

  const donationGoalSum = donations?.reduce((a, d) => a + (d.goal ?? 0), 0) ?? 0
  const donationCurrentSum = donations?.reduce((a, d) => a + (d.current ?? 0), 0) ?? 0
  const donationPct = donationGoalSum > 0 ? Math.min(100, Math.round((donationCurrentSum / donationGoalSum) * 100)) : 0

  // --- 상품 (총/활성)
  const productTotal = products?.length ?? 0
  const productActive = products?.filter((p) => p.status === "ACTIVE").length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">관리자 대시보드</h1>
        <p className="text-muted-foreground">관리 항목의 현황을 확인하고 이동하세요.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 배너 */}
        <Link href="/admin/banner" className="group outline-none">
          <Card className="h-full cursor-pointer transition hover:shadow-lg focus-within:ring-2 focus-within:ring-primary">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Image className="h-5 w-5 text-muted-foreground" />
                배너
              </CardTitle>
              <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{bannerCount}</div>
              <p className="text-xs text-muted-foreground">등록된 배너 수</p>
            </CardContent>
          </Card>
        </Link>

        {/* 문의 */}
        <Link href="/admin/chatlogs" className="group outline-none">
          <Card className="h-full cursor-pointer transition hover:shadow-lg focus-within:ring-2 focus-within:ring-primary">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                문의
              </CardTitle>
              <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{chatlogsTotal}</div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">총 문의</p>
                {/* {chatlogsUnanswered > 0 ? (
                  <Badge variant="destructive">미답변 {chatlogsUnanswered}</Badge>
                ) : (
                  <Badge variant="secondary">모두 답변됨</Badge>
                )} */}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 기부 */}
        <Link href="/admin/donation" className="group outline-none">
          <Card className="h-full cursor-pointer transition hover:shadow-lg focus-within:ring-2 focus-within:ring-primary">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <HandCoins className="h-5 w-5 text-muted-foreground" />
                기부
              </CardTitle>
              <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold">{donationTotal}</div>
                <p className="text-xs text-muted-foreground">총 항목 · 진행중 {donationOpen}</p>
              </div>

              <div className="space-y-1">
                <Progress value={donationPct} />
                <p className="text-xs text-muted-foreground">
                  모금 {fmtWon(donationCurrentSum)} / 목표 {fmtWon(donationGoalSum)} ({donationPct}%)
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 상품 */}
        <Link href="/admin/product" className="group outline-none">
          <Card className="h-full cursor-pointer transition hover:shadow-lg focus-within:ring-2 focus-within:ring-primary">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                상품
              </CardTitle>
              <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{productTotal}</div>
              <p className="text-xs text-muted-foreground">활성 {productActive} / 비활성 {Math.max(0, productTotal - productActive)}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
