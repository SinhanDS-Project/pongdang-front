// src/components/admin/banners/BannerForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Textarea } from "@components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/card"
import { toast } from "@components/ui/use-toast"
import { PasteImageBox } from "@/components/admin-page/common/PasteImageBox"
// import { buildMultipart, sanitizeString } from "@lib/multipart"
import { api } from "@lib/admin/axios"

export function BannerForm() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
    if (!file) {
      toast({ title: "이미지 필요", description: "배너 이미지를 선택해 주세요.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("banner_link_url", bannerUrl.trim());
      fd.append("description", (description ?? "").trim() || "-");
      fd.append("file", file, file.name);

      await api.post("/api/admin/banner", fd);

      toast({ title: "성공", description: "배너가 등록되었습니다." });
      router.push("/admin/banner");
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
    <Card>
      <CardHeader>
        <CardTitle>배너 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">배너 링크 URL *</Label>
              <Input id="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">설명</Label>
            <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* 붙여넣기/드롭/파일선택 통합 */}
          <PasteImageBox
            label="배너 이미지"
            hint="여기에 붙여넣기/드래그하거나, 파일을 선택하세요."
            file={file}
            setFile={setFile}
            initialUrl={null}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "등록 중..." : "배너 등록"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
