"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { LuChevronDown as ChevronDown } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { OrderTracker } from "@/components/order-tracker";
import { cartFulfillmentContext } from "@/lib/cart-store";
import { useOrders } from "@/lib/orders-store";
import { BRANDS, getItem } from "@/lib/mock-data";
import { StoreLogo } from "@/components/store-logo";
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
      <div className="container max-w-3xl pt-16 pb-28 md:py-16">
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading order…
        </div>
      </div>
    );
  }

  const created = new Date(order.createdAt);
  const fulfillment = cartFulfillmentContext(order.lines);
  const grouped = new Map<string, typeof order.lines>();
  for (const line of order.lines) {
    const item = getItem(line.itemId);
    if (!item) continue;
    const arr = grouped.get(item.brandId) ?? [];
    arr.push(line);
    grouped.set(item.brandId, arr);
  }

  return (
    <div className="container max-w-5xl pt-8 pb-28 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Placed{" "}
          {created.toLocaleString("en-ZA", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <OrderTracker
            orderId={order.id}
            status={order.status}
            createdAt={order.createdAt}
          />

          <section className="space-y-1">
            <h2 className="text-xl font-semibold">Order</h2>
            <div className="divide-y divide-border/60">
              {Array.from(grouped.entries()).map(([brandId, brandLines]) => {
                const brand = BRANDS.find((b) => b.id === brandId);
                if (!brand) return null;
                const displayName = brand.name.split("\u2014")[1]?.trim() ?? brand.name;
                return (
                  <OrderStoreAccordion
                    key={brandId}
                    brand={brand}
                    displayName={displayName}
                    brandLines={brandLines}
                  />
                );
              })}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-secondary p-5">
            <h2 className="text-base font-semibold">Receipt</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              <Row label="Delivery" value={formatPrice(order.deliveryFee)} />
              <Row label="Service fee" value={formatPrice(order.serviceFee)} />
              {order.tipCents > 0 ? (
                <Row label="Tip" value={formatPrice(order.tipCents)} />
              ) : null}
            </dl>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total paid</span>
              <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
            </div>
            <Button asChild variant="dark" size="lg" className="mt-5 w-full rounded-full">
              <Link href="/menu">Order again</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
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

function OrderStoreAccordion({
  brand,
  displayName,
  brandLines,
}: {
  brand: (typeof import("@/lib/mock-data").BRANDS)[number];
  displayName: string;
  brandLines: { lineId: string; itemId: string; quantity: number; unitPrice: number; modifiers: { name: string }[] }[];
}) {
  const [open, setOpen] = useState(false);
  const brandItemCount = brandLines.reduce((s, l) => s + l.quantity, 0);
  const brandTotal = brandLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const initials = displayName.split(/\s+/).filter((p) => p !== "&").slice(0, 2).map((p) => p[0]).join("");
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <StoreLogo
          name={displayName}
          initials={initials}
          color={brand.logoColor}
          logoUrl={brand.logoUrl}
          className="h-10 w-10 rounded-full text-xs"
          noBorder
        />
        <span className="flex-1 text-sm">{displayName}</span>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{brandItemCount}</span>
        <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">{formatPrice(brandTotal)}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="pb-3 pl-[52px] pr-7">
          {brandLines.map((line) => {
            const item = getItem(line.itemId);
            if (!item) return null;
            return (
              <li key={line.lineId} className="flex items-baseline gap-3 py-1.5">
                <span className="min-w-0 flex-1 text-sm">{item.name}</span>
                {line.modifiers.length > 0 ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {line.modifiers.map((m) => m.name).join(" · ")}
                  </span>
                ) : null}
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{line.quantity}</span>
                <span className="w-16 shrink-0 text-right text-sm tabular-nums">
                  {formatPrice(line.unitPrice * line.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
