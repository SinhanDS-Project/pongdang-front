// src/components/modals/DonateModal.tsx
'use client';

import { useState, useMemo } from 'react';
import Modal from './Modal';
import { useDonate } from '@/lib/swr';
import { mutate } from 'swr';

type wallet_type = 'PONG' | 'DONA'; // 일반 퐁 / 기부 퐁
const KRW_PER_PONG = 100;

const fmtKRW = (n: number) => `${n.toLocaleString('ko-KR')}원`;
const fmtPong = (n: number) => `${n.toLocaleString('ko-KR')} 퐁`;
const onlyDigits = (v: string) => {
  const s = v.replace(/[^\d]/g, '');
  return s ? Number(s) : '';
};

export default function DonateModal({
  open,
  onClose,
  infoId,
  title,
  maxRemain,              // 캠페인 남은 한도(원) - 선택
  pong_balance = 0,        // 일반 퐁 잔액(퐁)
  dona_balance = 0,        // 기부 퐁 잔액(퐁)
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  infoId: number;
  title?: string;
  maxRemain?: number;             // 원 단위
  pong_balance?: number;           // 퐁 단위
  dona_balance?: number;           // 퐁 단위
  onDone?: () => void | Promise<void>;
}) {
  const { donate } = useDonate();

  // 1) 원천 선택 (일반 퐁/기부 퐁)
  const [wallet_type, setWallet_type] = useState<wallet_type>('PONG');

  // 2) 입력값: 퐁 단위
  const [amountPong, setAmountPong] = useState<number | ''>('');
  const nPong = typeof amountPong === 'number' ? amountPong : 0;

  const selectedBalancePong = wallet_type === 'PONG' ? pong_balance : dona_balance; // 퐁

  // 3) 한도 산정
  const capByRemainPong = Number.isFinite(maxRemain as number)
    ? Math.floor((maxRemain as number) / KRW_PER_PONG) // 남은 원화 → 퐁으로 환산
    : Infinity;
  const capByBalancePong = selectedBalancePong;         // 보유 잔액(퐁)
  const maxAllowPong = Math.min(capByRemainPong, capByBalancePong);

  // 4) 검증/환산
  const tooSmall = nPong < 1;
  const tooBig   = nPong > maxAllowPong;
  const valid    = !tooSmall && !tooBig;

  const amountKRW = nPong * KRW_PER_PONG;
  const remainAfterPong = selectedBalancePong - nPong;

  const helper = useMemo(() => {
    if (tooSmall) return '1퐁 이상 입력하세요.';
    if (tooBig)
      return `최대 ${maxAllowPong.toLocaleString('ko-KR')}퐁 (${fmtKRW(maxAllowPong * KRW_PER_PONG)}) 까지 가능합니다.`;
    return `현재 선택: ${wallet_type === 'PONG' ? '일반 퐁' : '기부 퐁'} · 잔액 ${fmtPong(selectedBalancePong)}`;
  }, [tooSmall, tooBig, maxAllowPong, selectedBalancePong, wallet_type]);

  const submit = async () => {
    if (!valid) return;
    try {
      // 서버는 원화(₩) 받는다고 가정 → 퐁 → 원 변환해서 전송
      await donate({ donation_info_id: infoId, amount: nPong, wallet_type });
      await mutate(`/donation/${infoId}`);   // 상세 갱신
      await mutate('/donation/status');      // 전체 현황 갱신
      await onDone?.();
      onClose();
    } catch (e) {
      console.error(e);
      // TODO: 토스트 등
    }
  };
    // 선택 카드 공용 cls
    const cardCls = (selected: boolean) =>
        `cursor-pointer rounded-lg border p-3 transition
        ${selected
            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
            : 'bg-white border-neutral-300 hover:bg-neutral-50'
        } focus-within:ring-2 focus-within:ring-emerald-300`;

  return (
    <Modal open={open} onClose={onClose} title="기부하기" width={520}>
      {title && <p className="mb-3 text-sm text-neutral-600">{title}</p>}
      
      {/* 원천 선택 + 잔액 */}
      <div className="mb-3 grid grid-cols-2 gap-2" role="tablist">
        {/* 일반 퐁 */}
        <label className={cardCls(wallet_type === 'PONG')} role="tab" aria-selected={wallet_type === 'PONG'}>
            <input
            type="radio"
            name="don-src"
            className="sr-only"
            checked={wallet_type === 'PONG'}
            onChange={() => setWallet_type('PONG')}
            />
            <div className="flex items-start justify-between">
            <div className="text-sm font-semibold">일반 퐁 기부</div>
            {wallet_type === 'PONG' && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                ✓
                </span>
            )}
            </div>
            <div className="mt-1 text-xs text-neutral-600">
            잔액 {fmtPong(pong_balance)} (≈ {fmtKRW(pong_balance * KRW_PER_PONG)})
            </div>
        </label>

        {/* 기부 퐁 */}
        <label className={cardCls(wallet_type === 'DONA')} role="tab" aria-selected={wallet_type === 'DONA'}>
            <input
            type="radio"
            name="don-src"
            className="sr-only"
            checked={wallet_type === 'DONA'}
            onChange={() => setWallet_type('DONA')}
            />
            <div className="flex items-start justify-between">
            <div className="text-sm font-semibold">기부 퐁 기부</div>
            {wallet_type === 'DONA' && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                ✓
                </span>
            )}
            </div>
            <div className="mt-1 text-xs text-neutral-600">
            잔액 {fmtPong(dona_balance)} (≈ {fmtKRW(dona_balance * KRW_PER_PONG)})
            </div>
        </label>
        </div>

      {/* 입력: 퐁 단위 */}
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">기부 수량(퐁)</span>
        <input
          inputMode="numeric"
          placeholder="숫자만 입력"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-emerald-500"
          value={amountPong}
          onChange={(e) => setAmountPong(onlyDigits(e.target.value))}
        />
      </label>

      {/* 안내/환산 */}
      <div className="mt-2 text-xs text-neutral-600 space-y-1">
        <p className={`${valid ? '' : 'text-red-600'}`}>{helper}</p>
        {nPong > 0 && (
          <p>
            예상 기부 금액: <b>{fmtKRW(amountKRW)}</b>
            {' · '}기부 후 예상 잔액: <b>{Math.max(0, remainAfterPong).toLocaleString('ko-KR')}퐁</b>
          </p>
        )}
        <p className="opacity-60">※ 1퐁 = {KRW_PER_PONG.toLocaleString()}원</p>
        {Number.isFinite(maxRemain as number) && (
          <p className="opacity-60">
            캠페인 남은 한도: <b>{fmtKRW(maxRemain!)}</b> (≈{' '}
            <b>{Math.floor(maxRemain! / KRW_PER_PONG).toLocaleString('ko-KR')}퐁</b>)
          </p>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>취소</button>
        <button className="btn-primary disabled:opacity-40" onClick={submit} disabled={!valid}>
          기부하기
        </button>
      </div>
    </Modal>
  );
}
