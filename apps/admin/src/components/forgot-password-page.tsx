"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";

const showQaCreds = process.env.NEXT_PUBLIC_SHOW_QA_CREDENTIALS === "true";

export function ForgotPasswordPage() {
  const forgotPassword = useAuth((s) => s.forgotPassword);

  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [devToken, setDevToken] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await forgotPassword(email.trim());
      setDevToken(res.devResetToken ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8 sm:py-10">
      <section className="w-full max-w-[360px]">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>

        {sent ? (
          <>
            <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
              If an account exists for <span className="font-semibold">{email.trim()}</span>, we have
              sent a link to reset your password. Please check your inbox.
            </div>
            {showQaCreds && devToken && (
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Dev shortcut:{" "}
                <Link
                  href={`/reset-password?token=${devToken}`}
                  className="font-semibold text-foreground hover:text-foreground/75"
                >
                  open reset link
                </Link>
              </p>
            )}
          </>
        ) : (
          <>
            <form className="mt-6 grid gap-3" onSubmit={submit}>
              <label className="sr-only" htmlFor="forgot-email">
                Email
              </label>
              <Input
                id="forgot-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="Email"
                autoComplete="email"
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                variant="dark"
                size="lg"
                className="w-full"
                disabled={busy || !email.trim()}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    Sending
                    <LoadingDots />
                  </span>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-foreground hover:text-foreground/75">
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
