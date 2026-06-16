"use client";

import * as React from "react";
import Link from "next/link";
import { LuCheck as Check } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import {
  PARTNER_STAGES,
  partnerStageIndex,
  usePartnerApplication,
} from "@/lib/partner-application-store";
import { cn } from "@/lib/utils";

export function PartnerApplicationStatus() {
  const [mounted, setMounted] = React.useState(false);
  const application = usePartnerApplication((s) => s.application);
  const markVerified = usePartnerApplication((s) => s.markVerified);
  const [resendState, setResendState] = React.useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [resendMessage, setResendMessage] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const resend = React.useCallback(async () => {
    if (!application?.id || resendState === "sending") return;
    setResendState("sending");
    setResendMessage("");
    try {
      const result = await api<{ ok: boolean; alreadyVerified: boolean }>(
        `/partners/applications/${application.id}/resend-verification`,
        { method: "POST" }
      );
      if (result.alreadyVerified) {
        markVerified();
        setResendState("idle");
        return;
      }
      setResendState("sent");
    } catch (error) {
      setResendState("error");
      setResendMessage(
        error instanceof ApiError
          ? error.message
          : "We could not send the email. Please try again."
      );
    }
  }, [application?.id, markVerified, resendState]);

  if (!mounted) return null;

  if (!application) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          No application yet
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Once you add your store to Gawula, you can track your progress here.
        </p>
        <Button
          asChild
          variant="dark"
          size="lg"
          className="mt-6 rounded-full px-6"
        >
          <Link href="/partners/signup">Add your store</Link>
        </Button>
      </div>
    );
  }

  const currentIndex = application.waitlisted
    ? 0
    : partnerStageIndex(application.stage);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Your store application
      </h1>
      <p className="mt-4 text-base text-muted-foreground">
        Thanks, {application.firstName}. We have your application for{" "}
        {application.storeName}.
      </p>

      {!application.contactEmailVerified ? (
        <div className="mt-6 rounded-2xl bg-secondary p-5">
          <p className="text-base font-semibold">Confirm your email</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to {application.contactEmail}. Open it to
            verify your email so we can review your application and keep you
            updated.
          </p>
          {resendState === "sent" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Sent. Check {application.contactEmail} for the new link.
            </p>
          ) : (
            <Button
              variant="dark"
              size="sm"
              className="mt-4 rounded-full px-5"
              onClick={resend}
              disabled={resendState === "sending" || !application.id}
            >
              {resendState === "sending" ? "Sending…" : "Resend confirmation email"}
            </Button>
          )}
          {resendState === "error" ? (
            <p className="mt-3 text-sm text-destructive">{resendMessage}</p>
          ) : null}
        </div>
      ) : null}

      {application.waitlisted ? (
        <div className="mt-6 rounded-2xl bg-secondary p-5">
          <p className="text-base font-semibold">You are getting in early</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You are set to be the first store bringing Gawula to{" "}
            {application.areaLabel &&
            application.areaLabel !== "My area is not listed"
              ? application.areaLabel
              : "your area"}
            . That gives you a real head start. We will be in contact with you
            soon to get you setup, and your application will move straight into
            review.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border bg-card p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">Current status</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {PARTNER_STAGES[currentIndex]?.label}
          </h2>

          <ol className="mt-8 space-y-4">
            {PARTNER_STAGES.map((stage, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <li key={stage.id} className="flex items-center gap-4">
                  <div
                    className={cn(
                      "relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      done && "border-foreground bg-foreground text-background",
                      active && "border-foreground bg-background text-foreground",
                      !done &&
                        !active &&
                        "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold">{i + 1}</span>
                    )}
                    {active ? (
                      <span className="absolute inset-0 -z-0 animate-ping rounded-full border-2 border-foreground/40" />
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      !done && !active && "text-muted-foreground"
                    )}
                  >
                    {stage.label}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        We will keep {application.email} updated as your application moves
        forward.
      </p>
    </div>
  );
}
