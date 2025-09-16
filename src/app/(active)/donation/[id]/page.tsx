'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMe, useDonationDetail } from '@/lib/swr';
import DonateModal from '@/components/modals/DonateModal';
import DonationConsentModal from '@/components/modals/DonationConsentModal';
import type { DonationDetail } from '@/types/donation';

function toNum(v: unknown) {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function formatKRW(n: number) {
  return `${n.toLocaleString('ko-KR')}원`;
}
function toPercent(current?: unknown, goal?: unknown) {
  const c = toNum(current);
  const g = toNum(goal);
  if (g <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((c / g) * 100)));
}
function dday(end?: unknown) {
  if (!end) return null;
  const endDate = new Date(end as any);
  if (isNaN(endDate.getTime())) return null;
  const today = new Date();
  const ms = endDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return days;
}

export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);
  const { data, isLoading, error } = useDonationDetail(
    Number.isFinite(numId) ? numId : null
  );

  const meRes = useMe();
  const pongbal = meRes.data?.pong_balance ?? 0;
  const donabal = meRes.data?.dona_balance ?? 0;
  const [donateOpen, setDonateOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [donateMode, setDonateMode] = useState<'pay' | 'balance'>('balance');


  if (isLoading) {
    return (
      <main className="mx-auto max-w-screen-lg px-4 py-10 space-y-6">
        <div className="aspect-[16/9] rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse" />
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="mx-auto max-w-screen-lg px-4 py-10 space-y-6">
        <Link href="/donation" className="text-sm text-gray-500 hover:text-gray-700">
          ← 목록으로
        </Link>
        <p className="text-red-600">상세 정보를 불러오지 못했습니다.</p>
      </main>
    );
  }

  const item = data as unknown as DonationDetail;
  const img = (item as any).img || '/images/placeholder-donation.jpg';
  const title = (item as any).title ?? '';
  const org = (item as any).org ?? '';
  const goal = toNum((item as any).goal);
  const current = toNum((item as any).current);
  const percent = toPercent(current, goal);
  const remain = Math.max(0, goal - current);
  const days = dday((item as any).end_date);

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-6 md:py-10 space-y-6 md:space-y-8">
      <Link href="/donation" className="text-sm text-gray-500 hover:text-gray-700">
        ← 목록으로
      </Link>

      {/* === HERO (배경 이미지 + 오버레이 + 진행바/금액) === */}
      <section className="relative h-[240px] sm:h-[300px] md:h-[360px] rounded-2xl overflow-hidden">
        <Image src={img} alt={title} fill className="object-cover" priority />
        {/* dim */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
        {/* D-day */}
        {typeof days === 'number' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-emerald-600/90 text-white text-xs font-semibold px-3 py-1">
              {days < 0 ? '종료' : days === 0 ? '오늘 마감' : `D-${days}`}
            </span>
          </div>
        )}
        {/* 타이틀 */}
        <h1 className="absolute left-6 right-6 top-1/2 -translate-y-1/2 text-white text-2xl md:text-3xl font-extrabold drop-shadow">
          {title}
        </h1>
        {/* 진행 퍼센트 + 금액 */}
        <div className="absolute left-0 right-0 bottom-14 px-6 flex items-center justify-between text-white text-sm font-semibold">
          <span>{percent}%</span>
          <span>{formatKRW(current)} 모금</span>
        </div>
        {/* 진행바 */}
        <div className="absolute left-0 right-0 bottom-6 px-6">
          <div className="h-2 w-full rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-emerald-400"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </section>
      {/* === 본문 + 사이드 === */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 본문 */}
        <article className="lg:col-span-8 space-y-5">
          <div className="flex flex-wrap gap-2">
            {/* 예시 태그 (데이터에 태그가 있으면 매핑하세요) */}
            {(item as any).type && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-xs font-medium">
                {(item as any).type}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold">모금소개</h2>
          {(item as any).purpose && (
            <p className="text-neutral-700">{(item as any).purpose}</p>
          )}
          {(item as any).content && (
            <div className="prose max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:mx-auto [&_img]:object-contain">
              {(item as any).content}
            </div>
          )}
        </article>

        {/* 사이드 */}
        <aside className="lg:col-span-4 space-y-4">
          {/* 모금단체 카드 */}
          <div className="rounded-2xl border">
            <div className="p-4 border-b">
              <h3 className="text-sm font-bold">모금단체</h3>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100" />
              <div className="min-w-0">
                <p className="font-medium truncate">{org || '모금단체'}</p>
                <p className="text-xs text-neutral-500">검증된 단체</p>
              </div>
            </div>
          </div>

          {/* 안내 박스 */}
          <div className="rounded-2xl border p-4 space-y-3">
            <p className="font-bold">지금 기부에 참여하세요!</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">
                100% 전달
              </span>
              <span className="text-neutral-500">수수료 없이 전달돼요</span>
            </div>
            <button
              className="w-full rounded-md bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 font-semibold"
              onClick={() => setConsentOpen(true)}
            >
              지금 기부하기
            </button>
            <ul className="text-xs text-neutral-500 space-y-1">
              <li>목표 금액: {formatKRW(goal)}</li>
              <li>남은 금액: {formatKRW(remain)}</li>
              <li>
                기간:{' '}
                {(item as any).start_date
                  ? new Date((item as any).start_date).toLocaleDateString('ko-KR')
                  : '-'}{' '}
                ~{' '}
                {(item as any).end_date
                  ? new Date((item as any).end_date).toLocaleDateString('ko-KR')
                  : '-'}
              </li>
            </ul>
          </div>
        </aside>
      </section>

      <DonationConsentModal
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        onProceed={(mode) => {
          setDonateMode(mode);
          setConsentOpen(false);
          setDonateOpen(true);          // ✅ 동의 통과 후 금액 입력 모달
        }}
        defaultMode="balance"
      />

      {/* 기부 모달 */}
      <DonateModal
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        infoId={(item as any).id}
        title={title}
        maxRemain={remain > 0 ? remain : undefined}
        pong_balance={pongbal}
        dona_balance={donabal}
        onDone={() => {
          setDonateOpen(false);
        }}
      />
    </main>
  );
}
