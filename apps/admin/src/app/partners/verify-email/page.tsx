import { Suspense } from "react";
import type { Metadata } from "next";
import { PartnerVerifyEmailPage } from "@/components/partner-verify-email-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Confirm your email",
  description:
    "Confirm your email to continue your Gawula partner application.",
  noindex: true,
});

export default function PartnerVerifyEmail() {
  return (
    <Suspense>
      <PartnerVerifyEmailPage />
    </Suspense>
  );
}
