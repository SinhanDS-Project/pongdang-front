// src/components/admin/donations/DonationForm.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Textarea } from "@components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { fetcher } from "@lib/admin/swr"
import type { Donation } from "@/types/admin"
import { PasteImageBox } from "@/components/admin-page/common/PasteImageBox"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import { buildMultipart, sanitizeString } from "@lib/admin/multipart"
import { api } from "@lib/admin/axios"

type Props = { donationId?: string | number; initialData?: Donation } // ✅ optional로 변경

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "")
const toIso00 = (d: string) => (d ? `${d}T00:00:00` : "")
const pong = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) + "퐁"

export function DonationForm({ donationId, initialData }: Props) {
  const router = useRouter()

  // ✅ 안전한 id 파싱(+ NaN 가드)
  const idNum = useMemo(() => {
    if (donationId === undefined || donationId === null) return undefined
    const n = typeof donationId === "string" ? Number(donationId) : donationId
    return Number.isFinite(n) ? n : undefined
  }, [donationId])

  // ✅ 상세 조회는 id가 있을 때만
  const detailKey = idNum !== undefined ? `/api/donation/${idNum}` : null
  const { data: donation, isLoading, error } = useSWR<Donation>(detailKey, fetcher, {
    revalidateOnFocus: false, fallbackData: initialData,
  })

  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", purpose: "", content: "", org: "",
    start_date: "", end_date: "", type: "",
    goal: "", current: "",
    img: "" as string | null | undefined,
  })

  // 상세조회가 없다고 했으니 initialData 기준 세팅
  useEffect(() => {
    const d = initialData
    if (!d) return
    setForm({
      title: d.title ?? "",
      purpose: d.purpose ?? "",
      content: d.content ?? "",
      org: d.org ?? "",
      start_date: toDateInput(d.start_date),
      end_date: toDateInput(d.end_date),
      type: d.type ?? "",
      goal: String(d.goal ?? 0),
      current: String(d.current ?? 0),
      img: d.img,
    })
  }, [initialData])

  const disabled = useMemo(() => saving, [saving])

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donation) return;

    setSaving(true);
    try {
      // 서버가 not-null로 받을 가능성 있는 문자열은 fallback 지정
      const json = {
        title: sanitizeString(form.title, "-"),
        purpose: sanitizeString(form.purpose, "-"),
        content: (form.content ?? "").trim(),          // 내용은 빈값 허용이면 "" 유지
        org: sanitizeString(form.org, "-"),
        start_date: sanitizeString(toIso00(form.start_date), "-"),
        end_date: sanitizeString(toIso00(form.end_date), "-"),
        type: sanitizeString(form.type, "-"),
        goal: Number(form.goal || 0),
        // current가 null 허용이면 JSON엔 null, 텍스트 필드는 "0" 같은 값으로도 같이 전달
        current: form.current === "" ? null : Number(form.current),
      };

      // 서버에서 @RequestPart 이름이 애매하므로 donation/info 둘 다 넣음 + 파일 키도 다중
      const fd = buildMultipart(json, file, {
        jsonPartNames: ["donation", "info"],
        fileFieldNames: ["file", "image", "img", "files"],
        coerceEmptyTo: "-", // 텍스트 필드로 받을 때 null 방지
      });

      await api.put(`/api/admin/donation/${idNum}`, fd);

      await Promise.all([
        mutate(`/api/admin/donation/${idNum}`),
        mutate(`/api/admin/donation`),
      ]);

      toast({ title: "성공", description: "기부 정보가 수정되었습니다." });
      router.push("/admin/donation");
    } catch {
      toast({
        title: "수정 실패",
        description: "입력값 또는 서버 응답을 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // id 없이 이 폼이 렌더되면(예: 라우팅 문제) 가드
  if (donationId === undefined) return <div>잘못된 접근입니다. (id 없음)</div>
  if (isLoading) return <div>로딩 중...</div>
  if (error) return <div>데이터 로드 실패</div>
  if (!donation) return <div>데이터가 없습니다.</div>

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로 가기
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>기부 정보 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input id="title" value={form.title} onChange={onChange("title")} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org">기관 *</Label>
                <Input id="org" value={form.org} onChange={onChange("org")} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">분류 *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((s) => ({ ...s, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="분류 선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="보건복지">보건복지</SelectItem>
                    <SelectItem value="재난구휼">재난구휼</SelectItem>
                    <SelectItem value="환경보전">환경보전</SelectItem>
                    <SelectItem value="자선">자선</SelectItem>
                    <SelectItem value="시민사회구축">시민사회구축</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">목표 금액 *</Label>
                <Input id="goal" type="number" value={form.goal} onChange={onChange("goal")} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current">현재 금액</Label>
                <Input id="current" type="number" value={form.current} onChange={onChange("current")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start">시작일 *</Label>
                <Input id="start" type="date" value={form.start_date} onChange={onChange("start_date")} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">종료일 *</Label>
                <Input id="end" type="date" value={form.end_date} onChange={onChange("end_date")} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">목적 *</Label>
              <Input id="purpose" value={form.purpose} onChange={onChange("purpose")} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea id="content" value={form.content} onChange={onChange("content")} rows={5} />
            </div>

            {/* 공통 이미지 박스 (붙여넣기/드래그/파일 선택 지원) */}
            <PasteImageBox
              label="대표 이미지"
              hint="이미지를 붙여넣기/드래그하거나, 파일을 선택하세요."
              file={file}
              setFile={setFile}
              initialUrl={form.img ?? null}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
              <Button type="submit" disabled={disabled}>{saving ? "저장 중..." : "수정"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
