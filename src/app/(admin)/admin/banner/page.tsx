"use client"
import Link from "next/link"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { BannerTable } from "@components/admin-page/banner/BannerTable"
import { useAdminStore } from "@stores/admin"
import { Plus, Search } from "lucide-react"

export default function BannersPage() {
  const { search, setSearch } = useAdminStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">배너 관리</h1>
          <p className="text-muted-foreground">사이트 배너를 관리하고 새로운 배너를 추가하세요.</p>
        </div>
        <Link href="/admin/banner/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            배너 추가
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="배너 제목으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <BannerTable />
    </div>
  )
}
