"use client";

import * as React from "react";
import { LuCalendarDays as CalendarDays, LuReceiptText as ReceiptText, LuTrendingUp as TrendingUp, LuWallet as Wallet } from "react-icons/lu";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { type Analytics } from "../_lib/types";
import {
  EmptyState,
  ErrorState,
  PageHeading,
  Panel,
  Stat,
  StatRow,
  StatBar,
  TableShell,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "../_components/ui";

const dayFmt = new Intl.DateTimeFormat("en-ZA", { weekday: "short", day: "numeric", month: "short" });
const formatDay = (day: string) => dayFmt.format(new Date(day));

export default function AdminAnalyticsPage() {
  const token = useAuth((store) => store.token);
  const { data: analytics, error: loadError, refresh } = useApiData<Analytics>("/admin/analytics", {
    token,
    pollMs: 30000,
  });

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
  const dailyRevenue = analytics?.dailyRevenue ?? [];
  const categoryBreakdown = analytics?.categoryBreakdown ?? [];
  const averageOrderCents = analytics && analytics.totalOrders > 0
    ? Math.round(analytics.revenueCents / analytics.totalOrders)
    : 0;
  const bestDay = dailyRevenue.reduce(
    (best, day) => (day.revenueCents > best.revenueCents ? day : best),
    { day: "", revenueCents: 0, orders: 0 },
  );
  const maxDailyRevenue = Math.max(1, ...dailyRevenue.map((day) => day.revenueCents));

  return (
    <main>
      <PageHeading title="Analytics" />

      <StatRow>
        <Stat label="Orders" value={analytics ? String(analytics.totalOrders) : "-"} icon={<ReceiptText />} />
        <Stat label="Revenue" value={analytics ? formatPrice(analytics.revenueCents) : "-"} icon={<Wallet />} />
        <Stat label="Average order" value={analytics ? formatPrice(averageOrderCents) : "-"} icon={<TrendingUp />} />
        <Stat label="Best day" value={bestDay.day ? formatDay(bestDay.day) : "-"} icon={<CalendarDays />} />
      </StatRow>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Revenue trend">
          <div className="grid gap-3">
            {!analytics ? (
              Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-7 rounded-full" />)
            ) : dailyRevenue.length > 0 ? (
              dailyRevenue.map((day) => (
                <StatBar
                  key={day.day}
                  label={formatDay(day.day)}
                  value={`${formatPrice(day.revenueCents)} (${day.orders})`}
                  pct={(day.revenueCents / maxDailyRevenue) * 100}
                />
              ))
            ) : (
              <EmptyState title="No revenue data yet" />
            )}
          </div>
        </Panel>

        <Panel title="Category mix">
          <div className="grid gap-3">
            {!analytics ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-7 rounded-full" />)
            ) : categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((category) => (
                <StatBar
                  key={category.name}
                  label={category.name}
                  value={formatPrice(category.cents)}
                  pct={category.pct}
                />
              ))
            ) : (
              <EmptyState title="No category sales yet" />
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Top stores">
          <TableShell minWidth="min-w-[560px]">
            <thead className={tableHeadClass}>
              <tr>
                <th scope="col" className={`${tableCellClass} font-medium`}>Rank</th>
                <th scope="col" className={`${tableCellClass} font-medium`}>Store</th>
                <th scope="col" className={`${tableCellClass} text-right font-medium`}>Orders</th>
                <th scope="col" className={`${tableCellClass} text-right font-medium`}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {!analytics ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-5" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-10" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-16" /></td>
                  </tr>
                ))
              ) : topStores.length > 0 ? (
                topStores.map((store, index) => (
                  <tr key={store.name + index} className={tableRowClass}>
                    <td className={`${tableCellClass} text-muted-foreground`}>{index + 1}</td>
                    <td className={`${tableCellClass} font-medium`}>{store.name}</td>
                    <td className={`${tableCellClass} text-right tabular-nums`}>{store.orders}</td>
                    <td className={`${tableCellClass} whitespace-nowrap text-right font-medium tabular-nums`}>
                      {formatPrice(store.revenueCents)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10">
                    <EmptyState title="No store sales in this period" />
                  </td>
                </tr>
              )}
            </tbody>
          </TableShell>
        </Panel>
      </div>
    </main>
  );
}
