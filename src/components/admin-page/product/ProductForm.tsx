// src/components/admin/products/ProductForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { api } from "@lib/net/client-axios"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import { PasteImageBoxMulti } from "@/components/admin-page/common/PasteImageBoxMulti"

type FormState = {
  name: string
  price: string
  description: string
  type: string // ex) "GIFT"
  // (UI 유지용) 필요시 추가 필드가 있더라도 생성/수정 요청에는 넣지 않음
}

export function ProductForm() {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    name: "",
    price: "",
    description: "",
    type: "GIFT",
  })

  const [descMainFiles, setDescMainFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false)

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    // 1) 서버 DTO와 필드가 일치하는 JSON 페이로드 구성
    const payload = {
      name: form.name.trim(),
      price: Number(form.price || 0),
      type: form.type || "GIFT",
      description: (form.description ?? "").trim(),
    };

    // 2) 멀티파트 생성: JSON은 @RequestPart("request")로 받도록 Blob으로
    const fd = new FormData();
    fd.append(
      "request",
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );

    // 3) 이미지 파트(최대 2장). 컨트롤러가 'files'를 받는다면 아래 그대로,
    descMainFiles.slice(0, 2).forEach((f) => fd.append("files", f, f.name));

    // 4) headers에 Content-Type 수동 지정 금지! (브라우저가 boundary 포함해서 자동 설정)
    await api.post("/api/admin/product", fd);

    toast({ title: "성공", description: "상품이 등록되었습니다." });
    alert("상품이 등록되었습니다.");
    router.push("/admin/product/new");
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
                    {/* GIFT, CARD, SHOP, ACCOUNT, INVESTMENT, OTT */}
                    <SelectItem value="GIFT">GIFT(기프트카드)</SelectItem>
                    <SelectItem value="CARD">CARD(카드 연회비)</SelectItem>
                    <SelectItem value="SHOP">SHOP(올댓, 서비스 내 상품)</SelectItem>
                    <SelectItem value="ACCOUNT">ACCOUNT(우대 금리)</SelectItem>
                    <SelectItem value="INVESTMENT">INVESTMENT(투자 상품)</SelectItem>
                    <SelectItem value="INSURANCE">INSURANCE(보험)</SelectItem>
                    <SelectItem value="OTT">OTT</SelectItem>
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
              label="이미지 (① 대표, ② 설명용)"
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
