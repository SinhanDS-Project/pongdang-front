"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { mutate } from "swr";
import ProfileEditModal from '@/components/modals/ProfileEditModal';
import PongConvertModal from '@/components/modals/PongConvertModal';
import { linkBetting, useMyChatlogs, usePointToPong } from "@/lib/swr";
import { useMe, updateUser, logout } from "@/lib/swr";
import { useMyDonations } from "@/lib/swr";
import { useMyPurchases } from "@/lib/swr";
import { UserMe, UpdateUserPayload } from "@/types/user";
import type { DonationItem } from "@/types/donation";
import type { PurchaseItem } from "@/types/purchase";
import BettingLinkModal from "@/components/modals/BettingLinkModal";
import { ChatlogItem } from "@/types/chatlog";
import ChatlogDetailModal from "@/components/modals/ChatlogDetailModal";


export default function ProfilePage() {
  const { data, error, isLoading } = useMe(); // ⬅️ API 호출
  const [infoOpen, setInfoOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const linked = !!data?.linked_with_betting;
  const { point_balance, convert, isLoading: ptLoading } = usePointToPong(linked);
  const router = useRouter();
  
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-56 rounded bg-gray-200" />
          <div className="h-28 w-full rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    const msg = (error as any)?.response?.data?.message ||  "내 정보 조회에 실패했습니다.";
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
        <p className="text-red-600">{msg}</p>;
      </div>
    );
  }
  
  const me: UserMe = data;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
      {/* 상단 프로필 */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="pt-2">
            <p className="text-2xl font-semibold">
              안녕하세요,{" "}
              <span className="text-primary font-extrabold">{me.nickname}</span> 님
            </p>
           <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={() => setInfoOpen(true)}>
          나의 정보 확인하기
        </button>

        {!linked ? (
          <button onClick={() => setLinkOpen(true)}>배팅 연동하기</button>
        ) : (
          <button onClick={() => setConvertOpen(true)} disabled={ptLoading}>퐁으로 전환하기</button>
        )}
      </div>
            <div className="mt-3 flex items-center gap-3 text-sm text-neutral-500">
            일반 퐁 : {me.pong_balance}
            기부 퐁 : {me.dona_balance}
            </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
            구매 내역 :
          </div>
          <div>
            <PurchaseHistorySection />
            </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
            기부 내역 :
            </div>
            <div> 
            <DonationHistorySection />
            </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
            문의 내역 : 
          </div>
            <ChatlogHistorySection />
          </div>
          
        </div>
      </div> 
      {/* 모달들 */}
      <ProfileEditModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        me={me}
        onSave={async (v: UpdateUserPayload) => {
          try {
            await updateUser(v);
            // 내 정보 다시 가져오도록 SWR 캐시 갱신
            await mutate('/user/me');
            setInfoOpen(false);
          } catch (e: any) {
            // 에러 처리 (알림/토스트 등)
            console.error(e);
            // toast.error(e?.response?.data?.message ?? '수정에 실패했습니다.');
          }
        }}
         onWithdrawDone={async () => {
          try {
            await logout();
          } catch (e) {
            console.error('logout failed', e);
          } finally {
            router.replace('/');  // 홈 등으로 이동
          }
        }}
      />
      <BettingLinkModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onLinked={async () => {
          // 모달 내부에서 mutate('/user/me', '/user/find-betting-user') 이미 처리했다면 생략 가능
          await mutate('/user/me');
          await mutate('/user/find-betting');
          setLinkOpen(false);
        }}
      />
      <PongConvertModal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        balance={point_balance}              // ✅ point_balance 기준
        onSubmit={async (amt) => {
          try {
            await convert(amt);             // ✅ 포인트 → 퐁
            setConvertOpen(false);
          } catch (e) {
            console.error(e);
          }
        }}
      />
    </div>
  );
}


function* pagesFor(total: number, current: number) {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  for (let i = start; i <= end; i++) yield i;
}

function DonationHistorySection() {
  const [page, setPage] = useState(0); // 0-base
  const size = 10;
  const { data, error, isLoading } = useMyDonations(page, size);

  if (isLoading) return <div className="mt-8 text-sm text-gray-500">기부 내역 불러오는 중…</div>;
  if (error) return <div className="mt-8 text-sm text-red-600">기부 내역 조회 실패</div>;
  if (!data || data.empty) return <div className="mt-8 text-sm text-gray-500">기부 내역이 없습니다.</div>;

  return (
    <div className="mt-8 rounded-xl border">
      {/* 테이블 */}
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[60px]" />
          <col />
          <col className="w-[140px]" />
          <col className="w-[140px]" />
        </colgroup>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">내용</th>
            <th className="px-4 py-3 text-right">금액</th>
            <th className="px-4 py-3 text-right">날짜</th>
          </tr>
        </thead>
        <tbody>
          {data.content.map((row: DonationItem, i: number) => (
            <tr key={row.id} className="border-t">
              <td className="px-4 py-3">{page * data.size + i + 1}</td>
              <td className="px-4 py-3 text-gray-600">
                기부 (info #{row.donation_info_id})
              </td>
              <td className="px-4 py-3 text-right font-semibold">
                {row.amount.toLocaleString()} 퐁
              </td>
              <td className="px-4 py-3 text-right text-gray-500">
                {/* 서버 응답에 created_at이 없으면 일단 대시 처리 */}
                -
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 (1,2,3...) */}
      <div className="flex items-center justify-center gap-1 border-t p-3">
        <button
          className="h-8 rounded px-2 text-sm disabled:opacity-50"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={data.first}
        >
          ◀
        </button>

        {Array.from({ length: data.total_pages }).map((_, idx) => (
          <button
            key={idx}
            className={`h-8 rounded px-3 text-sm ${idx === data.number ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
            onClick={() => setPage(idx)}
          >
            {idx + 1}
          </button>
        ))}

        <button
          className="h-8 rounded px-2 text-sm disabled:opacity-50"
          onClick={() => setPage(p => (data.last ? p : p + 1))}
          disabled={data.last}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

function PurchaseHistorySection() {
  const [page, setPage] = useState(0); // 0-base
  const size = 10;
  const { data, error, isLoading } = useMyPurchases(page, size);

  if (isLoading) return <div className="mt-8 text-sm text-gray-500">구매 내역 불러오는 중…</div>;
  if (error) return <div className="mt-8 text-sm text-red-600">구매 내역 조회 실패</div>;
  if (!data || data.empty) return <div className="mt-8 text-sm text-gray-500">구매 내역이 없습니다.</div>;

  return (
    <div className="mt-8 rounded-xl border">
      {/* 테이블 */}
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[60px]" />
          <col />
          <col className="w-[140px]" />
          <col className="w-[140px]" />
        </colgroup>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">내용</th>
            <th className="px-4 py-3 text-right">금액</th>
            <th className="px-4 py-3 text-right">날짜</th>
          </tr>
        </thead>
        <tbody>
          {data.content.map((row: PurchaseItem, i: number) => (
            <tr key={row.id} className="border-t">
              <td className="px-4 py-3">{page * data.size + i + 1}</td>
              <td className="px-4 py-3 text-gray-600">
                구매 (info #{row.id})
              </td>
              <td className="px-4 py-3 text-right font-semibold">
                {row.price.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-gray-500">
                {/* 서버 응답에 created_at이 없으면 일단 대시 처리 */}
                -
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 (1,2,3...) */}
      <div className="flex items-center justify-center gap-1 border-t p-3">
        <button
          className="h-8 rounded px-2 text-sm disabled:opacity-50"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={data.first}
        >
          ◀
        </button>

        {Array.from({ length: data.total_pages }).map((_, idx) => (
          <button
            key={idx}
            className={`h-8 rounded px-3 text-sm ${idx === data.number ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
            onClick={() => setPage(idx)}
          >
            {idx + 1}
          </button>
        ))}

        <button
          className="h-8 rounded px-2 text-sm disabled:opacity-50"
          onClick={() => setPage(p => (data.last ? p : p + 1))}
          disabled={data.last}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

function ChatlogHistorySection() {
  const [page, setPage] = useState(0); // 1-base
  const size = 10;
  const { data, error, isLoading } = useMyChatlogs(page, size);

  // ✅ 상세 모달 상태
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (isLoading) return <div className="mt-8 text-sm text-gray-500">문의 내역 불러오는 중…</div>;
  if (error)     return <div className="mt-8 text-sm text-red-600">문의 내역 조회 실패</div>;

  const rows: ChatlogItem[] = Array.isArray(data)
    ? (data as any)
    : ((data as any)?.content ?? []);

  if (!data || data.empty) return <div>문의 내역이 없습니다.</div>;

  const totalPages  = (data as any)?.total_pages ?? 1;
  const currentPage = (data as any)?.number ?? page;
  const isFirst     = (data as any)?.first ?? currentPage === 0;
  const isLast      = (data as any)?.last ?? true;
  const pageSize    = (data as any)?.size ?? size;

  const openDetail = (id: number) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <>
      <div className="mt-8 rounded-xl border">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[60px]" />
            <col />
            <col className="w-[160px]" />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">제목</th>
              <th className="px-4 py-3 text-right">작성일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: ChatlogItem, i: number) => {
              const created = row.chat_date
                ? new Date(row.chat_date).toLocaleString('ko-KR')
                : '-';
              return (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">{currentPage * pageSize + i + 1}</td>
                  <td className="px-4 py-3">
                    {/* ✅ 제목 클릭 → 모달 오픈 */}
                    <button
                      type="button"
                      onClick={() => openDetail(row.id)}
                      className="text-left text-blue-600 hover:underline truncate"
                      title="상세보기"
                      style={{ maxWidth: '100%' }}
                    >
                      {row.title ?? `대화 #${row.id}`}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{created}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-center gap-1 border-t p-3">
          <button
            className="h-8 rounded px-2 text-sm disabled:opacity-50"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={isFirst}
          >
            ◀
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              className={`h-8 rounded px-3 text-sm ${idx === currentPage ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
              onClick={() => setPage(idx)}
            >
              {idx + 1}
            </button>
          ))}

          <button
            className="h-8 rounded px-2 text-sm disabled:opacity-50"
            onClick={() => setPage(p => (isLast ? p : p + 1))}
            disabled={isLast}
          >
            ▶
          </button>
        </div>
      </div>

      {/* ✅ 상세 모달 */}
      <ChatlogDetailModal
        key={selectedId ?? 'none'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        row={selectedId ? rows.find(r => r.id === selectedId) : undefined}
      />
    </>
  );
}