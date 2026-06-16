import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Sign in | Gawula",
};

export default function SignInPage() {
  return (
    <Suspense>
      <AuthPage mode="login" />
    </Suspense>
  );
}