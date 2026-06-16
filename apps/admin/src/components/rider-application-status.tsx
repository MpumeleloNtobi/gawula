"use client";

import * as React from "react";
import Link from "next/link";
import { LuCheck as Check } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  APPLICATION_STAGES,
  useRiderApplication,
} from "@/lib/rider-application-store";
import { useApiData } from "@/lib/use-api-data";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

type LiveStatus = {
  id: string;
  firstName: string;
  email: string;
  areaLabel: string;
  waitlisted: boolean;
  stage: "submitted" | "approved" | "rejected";
  rejectionReason: string | null;
};

export function RiderApplicationStatus() {
  const [mounted, setMounted] = React.useState(false);
  const application = useRiderApplication((s) => s.application);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const applicationId = application?.applicationId ?? null;
  const token = useAuth((s) => s.token);
  const refreshSession = useAuth((s) => s.refreshSession);
  const { data: live } = useApiData<LiveStatus>(
    applicationId ? `/riders/applications/${applicationId}` : null,
    { token, pollMs: 8000 }
  );

  const refreshedOnApproval = React.useRef(false);
  React.useEffect(() => {
    if (live?.stage === "approved" && !refreshedOnApproval.current) {
      refreshedOnApproval.current = true;
      void refreshSession();
    }
  }, [live?.stage, refreshSession]);

  if (!mounted) return null;

  if (!application) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          No application yet
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Once you apply to ride with Gawula, you can track your progress here.
        </p>
        <Button
          asChild
          variant="dark"
          size="lg"
          className="mt-6 rounded-full px-6"
        >
          <Link href="/riders/signup">Sign up to ride</Link>
        </Button>
      </div>
    );
  }

  const firstName = live?.firstName ?? application.firstName;
  const email = live?.email ?? application.email;
  const areaLabel = live?.areaLabel ?? application.areaLabel;
  const waitlisted = live?.waitlisted ?? application.waitlisted;
  const stage = live?.stage ?? "submitted";
  const approved = stage === "approved";
  const rejected = stage === "rejected";

  const currentIndex = approved
    ? APPLICATION_STAGES.length - 1
    : waitlisted
      ? 0
      : 0;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Your rider application
      </h1>
      <p className="mt-4 text-base text-muted-foreground">
        Thanks, {firstName}. We have your application for{" "}
        {areaLabel || "your area"}.
      </p>

      {approved ? (
        <div className="mt-6 rounded-2xl border border-border bg-secondary/50 p-6 sm:p-8">
          <p className="text-base font-semibold">You&apos;re approved to ride</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to Gawula. Head to your rider portal to go online and start
            accepting trips.
          </p>
          <Button
            asChild
            variant="dark"
            size="lg"
            className="mt-5 rounded-full px-6"
          >
            <Link href="/rider">Go to rider portal</Link>
          </Button>
        </div>
      ) : rejected ? (
        <div className="mt-6 rounded-2xl bg-secondary p-5">
          <p className="text-base font-semibold">
            We couldn&apos;t approve your application
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {live?.rejectionReason ||
              "Please reach out to our support team if you would like to know more."}
          </p>
        </div>
      ) : waitlisted ? (
        <div className="mt-6 rounded-2xl bg-secondary p-5">
          <p className="text-base font-semibold">You are on the waiting list</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Gawula is not live in your area yet. We will message {email} the
            moment we go live near you, and your application will move straight
            into review.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-border bg-secondary/50 p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">Current status</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {APPLICATION_STAGES[currentIndex]?.label}
          </h2>

          <ol className="mt-8 space-y-4">
            {APPLICATION_STAGES.map((stage, i) => {
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
        We will keep {email} updated as your application moves forward.
      </p>
    </div>
  );
}

