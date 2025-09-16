// src/components/modals/BettingLinkModal.tsx
'use client';

import Modal from './Modal';
import { findBetting, useBettingUserInfo, linkBetting } from '@/lib/swr';
import { useState } from 'react';

export default function BettingLinkModal({
  open,
  onClose,
  onLinked, // 연동 성공 후 후처리(토스트/리다이렉트 등)
}: {
  open: boolean;
  onClose: () => void;
  onLinked?: () => void | Promise<void>;
}) {
  // linked 여부와 무관하게, 현재 계정으로 조회 가능한 배팅 유저 정보를 시도
  const { data, error, isLoading } = useBettingUserInfo(true);
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    setLoading(true);
    try {
      await linkBetting();
      await onLinked?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="배팅 계정 연동" width={640}>
      {/* 상태 영역 */}
      {isLoading && <p className="text-sm text-neutral-500">배팅 계정 정보를 불러오는 중…</p>}
      {!isLoading && error && (
        <p className="text-sm text-red-600">
          배팅 계정 정보를 조회할 수 없습니다. 연동을 진행하면 연결 가능한 계정을 확인합니다.
        </p>
      )}

      {/* 정보 카드 */}
      {!isLoading && !error && data && (
        <div className="mt-3 rounded-xl border p-4">
          <Row label="배팅 사용자 ID" value={String((data as any)?.email ?? '-')} />
          <Row label="닉네임" value={String((data as any)?.nickname ?? '-')} />
          <Row label="포인트 잔액" value={Number((data as any)?.point_balance ?? 0).toLocaleString()} />
          {'pong_balance' in (data as any) && (
            <Row label="퐁 잔액" value={Number((data as any)?.pong_balance ?? 0).toLocaleString()} />
          )}
        </div>
      )}

      {/* 안내 */}
      <p className="mt-3 text-xs text-neutral-500">
        연동을 진행하면 위 계정이 현재 로그인한 계정과 연결되며, 포인트/퐁 전환 기능을 사용할 수 있습니다.
      </p>

      {/* 하단 버튼 */}
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>취소</button>
        <button
          className="btn-primary disabled:opacity-40"
          onClick={handleLink}
          disabled={loading}
        >
          {loading ? '연동 중…' : '연동하기'}
        </button>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
