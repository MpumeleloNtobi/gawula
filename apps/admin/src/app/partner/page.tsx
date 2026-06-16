"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { RoleGate } from "@/components/role-gate";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PartnerSubOrder = {
  id: string;
  orderId: string;
  status: string;
  foodSubtotalCents: number;
  placedAt: string;
  customerName: string;
  addressLine: string;
  items: { id: string; name: string; qty: number; notes: string | null }[];
};

const NEXT_ACTION: Record<string, { next: string; label: string } | null> = {
  pending: { next: "accepted", label: "Accept order" },
  accepted: { next: "preparing", label: "Start preparing" },
  preparing: { next: "ready", label: "Mark ready" },
  ready: null,
  collected: null,
};

const STATUS_LABEL: Record<string, string> = {
  pending: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  collected: "Collected",
};

export default function PartnerPage() {
  return (
    <RoleGate role="partner" title="Store sign in">
      <PartnerBoard />
    </RoleGate>
  );
}

function PartnerBoard() {
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);
  const { data, error, refresh } = useApiData<PartnerSubOrder[]>("/partner/suborders", {
    token,
    pollMs: 4000,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function transition(sub: PartnerSubOrder, next: string) {
    setBusyId(sub.id);
    setActionError(null);
    try {
      await api(`/partner/suborders/${sub.id}/status`, {
        method: "PATCH",
        token,
        body: { status: next },
      });
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update order");
    } finally {
      setBusyId(null);
    }
  }

  const orders = data ?? [];

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kitchen orders</h1>
        <Button variant="ghost" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {actionError && <p className="mt-4 text-sm text-destructive">{actionError}</p>}

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No live orders right now.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((sub) => {
            const action = NEXT_ACTION[sub.status];
            return (
              <div key={sub.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    {STATUS_LABEL[sub.status] ?? sub.status}
                  </span>
                </div>
                <p className="mt-3 font-semibold">{sub.customerName}</p>
                <p className="text-xs text-muted-foreground">{sub.addressLine}</p>
                <ul className="mt-3 grid gap-1 text-sm">
                  {sub.items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-2">
                      <span>
                        {it.qty} &times; {it.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm font-medium">
                  <span>{formatPrice(sub.foodSubtotalCents)}</span>
                  {action && (
                    <Button
                      size="sm"
                      disabled={busyId === sub.id}
                      onClick={() => transition(sub, action.next)}
                    >
                      {busyId === sub.id ? "..." : action.label}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
