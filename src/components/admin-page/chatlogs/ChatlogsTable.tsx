"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { inquiriesApi } from "@/lib/admin/chatlogs";
import type { Chatlog } from "@/types/admin";
import { useAdminStore } from "@stores/admin";
import AnswerDialog from "@components/admin-page/chatlogs/AnswerDialog";
import { Button } from "@/components/ui/button";

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "-");

export function ChatlogsTable() {
  const { search } = useAdminStore();
  const q = search?.trim() ?? "";

  const { data, error, isLoading, mutate } = useSWR(
    ["chatlogs", q],
    () => inquiriesApi.list(q ? { q } : undefined)
  );

  const items = useMemo(() => {
    if (!data) return [];
    if (!q) return data;
    const lower = q.toLowerCase();
    return data.filter((it) => (it.title ?? "").toLowerCase().includes(lower));
  }, [data, q]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Chatlog | null>(null);

  const onAnswer = (item: Chatlog) => {
    setSelected(item);
    setOpen(true);
  };

  if (isLoading) return <div className="text-sm text-gray-500">불러오는 중…</div>;
  if (error) return <div className="text-sm text-red-600">조회 실패: {String((error as any)?.message ?? error)}</div>;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-2 w-20">ID</th>
              <th className="px-4 py-2">제목</th>
              <th className="px-4 py-2">문의자</th>
              <th className="px-4 py-2">문의일</th>
              <th className="px-4 py-2">답변일</th>
              <th className="px-4 py-2 w-28">상태</th>
              <th className="px-4 py-2 w-28">답변</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">문의가 없습니다.</td>
              </tr>
            ) : (
              items.map((it) => {
                const status = it.response ? "ANSWERED" : "OPEN";
                return (
                  <tr key={it.id} className="border-t">
                    <td className="px-4 py-2">{it.id}</td>
                    <td className="px-4 py-2">{it.title}</td>
                    <td className="px-4 py-2">{it.nickname ?? `USER#${it.user_id}`}</td>
                    <td className="px-4 py-2">{fmt(it.chat_date)}</td>
                    <td className="px-4 py-2">{fmt(it.response_date)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          status === "OPEN"
                            ? "inline-block rounded bg-yellow-100 px-2 py-0.5 text-yellow-800"
                            : "inline-block rounded bg-green-100 px-2 py-0.5 text-green-800"
                        }
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Button size="sm" onClick={() => onAnswer(it)}>
                        {it.response ? "수정" : "답변"}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnswerDialog
        open={open}
        onOpenChange={setOpen}
        item={selected}
        onSaved={mutate}
      />
    </>
  );
}
