import axios from "axios";

export const api = axios.create({
  baseURL: "/",         // ✅ 절대 외부 IP 쓰지 말고 /api 로만 호출
  withCredentials: false,  // 쿠키 안 쓰면 false가 CORS 면에서 안전
});


// (옵션) 토큰 자동 첨부
api.interceptors.request.use((cfg) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
