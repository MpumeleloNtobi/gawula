import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your order",
  description: "View the details of your Gawula order.",
  noindex: true,
});

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
