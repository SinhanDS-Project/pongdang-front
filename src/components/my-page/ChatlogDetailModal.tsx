// src/components/modals/ChatlogDetailModal.tsx
'use client';
import Modal from './Modal';
import { useChatlogDetail } from '@/lib/swr';
import type { ChatlogItem } from '@/types/chatlog';

export default function ChatlogDetailModal({
  open, onClose, row,
}: { open: boolean; onClose: () => void; row?: ChatlogItem }) {
  const id = row?.id ?? null;
  const { data: detail } = useChatlogDetail(id);

  // 상세가 있으면 상세 우선, 없으면 리스트 row 사용
  const item = detail ?? row;

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="문의 상세" width={640}>
      {!item ? (
        <p className="text-sm text-neutral-500">내용을 불러오지 못했습니다.</p>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">{item.title}</h3>

          <section>
            <h4 className="text-sm font-semibold text-neutral-600">문의 내용</h4>
            <p className="mt-1 whitespace-pre-line text-neutral-800">
              {item.question || '-'}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              문의일시: {item.chat_date ? new Date(item.chat_date).toLocaleString('ko-KR') : '-'}
            </p>
          </section>

          <section className="pt-2 border-t">
            <h4 className="text-sm font-semibold text-neutral-600">답변</h4>
            {item.response ? (
              <>
                <p className="mt-1 whitespace-pre-line text-neutral-800">
                  {item.response}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  답변일시: {item.response_date ? new Date(item.response_date).toLocaleString('ko-KR') : '-'}
                </p>
              </>
            ) : (
              <p className="mt-1 text-neutral-500">답변 대기중입니다.</p>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
