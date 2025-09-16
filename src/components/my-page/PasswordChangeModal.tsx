// src/components/modals/PasswordChangeModal.tsx
'use client';
import { useState } from 'react';
import Modal from './Modal';
import { updatePassword } from '@/lib/swr';

export default function PasswordChangeModal({
  open, onClose, onChanged,
}: { open: boolean; onClose: () => void; onChanged?: () => void }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const valid = next.length >= 8 && next === conf;

  const submit = async () => {
    if (!valid) return;
    setLoading(true);
    try {
      await updatePassword(cur /* 현재 비밀번호 */, next /* 새 비번 */);
      onChanged?.();
      onClose();
    } catch (e:any) {
      if (e?.response?.status === 401) {
        setErr('다시 로그인이 필요합니다.');
      } else {
        setErr(e?.response?.data?.message ?? '변경에 실패했습니다.');
      }
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="비밀번호 수정하기" width={520}>
      <label className="block mb-3">
        <div className="mb-1 text-sm font-semibold">현재 비밀번호</div>
        <input type="password" className="i-input" value={cur} onChange={e=>setCur(e.target.value)} />
      </label>
      <label className="block mb-3">
        <div className="mb-1 text-sm font-semibold">새 비밀번호 (8자 이상)</div>
        <input type="password" className="i-input" value={next} onChange={e=>setNext(e.target.value)} />
      </label>
      <label className="block mb-1">
        <div className="mb-1 text-sm font-semibold">새 비밀번호 확인</div>
        <input type="password" className="i-input" value={conf} onChange={e=>setConf(e.target.value)} />
      </label>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>취소</button>
        <button className="btn-primary disabled:opacity-40" disabled={!valid || loading} onClick={submit}>
          변경하기
        </button>
      </div>
    </Modal>
  );
}
