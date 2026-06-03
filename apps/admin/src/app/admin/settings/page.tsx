"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-store";
import { PageHeading } from "../_components/ui";

export default function AdminSettingsPage() {
  const principal = useAuth((s) => s.principal);

  const rows: { label: string; value: string }[] = [
    { label: "Name", value: principal?.name ?? "Administrator" },
    { label: "Email", value: principal?.email ?? "–" },
    { label: "Role", value: "Admin" },
    { label: "Email verified", value: principal?.emailVerified ? "Yes" : "Not verified" },
  ];

  return (
    <main>
      <PageHeading title="Settings" />

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Field</th>
                <th scope="col" className="px-4 py-3 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{r.label}</td>
                  <td className="px-4 py-3 font-medium">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
