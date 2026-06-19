import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Create your account",
  description:
    "Create a Gawula account to order from multiple stores with a single delivery.",
  noindex: true,
});

export default function SignUpPage() {
  return (
    <Suspense>
      <AuthPage mode="signup" />
    </Suspense>
  );
}