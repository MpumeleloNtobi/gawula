import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your orders",
  description: "Track your current and past Gawula orders in one place.",
  noindex: true,
});

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
