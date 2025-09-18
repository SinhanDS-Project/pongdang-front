'use client'

export default function LoadingModal({ open, message }: { open: boolean; message: string }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
      <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="flex flex-col items-center gap-3">
          {/* 로딩 스피너 */}
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">{message}</h2>
        </div>
      </div>
    </div>
  )
}
