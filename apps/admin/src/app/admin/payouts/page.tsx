"use client";

import * as React from "react";
import { LuTriangleAlert as AlertTriangle, LuClock as Clock, LuListChecks as ListChecks, LuWallet as Wallet } from "react-icons/lu";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { type Payout } from "../_lib/types";
import {
  EmptyState,
  ErrorState,
  PageHeading,
  Panel,
  Stat,
  StatRow,
  StatusBadge,
  payoutStatusTone,
} from "../_components/ui";
import { DataTable } from "../_components/data-table";

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

const KIND_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label })),
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

export default function AdminPayoutsPage() {
  const token = useAuth((store) => store.token);
  const { data: payouts, error: loadError, refresh } = useApiData<Payout[]>("/admin/payouts", {
    token,
    pollMs: 30000,
  });

  const pending = (payouts ?? []).filter((payout) => payout.status === "pending");
  const failed = (payouts ?? []).filter((payout) => payout.status === "failed");
  const paidTotalCents = (payouts ?? [])
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + payout.totalCents, 0);
  const pendingTotalCents = pending.reduce((sum, payout) => sum + payout.totalCents, 0);

  return (
    <main>
      <PageHeading title="Payouts" />

      <StatRow>
        <Stat label="Paid total" value={payouts ? formatPrice(paidTotalCents) : "-"} icon={<Wallet />} />
        <Stat label="Pending total" value={payouts ? formatPrice(pendingTotalCents) : "-"} icon={<Clock />} />
        <Stat label="Pending runs" value={payouts ? String(pending.length) : "-"} icon={<ListChecks />} />
        <Stat label="Failed runs" value={payouts ? String(failed.length) : "-"} icon={<AlertTriangle />} />
      </StatRow>

      {loadError && !payouts ? (
        <div className="mt-6">
          <ErrorState message={loadError} onRetry={refresh} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_18rem]">
          <Panel title="Settlement runs">
            <DataTable
              rows={payouts}
              getRowKey={(payout) => payout.id}
              minWidth="min-w-[680px]"
              emptyTitle="No payout runs yet"
              emptyFilteredTitle="No payout runs match your filters"
              initialSort={[{ id: "runDate", dir: "desc" }]}
              columns={[
                {
                  id: "runDate",
                  header: "Run date",
                  className: "whitespace-nowrap font-medium",
                  sortable: true,
                  sortAccessor: (p) => new Date(p.runDate).getTime(),
                  cell: (p) => formatDate(p.runDate),
                },
                {
                  id: "kind",
                  header: "Kind",
                  className: "text-muted-foreground",
                  sortable: true,
                  sortAccessor: (p) => KIND_LABEL[p.kind] ?? p.kind,
                  filter: {
                    type: "select",
                    options: KIND_FILTER_OPTIONS,
                    match: (p, value) => p.kind === value,
                  },
                  cell: (p) => KIND_LABEL[p.kind] ?? p.kind,
                },
                {
                  id: "lines",
                  header: "Lines",
                  align: "right",
                  headerClassName: "text-right",
                  className: "text-right tabular-nums",
                  sortable: true,
                  sortAccessor: (p) => p.lineCount,
                  cell: (p) => p.lineCount,
                },
                {
                  id: "amount",
                  header: "Amount",
                  align: "right",
                  headerClassName: "text-right",
                  className: "whitespace-nowrap text-right font-medium tabular-nums",
                  sortable: true,
                  sortAccessor: (p) => p.totalCents,
                  cell: (p) => formatPrice(p.totalCents),
                },
                {
                  id: "status",
                  header: "Status",
                  sortable: true,
                  sortAccessor: (p) => STATUS_LABEL[p.status] ?? p.status,
                  filter: {
                    type: "select",
                    options: STATUS_FILTER_OPTIONS,
                    match: (p, value) => p.status === value,
                  },
                  cell: (p) => (
                    <StatusBadge tone={payoutStatusTone(p.status)} dot>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </StatusBadge>
                  ),
                },
              ]}
            />
          </Panel>

          <Panel title="Attention needed">
            <div className="grid gap-3">
              {!payouts ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)
              ) : failed.length > 0 || pending.length > 0 ? (
                [...failed, ...pending].slice(0, 5).map((payout) => (
                  <div key={payout.id} className="rounded-xl border border-border px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{KIND_LABEL[payout.kind] ?? payout.kind}</p>
                      <StatusBadge tone={payoutStatusTone(payout.status)}>{STATUS_LABEL[payout.status] ?? payout.status}</StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(payout.runDate)}, {payout.lineCount} lines, {formatPrice(payout.totalCents)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState title="No payout issues" />
              )}
            </div>
          </Panel>
        </div>
      )}
    </main>
  );
}
