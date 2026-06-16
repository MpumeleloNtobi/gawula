"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";

type Status = "verifying" | "success" | "invalid" | "missing";

export function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const verifyEmail = useAuth((s) => s.verifyEmail);
  const isAuthed = useAuth((s) => Boolean(s.token));

  const [status, setStatus] = React.useState<Status>(token ? "verifying" : "missing");
  const [message, setMessage] = React.useState<string | null>(null);
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("invalid");
        setMessage(
          err instanceof ApiError ? err.message : "This verification link could not be used",
        );
      });
  }, [token, verifyEmail]);

  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8 sm:py-10">
      <section className="w-full max-w-[360px]">
        <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>

        {status === "verifying" && (
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            Confirming your email
            <LoadingDots />
          </div>
        )}

        {status === "success" && (
          <>
            <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
              Your email is verified. You can now place orders on Gawula.
            </div>
            <Button
              variant="dark"
              size="lg"
              className="mt-6 w-full"
              onClick={() => router.push(isAuthed ? "/menu" : "/sign-in")}
            >
              {isAuthed ? "Start ordering" : "Go to sign in"}
            </Button>
          </>
        )}

        {status === "invalid" && (
          <>
            <p className="mt-6 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
              {message ?? "This verification link is invalid or has expired"}
            </p>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Signed in? Open the menu and use the banner to resend the link.{" "}
              <Link href="/menu" className="font-semibold text-foreground hover:text-foreground/75">
                Go to menu
              </Link>
            </p>
          </>
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
