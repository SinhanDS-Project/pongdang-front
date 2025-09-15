import { api } from "@lib/admin/axios";
import { AxiosHeaders } from "axios";

export const bannersApi = {
  create: (data: {
    title: string;
    banner_link_url?: string;
    description?: string;
    file: File;
  }) => {
    const form = new FormData();
    form.append(
      "banner",
      new Blob(
        [
          JSON.stringify({
            title: data.title,
            banner_link_url: data.banner_link_url,
            description: data.description,
          }),
        ],
        { type: "application/json" }
      )
      // 필요하면 파일명 추가: , "banner.json"
    );
    form.append("file", data.file);

    return api.post("/api/admin/banner", form, {
      // ✅ 깨끗한 헤더 객체 + 변환 우회
      headers: new AxiosHeaders(), // <- Content-Type 비워둠(브라우저가 자동)
      transformRequest: (v) => v,  // <- 전역 transformRequest 무시
    });
  },
};
