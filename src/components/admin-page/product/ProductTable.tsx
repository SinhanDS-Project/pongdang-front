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
import type { Product, Page } from "@/types/admin"
import { Edit, Trash2, Eye } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function ProductTable() {
  const { search } = useAdminStore()
  const [page, setPage] = useState(0)

  const { data, error, isLoading } = useSWR<Page<Product>>(`/api/admin/product?page=${page}&search=${search}`, fetcher)

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/product/${id}`)
      mutate(`/api/admin/product?page=${page}&search=${search}`)
      toast({
        title: "성공",
        description: "상품이 삭제되었습니다.",
      })
    } catch (error) {
      toast({
        title: "오류",
        description: "상품 삭제에 실패했습니다.",
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
              <TableHead>상품명</TableHead>
              <TableHead>가격</TableHead>
              <TableHead>재고</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.price.toLocaleString()}원</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                    {product.status === "ACTIVE" ? "활성" : "비활성"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link href={`/admin/product/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>상품 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(product.id)}>삭제</AlertDialogAction>
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
