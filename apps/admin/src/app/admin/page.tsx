"use client";

import * as React from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuBike as Bike, LuClipboardList as ClipboardList, LuReceiptText as ReceiptText, LuWallet as Wallet } from "react-icons/lu";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PARTNER_STAGE_LABEL,
  STATUS_LABEL,
  type AdminOrder,
  type PartnerApplication,
  type RiderApplication,
} from "./_lib/types";
import {
  EmptyState,
  PageHeading,
  Stat,
  StatRow,
  StatusBadge,
  orderStatusTone,
  tableCellClass,
} from "./_components/ui";

const closedStatuses = new Set(["delivered", "cancelled"]);
const dateFmt = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" });
const formatDate = (iso: string) => dateFmt.format(new Date(iso));

export default function AdminOverviewPage() {
  const token = useAuth((store) => store.token);
  const { data: orders } = useApiData<AdminOrder[]>("/admin/orders", { token, pollMs: 5000 });
  const riders = useApiData<RiderApplication[]>("/admin/rider-applications", { token, pollMs: 10000 });
  const stores = useApiData<PartnerApplication[]>("/admin/partner-applications", { token, pollMs: 10000 });

  const activeOrders = (orders ?? []).filter((order) => !closedStatuses.has(order.status));
  const recentOrders = (orders ?? []).slice(0, 8);
  const revenueCents = (orders ?? []).reduce((sum, order) => sum + order.totalCents, 0);
  const pendingApplications = [
    ...(riders.data ?? []).filter((application) => application.stage === "submitted"),
    ...(stores.data ?? []).filter((application) => application.stage !== "live" && application.stage !== "rejected"),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const unassignedOrders = activeOrders.filter((order) => !order.riderName).length;

  return (
    <main>
      <PageHeading title="Overview" />

      <StatRow>
        <Stat label="Active orders" value={orders ? String(activeOrders.length) : "-"} icon={<ReceiptText />} />
        <Stat label="Pending applications" value={riders.data && stores.data ? String(pendingApplications.length) : "-"} icon={<ClipboardList />} />
        <Stat label="Unassigned orders" value={orders ? String(unassignedOrders) : "-"} icon={<Bike />} />
        <Stat label="Order revenue" value={orders ? formatPrice(revenueCents) : "-"} icon={<Wallet />} />
      </StatRow>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b-2 border-border/50 text-left text-sm text-muted-foreground">
                <tr>
                  <th scope="col" className="py-3 pl-0 pr-4 font-medium">Order</th>
                  <th scope="col" className={`${tableCellClass} font-medium`}>Customer</th>
                  <th scope="col" className={`${tableCellClass} font-medium`}>Complex</th>
                  <th scope="col" className={`${tableCellClass} font-medium`}>Status</th>
                  <th scope="col" className="py-3 pl-4 pr-0 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border/50">
                {!orders ? (
                  Array.from({ length: 5 }).map((_, index) => <OrderSkeleton key={index} />)
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-secondary/40">
                      <td className="whitespace-nowrap py-3 pl-0 pr-4 font-medium">
                        <Link href={`/admin/orders/${order.id}`} className="transition-colors hover:text-primary">
                          #{order.id.slice(-5).toUpperCase()}
                        </Link>
                      </td>
                      <td className={tableCellClass}>{order.customerName}</td>
                      <td className={`${tableCellClass} text-muted-foreground`}>{order.complexName}</td>
                      <td className={tableCellClass}>
                        <StatusBadge tone={orderStatusTone(order.status)} dot>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap py-3 pl-4 pr-0 text-right font-medium tabular-nums">
                        {formatPrice(order.totalCents)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10">
                      <EmptyState title="No orders yet" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="grid gap-3">
            {!riders.data || !stores.data ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)
            ) : pendingApplications.length > 0 ? (
              pendingApplications.slice(0, 6).map((application) => {
                const isRider = "vehicleType" in application;
                const name = isRider ? application.name : application.storeName;
                const status = isRider ? "Awaiting review" : PARTNER_STAGE_LABEL[application.stage];
                const href = isRider
                  ? `/admin/applications/riders/${application.id}`
                  : `/admin/applications/stores/${application.id}`;
                return (
                  <Link
                    key={`${isRider ? "rider" : "store"}-${application.id}`}
                    href={href}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-3 transition-colors hover:border-foreground/30"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {isRider ? "Rider" : "Store"}, {application.areaLabel}, {formatDate(application.createdAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground">
                      {status}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                );
              })
            ) : (
              <EmptyState title="No pending applications" />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function OrderSkeleton() {
  return (
    <tr>
      <td className="py-3 pl-0 pr-4"><Skeleton className="h-4 w-16" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="py-3 pl-4 pr-0"><Skeleton className="ml-auto h-4 w-14" /></td>
    </tr>
  );
}
