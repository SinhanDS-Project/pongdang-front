// src/components/donation/TodayStats.tsx
'use client';

import { useMemo } from 'react';
import type { DonationDetail } from '@/types/donation';

function toNum(v: unknown) {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function formatKRW(n: number) {
  return `${n.toLocaleString('ko-KR')}원`;
}

export default function TodayStats({
  items,
  className,
}: {
  items: readonly DonationDetail[];
  className?: string;
}) {
  const { totalGoal, totalCurrent, campaignCount, percent } = useMemo(() => {
    const campaignCount = items.length;
    let totalGoal = 0;
    let totalCurrent = 0;

    for (const it of items) {
      // 백에서 string/null로 올 수 있으니 안전 변환
      totalGoal += toNum((it as any).goal);
      totalCurrent += toNum((it as any).current);
    }

    const percent =
      totalGoal > 0 ? Math.max(0, Math.min(100, Math.round((totalCurrent / totalGoal) * 100))) : 0;

    return { totalGoal, totalCurrent, campaignCount, percent };
  }, [items]);

  return (
    <section className={`rounded-2xl bg-emerald-500 text-white ${className ?? ''}`}>
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="mb-6">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
            오늘의 참여현황
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-5 md:items-center">
          <h2 className="text-2xl md:col-span-2 md:text-3xl font-extrabold leading-tight">
            현재 등록된 기부의 총합
          </h2>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:col-span-3">
            <Metric label="진행 중 캠페인" value={`${campaignCount.toLocaleString('ko-KR')}개`} />
            <Metric label="총 목표액" value={formatKRW(totalGoal)} />
            <Metric label="모금된 금액" value={formatKRW(totalCurrent)} />
            <Metric label="전체 달성률" value={`${percent}%`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm/5 opacity-80">{label}</span>
      <span className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight">{value}</span>
    </div>
  );
}
