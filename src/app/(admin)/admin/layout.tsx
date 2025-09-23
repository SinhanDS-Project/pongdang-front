"use client";

import type { ReactNode } from "react";

import { Sidebar } from "@components/admin-page/Sidebar";
import { Topbar } from "@components/admin-page/Topbar";
import { RequireAdmin } from "@/components/RequireAdmin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAdmin>
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
    </RequireAdmin>
  );
}
