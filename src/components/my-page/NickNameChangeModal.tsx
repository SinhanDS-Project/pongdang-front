// src/components/modals/NicknameChangeModal.tsx
'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { updateNickname, useNicknameCheck } from '@/lib/swr';

export default function NicknameChangeModal({
  open, onClose, current, onChanged,
}: {
  open: boolean; onClose: () => void; current?: string; onChanged?: () => void;
}) {
  const [nick, setNick] = useState(current ?? '');
  const [loading, setLoading] = useState(false);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) setNick(current ?? '');
  }, [open, current]);

  // ✅ API만 검사 (디바운스)
  const { checking, duplicate, message, recheck } = useNicknameCheck(nick, 400);

  // ✅ 제출 조건: API에서 duplicate === false 이고, 검사중/로딩 아님
  const canSubmit = duplicate === false && !checking && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await updateNickname(nick.trim());
      onChanged?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 도움말 문구 (정책 없음 → API 결과만 표시)
  const helperText =
    checking ? '중복 확인 중…'
    : duplicate === false ? '사용 가능한 닉네임입니다.'
    : duplicate === true ? (message ?? '이미 사용 중인 닉네임입니다.')
    : '닉네임을 입력하면 자동으로 중복을 확인합니다.';
  const helperColor =
    checking ? '#6b7280'
    : duplicate === false ? '#16a34a'
    : duplicate === true ? '#dc2626'
    : '#6b7280';

  return (
    <Modal open={open} onClose={onClose} title="닉네임 수정하기" width={480}>
      <label className="block mb-2">
        <div className="mb-1 text-sm font-semibold">새 닉네임</div>
        <div style={{ display:'flex', gap:8 }}>
          <input
            className="i-input"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="닉네임을 입력하세요"
            // maxLength 제거: 서버 정책 없음 → API만 신뢰
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn-ghost"
            onClick={recheck}
            disabled={checking}
          >
            {checking ? '확인중…' : '다시 확인'}
          </button>
        </div>
      </label>

      <p className="text-xs" style={{ color: helperColor }}>{helperText}</p>

      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>취소</button>
        <button
          className="btn-primary disabled:opacity-40"
          disabled={!canSubmit}
          onClick={submit}
        >
          {loading ? '변경 중…' : '변경하기'}
        </button>
      </div>
    </Modal>
  );
}
