// src/lib/donations.ts
import { api } from "@lib/admin/axios"
import type { Donation } from "@/types/admin"

export type DonationUpdateDTO = {
  title: string
  purpose: string
  content: string
  org: string
  start_date: string // "YYYY-MM-DDTHH:mm:ss"
  end_date: string   // "YYYY-MM-DDTHH:mm:ss"
  type: string
  goal: number
  current: number | null
  file?: File | null
}

export const donations = {
  getOne: (id: number) =>
    api.get(`/api/admin/donation/${id}`).then((r) => r.data as Donation),

  update: (id: number, payload: DonationUpdateDTO) => {
    const { file, ...info } = payload

    // 파일이 있으면 multipart/form-data, 없으면 JSON
    if (file) {
      const fd = new FormData()
      // ⚠️ 백엔드 @RequestPart 이름과 맞춰주세요. (예: "donation" / "info")
      fd.append("donation", new Blob([JSON.stringify(info)], { type: "application/json" }))
      fd.append("file", file)

      return api.put(`/api/admin/donation/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    }

    return api.put(`/api/admin/donation/${id}`, info) // application/json
  },
}
