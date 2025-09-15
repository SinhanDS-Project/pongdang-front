import { api } from "@lib/admin/axios";

/** 상품 등록: POST /api/admin/product  (JSON 바디 가정) */
export const productsApi = {
  create: (p: { name: string; price: number; description?: string; type?: string; }) =>
    api.post(`/api/admin/product`, p),
};
