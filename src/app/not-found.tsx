export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-2 text-3xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-muted-foreground mb-6">요청하신 페이지가 존재하지 않거나 이동되었어요.</p>
      <a href="/" className="inline-block rounded-md bg-black px-4 py-2 text-white">
        홈으로 가기
      </a>
    </main>
  )
}
