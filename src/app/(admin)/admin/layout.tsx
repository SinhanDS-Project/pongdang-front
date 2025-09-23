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

  useEffect(() => {
    if (mounted) {
      if (status === "unauthenticated") {
        router.replace("/signin");
      } else if (status === "authenticated" && user?.role !== "ADMIN") {
        throw new Error("권한 없음");
      }
    }
  }, [mounted, status, user, router]);

  if (!mounted || status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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
