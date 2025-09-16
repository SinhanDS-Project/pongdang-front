// src/components/modals/ConfirmDialog.tsx
'use client';

import { useState } from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); onClose(); }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} width={480}>
      <div style={{ whiteSpace: 'pre-line', color: '#374151' }}>{message}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={btnGhost}>{cancelText}</button>
        <button onClick={handleConfirm} disabled={loading}
          style={{ ...btnPrimary, background: danger ? '#e11d48' : '#5b8ef1', opacity: loading ? .6 : 1 }}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

const btnGhost: React.CSSProperties = {
  padding: '10px 16px', border: 'none', borderRadius: 8, background: '#e5e7eb', cursor: 'pointer'
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 16px', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer'
};
