import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Browse stores near you",
  description:
    "Browse stores in your mall, food court or cluster and add items from several shops to one cart for a single Gawula delivery.",
  path: "/menu",
});

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
