"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { type Payout } from "../_lib/types";
import { EmptyState, ErrorState, PageHeading, StatusBadge, payoutStatusTone } from "../_components/ui";

const dateFmt = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" });
const formatDate = (iso: string) => dateFmt.format(new Date(iso));

const KIND_LABEL: Record<string, string> = {
  outlet: "Store payout",
  rider: "Rider payout",
  platform: "Platform",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
};

export default function AdminPayoutsPage() {
  const token = useAuth((s) => s.token);
  const {
    data: payouts,
    error: loadError,
    refresh,
  } = useApiData<Payout[]>("/admin/payouts", { token, pollMs: 30000 });

  return (
    <main>
      <PageHeading title="Payouts" />

      {loadError && !payouts ? (
        <div className="mt-6">
          <ErrorState message={loadError} onRetry={refresh} />
        </div>
      ) : (
        <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Run date</th>
                  <th scope="col" className="px-5 py-3 font-medium">Kind</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium" title="Number of payout line items in this run">Lines</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Amount</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {!payouts
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-5 py-3"><Skeleton className="ml-auto h-4 w-8" /></td>
                        <td className="px-5 py-3"><Skeleton className="ml-auto h-4 w-16" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      </tr>
                    ))
                  : payouts.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-5 py-3 font-medium">
                          {formatDate(p.runDate)}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {KIND_LABEL[p.kind] ?? p.kind}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums">{p.lineCount}</td>
                        <td className="px-5 py-3 text-right font-medium tabular-nums">
                          {formatPrice(p.totalCents)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge tone={payoutStatusTone(p.status)} dot>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                {payouts && payouts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10">
                      <EmptyState
                        title="No payout runs yet"
                        description="Runs will appear here once the first store or rider payout has been settled."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
