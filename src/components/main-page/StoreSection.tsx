'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SectionTitle } from '@/components/SectionTitle'
import { Card, CardContent } from '@/components/ui/card'
import { PongIcon } from '@/icons'
import { useMe } from '@/hooks/use-me'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export type StoreItem = {
  id: number
  name: string
  price: number
  img: string | null
  product_type: string
}

export function StoreSection({ items }: { items: StoreItem[] }) {
  const router = useRouter()
  const { user } = useMe()
  const [loginNoticeOpen, setLoginNoticeOpen] = useState(false)

  const handleClick = (id: number) => {
    if (!user) {
      setLoginNoticeOpen(true)
      return
    }
    router.push(`/store/${id}`)
  }

  return (
    <section className="mb-8">
      {/* SectionTitle 클릭 제어 */}
      <div
        onClick={() => {
          if (!user) {
            setLoginNoticeOpen(true)
            return
          }
          router.push('/store')
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (!user) {
              setLoginNoticeOpen(true)
              return
            }
            router.push('/store')
          }
        }}
      >
        {/* href 제거해서 기본 이동 못하게 함 */}
        <SectionTitle href="#" title="퐁당퐁당 스토어" />
      </div>

      {/* 상품 목록 */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleClick(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick(item.id)}
            className="hover:shadow-badge block cursor-pointer rounded-xl transition-shadow"
          >
            <Card className="p-2.5">
              <CardContent className="flex flex-col gap-y-2 p-0">
                {/* 이미지 */}
                <div className="bg-placeholder relative aspect-[2/1] w-full overflow-hidden rounded">
                  <Image
                    src={item.img ?? '/placeholder-banner.png'}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>

                {/* 상품명 */}
                <div className="line-clamp-1 text-base font-semibold sm:text-lg">{item.name}</div>

                {/* 가격 */}
                <div className="flex w-full items-center justify-end gap-x-3 sm:gap-x-4">
                  <PongIcon />
                  <div className="flex items-center gap-x-1 sm:gap-x-2">
                    <div className="text-sm sm:text-base md:text-lg">{item.price}</div>
                    <div className="text-primary-shinhan text-base font-bold sm:text-lg md:text-xl">퐁</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* 로그인 안내 모달 */}
      <AlertDialog open={loginNoticeOpen} onOpenChange={setLoginNoticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
            <AlertDialogDescription>스토어는 로그인 후 이용할 수 있습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel
              onClick={() => {
                setLoginNoticeOpen(false)
              }}
            >
              닫기
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setLoginNoticeOpen(false)
                router.push('/signin')
              }}
              className="bg-secondary-royal hover:bg-secondary-navy"
            >
              로그인하러 가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
