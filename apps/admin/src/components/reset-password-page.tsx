"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { isStrongPassword, PASSWORD_REQUIREMENT } from "@/lib/password";

export function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useAuth((s) => s.resetPassword);

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isStrongPassword(password)) {
      setError(PASSWORD_REQUIREMENT);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8 sm:py-10">
      <section className="w-full max-w-[360px]">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>

        {done ? (
          <>
            <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
              Your password has been updated. You can now sign in with your new password.
            </div>
            <Button
              variant="dark"
              size="lg"
              className="mt-6 w-full"
              onClick={() => router.push("/login")}
            >
              Go to sign in
            </Button>
          </>
        ) : !token ? (
          <>
            <p className="mt-6 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
              This reset link is missing its token. Please request a new password reset.
            </p>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link
                href="/forgot-password"
                className="font-semibold text-foreground hover:text-foreground/75"
              >
                Request a new link
              </Link>
            </p>
          </>
        ) : (
          <>
            <form className="mt-6 grid gap-3" onSubmit={submit}>
              <label className="sr-only" htmlFor="new-password">
                New password
              </label>
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password (at least 8 characters)"
                autoComplete="new-password"
                autoFocus
              />
              <label className="sr-only" htmlFor="confirm-password">
                Confirm new password
              </label>
              <PasswordInput
                id="confirm-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                variant="dark"
                size="lg"
                className="w-full"
                disabled={busy || password.length < 8 || confirm.length < 8}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    Updating
                    <LoadingDots />
                  </span>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
