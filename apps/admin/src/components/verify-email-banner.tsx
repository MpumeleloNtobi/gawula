"use client";

import * as React from "react";
import { MailWarning } from "lucide-react";
import { useAuth } from "@/lib/auth-store";

export function VerifyEmailBanner() {
  const hydrated = useAuth((s) => s.hydrated);
  const principal = useAuth((s) => s.principal);
  const token = useAuth((s) => s.token);
  const resendVerification = useAuth((s) => s.resendVerification);
  const refreshMe = useAuth((s) => s.refreshMe);

  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  const show =
    hydrated &&
    Boolean(token) &&
    principal?.roles?.includes("customer") &&
    principal?.emailVerified === false;

  React.useEffect(() => {
    if (hydrated && token && principal?.roles?.includes("customer") && !principal.emailVerified) {
      void refreshMe();
    }
  }, [hydrated, token, principal?.roles, principal?.emailVerified, refreshMe]);

  if (!show) return null;

  const resend = async () => {
    setStatus("sending");
    try {
      await resendVerification();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
      <div className="container flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
        <MailWarning className="h-4 w-4 shrink-0" />
        <p className="flex-1">
          Verify your email to place orders. We sent a link to{" "}
          <span className="font-medium">{principal?.email}</span>.
        </p>
        {status === "sent" ? (
          <span className="font-medium">Sent, check your inbox</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={status === "sending"}
            className="font-semibold text-amber-900 hover:text-amber-700 disabled:opacity-60"
          >
            {status === "sending" ? "Sending" : status === "error" ? "Try again" : "Resend email"}
          </button>
        )}
      </div>
    </div>
  );
}
