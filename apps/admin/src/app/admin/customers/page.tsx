"use client";

import * as React from "react";
import { LuShoppingBag as ShoppingBag, LuUserCheck as UserCheck, LuUsers as Users, LuWallet as Wallet } from "react-icons/lu";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";
import { type AdminCustomer } from "../_lib/types";
import {
  ErrorState,
  PageHeading,
  Stat,
  StatRow,
  StatusBadge,
} from "../_components/ui";
import { DataTable } from "../_components/data-table";

const dateFmt = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" });
const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "No orders yet");

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function AdminCustomersPage() {
  const token = useAuth((store) => store.token);
  const { data: customers, error: loadError, refresh } = useApiData<AdminCustomer[]>("/admin/customers", {
    token,
    pollMs: 15000,
  });

  const activeCount = (customers ?? []).filter((customer) => customer.active).length;
  const lifetimeCents = (customers ?? []).reduce((sum, customer) => sum + customer.totalSpentCents, 0);
  const totalOrders = (customers ?? []).reduce((sum, customer) => sum + customer.totalOrders, 0);
  const averageOrders = customers?.length ? Math.round(totalOrders / customers.length) : 0;

  return (
    <main>
      <PageHeading title="Customers" />

      <StatRow>
        <Stat label="Total customers" value={customers ? String(customers.length) : "-"} icon={<Users />} />
        <Stat label="Active this month" value={customers ? String(activeCount) : "-"} icon={<UserCheck />} />
        <Stat label="Lifetime revenue" value={customers ? formatPrice(lifetimeCents) : "-"} icon={<Wallet />} />
        <Stat label="Average orders" value={customers ? String(averageOrders) : "-"} icon={<ShoppingBag />} />
      </StatRow>

      {loadError && !customers ? (
        <div className="mt-4">
          <ErrorState message={loadError} onRetry={refresh} />
        </div>
      ) : (
        <div className="mt-5">
          <DataTable
            rows={customers}
            getRowKey={(customer) => customer.id}
            minWidth="min-w-[760px]"
            emptyTitle="No customers yet"
            emptyFilteredTitle="No customers match your filters"
            initialSort={[{ id: "spent", dir: "desc" }]}
            columns={[
              {
                id: "customer",
                header: "Customer",
                sortable: true,
                sortAccessor: (c) => c.name ?? "Guest",
                filter: { type: "text", accessor: (c) => `${c.name ?? "Guest"} ${c.email}` },
                cell: (c) => <p className="font-medium">{c.name ?? "Guest"}</p>,
              },
              {
                id: "contact",
                header: "Contact",
                sortable: true,
                sortAccessor: (c) => c.email,
                filter: { type: "text", accessor: (c) => `${c.email} ${c.phone ?? ""}` },
                cell: (c) => (
                  <>
                    <p className="text-foreground">{c.email}</p>
                    {c.phone ? <p className="text-xs text-muted-foreground">{c.phone}</p> : null}
                  </>
                ),
              },
              {
                id: "status",
                header: "Status",
                sortable: true,
                sortAccessor: (c) => (c.active ? "Active" : "Inactive"),
                filter: {
                  type: "select",
                  options: STATUS_FILTER_OPTIONS,
                  match: (c, value) => (value === "active" ? c.active : !c.active),
                },
                cell: (c) => (
                  <StatusBadge tone={c.active ? "success" : "muted"} dot>
                    {c.active ? "Active" : "Inactive"}
                  </StatusBadge>
                ),
              },
              {
                id: "orders",
                header: "Orders",
                align: "right",
                headerClassName: "text-right",
                className: "text-right tabular-nums",
                sortable: true,
                sortAccessor: (c) => c.totalOrders,
                cell: (c) => c.totalOrders,
              },
              {
                id: "spent",
                header: "Total spent",
                align: "right",
                headerClassName: "text-right",
                className: "text-right font-medium tabular-nums",
                sortable: true,
                sortAccessor: (c) => c.totalSpentCents,
                cell: (c) => formatPrice(c.totalSpentCents),
              },
              {
                id: "lastOrder",
                header: "Last order",
                className: "whitespace-nowrap text-muted-foreground",
                sortable: true,
                sortAccessor: (c) => (c.lastOrderAt ? new Date(c.lastOrderAt).getTime() : 0),
                cell: (c) => formatDate(c.lastOrderAt),
              },
            ]}
          />
        </div>
      )}
    </main>
  );
}
