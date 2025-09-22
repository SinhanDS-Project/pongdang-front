// src/components/admin-page/chatlogs/ChatlogsTable.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Chatlog } from '@/types/admin';
import { useAdminStore } from '@stores/admin';
import { Button } from '@/components/ui/button';
import AnswerDialog from './AnswerDialog';
import { api } from '@/lib/net/client-axios';

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '-');

export function ChatlogsTable() {
  const { search } = useAdminStore();
  const q = search?.trim() ?? '';

  const [content, setContent] = useState<Chatlog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/admin/chatlogs');
        if (!mounted) return;
        setContent(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'fetch error');
        // 실패 시 플레이스홀더
        setContent(
          Array.from({ length: 3 }).map((_, i) => ({
            id: i + 1,
            title: `Placeholder Banner ${i + 1}`,
            question: '/placeholder-banner.png',
            response: '#',
            chat_date: `2024-10-0${i + 1}`,
            response_date: null,
            user_id: i + 1,
            nickname: 'User',
          }))
  );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const items = useMemo(() => {
    if (!content) return [];
    if (!q) return content;
    const lower = q.toLowerCase();
    return content.filter((it) => (it.title ?? '').toLowerCase().includes(lower));
  }, [content, q]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Chatlog | null>(null);

  const onAnswer = (item: Chatlog) => {
    setSelected(item);
    setOpen(true);
  };

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
            {!content ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">불러오는 중…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">문의가 없습니다.</td>
              </tr>
            ) : (
              items.map((it) => {
                const status = it.response ? 'ANSWERED' : 'OPEN';
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
                          status === 'OPEN'
                            ? 'inline-block rounded bg-yellow-100 px-2 py-0.5 text-yellow-800'
                            : 'inline-block rounded bg-green-100 px-2 py-0.5 text-green-800'
                        }
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Button size="sm" onClick={() => onAnswer(it)}>
                        {it.response ? '수정' : '답변'}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">에러: {error}</p>}

      <AnswerDialog open={open} onOpenChange={setOpen} item={selected} />
    </>
  );
}
