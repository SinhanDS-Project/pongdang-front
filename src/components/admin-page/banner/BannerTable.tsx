"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR, { mutate } from "swr"
import { Button } from "@components/ui/button"
import { Badge } from "@components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@components/ui/alert-dialog"
import { fetcher } from "@lib/admin/swr"
import { api } from "@lib/admin/axios"
import { useAdminStore } from "@stores/admin"
import type { Banner, Page } from "@/types/admin"
import { Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function BannerTable() {
  const { search } = useAdminStore()
  const [page, setPage] = useState(0)

  const { data, error, isLoading } = useSWR<Page<Banner>>(`/api/admin/banner?page=${page}&search=${search}`, fetcher)

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/banner/${id}`)
      mutate(`/api/admin/banner?page=${page}&search=${search}`)
      toast({
        title: "성공",
        description: "배너가 삭제되었습니다.",
      })
    } catch (error) {
      toast({
        title: "오류",
        description: "배너 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const toggleVisibility = async (id: number, visible: boolean) => {
    try {
      await api.put(`/api/admin/banner/${id}`, { visible: !visible })
      mutate(`/api/admin/banner?page=${page}&search=${search}`)
      toast({
        title: "성공",
        description: `배너가 ${!visible ? "활성화" : "비활성화"}되었습니다.`,
      })
    } catch (error) {
      toast({
        title: "오류",
        description: "배너 상태 변경에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <div>로딩 중...</div>
  if (error) return <div>오류가 발생했습니다.</div>
  if (!data) return <div>데이터가 없습니다.</div>

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이미지</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>링크 URL</TableHead>
              <TableHead>정렬 순서</TableHead>
              <TableHead>표시 상태</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((banner) => (
              <TableRow>
                <TableCell>
                  <img
                    src={banner.image_path || "/placeholder.svg"}
                    alt={banner.title}
                    className="h-12 w-20 rounded object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{banner.title}</TableCell>
                <TableCell>
                  {banner.banner_link_url ? (
                    <a
                      href={banner.banner_link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block max-w-32"
                    >
                      {banner.banner_link_url}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>배너 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            정말로 이 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.total_pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {data.total_pages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= data.total_pages - 1}>
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
