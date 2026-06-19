import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/components/forgot-password-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Reset your password",
  description: "Request a link to reset your Gawula account password.",
  noindex: true,
});

export default function ForgotPassword() {
  return <ForgotPasswordPage />;
}
