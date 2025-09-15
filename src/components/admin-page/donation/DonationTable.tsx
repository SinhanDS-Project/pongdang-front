"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Progress } from "@components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@components/ui/alert-dialog";
import { fetcher } from "@lib/admin/swr";
import { api } from "@lib/admin/axios";
import { useAdminStore } from "@stores/admin";
import type { Donation } from "@/types/admin";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const PAGE_SIZE = 10;

const won = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) + "원";

const pct = (current: number | null, goal: number) =>
  goal > 0 ? Math.min(100, Math.round(((current ?? 0) / goal) * 100)) : 0;

// 상단에 유틸
type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | null | undefined;

const getBadgeProps = (status: string): { variant: BadgeVariant; className?: string } => {
  switch (status) {
    case "진행중":
      return { variant: "default" }; // 기본 색
    case "달성":
      return {
        variant: "secondary", // 타입에 맞춤
        className: "bg-green-600/10 text-green-700 border-green-600/20 dark:bg-green-900/30 dark:text-green-200",
      };
    case "예정":
      return { variant: "outline" };
    default: // "종료" 등
      return { variant: "secondary" };
  }
};


const statusByDates = (d: Donation) => {
  const now = new Date();
  const s = new Date(d.start_date);
  const e = new Date(d.end_date);
  if ((d.current ?? 0) >= d.goal) return "달성";
  if (now < s) return "예정";
  if (now > e) return "종료";
  return "진행중";
};

export function DonationTable() {
  const { search } = useAdminStore();
  const [page, setPage] = useState(0);

  // ✅ 백엔드: GET /api/admin/donation (배열 반환)
  const { data, error, isLoading } = useSWR<Donation[]>("/api/admin/donation", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const filtered = useMemo(() => {
    const q = (search ?? "").trim().toLowerCase();
    if (!data) return [];
    if (!q) return data;
    return data.filter(
      (d) =>
        (d.title ?? "").toLowerCase().includes(q) ||
        (d.org ?? "").toLowerCase().includes(q) ||
        (d.type ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  // 클라 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>오류가 발생했습니다.</div>;
  if (!data || data.length === 0) return <div>데이터가 없습니다.</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>기관</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>목표</TableHead>
              <TableHead>현재</TableHead>
              <TableHead>진행률</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>기간</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((d) => {
              const progress = pct(d.current, d.goal);
              const status = statusByDates(d);
              const bp = getBadgeProps(status);
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>{d.org}</TableCell>
                  <TableCell>{d.type}</TableCell>
                  <TableCell>{won(d.goal)}</TableCell>
                  <TableCell>{won(d.current)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={progress} className="w-24" />
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={bp.variant} className={bp.className}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(d.start_date).toLocaleDateString()} ~ {new Date(d.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={{ pathname: `/admin/donation/${d.id}`, query: { data: encodeURIComponent(JSON.stringify(d)) }, // ✅ 안전하게 인코딩
                        }}
                      >
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
                            <AlertDialogTitle>기부 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              정말로 이 기부를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}>
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {safePage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
