import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Sign up | Gawula",
};

export default function SignupPage() {
  return <AuthPage mode="signup" />;
}