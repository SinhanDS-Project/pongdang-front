import { api } from "@lib/admin/axios"

export const fetcher = (url: string) => api.get(url).then((r) => r.data)
