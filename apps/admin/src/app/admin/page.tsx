"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { type AdminOrder, STATUS_LABEL } from "./_lib/types";
import { PageHeading, StatusBadge, orderStatusTone } from "./_components/ui";

export default function AdminOverviewPage() {
  const token = useAuth((s) => s.token);
  const { data: orders } = useApiData<AdminOrder[]>("/admin/orders", { token, pollMs: 5000 });
  const recent = (orders ?? []).slice(0, 8);

  return (
    <main>
      <PageHeading title="Overview" />

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Order</th>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {!orders
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-14" /></td>
                    </tr>
                  ))
                : recent.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-secondary/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        #{o.id.slice(-5).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">{o.customerName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={orderStatusTone(o.status)} dot>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                        {formatPrice(o.totalCents)}
                      </td>
                    </tr>
                  ))}
              {orders && orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No orders yet.
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
