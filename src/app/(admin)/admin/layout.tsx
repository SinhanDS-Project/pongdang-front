"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Sidebar } from "@components/admin-page/Sidebar";
import { Topbar } from "@components/admin-page/Topbar";
import { useMe } from "@/hooks/use-me";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, status } = useMe();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // ✅ hydration mismatch 방지: 클라이언트 마운트 후에만 렌더링
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (status === "unauthenticated") {
    // 로그인 안됨 → 로그인 페이지로 보냄
    if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
    return null;
  }

  if (status === "authenticated" && user?.role !== "ADMIN") {
    // ✅ 여기서 throw → error.tsx로 잡힘
    throw new Error("권한 없음");
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
