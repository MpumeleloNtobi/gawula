import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { AdminFrame } from "./_components/admin-frame";

export const metadata: Metadata = pageMetadata({
  title: "Admin",
  description: "Gawula admin console.",
  noindex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
