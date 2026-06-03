"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { cn, formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type AdminOrder, STATUS_LABEL, STATUS_ORDER } from "../_lib/types";
import { ErrorState, PageHeading, StatusBadge, orderStatusTone } from "../_components/ui";
import { OrderDetailDrawer } from "../_components/order-detail-drawer";

const FILTERS = ["all", ...STATUS_ORDER];
const PAGE_SIZE = 12;

type SortKey = "placedAt" | "customerName" | "complexName" | "status" | "totalCents";

const STATUS_RANK: Record<string, number> = Object.fromEntries(
  STATUS_ORDER.map((s, i) => [s, i])
);

export default function AdminOrdersPage() {
  const token = useAuth((s) => s.token);
  const { data: orders, error, refresh } = useApiData<AdminOrder[]>("/admin/orders", {
    token,
    pollMs: 5000,
  });
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "placedAt",
    dir: "desc",
  });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<AdminOrder | null>(null);

  const counts = React.useMemo(() => {
    const map: Record<string, number> = { all: orders?.length ?? 0 };
    for (const o of orders ?? []) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [orders]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = (orders ?? []).filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.complexName.toLowerCase().includes(q) ||
        (o.riderName ?? "").toLowerCase().includes(q)
      );
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "totalCents":
          cmp = a.totalCents - b.totalCents;
          break;
        case "status":
          cmp = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
          break;
        case "placedAt":
          cmp = new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
          break;
        default:
          cmp = a[sort.key].localeCompare(b[sort.key]);
      }
      return cmp * dir;
    });
  }, [orders, query, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [query, status, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );

  return (
    <main>
      <PageHeading title="Orders" />

      <div className="mt-6 flex flex-col gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order, customer, complex or rider"
            className="h-10 rounded-full border-0 bg-secondary pl-10 pr-4 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-foreground/15"
          />
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatus(f)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                status === f
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" ? "All" : STATUS_LABEL[f] ?? f}
              <span className={cn(status === f ? "text-background/80" : "text-foreground")}>
                {counts[f] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && !orders ? (
        <div className="mt-4">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <SortHeader label="Order" sortKey="placedAt" sort={sort} onSort={toggleSort} />
                    <SortHeader
                      label="Customer"
                      sortKey="customerName"
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <SortHeader
                      label="Complex"
                      sortKey="complexName"
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <SortHeader label="Status" sortKey="status" sort={sort} onSort={toggleSort} />
                    <th scope="col" className="px-4 py-3 font-medium">Rider</th>
                    <th scope="col" className="px-4 py-3 font-medium">Paid</th>
                    <SortHeader
                      label="Total"
                      sortKey="totalCents"
                      sort={sort}
                      onSort={toggleSort}
                      align="right"
                    />
                  </tr>
                </thead>
                <tbody>
                  {!orders
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                          <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-14" /></td>
                        </tr>
                      ))
                    : pageRows.map((o) => (
                        <tr
                          key={o.id}
                          tabIndex={0}
                          role="button"
                          aria-label={`View order #${o.id.slice(-5).toUpperCase()}`}
                          onClick={() => setSelected(o)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelected(o);
                            }
                          }}
                          className="cursor-pointer border-b border-border outline-none transition-colors last:border-0 hover:bg-secondary/40 focus-visible:bg-secondary/40"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium">
                            #{o.id.slice(-5).toUpperCase()}
                          </td>
                          <td className="px-4 py-3">{o.customerName}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {o.complexName}
                            {o.outletCount > 1 ? ` · ${o.outletCount} stores` : ""}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge tone={orderStatusTone(o.status)} dot>
                              {STATUS_LABEL[o.status] ?? o.status}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {o.riderName ?? "Unassigned"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge tone={o.paid ? "success" : "muted"}>
                              {o.paid ? "Paid" : "Pending"}
                            </StatusBadge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                            {formatPrice(o.totalCents)}
                          </td>
                        </tr>
                      ))}
                  {orders && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {orders && filtered.length > 0 ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {(safePage - 1) * PAGE_SIZE + 1}
                {"\u2013"}
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              {pageCount > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:bg-secondary disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {safePage} / {pageCount}
                  </span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={safePage >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:bg-secondary disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <OrderDetailDrawer order={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
  align?: "right";
}) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      className={cn("px-4 py-3 font-medium", align === "right" && "text-right")}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active && "text-foreground"
        )}
      >
        {label}
        {active ? (
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", sort.dir === "asc" && "rotate-180")}
          />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
    </th>
  );
}
