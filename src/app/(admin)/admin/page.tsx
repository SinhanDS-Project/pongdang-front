// src/app/admin/page.tsx
"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { Image, HelpCircle, HandCoins, ShoppingCart, ArrowRight } from "lucide-react"

export default function AdminHomePage() {
  const items = [
    { href: "/admin/banner",    icon: Image,       title: "배너",  desc: "배너 등록으로 이동" },
    { href: "/admin/chatlogs",  icon: HelpCircle,  title: "문의",  desc: "1:1 문의 관리로 이동" },
    { href: "/admin/donation",  icon: HandCoins,   title: "기부",  desc: "기부 관리로 이동" },
    { href: "/admin/product/new",   icon: ShoppingCart,title: "상품",  desc: "상품 등록으로 이동" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">관리자 대시보드</h1>
        <p className="text-muted-foreground">관리 항목으로 이동하세요.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href} className="group outline-none">
            <Card className="h-full cursor-pointer transition hover:shadow-lg focus-within:ring-2 focus-within:ring-primary">
              <CardHeader className="flex items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {title}
                </CardTitle>
                <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
