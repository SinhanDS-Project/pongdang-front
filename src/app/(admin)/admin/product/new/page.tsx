import { ProductForm } from "@/components/admin-page/product/ProductForm"

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 상품 추가</h1>
        <p className="text-muted-foreground">새로운 상품 정보를 입력하세요.</p>
      </div>

      <ProductForm />
    </div>
  )
}
