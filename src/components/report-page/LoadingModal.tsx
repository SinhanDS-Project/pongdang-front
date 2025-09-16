'use client'

export default function LoadingModal({ open }: { open: boolean }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex flex-col items-center rounded-lg bg-white p-8 shadow-lg">
        {/* 스피너 */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>

        {/* 메시지 */}
        <p className="mt-6 text-lg font-semibold">🤖 AI가 맞춤 금융 리포트를 생성하고 있습니다.</p>
        <p className="mt-2 text-sm text-gray-500">잠시만 기다려주세요...</p>
      </div>
    </div>
  )
}
