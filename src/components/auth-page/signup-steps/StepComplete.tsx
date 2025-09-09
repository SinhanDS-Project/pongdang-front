'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export function StepComplete() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <CheckCircle className="text-secondary-sky h-12 w-12" />
      <h3 className="text-2xl font-bold">회원가입이 완료되었습니다!</h3>
      <p className="text-muted-foreground">이제 로그인 후 서비스를 이용해보세요.</p>
      <div className="mt-4 flex gap-3">
        <Link href="/">
          <Button variant="outline">메인으로</Button>
        </Link>
        <Link href="/signin">
          <Button className="bg-secondary-royal hover:bg-secondary-navy">로그인 하기</Button>
        </Link>
      </div>
    </div>
  )
}
