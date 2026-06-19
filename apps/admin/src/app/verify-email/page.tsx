import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailPage } from "@/components/verify-email-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Verify your email",
  description:
    "Confirm your email address to finish setting up your Gawula account.",
  noindex: true,
});

export default function VerifyEmail() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  );
}
