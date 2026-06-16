"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOrders, ORDER_STATUSES, statusIndex } from "@/lib/orders-store";
import { BRANDS, getItem } from "@/lib/mock-data";
import { StoreLogo } from "@/components/store-logo";
import { formatPrice, cn } from "@/lib/utils";

export default function OrdersPage() {
  const orders = useOrders((s) => s.orders);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (hydrated && orders.length === 0) {
    return (
      <div className="container max-w-2xl py-24 text-center text-sm text-muted-foreground">
        No orders yet
      </div>
    );
  }

  return (
    <div className="container max-w-3xl pt-8 pb-28 md:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">Your orders</h1>

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
          const brandsForOrder = brandIds
            .map((id) => BRANDS.find((br) => br.id === id))
            .filter((b): b is (typeof BRANDS)[number] => Boolean(b));
          const sIdx = statusIndex(order.status);
          const isActive = order.status !== "delivered";

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="group block rounded-2xl bg-secondary p-5 transition-opacity hover:opacity-80"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-2">
                  {brandsForOrder.map((brand) => {
                    const displayName = brand.name.split("—")[1]?.trim() ?? brand.name;
                    const initials = displayName
                      .split(/\s+/)
                      .filter((p) => p !== "&")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("");
                    return (
                      <StoreLogo
                        key={brand.id}
                        name={displayName}
                        initials={initials}
                        color={brand.logoColor}
                        logoUrl={brand.logoUrl}
                        className="h-10 w-10 rounded-full text-xs"
                      />
                    );
                  })}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-background text-muted-foreground"
                  )}
                >
                  {ORDER_STATUSES[sIdx]?.label ?? "Received"}
                </span>
              </div>

              <div className="mt-3">
                <p className="mt-1 text-xs text-muted-foreground">
                  {created.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
