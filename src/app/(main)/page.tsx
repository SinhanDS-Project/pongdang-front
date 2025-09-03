import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { AlertBar } from '@/components/main-page/AlertBar'
import { Banner, BannerCarousel } from '@/components/main-page/BannerCarousel'
import { CtaSection } from '@/components/main-page/CtaSection'
import { Card, CardContent } from '@/components/ui/card'
import { PongIcon } from '@/icons'
import { serverFetchJSON } from '@/lib/net/server-fetch'

export default async function MainHome() {
  // 서버사이드에서 API 호출하여 배너 데이터 가져오기
  let banners: Banner[] = []

  try {
    const response = await serverFetchJSON<{ banners: Banner[] }>('/api/content/banner/list', {
      revalidate: 60,
      auth: 'none',
    })

    banners = response.banners
  } catch (error) {
    console.error('배너 API 불러오기 실패: ', error)

    banners = Array.from({ length: 3 }).map((_, index) => ({
      id: `${index + 1}`,
      title: `Placeholder Banner ${index + 1}`,
      image_path: '/placeholder-banner.png', // 적절한 플레이스홀더 이미지 경로
      banner_link_url: '#',
      description: 'This is a placeholder banner',
    }))
  }

  return (
    <div className="lg:px-8) container mx-auto px-4 md:px-6">
      <BannerCarousel banners={banners} />
      <AlertBar message="작은 퐁 하나가 내일의 큰 혜택이 됩니다" />
      <CtaSection
        title="나에게 맞는 금융은 뭐가 있을까?"
        rows={
          [
            ['저축', '투자', '대출', '카드', '자산관리'],
            ['소비패턴', '절약', '보험', '연금', '주거/부동산'],
          ] as string[][]
        }
        ctaHref="#"
        ctaLabel="나의 금융 소비에 맞는 AI 추천 받으러 가기"
      />

      {/* 퐁당 스토어  */}
      <div className="mb-8 flex items-center text-3xl font-semibold">
        <div>퐁당퐁당 스토어</div>
        <ChevronRight className="size-8" />
      </div>
      <div className="flex gap-x-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Link href={'#'} className="hover:shadow-badge w-1/4 rounded-xl">
            <Card key={index} className="p-4">
              <CardContent className="flex flex-col gap-y-4 p-0">
                <div className="bg-accent-foreground aspect-6/5 w-full"></div>
                <div className="text-xl font-bold">상품이름{index + 1}</div>
                <div className="flex w-full items-center justify-end gap-x-4">
                  <PongIcon />
                  <div className="flex items-center gap-x-2">
                    <div className="text-lg">100</div>
                    <div className="text-primary-shinhan text-xl font-bold">퐁</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
