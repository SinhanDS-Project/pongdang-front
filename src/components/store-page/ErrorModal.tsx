'use client'

import { createPortal } from 'react-dom'
import { Dialog } from '@headlessui/react'

export default function ErrorModal({
  open,
  message,
  onClose,
}: {
  open: boolean
  message: string
  onClose: () => void
}) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 반투명 배경 */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />

      {/* 모달 컨텐츠 */}
      <div className="relative mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-red-600">⚠ 알림</h2>
        <p className="mt-2 text-gray-700">{message}</p>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
