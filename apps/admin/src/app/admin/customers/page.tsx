"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type AdminCustomer } from "../_lib/types";
import { ErrorState, PageHeading, Stat, StatusBadge } from "../_components/ui";

const dateFmt = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" });
const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "No orders yet");

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminCustomersPage() {
  const token = useAuth((s) => s.token);
  const {
    data: customers,
    error: loadError,
    refresh,
  } = useApiData<AdminCustomer[]>("/admin/customers", { token, pollMs: 15000 });
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const list = customers ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      [c.name ?? "", c.email, c.phone ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [customers, query]);

  const activeCount = (customers ?? []).filter((c) => c.active).length;
  const lifetimeCents = (customers ?? []).reduce((s, c) => s + c.totalSpentCents, 0);
  const avgOrders = customers && customers.length
    ? Math.round(customers.reduce((s, c) => s + c.totalOrders, 0) / customers.length)
    : 0;

  return (
    <main>
      <PageHeading title="Customers" />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Total customers" value={customers ? String(customers.length) : "–"} />
        <Stat label="Active this month" value={customers ? String(activeCount) : "–"} />
        <Stat label="Lifetime revenue" value={customers ? formatPrice(lifetimeCents) : "–"} />
      </div>

      <div className="relative mt-4 w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or phone"
          className="h-10 rounded-full border-0 bg-secondary pl-10 pr-4 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-foreground/15"
        />
      </div>

      {loadError && !customers ? (
        <div className="mt-4">
          <ErrorState message={loadError} onRetry={refresh} />
        </div>
      ) : (
        <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-5 py-3 font-medium">Contact</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Orders</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Total spent</th>
                  <th scope="col" className="px-5 py-3 font-medium">Last order</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {!customers
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-5 py-3"><Skeleton className="h-8 w-40" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-4 w-36" /></td>
                        <td className="px-5 py-3"><Skeleton className="ml-auto h-4 w-8" /></td>
                        <td className="px-5 py-3"><Skeleton className="ml-auto h-4 w-16" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      </tr>
                    ))
                  : filtered.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border transition-colors last:border-0 hover:bg-secondary/40"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                              {initials(c.name, c.email)}
                            </div>
                            <p className="font-medium">{c.name ?? "Guest"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-foreground">{c.email}</p>
                          {c.phone ? <p className="text-xs text-muted-foreground">{c.phone}</p> : null}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums">{c.totalOrders}</td>
                        <td className="px-5 py-3 text-right font-medium tabular-nums">
                          {formatPrice(c.totalSpentCents)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                          {formatDate(c.lastOrderAt)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge tone={c.active ? "success" : "muted"} dot>
                            {c.active ? "Active" : "Inactive"}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                {customers && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      No customers match your search.
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
