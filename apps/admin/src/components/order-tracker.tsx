"use client";

import { useEffect } from "react";
import { LuShoppingBag, LuUtensils, LuBell, LuBike, LuHouse } from "react-icons/lu";
import { ORDER_STATUSES, OrderStatus, statusIndex, nextStatus, useOrders } from "@/lib/orders-store";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<string, React.ReactNode> = {
  received:     <LuShoppingBag className="h-4 w-4" />,
  preparing:    <LuUtensils className="h-4 w-4" />,
  ready:        <LuBell className="h-4 w-4" />,
  "on-the-way": <LuBike className="h-4 w-4" />,
  delivered:    <LuHouse className="h-4 w-4" />,
};

type Props = {
  orderId: string;
  status: OrderStatus;
  createdAt: number;
};

export function OrderTracker({ orderId, status }: Props) {
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
    <div>
      <h2 className="text-xl font-semibold">
        {ORDER_STATUSES[currentIndex]?.label ?? "Received"}
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {status === "delivered" ? "Your order has been delivered." : "Updating in real time."}
      </p>

      <ol className="mt-6 space-y-5">
        {ORDER_STATUSES.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step.id} className="relative flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                    (done || active) ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {STEP_ICONS[step.id]}
                  {active && status !== "delivered" && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  )}
                </div>
              </div>
              <p
                className={cn(
                  "text-sm font-semibold leading-none",
                  done && "text-primary",
                  active && "text-primary",
                  !done && !active && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
