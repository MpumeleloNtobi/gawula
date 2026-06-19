import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description:
    "Sign in to your Gawula account to order, track deliveries and manage your details.",
  noindex: true,
});

export default function SignInPage() {
  return (
    <Suspense>
      <AuthPage mode="login" />
    </Suspense>
  );
}