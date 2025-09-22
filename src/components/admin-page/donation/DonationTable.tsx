"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Progress } from "@components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { useAdminStore } from "@stores/admin";
import type { Donation } from "@/types/admin";
import { Edit } from "lucide-react";
import { api } from "@/lib/net/client-axios";

const PAGE_SIZE = 40;

const won = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) + "원";

const pct = (current: number | null | undefined, goal: number | null | undefined) => {
  const g = goal ?? 0;
  const c = current ?? 0;
  return g > 0 ? Math.min(100, Math.round((c / g) * 100)) : 0;
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | null | undefined;
const getBadgeProps = (status: string): { variant: BadgeVariant; className?: string } => {
  switch (status) {
    case "진행중":
      return { variant: "default" };
    case "달성":
      return {
        variant: "secondary",
        className:
          "bg-green-600/10 text-green-700 border-green-600/20 dark:bg-green-900/30 dark:text-green-200",
      };
    case "예정":
      return { variant: "outline" };
    default:
      return { variant: "secondary" };
  }
};

type Page<T> = {
  content: T[];
  total_pages?: number;
  totalPages?: number;
  totalElements?: number;
};

// Page 응답인지 판별
function isPage<T>(x: unknown): x is Page<T> {
  return !!x && typeof x === "object" && "content" in (x as any) && Array.isArray((x as any).content);
}

const statusByDates = (d: Donation) => {
  const now = new Date();
  const s = new Date(d.start_date);
  const e = new Date(d.end_date);
  if ((d.current ?? 0) >= (d.goal ?? 0)) return "달성";
  if (now < s) return "예정";
  if (now > e) return "종료";
  return "진행중";
};

export function DonationTable() {
  const { search } = useAdminStore();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Donation[] | Page<Donation> | null>(null);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const { data } = await api.get<Donation[] | Page<Donation>>("/api/admin/donation");
          if (!mounted) return;
          setData(data);
        } catch (e: any) {
          if (!mounted) return;
          setError(e?.message ?? 'axios error');
          // 실패 시 플레이스홀더
          setData(
            Array.from({ length: 3 }).map((_, i) => ({
              id: i + 1,
              title: `Placeholder Banner ${i + 1}`,
              purpose: '/placeholder-banner.png',
              content: '#',
              org: '#',
              start_date: `2024-10-0${i + 1}`,
              end_date: `2024-10-0${i + 1}`,
              type: '#',
              goal: 10000000,
              current: 0,
              img: '/placeholder-donation.png',
            }))
    );
        }
      })();
      return () => {
        mounted = false;
      };
    }, []);

  // 필터링
  const rows = useMemo<Donation[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (isPage<Donation>(data)) return data.content ?? [];
    return [];
  }, [data]);

  // 페이지 수 (서버 페이징 있으면 우선 사용)
  const serverTotalPages =
    !Array.isArray(data) && isPage<Donation>(data)
      ? (data.total_pages ?? data.totalPages ?? null)
      : null;

  const clientTotalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const totalPages = serverTotalPages ?? clientTotalPages;
  const safePage = Math.min(page, totalPages - 1);
  const pageItems =
    serverTotalPages != null
      ? rows // 서버가 이미 잘라서 줌
      : rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

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
                        href={`/admin/donation/${d.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
          >
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
