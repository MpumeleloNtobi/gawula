import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailPage } from "@/components/verify-email-page";

export const metadata: Metadata = {
  title: "Verify your email | Gawula",
};

export default function VerifyEmail() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  );
}
