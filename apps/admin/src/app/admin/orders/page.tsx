"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LuBan as Ban, LuBike as Bike, LuChevronDown as ChevronDown, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuChevronsUpDown as ChevronsUpDown, LuReceiptText as ReceiptText, LuWallet as Wallet } from "react-icons/lu";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { cn, formatPrice } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { type AdminOrder, STATUS_LABEL, STATUS_ORDER } from "../_lib/types";
import {
  ErrorState,
  PageHeading,
  Stat,
  StatRow,
  StatusBadge,
  TableShell,
  orderStatusTone,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "../_components/ui";

const PAGE_SIZE = 12;

type SortKey = "placedAt" | "customerName" | "complexName" | "status" | "riderName" | "paid" | "totalCents";
type SortDir = "asc" | "desc";
type SortCriterion = { key: SortKey; dir: SortDir };

type PaidFilter = "all" | "paid" | "pending";
type ColumnFilters = {
  order: string;
  customer: string;
  complex: string;
  rider: string;
  paid: PaidFilter;
};

const EMPTY_FILTERS: ColumnFilters = {
  order: "",
  customer: "",
  complex: "",
  rider: "",
  paid: "all",
};

const PAID_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] ?? s })),
];

const STATUS_RANK: Record<string, number> = Object.fromEntries(
  STATUS_ORDER.map((s, i) => [s, i])
);

export default function AdminOrdersPage() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const { data: orders, error, refresh } = useApiData<AdminOrder[]>("/admin/orders", {
    token,
    pollMs: 5000,
  });
  const [filters, setFilters] = React.useState<ColumnFilters>(EMPTY_FILTERS);
  const [status, setStatus] = React.useState("all");
  const [sorts, setSorts] = React.useState<SortCriterion[]>([
    { key: "placedAt", dir: "desc" },
  ]);
  const [page, setPage] = React.useState(1);

  const counts = React.useMemo(() => {
    const map: Record<string, number> = { all: orders?.length ?? 0 };
    for (const o of orders ?? []) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [orders]);

  const activeOrders = (orders ?? []).filter((order) => order.status !== "delivered" && order.status !== "cancelled");
  const unassignedOrders = activeOrders.filter((order) => !order.riderName).length;
  const orderRevenueCents = (orders ?? []).reduce((sum, order) => sum + order.totalCents, 0);

  const filtered = React.useMemo(() => {
    const f = {
      order: filters.order.trim().toLowerCase(),
      customer: filters.customer.trim().toLowerCase(),
      complex: filters.complex.trim().toLowerCase(),
      rider: filters.rider.trim().toLowerCase(),
    };
    const rows = (orders ?? []).filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (f.order) {
        const needle = f.order.replace(/^#/, "");
        const shortId = o.id.slice(-5).toLowerCase();
        if (!shortId.includes(needle) && !o.id.toLowerCase().includes(needle)) return false;
      }
      if (f.customer && !o.customerName.toLowerCase().includes(f.customer)) return false;
      if (f.complex && !o.complexName.toLowerCase().includes(f.complex)) return false;
      if (f.rider && !(o.riderName ?? "Unassigned").toLowerCase().includes(f.rider)) return false;
      if (filters.paid === "paid" && !o.paid) return false;
      if (filters.paid === "pending" && o.paid) return false;
      return true;
    });
    const compareByKey = (a: AdminOrder, b: AdminOrder, key: SortKey) => {
      switch (key) {
        case "totalCents":
          return a.totalCents - b.totalCents;
        case "status":
          return (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
        case "placedAt":
          return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
        case "paid":
          return Number(a.paid) - Number(b.paid);
        case "riderName":
          return (a.riderName ?? "Unassigned").localeCompare(b.riderName ?? "Unassigned");
        default:
          return a[key].localeCompare(b[key]);
      }
    };
    const active = sorts.length > 0 ? sorts : [{ key: "placedAt" as SortKey, dir: "desc" as SortDir }];
    return [...rows].sort((a, b) => {
      for (const { key, dir } of active) {
        const cmp = compareByKey(a, b, key);
        if (cmp !== 0) return cmp * (dir === "asc" ? 1 : -1);
      }
      return 0;
    });
  }, [orders, filters, status, sorts]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [filters, status, sorts]);

  const filtersActive =
    status !== "all" ||
    filters.paid !== "all" ||
    Boolean(filters.order || filters.customer || filters.complex || filters.rider);

  const toggleSort = (key: SortKey) =>
    setSorts((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (!existing) return [...prev, { key, dir: "desc" }];
      if (existing.dir === "desc") {
        return prev.map((s) => (s.key === key ? { key, dir: "asc" } : s));
      }
      return prev.filter((s) => s.key !== key);
    });

  const sortActive = sorts.length > 0;

  return (
    <main>
      <PageHeading title="Orders" />

      <StatRow>
        <Stat label="Active orders" value={orders ? String(activeOrders.length) : "-"} icon={<ReceiptText />} />
        <Stat label="Unassigned" value={orders ? String(unassignedOrders) : "-"} icon={<Bike />} />
        <Stat label="Cancelled" value={orders ? String(counts.cancelled ?? 0) : "-"} icon={<Ban />} />
        <Stat label="Revenue" value={orders ? formatPrice(orderRevenueCents) : "-"} icon={<Wallet />} />
      </StatRow>

      {error && !orders ? (
        <div className="mt-4">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      ) : (
        <>
          {filtersActive || sortActive ? (
            <div className="mb-2 flex min-h-5 items-center justify-end gap-4">
              {filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setStatus("all");
                    setFilters(EMPTY_FILTERS);
                  }}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear filters
                </button>
              ) : null}
              {sortActive ? (
                <button
                  type="button"
                  onClick={() => setSorts([])}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear sort
                </button>
              ) : null}
            </div>
          ) : null}
          <div>
            <TableShell minWidth="min-w-[820px]">
                <thead className={tableHeadClass}>
                  <tr>
                    <SortHeader label="Order" sortKey="placedAt" sorts={sorts} onSort={toggleSort} />
                    <SortHeader
                      label="Customer"
                      sortKey="customerName"
                      sorts={sorts}
                      onSort={toggleSort}
                    />
                    <SortHeader
                      label="Complex"
                      sortKey="complexName"
                      sorts={sorts}
                      onSort={toggleSort}
                    />
                    <SortHeader label="Status" sortKey="status" sorts={sorts} onSort={toggleSort} />
                    <SortHeader label="Rider" sortKey="riderName" sorts={sorts} onSort={toggleSort} />
                    <SortHeader label="Paid" sortKey="paid" sorts={sorts} onSort={toggleSort} />
                    <SortHeader
                      label="Total"
                      sortKey="totalCents"
                      sorts={sorts}
                      onSort={toggleSort}
                      align="right"
                    />
                  </tr>
                  <tr>
                    <th className="px-4 pb-3 align-top">
                      <FilterInput
                        label="Filter by order"
                        value={filters.order}
                        onChange={(v) => setFilters((s) => ({ ...s, order: v }))}
                      />
                    </th>
                    <th className="px-4 pb-3 align-top">
                      <FilterInput
                        label="Filter by customer"
                        value={filters.customer}
                        onChange={(v) => setFilters((s) => ({ ...s, customer: v }))}
                      />
                    </th>
                    <th className="px-4 pb-3 align-top">
                      <FilterInput
                        label="Filter by complex"
                        value={filters.complex}
                        onChange={(v) => setFilters((s) => ({ ...s, complex: v }))}
                      />
                    </th>
                    <th className="px-4 pb-3 align-top">
                      <Dropdown
                        ariaLabel="Filter by status"
                        value={status}
                        onSelect={setStatus}
                        options={STATUS_FILTER_OPTIONS}
                        radio
                        triggerClassName="h-8 w-full rounded-md px-2 text-xs font-normal"
                        listClassName="max-h-none overflow-visible"
                      />
                    </th>
                    <th className="px-4 pb-3 align-top">
                      <FilterInput
                        label="Filter by rider"
                        value={filters.rider}
                        onChange={(v) => setFilters((s) => ({ ...s, rider: v }))}
                      />
                    </th>
                    <th className="px-4 pb-3 align-top">
                      <Dropdown
                        ariaLabel="Filter by payment"
                        value={filters.paid}
                        onSelect={(v) => setFilters((s) => ({ ...s, paid: v as PaidFilter }))}
                        options={PAID_FILTER_OPTIONS}
                        radio
                        triggerClassName="h-8 w-full rounded-md px-2 text-xs font-normal"
                        listClassName="max-h-none overflow-visible"
                      />
                    </th>
                    <th className="px-4 pb-3 align-top" aria-hidden />
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
                          onClick={() => router.push(`/admin/orders/${o.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(`/admin/orders/${o.id}`);
                            }
                          }}
                          className={cn("cursor-pointer align-top outline-none focus-visible:bg-secondary/40", tableRowClass)}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium">
                            #{o.id.slice(-5).toUpperCase()}
                          </td>
                          <td className="px-4 py-3">{o.customerName}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {o.complexName}
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
                      <td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                        {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
                      </td>
                    </tr>
                  )}
                </tbody>
            </TableShell>
          </div>

          {orders && filtered.length > 0 ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {(safePage - 1) * PAGE_SIZE + 1}
                {" to "}
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
    </main>
  );
}

function FilterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      aria-label={label}
      placeholder="Filter"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full min-w-[80px] rounded-md border border-border bg-background px-2 text-xs font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
    />
  );
}

function SortHeader({
  label,
  sortKey,
  sorts,
  onSort,
  align,
}: {
  label: string;
  sortKey: SortKey;
  sorts: SortCriterion[];
  onSort: (key: SortKey) => void;
  align?: "right";
}) {
  const index = sorts.findIndex((s) => s.key === sortKey);
  const active = index >= 0;
  const dir = active ? sorts[index].dir : null;
  const showRank = active && sorts.length > 1;
  return (
    <th
      scope="col"
      className={cn("px-4 py-3 font-medium", align === "right" && "text-right")}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        title="Click to sort. Click again to reverse, once more to remove."
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
            className={cn("h-3.5 w-3.5 transition-transform", dir === "asc" && "rotate-180")}
          />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
        {showRank ? (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-secondary px-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {index + 1}
          </span>
        ) : null}
      </button>
    </th>
  );
}
