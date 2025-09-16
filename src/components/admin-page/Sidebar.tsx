"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@lib/utils"
import { Package, Heart, ImageIcon, MessageSquare, LayoutDashboard } from "lucide-react"

const navigation = [
  {
    name: "대시보드",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "상품 등록",
    href: "/admin/product/new",
    icon: Package,
  },
  {
    name: "기부 관리",
    href: "/admin/donation",
    icon: Heart,
  },
  {
    name: "배너 등록",
    href: "/admin/banner",
    icon: ImageIcon,
  },
  {
    name: "문의 관리",
    href: "/admin/chatlogs",
    icon: MessageSquare,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border">
      <div className="flex items-center justify-center h-16 px-4 border-b border-border">
        <h1 className="text-xl font-bold">관리자 콘솔</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
