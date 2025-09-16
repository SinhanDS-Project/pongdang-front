'use client'

export default function SuccessModal({
  open,
  message,
  onClose,
}: {
  open: boolean
  message: string
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
      <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <h2 className="text-lg font-bold text-green-600">🎉 완료</h2>
        <p className="mt-2 text-gray-700">{message}</p>
        <div className="mt-4 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
