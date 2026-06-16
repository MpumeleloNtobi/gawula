"use client";

import * as React from "react";
import { LuShieldCheck as ShieldCheck, LuUserRound as UserRound } from "react-icons/lu";
import { useAuth } from "@/lib/auth-store";
import { PageHeading, Panel, StatusBadge } from "../_components/ui";

export default function AdminSettingsPage() {
  const principal = useAuth((store) => store.principal);

  const accountRows: { label: string; value: string }[] = [
    { label: "Name", value: principal?.name ?? "Administrator" },
    { label: "Email", value: principal?.email ?? "-" },
    { label: "Role", value: "Admin" },
  ];

  const accessRows: { label: string; value: string }[] = [
    { label: "Authentication", value: principal ? "Signed in" : "Not signed in" },
    { label: "Email verified", value: principal?.emailVerified ? "Verified" : "Not verified" },
    { label: "Console access", value: "Full operations" },
  ];

  return (
    <main>
      <PageHeading title="Settings" />

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Account">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">{principal?.name ?? "Administrator"}</p>
              <p className="truncate text-sm text-muted-foreground">{principal?.email ?? "No email on session"}</p>
              <div className="mt-4 grid gap-3">
                {accountRows.map((row) => (
                  <Detail key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Access">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold">Operations role</p>
                <StatusBadge tone={principal?.emailVerified ? "success" : "warning"} dot>
                  {principal?.emailVerified ? "Verified" : "Needs verification"}
                </StatusBadge>
              </div>
              <div className="mt-4 grid gap-3">
                {accessRows.map((row) => (
                  <Detail key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-t border-border pt-3 text-sm first:border-t-0 first:pt-0">
      <p className="text-muted-foreground">{label}</p>
      <p className="min-w-0 truncate font-medium">{value}</p>
    </div>
  );
}
