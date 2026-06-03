import { Suspense } from "react";
import type { Metadata } from "next";
import { PartnerVerifyEmailPage } from "@/components/partner-verify-email-page";

export const metadata: Metadata = {
  title: "Confirm your email | Gawula partners",
};

export default function PartnerVerifyEmail() {
  return (
    <Suspense>
      <PartnerVerifyEmailPage />
    </Suspense>
  );
}
