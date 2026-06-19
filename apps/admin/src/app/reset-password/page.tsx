import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordPage } from "@/components/reset-password-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Set a new password",
  description: "Choose a new password for your Gawula account.",
  noindex: true,
});

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
