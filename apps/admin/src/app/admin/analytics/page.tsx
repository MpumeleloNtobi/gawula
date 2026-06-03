"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { type Analytics } from "../_lib/types";
import { ErrorState, PageHeading } from "../_components/ui";

export default function AdminAnalyticsPage() {
  const token = useAuth((s) => s.token);
  const {
    data: analytics,
    error: loadError,
    refresh,
  } = useApiData<Analytics>("/admin/analytics", { token, pollMs: 30000 });

  if (loadError && !analytics) {
    return (
      <main>
        <PageHeading title="Analytics" />
        <div className="mt-6">
          <ErrorState message={loadError} onRetry={refresh} />
        </div>
      </main>
    );
  }

  const topStores = analytics?.topStores ?? [];

  return (
    <main>
      <PageHeading title="Top stores this week" />

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">#</th>
                <th scope="col" className="px-4 py-3 font-medium">Store</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Orders</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {!analytics
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-10" /></td>
                      <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-16" /></td>
                    </tr>
                  ))
                : topStores.map((s, i) => (
                    <tr
                      key={s.name + i}
                      className="border-b border-border last:border-0 hover:bg-secondary/40"
                    >
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.orders}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                        {formatPrice(s.revenueCents)}
                      </td>
                    </tr>
                  ))}
              {analytics && topStores.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No store sales in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
