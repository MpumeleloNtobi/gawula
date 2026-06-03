import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordPage } from "@/components/reset-password-page";

export const metadata: Metadata = {
  title: "Set a new password | Gawula",
};

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
