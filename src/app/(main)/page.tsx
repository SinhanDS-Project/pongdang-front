import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export default function MainHome() {
  return (
    <div className="lg:px-8) container mx-auto px-4 md:px-6">
      {/* 배너 슬라이더 */}
      <Carousel className="mb-4 w-full">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-3/1 items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* 최신 알림 텍스트 바 */}
      <div className="shadow-badge mb-8 rounded-full px-8 py-2 text-base">작은 퐁 하나가 내일의 큰 혜택이 됩니다</div>

      {/* AI 추천 CTA 섹션 */}
      <div className="bg-bubble flex flex-col items-center gap-y-16 py-24">
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
    </div>
  )
}
