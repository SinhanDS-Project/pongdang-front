'use client'

import Image from 'next/image'

export default function InfoPage() {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-black">
      <div className="h-full w-full overflow-auto">
        <Image
          src="/pongdang-service.png"
          alt="정보 페이지 이미지"
          width={1200} // 원본 크기나 충분히 큰 값
          height={0}
          className="h-auto w-full object-contain"
          priority
        />
      </div>
    </main>
  )
}
