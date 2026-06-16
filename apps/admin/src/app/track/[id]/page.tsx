"use client";

import { use, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { connectRealtime, releaseRealtime } from "@/lib/realtime";
import { RoleGate } from "@/components/role-gate";
import { formatPrice } from "@/lib/utils";

type OrderDetail = {
  id: string;
  status: string;
  complexName: string;
  foodSubtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  tipCents: number;
  totalCents: number;
  paid: boolean;
  address: { line1: string; suburb: string | null; city: string };
  subOrders: {
    id: string;
    status: string;
    outletName: string;
    pickupCode: string;
    items: { name: string; qty: number }[];
  }[];
  trip: { status: string; riderName: string | null } | null;
};

type Notification = { orderId: string; message: string; at: string };

const STEPS: { id: string; label: string }[] = [
  { id: "received", label: "Order received" },
  { id: "preparing", label: "Kitchens preparing" },
  { id: "ready", label: "Ready for collection" },
  { id: "on_the_way", label: "On the way" },
  { id: "delivered", label: "Delivered" },
];

export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RoleGate role="customer" title="Sign in to track your order">
      <Tracker orderId={id} />
    </RoleGate>
  );
}

function Tracker({ orderId }: { orderId: string }) {
  const token = useAuth((s) => s.token);
  const { data: order, error, refresh } = useApiData<OrderDetail>(`/orders/${orderId}`, {
    token,
    pollMs: 20000,
  });
  const { data: notifications } = useApiData<Notification[]>("/notifications", {
    token,
    pollMs: 20000,
  });

  useEffect(() => {
    if (!token) return;
    const socket = connectRealtime(token);
    const onUpdate = (payload: { orderId: string }) => {
      if (payload?.orderId === orderId) refresh();
    };
    socket.on("customer.order.updated", onUpdate);
    return () => {
      socket.off("customer.order.updated", onUpdate);
      releaseRealtime();
    };
  }, [token, orderId, refresh]);

  if (error) {
    return <p className="container py-10 text-sm text-destructive">{error}</p>;
  }
  if (!order) {
    return <p className="container py-10 text-sm text-muted-foreground">Loading order...</p>;
  }

  const activeIndex = STEPS.findIndex((s) => s.id === order.status);
  const orderNotes = (notifications ?? []).filter((n) => n.orderId === orderId);

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="text-2xl font-semibold">Order #{order.id.slice(-5).toUpperCase()}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {order.complexName} to {order.address.suburb ?? order.address.city}
      </p>

      <div className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <ol className="grid gap-4">
          {STEPS.map((step, i) => {
            const done = i <= activeIndex;
            const current = i === activeIndex;
            return (
              <li key={step.id} className="flex items-center gap-3">
                <span
                  className={
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-medium " +
                    (done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")
                  }
                >
                  {i + 1}
                </span>
                <span className={current ? "font-semibold" : done ? "" : "text-muted-foreground"}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Your items</h2>
        <div className="mt-3 grid gap-4">
          {order.subOrders.map((sub) => (
            <div key={sub.id}>
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium">{sub.outletName}</p>
                <span className="text-xs text-muted-foreground">Code {sub.pickupCode}</span>
              </div>
              <ul className="mt-1 grid gap-0.5 text-sm text-muted-foreground">
                {sub.items.map((it, idx) => (
                  <li key={idx}>
                    {it.qty} &times; {it.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-1 border-t pt-3 text-sm">
          <Row label="Subtotal" value={formatPrice(order.foodSubtotalCents)} />
          <Row label="Delivery" value={formatPrice(order.deliveryFeeCents)} />
          <Row label="Service fee" value={formatPrice(order.serviceFeeCents)} />
          {order.tipCents > 0 && <Row label="Tip" value={formatPrice(order.tipCents)} />}
          <div className="mt-1 flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {orderNotes.length > 0 && (
        <div className="mt-5 rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Updates</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {orderNotes.map((n, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span>{n.message}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(n.at).toLocaleTimeString("en-ZA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
