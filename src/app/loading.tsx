export default function Loading() {
  return (
    <main className="bg-muted fixed top-0 left-0 z-50 h-dvh w-dvw overflow-hidden">
      <div className="mx-auto flex h-full max-w-4xl items-center justify-center p-4">
        <div className="flex flex-col gap-6"></div>
        <div className="flex h-screen w-full items-center justify-center">
          <div className="flex flex-col items-center gap-y-8">
            {/* 동그란 스피너 */}
            <div className="border-muted-foreground h-20 w-20 animate-spin rounded-full border-4 border-t-transparent"></div>
            <p className="text-base font-semibold text-gray-600">잠시만 기다려주세요. 준비중입니다...</p>
          </div>
        </div>
      </div>
    </main>
  )
}
