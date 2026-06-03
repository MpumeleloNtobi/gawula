"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { RoleGate } from "@/components/role-gate";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Complex = { id: string; name: string };
type Outlet = { id: string; name: string; tagline: string | null; locationInMall: string };
type Item = { id: string; name: string; description: string | null; priceCents: number };
type OutletMenu = { outlet: { id: string; name: string }; items: Item[] };

type DraftLine = {
  outletId: string;
  outletName: string;
  itemId: string;
  itemName: string;
  priceCents: number;
  qty: number;
};

export default function OrderPage() {
  return (
    <RoleGate role="customer" title="Sign in to order">
      <OrderFlow />
    </RoleGate>
  );
}

function OrderFlow() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const { data: complexes } = useApiData<Complex[]>("/complexes", { token });
  const complexId = complexes?.[0]?.id ?? null;
  const { data: outlets } = useApiData<Outlet[]>(
    complexId ? `/complexes/${complexId}/outlets` : null,
    { token },
  );

  const [draft, setDraft] = useState<DraftLine[]>([]);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => draft.reduce((sum, l) => sum + l.priceCents * l.qty, 0),
    [draft],
  );

  function addLine(outlet: Outlet, item: Item) {
    setDraft((prev) => {
      const existing = prev.find((l) => l.itemId === item.id);
      if (existing) {
        return prev.map((l) => (l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [
        ...prev,
        {
          outletId: outlet.id,
          outletName: outlet.name,
          itemId: item.id,
          itemName: item.name,
          priceCents: item.priceCents,
          qty: 1,
        },
      ];
    });
  }

  function changeQty(itemId: string, delta: number) {
    setDraft((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }

  async function placeOrder() {
    if (!complexId || draft.length === 0) return;
    setPlacing(true);
    setError(null);
    try {
      const order = await api<{ id: string }>("/orders", {
        method: "POST",
        token,
        body: {
          complexId,
          tipCents: 0,
          paymentMethod: "card",
          lines: draft.map((l) => ({ outletId: l.outletId, itemId: l.itemId, qty: l.qty })),
        },
      });
      await api(`/payments/${order.id}/confirm`, { method: "POST", token });
      router.push(`/track/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not place order");
      setPlacing(false);
    }
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold">Order from your favourites</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">
          {(outlets ?? []).map((outlet) => (
            <OutletBlock key={outlet.id} outlet={outlet} token={token} onAdd={addLine} />
          ))}
          {outlets && outlets.length === 0 && (
            <p className="text-sm text-muted-foreground">No stores available right now.</p>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Your cart</h2>
            {draft.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Add items from any store. One cart, one delivery.
              </p>
            ) : (
              <div className="mt-3 grid gap-3">
                {draft.map((l) => (
                  <div key={l.itemId} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.itemName}</p>
                      <p className="text-xs text-muted-foreground">{l.outletName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1">
                        <button
                          type="button"
                          className="h-5 w-5 text-base leading-none text-muted-foreground"
                          onClick={() => changeQty(l.itemId, -1)}
                          aria-label="Remove one"
                        >
                          &minus;
                        </button>
                        <span className="w-4 text-center text-xs font-medium">{l.qty}</span>
                        <button
                          type="button"
                          className="h-5 w-5 text-base leading-none text-muted-foreground"
                          onClick={() => changeQty(l.itemId, 1)}
                          aria-label="Add one"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-16 text-right font-medium">
                        {formatPrice(l.priceCents * l.qty)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t pt-3 text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Delivery and service fees are calculated at checkout.
                </p>
              </div>
            )}

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <Button
              className="mt-4 w-full"
              disabled={draft.length === 0 || placing}
              onClick={placeOrder}
            >
              {placing ? "Placing order..." : "Place order and pay"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function OutletBlock({
  outlet,
  token,
  onAdd,
}: {
  outlet: Outlet;
  token: string | null;
  onAdd: (outlet: Outlet, item: Item) => void;
}) {
  const { data } = useApiData<OutletMenu>(`/outlets/${outlet.id}/menu`, { token });
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{outlet.name}</h2>
        <span className="text-xs text-muted-foreground">{outlet.locationInMall}</span>
      </div>
      {outlet.tagline && <p className="text-sm text-muted-foreground">{outlet.tagline}</p>}
      <div className="mt-4 grid gap-2">
        {(data?.items ?? []).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-medium">{item.name}</p>
              {item.description && (
                <p className="truncate text-sm text-muted-foreground">{item.description}</p>
              )}
              <p className="mt-0.5 text-sm font-medium">{formatPrice(item.priceCents)}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onAdd(outlet, item)}>
              Add
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
