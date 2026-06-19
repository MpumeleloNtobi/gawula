import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Track your order",
  description:
    "Follow your Gawula delivery in real time from the store to your door.",
  noindex: true,
});

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
