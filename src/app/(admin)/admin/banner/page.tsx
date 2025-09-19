import { BannerForm } from "@components/admin-page/banner/BannerForm"

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 배너 추가</h1>
        <p className="text-muted-foreground">새로운 배너 정보를 입력하세요.</p>
      </div>

      <BannerForm />
    </div>
  )
}
