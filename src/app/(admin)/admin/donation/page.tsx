"use client"

import { Input } from "@components/ui/input"
import { DonationTable } from "@/components/admin-page/donation/DonationTable"
import { useAdminStore } from "@stores/admin"
import { Plus, Search } from "lucide-react"

export default function DonationsPage() {
  const { search, setSearch } = useAdminStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">기부 관리</h1>
          <p className="text-muted-foreground">진행 중인 기부 프로젝트를 관리하고 새로운 기부를 추가하세요.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="기부 제목으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <DonationTable />
    </div>
  )
}
