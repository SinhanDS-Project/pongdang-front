'use client';

import { useState } from 'react';
import type { DonationDetail } from '@/types/donation';
import DonateModal from '@components/modals/DonateModal';

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
  const ms = endDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return days;
}

export default function CampaignStats({ item }: { item: DonationDetail }) {
  const [open, setOpen] = useState(false);

  const goal = toNum((item as any).goal);
  const current = toNum((item as any).current);
  const percent = toPercent(current, goal);
  const days = dday((item as any).end_date);
  const remain = Math.max(0, goal - current);

  const disabled = percent >= 100 || (typeof days === 'number' && days < 0);

  return (
    <aside className="rounded-2xl bg-emerald-500 text-white">
      <div className="px-6 py-6 md:px-8 md:py-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">기부 진행 현황</h3>
          {typeof days === 'number' ? (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              {days < 0 ? '종료' : days === 0 ? '오늘 마감' : `D-${days}`}
            </span>
          ) : null}
        </div>

        {/* 진행 바 */}
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="opacity-90">{percent}%</span>
            <span className="opacity-90">{formatKRW(current)}</span>
          </div>
        </div>

        {/* 메트릭 4개 */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Metric label="목표 금액" value={formatKRW(goal)} />
          <Metric
            label="남은 금액"
            value={formatKRW(remain)}
          />
          <Metric
            label="시작일"
            value={
              (item as any).start_date
                ? new Date((item as any).start_date).toLocaleDateString('ko-KR')
                : '-'
            }
          />
          <Metric
            label="마감일"
            value={
              (item as any).end_date
                ? new Date((item as any).end_date).toLocaleDateString('ko-KR')
                : '-'
            }
          />
        </div>

       {/* 기부 버튼 */}
        <button
          className="w-full rounded-xl bg-white text-emerald-700 font-semibold py-3 disabled:opacity-60"
          onClick={() => setOpen(true)}
          disabled={disabled}
          title={disabled ? '마감되었거나 목표를 달성했습니다.' : '기부하기'}
        >
          기부하기
        </button>
      </div>
      {/* ✅ 기부 모달 */}
      <DonateModal
        open={open}
        onClose={() => setOpen(false)}
        infoId={(item as any).id}
        title={(item as any).title}
        maxRemain={remain > 0 ? remain : undefined}    // 선택: 남은 금액 제한
      />
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs/5 opacity-80">{label}</span>
      <span className="mt-1 text-lg font-bold tracking-tight">{value}</span>
    </div>
  );
}
