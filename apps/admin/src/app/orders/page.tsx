"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders, ORDER_STATUSES, statusIndex } from "@/lib/orders-store";
import { BRANDS, getItem } from "@/lib/mock-data";
import { formatPrice, cn } from "@/lib/utils";

export default function OrdersPage() {
  const orders = useOrders((s) => s.orders);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (hydrated && orders.length === 0) {
    return (
      <div className="container max-w-2xl py-16 sm:py-24">
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
            No orders yet
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your past orders will show up here once you check out.
          </p>
          <Button asChild variant="dark" size="lg" className="mt-6">
            <Link href="/menu">Browse restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
        Your orders
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything you&apos;ve ordered through Tabletop.
      </p>

      <div className="mt-8 space-y-4">
        {orders.map((order) => {
          const created = new Date(order.createdAt);
          const brandIds = Array.from(
            new Set(
              order.lines
                .map((l) => getItem(l.itemId)?.brandId)
                .filter((b): b is string => Boolean(b))
            )
          );
          const brandNames = brandIds
            .map((id) => {
              const b = BRANDS.find((br) => br.id === id);
              return b?.name.split("—")[1]?.trim() ?? b?.name;
            })
            .filter(Boolean)
            .join(" · ");
          const sIdx = statusIndex(order.status);
          const isActive = order.status !== "delivered";
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="group block overflow-hidden rounded-2xl border bg-card transition-all hover:border-foreground/30 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.12em]",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {isActive ? (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      ) : null}
                      {ORDER_STATUSES[sIdx]?.label ?? "Received"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{order.id}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-base font-semibold">{brandNames}</h2>
                  <p className="text-xs text-muted-foreground">
                    {created.toLocaleString("en-ZA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {order.lines.reduce((s, l) => s + l.quantity, 0)} items
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold">
                    {formatPrice(order.total)}
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    View details →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
