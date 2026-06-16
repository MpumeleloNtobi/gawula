"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuInbox as Inbox, LuNavigation as Navigation, LuClock as Clock } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { AvailableOrders } from "./_available";
import { ActiveDeliveries } from "./_active";
import { OrdersHistory } from "./_history";

type Tab = "queue" | "active" | "history";

const TABS: { id: Tab; label: string; Icon: typeof Inbox }[] = [
  { id: "queue", label: "Queue", Icon: Inbox },
  { id: "active", label: "Active", Icon: Navigation },
  { id: "history", label: "History", Icon: Clock },
];

function OrdersTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = raw === "active" || raw === "history" ? raw : "queue";

  const setTab = useCallback(
    (next: Tab) => {
      router.replace(`/rider/orders?tab=${next}`, { scroll: false });
    },
    [router],
  );

  return (
    <div className="container pb-24 pt-6 md:py-10">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <div role="tablist" aria-label="Orders" className="mt-6 flex gap-6">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 text-[15px] transition-colors",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <t.Icon className="h-[18px] w-[18px]" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {tab === "queue" ? (
          <AvailableOrders onClaimed={() => setTab("active")} />
        ) : tab === "active" ? (
          <ActiveDeliveries onBrowse={() => setTab("queue")} />
        ) : (
          <OrdersHistory />
        )}
      </div>
    </div>
  );
}

export default function RiderOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="container pb-24 pt-6 md:py-10">
          <h1 className="text-2xl font-semibold">Orders</h1>
        </div>
      }
    >
      <OrdersTabs />
    </Suspense>
  );
}
