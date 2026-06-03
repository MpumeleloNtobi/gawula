"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { api, ApiError } from "@/lib/api";
import { usePartnerApplication } from "@/lib/partner-application-store";

type Status = "verifying" | "success" | "invalid" | "missing";

type VerifyResult = {
  ok: true;
  storeName: string;
  firstName: string;
};

export function PartnerVerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const markVerified = usePartnerApplication((s) => s.markVerified);

  const [status, setStatus] = React.useState<Status>(token ? "verifying" : "missing");
  const [storeName, setStoreName] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    api<VerifyResult>("/partners/applications/verify-email", {
      method: "POST",
      body: { token },
    })
      .then((result) => {
        setStoreName(result.storeName);
        markVerified();
        setStatus("success");
      })
      .catch((err) => {
        setStatus("invalid");
        setMessage(
          err instanceof ApiError ? err.message : "This verification link could not be used"
        );
      });
  }, [token, markVerified]);

  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8 sm:py-10">
      <section className="w-full max-w-[360px]">
        <h1 className="text-2xl font-semibold tracking-tight">Confirm your email</h1>

        {status === "verifying" && (
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            Confirming your email
            <LoadingDots />
          </div>
        )}

        {status === "success" && (
          <>
            <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
              Your email is confirmed{storeName ? ` for ${storeName}` : ""}. Our team will review
              your application and keep you updated by email.
            </div>
            <Button
              variant="dark"
              size="lg"
              className="mt-6 w-full"
              onClick={() => router.push("/partners/application")}
            >
              View your application
            </Button>
          </>
        )}

        {status === "invalid" && (
          <p className="mt-6 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
            {message ?? "This verification link is invalid or has expired"}
          </p>
        )}

        {status === "missing" && (
          <p className="mt-6 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
            This verification link is missing its token. Please use the link from your email.
          </p>
        )}
      </section>
    </main>
  );
}
