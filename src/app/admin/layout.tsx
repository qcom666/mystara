import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/admin-guard";

export const metadata: Metadata = { title: "Админ-панель", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AdminNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
