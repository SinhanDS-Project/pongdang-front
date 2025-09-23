// src/components/donation/DonationCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { DonationDetail } from '@/types/donation';

const PLACEHOLDER_IMG = '/images/placeholder-donation.jpg';

export default function DonationCard({
  item,
  percent,
  amountKRW,
  priority = false,
}: {
  item: DonationDetail;
  percent: number;     // 0~100
  amountKRW: string;   // "1,234,000원"
  priority?: boolean;
}) {
  const src = (item as any)?.img || PLACEHOLDER_IMG;
  const title = (item as any)?.title ?? '';
  const org = (item as any)?.org ?? '';

  return (
    <li className="group overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
      {/* ⬇️ 이미지 클릭 시 상세로 이동 */}
      <Link
        href={`/donation/${item.id}`}
        className="relative block aspect-[4/3] w-full bg-gray-100"
        aria-label={`${title} 상세 보기`}
      >
        {/* 이미지 영역: 고정 비율 + 센터 크롭 + 오버레이 */}
        <div className="relative aspect-[4/3] w-full bg-gray-100">
            <Image
            src={src}
            alt={title}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
            />
            <span className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            100% 전달
            </span>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-x-3 bottom-3 z-10 text-white">
            <p className="text-[12px] opacity-90">{org}</p>
            <h3 className="mt-0.5 text-[15px] font-semibold leading-snug line-clamp-2">
                {title}
            </h3>
            </div>
        </div>
        </Link>
      {/* 진행 정보 */}
      <div className="p-4 space-y-2">
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-emerald-600">{percent}%</span>
          <span className="text-gray-800">{amountKRW}</span>
        </div>
      </div>
    </li>
  );
}
