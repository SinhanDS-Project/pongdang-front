"use client"
import { Input } from "@components/ui/input"
import { ChatlogsTable } from "@components/admin-page/chatlogs/ChatlogsTable"
import { useAdminStore } from "@stores/admin"
import { Search } from "lucide-react"

export default function ChatlogsPage() {
  const { search, setSearch } = useAdminStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">문의 관리</h1>
          <p className="text-muted-foreground">사용자 문의를 확인하고 답변을 작성하세요.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="문의 제목으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ChatlogsTable />
    </div>
  )
}
