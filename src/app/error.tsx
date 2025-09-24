'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="bg-muted/40 h-dvh overflow-hidden">
      <div className="mx-auto flex h-full max-w-4xl items-center justify-center p-4">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-col items-center gap-y-2">
              <CardTitle className="mb-2 text-3xl font-bold">오류가 발생했습니다</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-y-4">
              <div className="relative aspect-square w-full min-w-72 overflow-hidden rounded">
                <Image
                  src={'error.png'}
                  alt={'페이지를 찾을 수 없습니다'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <div className="text-muted-foreground mb-2">{error.message}</div>
              <div className="grid grid-cols-2 gap-x-2">
                <Link href="/">
                  <Button size={'lg'} className="bg-secondary-royal hover:bg-secondary-sky">
                    홈으로 이동하기
                  </Button>
                </Link>
                <Button size={'lg'} onClick={() => reset()} className="bg-accent text-muted-foreground w-full">
                  다시시도
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
