import { ChevronRight } from 'lucide-react'

import { AlertBar } from '@/components/main-page/AlertBar'
import { Banner, BannerCarousel } from '@/components/main-page/BannerCarousel'
import { CtaSection } from '@/components/main-page/CtaSection'
import { StoreItem, StoreSection } from '@/components/main-page/StoreSection'
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
      <StoreSection items={storeItems} />
    </div>
  )
}
