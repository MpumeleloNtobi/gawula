"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import { ORDER_STATUSES, OrderStatus, statusIndex, nextStatus, useOrders } from "@/lib/orders-store";
import { cn } from "@/lib/utils";

type Props = {
  orderId: string;
  status: OrderStatus;
  createdAt: number;
};

export function OrderTracker({ orderId, status, createdAt }: Props) {
  const advance = useOrders((s) => s.advanceStatus);
  const currentIndex = statusIndex(status);

  useEffect(() => {
    const next = nextStatus(status);
    if (!next) return;
    const delays: Record<OrderStatus, number> = {
      received: 6000,
      preparing: 12000,
      ready: 8000,
      "on-the-way": 14000,
      delivered: 0,
    };
    const t = setTimeout(() => advance(orderId, next), delays[status]);
    return () => clearTimeout(t);
  }, [orderId, status, advance]);

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground">
            {status === "delivered" ? "Order complete" : "Live status"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            {ORDER_STATUSES[currentIndex]?.label ?? "Received"}
          </h2>
        </div>
      </div>

      <ol className="mt-8 space-y-4">
        {ORDER_STATUSES.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step.id} className="flex items-center gap-4">
              <div
                className={cn(
                  "relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  done && "border-foreground bg-foreground text-background",
                  active && "border-foreground bg-background text-foreground",
                  !done && !active && "border-border bg-background text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
                {active ? (
                  <span className="absolute inset-0 -z-0 animate-ping rounded-full border-2 border-foreground/40" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    !done && !active && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
              {active && status !== "delivered" ? (
                <span className="text-xs tracking-[0.18em] text-primary">
                  In progress
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
