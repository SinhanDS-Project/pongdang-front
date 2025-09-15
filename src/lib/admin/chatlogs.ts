import { api } from "@lib/admin/axios";
import type { Chatlog } from "@/types/admin";

/** 1:1 문의 내역 조회 */
export const inquiriesApi = {
  list: (params?: { q?: string; page?: number; size?: number }) =>
    api.get<Chatlog[]>("/api/admin/chatlogs", { params }).then(r => r.data),

  /** 1:1 문의 답변 작성/수정 */
  answer: (id: number | string, response: string) =>
    api.put(`/api/admin/chatlogs/${id}`, { response }),
} as const;
