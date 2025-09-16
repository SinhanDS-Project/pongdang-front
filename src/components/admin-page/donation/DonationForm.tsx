// src/components/admin/donations/DonationForm.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR, { mutate as globalMutate } from "swr"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Textarea } from "@components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import type { Donation } from "@/types/admin"
import { PasteImageBox } from "@/components/admin-page/common/PasteImageBox"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import { buildMultipart, sanitizeString } from "@lib/admin/multipart"
import { api } from "@lib/admin/axios"

type Props = { donationId?: string | number; initialData?: Donation }

// --- 일반 API 응답 스키마 (명세 그대로)
type PublicDonationInfo = {
  id: number
  title: string
  purpose: string
  content: string
  org: string
  start_date: string
  end_date: string
  type: string
  goal: number
  current: number | null
  img: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "")
const toIso00 = (d: string) => (d ? `${d}T00:00:00` : "")

const publicFetcher = async (url: string) => {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } })
  let body: any = undefined
  try { body = await res.json() } catch {}
  if (!res.ok) {
    const err = new Error(body?.message || `Request failed (${res.status})`) as any
    err.status = res.status
    err.code = body?.error
    throw err
  }
  return body as PublicDonationInfo
}

export function DonationForm({ donationId, initialData }: Props) {
  const router = useRouter()

  const idNum = useMemo(() => {
    if (donationId === undefined || donationId === null) return undefined
    const n = typeof donationId === "string" ? Number(donationId) : donationId
    return Number.isFinite(n) ? n : undefined
  }, [donationId])

  // ✅ 일반 API 상세 조회 (절대 URL 키 권장)
  const detailKey = idNum !== undefined ? `${API_BASE}/api/donation/${idNum}` : null
  const { data: donation, isLoading, error } = useSWR<PublicDonationInfo>(
    detailKey,
    publicFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  )

  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", purpose: "", content: "", org: "",
    start_date: "", end_date: "", type: "",
    goal: "", current: "",
    img: "" as string | null | undefined,
  })

  // ✅ 데이터 도착 시 폼 채우기: 1순위 일반 API -> 2순위 initialData
  useEffect(() => {
    if (donation) {
      setForm({
        title: donation.title ?? "",
        purpose: donation.purpose ?? "",
        content: donation.content ?? "",
        org: donation.org ?? "",
        start_date: toDateInput(donation.start_date),
        end_date: toDateInput(donation.end_date),
        type: (() => {
          const t = (donation.type ?? "").trim();
          return TYPE_OPTIONS.includes(t as any) ? t : "";
        })(),
        goal: String(donation.goal ?? 0),
        current: donation.current == null ? "0" : String(donation.current),
        img: donation.img,
      })
      return
    }
    if (initialData) {
      setForm({
        title: initialData.title ?? "",
        purpose: initialData.purpose ?? "",
        content: initialData.content ?? "",
        org: (initialData as any).org ?? (initialData as any).organization ?? "",
        start_date: toDateInput((initialData as any).start_date ?? (initialData as any).startDate),
        end_date: toDateInput((initialData as any).end_date ?? (initialData as any).endDate),
        type: (initialData as any).type ?? (initialData as any).category ?? "",
        goal: String((initialData as any).goal ?? (initialData as any).goalAmount ?? 0),
        current: String((initialData as any).current ?? (initialData as any).currentAmount ?? 0),
        img: (initialData as any).img ?? (initialData as any).imageUrl ?? null,
      })
    }
  }, [donation, initialData])

  const disabled = saving

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (idNum === undefined) {
      toast({ title: "잘못된 접근", description: "수정하려면 ID가 필요합니다.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const json = {
        title: sanitizeString(form.title, "-"),
        purpose: sanitizeString(form.purpose, "-"),
        content: (form.content ?? "").trim(),
        org: sanitizeString(form.org, "-"),
        start_date: sanitizeString(toIso00(form.start_date), "-"),
        end_date: sanitizeString(toIso00(form.end_date), "-"),
        type: sanitizeString(form.type, "-"),
        goal: Number(form.goal || 0),
        current: form.current === "" ? null : Number(form.current),
      }

      const fd = buildMultipart(json, file, {
        jsonPartNames: ["donation", "info"],
        fileFieldNames: ["file", "image", "img", "files"],
        coerceEmptyTo: "-",
      })

      // ✅ 수정은 관리자 API로
      await api.put(`/api/admin/donation/${idNum}`, fd)

      // ✅ 캐시 갱신: 일반 상세 + (있다면) 일반/관리자 목록 + 관리자 상세
      await Promise.allSettled([
        detailKey ? globalMutate(detailKey) : Promise.resolve(),
        globalMutate(`/api/donation`),            // 일반 목록을 쓰는 화면이 있다면
        globalMutate(`/api/admin/donation/${idNum}`),
        globalMutate(`/api/admin/donation`),
      ])

      toast({ title: "성공", description: "기부 정보가 수정되었습니다." })
      router.push("/admin/donation")
    } catch (err: any) {
      toast({
        title: "수정 실패",
        description: err?.message || "입력값 또는 서버 응답을 확인해주세요.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const TYPE_OPTIONS = ["보건복지", "재난구휼", "환경보전", "자선", "시민사회구축"] as const;

  // ---- 화면 상태 가드 ----
  if (donationId === undefined) return <div>잘못된 접근입니다. (id 없음)</div>
  if (isLoading && !initialData) return <div>로딩 중...</div>
  if (error && (error as any).status === 404) return <div>기부 정보가 존재하지 않습니다. (ID: {donationId})</div>
  if (error && !initialData) return <div>데이터 로드 실패</div>

  // ---- 폼 UI ----
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
                <Select
                      value={form.type ? form.type : undefined}
                      onValueChange={(v) => setForm((s) => ({ ...s, type: v }))}
                    >
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
