// src/components/modals/ModalBase.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number; // px
};

export default function Modal({ open, onClose, title, children, width = 700 }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ESC 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div style={S.wrap}>
      <div style={S.backdrop} onClick={onClose} />
      <div style={{ ...S.dialog, width }}>
        {title && (
          <div style={S.header}>
            <h3 style={S.title}>{title}</h3>
            <button aria-label="닫기" onClick={onClose} style={S.close}>✕</button>
          </div>
        )}
        <div style={S.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  backdrop: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' },
  dialog: {
    position: 'relative', maxHeight: '90vh', overflow: 'auto',
    background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 24px', borderBottom: '1px solid #eee',
  },
  title: { margin: 0, fontSize: 24, fontWeight: 800 },
  close: {
    width: 36, height: 36, borderRadius: 18, border: 'none', background: 'transparent',
    fontSize: 18, cursor: 'pointer',
  },
  body: { padding: '20px 24px 24px' },
};
