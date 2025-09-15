// src/components/admin/products/ProductForm.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { fetcher } from "@lib/admin/swr"
import { api } from "@lib/admin/axios"
import type { Product } from "@/types/admin"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import { PasteImageBoxMulti } from "@/components/admin-page/common/PasteImageBoxMulti"
import { Textarea } from "@/components/ui/textarea"

type FormState = {
  name: string
  price: string
  description: string
  type: string // ex) "GIFT"
  // (UI 유지용) 필요시 추가 필드가 있더라도 생성/수정 요청에는 넣지 않음
}

export function ProductForm() {
  const router = useRouter()

  const { data: product } = useSWR<Product>(
    fetcher,
    { revalidateOnFocus: false }
  )

  const [form, setForm] = useState<FormState>({
    name: "",
    price: "",
    description: "",
    type: "GIFT",
  })

  const [descMainFiles, setDescMainFiles] = useState<File[]>([]);
  const [desc, setDesc] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!product) return
    setForm({
      name: product.name ?? "",
      price: product.price != null ? String(product.price) : "",
      description: product.description ?? "",
      // 서버 스펙에 맞춰 기본값/매핑
      // product.type이 있다면 사용, 없다면 "GIFT"
      type: (product as any)?.type ?? "GIFT",
    })
  }, [product])

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  try {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("price", String(Number(form.price || 0)));
    fd.append("type", form.type || "GIFT");

    // descMainFiles: 설명/대표 이미지 묶음 (PasteImageBoxMulti에서 받은 File[])
    const imgs = descMainFiles;

    if (imgs.length >= 2) {
      // ✅ 2장: files 두 개만 전송, description은 전송하지 않음
      imgs.slice(0, 2).forEach((f) => fd.append("files", f, f.name));
    } else if (imgs.length === 1) {
      // ✅ 1장: description(텍스트) + files(1개)
      const desc = (form.description ?? "").trim();
      fd.append("description", desc === "" ? "-" : desc);
      fd.append("files", imgs[0], imgs[0].name);
    } else {
      // ✅ 0장: description만
      const desc = (form.description ?? "").trim();
      fd.append("description", desc === "" ? "-" : desc);
    }

    // 백엔드 엔드포인트로 직행
    await api.post("/api/admin/product", fd); // 서버 실제 경로

    toast({ title: "성공", description: "상품이 등록되었습니다." });
    router.push("/admin/product");
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.message ||
      "요청 실패";
    toast({ title: "오류", description: msg, variant: "destructive" });
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로 가기
      </Button>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">상품명 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">가격 *</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">분류 *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="분류 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GIFT">GIFT</SelectItem>
                    <SelectItem value="FOOD">COUPON</SelectItem>
                    <SelectItem value="DAILY">SUBSCRIBE</SelectItem>
                    <SelectItem value="ETC">ETC</SelectItem>
                    {/* 필요 시 서버 허용 값 추가 */}
                    {/* <SelectItem value="GOODS">GOODS</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명(텍스트)</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="텍스트 설명을 입력하세요 (이미지 2장 업로드 시 전송되지 않습니다)"
              />
            </div>

            {/* 설명/대표를 한 박스에서 최대 2장까지 */}
            <PasteImageBoxMulti
              label="이미지 (① 설명용, ② 대표)"
              files={descMainFiles}
              setFiles={setDescMainFiles}
              maxCount={2}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "저장 중..." : "등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
