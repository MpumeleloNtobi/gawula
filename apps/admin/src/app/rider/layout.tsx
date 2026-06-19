import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { RiderFrame } from "./_components/rider-frame";

export const metadata: Metadata = pageMetadata({
  title: "Rider",
  description: "Gawula rider portal.",
  noindex: true,
});

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <RiderFrame>{children}</RiderFrame>;
}
