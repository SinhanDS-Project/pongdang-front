// app/donation/page.tsx
'use client';

import { useMemo } from 'react';
import TodayStats from '@/components/donation/TodayStats';
import { useDonationItemsAll } from '@/lib/swr';
import { pickRandom } from '@/lib/random';
import DonationCard from './donationCard';
import type { DonationDetail } from '@/types/donation';

function toPercent(current?: number | null, goal?: number | null) {
  const c = typeof current === 'number' ? current : 0;
  const g = typeof goal === 'number' && goal > 0 ? goal : 0;
  return g ? Math.max(0, Math.min(100, Math.round((c / g) * 100))) : 0;
}
function formatKRW(n?: number | null) {
  const v = typeof n === 'number' ? n : 0;
  return `${v.toLocaleString('ko-KR')}원`;
}

export default function DonationPage() {
  // ✅ 단 한 번의 훅으로 전체 아이템 확보 (비페이징/페이징 모두 커버)
  const { data, isLoading, error } = useDonationItemsAll(30);
  const items: DonationDetail[] = data?.items ?? [];

  // 랜덤 4개
  const randomFour = useMemo<DonationDetail[]>(
    () => pickRandom(items, 4),
    [items]
  );

  if (error) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="text-sm text-red-600">기부 캠페인 목록을 불러오지 못했습니다.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 space-y-12">
      <section className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">100% 전달하는 기부</h1>
        <ul className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] items-stretch">
            {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
                ))
                : randomFour.map((c, i) => {
                    const p = toPercent((c as any).current, (c as any).goal);
                    const amt = formatKRW((c as any).current);
                    return (
                    <DonationCard
                        key={c.id}
                        item={c}
                        percent={p}
                        amountKRW={amt}
                        priority={i === 0}
                    />
                    );
                })}
            </ul>
      </section>
      {/* (2) 오늘의 참여현황 */}
    <TodayStats items={items}/>
    </main>
  );
}