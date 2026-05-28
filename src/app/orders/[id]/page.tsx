"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { MapPin, Clock, CreditCard, Wallet, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderTracker } from "@/components/order-tracker";
import { useOrders } from "@/lib/orders-store";
import { BRANDS, getItem } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const orders = useOrders((s) => s.orders);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const order = orders.find((o) => o.id === id);

  if (hydrated && !order) notFound();
  if (!order) {
    return (
      <div className="container max-w-3xl py-16">
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading order…
        </div>
      </div>
    );
  }

  const created = new Date(order.createdAt);
  const grouped = new Map<string, typeof order.lines>();
  for (const line of order.lines) {
    const item = getItem(line.itemId);
    if (!item) continue;
    const arr = grouped.get(item.brandId) ?? [];
    arr.push(line);
    grouped.set(item.brandId, arr);
  }

  return (
    <div className="container max-w-5xl py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground">
            Order #{order.id}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Thanks, {order.contactName.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed{" "}
            {created.toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/orders">View all orders</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <OrderTracker
            orderId={order.id}
            status={order.status}
            createdAt={order.createdAt}
          />

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
              Delivery details
            </h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={order.address}
              />
              <DetailRow
                icon={<Phone className="h-4 w-4" />}
                label="Contact"
                value={`${order.contactName} · ${order.contactPhone}`}
              />
              <DetailRow
                icon={
                  order.paymentMethod === "card" ? (
                    <CreditCard className="h-4 w-4" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )
                }
                label="Payment"
                value={order.paymentMethod === "card" ? "Card" : "Cash on delivery"}
              />
              <DetailRow
                icon={<Clock className="h-4 w-4" />}
                label="Placed"
                value={created.toLocaleString("en-ZA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-5 py-4 text-sm font-semibold tracking-[0.18em] text-muted-foreground">
              Items
            </div>
            <div className="divide-y">
              {Array.from(grouped.entries()).map(([brandId, brandLines]) => {
                const brand = BRANDS.find((b) => b.id === brandId);
                if (!brand) return null;
                const displayName = brand.name.split("—")[1]?.trim() ?? brand.name;
                return (
                  <div key={brandId} className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: brand.logoColor }}
                        aria-hidden
                      >
                        {displayName.charAt(0)}
                      </span>
                      <span className="text-sm font-semibold">{displayName}</span>
                    </div>
                    <ul className="space-y-3">
                      {brandLines.map((line) => {
                        const item = getItem(line.itemId);
                        if (!item) return null;
                        return (
                          <li key={line.lineId} className="flex gap-3 text-sm">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-3">
                                <span className="truncate font-medium">
                                  {line.quantity} × {item.name}
                                </span>
                                <span className="font-medium">
                                  {formatPrice(line.unitPrice * line.quantity)}
                                </span>
                              </div>
                              {line.modifiers.length > 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  {line.modifiers.map((m) => m.name).join(" · ")}
                                </p>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
              Receipt
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              <Row label="Delivery" value={formatPrice(order.deliveryFee)} />
              <Row label="Service fee" value={formatPrice(order.serviceFee)} />
              {order.tipCents > 0 ? (
                <Row label="Tip" value={formatPrice(order.tipCents)} />
              ) : null}
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="text-sm font-semibold">Total paid</span>
              <span className="text-lg font-semibold">{formatPrice(order.total)}</span>
            </div>
            <Button asChild variant="dark" className="mt-5 w-full">
              <Link href="/menu">Order again</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
