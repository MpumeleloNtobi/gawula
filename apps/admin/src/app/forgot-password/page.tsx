import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/components/forgot-password-page";

export const metadata: Metadata = {
  title: "Reset your password | Gawula",
};

export default function ForgotPassword() {
  return <ForgotPasswordPage />;
}
