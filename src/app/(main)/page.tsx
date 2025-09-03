import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Banner, BannerCarousel } from '@/components/main-page/BannerCarousel'
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

      {/* 최신 알림 텍스트 바 */}
      <div className="shadow-badge mb-8 rounded-full px-8 py-2 text-base">작은 퐁 하나가 내일의 큰 혜택이 됩니다</div>

      {/* AI 추천 CTA 섹션 */}
      <div className="bg-bubble mb-8 flex flex-col items-center gap-y-16 py-24">
        <div className="text-primary-shinhan text-5xl font-extrabold">나에게 맞는 금융은 뭐가 있을까?</div>
        <div className="flex flex-col items-center gap-y-8 text-3xl font-medium">
          <div className="flex items-center justify-center gap-x-16">
            <div className="animate-bounce [animation-delay:0s]">저축</div>
            <div className="animate-bounce [animation-delay:0.2s]">투자</div>
            <div className="animate-bounce [animation-delay:0.4s]">대출</div>
            <div className="animate-bounce [animation-delay:0.6s]">카드</div>
            <div className="animate-bounce [animation-delay:0.8s]">자산관리</div>
          </div>
          <div className="flex items-center justify-center gap-x-16">
            <div className="animate-bounce [animation-delay:0.9s]">소비패턴</div>
            <div className="animate-bounce [animation-delay:0.7s]">절약</div>
            <div className="animate-bounce [animation-delay:0.5s]">보험</div>
            <div className="animate-bounce [animation-delay:0.3s]">연금</div>
            <div className="animate-bounce [animation-delay:0.1s]">주거/부동산</div>
          </div>
        </div>
        <Link href={'#'} className="text-foreground hover:text-foreground/70 text-3xl font-bold underline">
          나의 금융 소비에 맞는 AI 추천 받으러 가기
        </Link>
      </div>

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
