import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Partner portal",
  description: "Manage your Gawula store, menu and orders.",
  noindex: true,
});

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
