// src/components/modals/PongConvertModal.tsx
'use client';

import { useMemo, useState } from 'react';
import Modal from './Modal';

const UNIT = 100; // ✅ 100단위

export default function PongConvertModal({
  open, onClose, balance, onSubmit,
}: { open:boolean; onClose:()=>void; balance:number; onSubmit:(amount:number)=>Promise<void>|void }) {
  const [amount, setAmount] = useState<number | ''>('');

  // balance 이하에서 가능한 최대 100단위
  const maxAllowed = useMemo(
    () => Math.floor(Math.max(0, balance) / UNIT) * UNIT,
    [balance]
  );

  const valid = useMemo(
    () =>
      typeof amount === 'number' &&
      amount >= UNIT &&
      amount <= maxAllowed &&
      amount % UNIT === 0,
    [amount, maxAllowed]
  );

  const tooSmall = typeof amount === 'number' && amount < UNIT;
  const tooBig   = typeof amount === 'number' && amount > maxAllowed;
  const notUnit  = typeof amount === 'number' && amount % UNIT !== 0;

  const doSubmit = async () => {
    if (!valid) return;
    await onSubmit(amount as number);
    onClose();
  };

  // ✅ 숫자만, 즉시 balance 이내 & 100단위로 스냅(내림)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D+/g, '');
    if (raw === '') {
      setAmount('');
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setAmount('');
      return;
    }
    const clamped = Math.min(n, Math.max(0, balance));
    const snapped = Math.floor(clamped / UNIT) * UNIT; // 100단위 내림
    setAmount(snapped > 0 ? snapped : '');
  };

  const handleMax = () => setAmount(maxAllowed > 0 ? maxAllowed : '');

  return (
    <Modal open={open} onClose={onClose} title="퐁 전환하기">
      <div style={{ marginBottom: 12, padding: 12, background:'#f5f6f8', borderRadius:8, display:'flex', justifyContent:'space-between' }}>
        <span>퐁으로 전환 가능한 포인트</span><b>{balance.toLocaleString('ko-KR')} 포인트</b>
      </div>
      <label style={{ display:'block' }}>
        <div style={{ marginBottom:6, padding: 12, fontWeight:700, fontSize:14, display: 'flex', justifyContent: 'space-between' }}>
          <span>전환할 포인트</span><b>1퐁 = 100포인트</b>
          </div>
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e)=>{ const v = e.target.value.replace(/\D+/g,''); setAmount(v ? Number(v) : ''); }}
          placeholder="숫자만 입력"
          style={{ width:'96%', padding:'10px 12px', border:'1px solid #cfd4dc', borderRadius:8 }}
          min={1}
          max={balance}

        />
      </label>
      {/* 안내/에러 */}
      <p className="mt-2 text-xs" style={{ color: (tooSmall || tooBig || notUnit) ? '#dc2626' : '#6b7280' }}>
        {maxAllowed <= 0
          ? '전환 가능한 포인트가 없습니다.'
          : notUnit
            ? `입력은 ${UNIT.toLocaleString()} 단위여야 합니다.`
            : tooSmall
              ? `${UNIT.toLocaleString()} 이상 입력하세요.`
              : tooBig
                ? '보유 포인트를 초과했습니다.'
                : `${UNIT.toLocaleString()} 단위로 전환할 수 있습니다. (최대 ${maxAllowed.toLocaleString()})`}
      </p>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
        <button onClick={onClose} style={{ padding:'10px 16px', background:'#e5e7eb', border:'none', borderRadius:8, cursor:'pointer' }}>취소</button>
        <button onClick={doSubmit} disabled={!valid}
          style={{ padding:'10px 16px', background: valid ? '#5b8ef1' : '#aebeea', color:'#fff', border:'none', borderRadius:8, cursor: valid ? 'pointer' : 'not-allowed' }}>
          전환하기
        </button>
      </div>
    </Modal>
  );
}
