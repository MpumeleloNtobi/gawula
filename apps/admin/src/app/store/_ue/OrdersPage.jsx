"use client";
import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuInbox as Inbox, LuNavigation as Navigation, LuClock as Clock } from "react-icons/lu";
import { OrderRow } from "../_ue/OrderRow";
import { useOrders } from "../_ue/OrdersContext";
import { fmt } from "../_ue/data";

const dayFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayLabel(date) {
  const diff = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86_400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return dayFormatter.format(date);
}

function groupByDay(orders) {
  const groups = new Map();
  for (const o of orders) {
    const parsed = o.placedAt ? new Date(o.placedAt) : null;
    const valid = parsed && !Number.isNaN(parsed.getTime());
    const key = valid
      ? `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`
      : "undated";
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: valid ? dayLabel(parsed) : "Earlier",
        sortValue: valid ? startOfDay(parsed).getTime() : 0,
        orders: [],
        total: 0,
      };
      groups.set(key, group);
    }
    group.orders.push(o);
    group.total += o.total ?? 0;
  }
  return Array.from(groups.values()).sort((a, b) => b.sortValue - a.sortValue);
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersView />
    </Suspense>
  );
}

function OrdersView() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab = raw === "active" || raw === "past" ? raw : "queue";
  const setTab = useCallback(
    (next) => {
      router.replace(`/store/orders?tab=${next}`, { scroll: false });
    },
    [router],
  );
  const { active, past, loading, error, acceptOrder } = useOrders();
  const [accepting, setAccepting] = useState(false);
  const queue = active.filter((o) => o.status === "new");
  const inProgress = active.filter((o) => o.status !== "new");
  const list = tab === "queue" ? queue : tab === "active" ? inProgress : past;
  const groups = groupByDay(list);
  const nextOrder = queue[0];

  const takeNext = async () => {
    if (!nextOrder || accepting) return;
    setAccepting(true);
    try {
      await acceptOrder(nextOrder.id);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Orders</h1>
        </div>
      </div>
      {error && (
        <div role="alert" aria-live="polite" className="card" style={{ padding: 18, color: "var(--red)", marginBottom: 14 }}>
          {error}
        </div>
      )}
      <div role="tablist" aria-label="Orders" className="flex gap-6">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "queue"}
          onClick={() => setTab("queue")}
          className={`flex items-center gap-2 text-[15px] transition-colors ${
            tab === "queue" ? "font-medium text-foreground" : "text-muted-foreground"
          }`}
        >
          <Inbox className="h-[18px] w-[18px]" aria-hidden />
          Queue
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "active"}
          onClick={() => setTab("active")}
          className={`flex items-center gap-2 text-[15px] transition-colors ${
            tab === "active" ? "font-medium text-foreground" : "text-muted-foreground"
          }`}
        >
          <Navigation className="h-[18px] w-[18px]" aria-hidden />
          Active
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "past"}
          onClick={() => setTab("past")}
          className={`flex items-center gap-2 text-[15px] transition-colors ${
            tab === "past" ? "font-medium text-foreground" : "text-muted-foreground"
          }`}
        >
          <Clock className="h-[18px] w-[18px]" aria-hidden />
          History
        </button>
      </div>
      <div className="stagger mt-8" key={tab}>
        {loading && list.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading orders…
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {tab === "queue"
              ? "No new orders right now"
              : tab === "active"
                ? "No active orders right now"
                : "No past orders yet"}
          </div>
        ) : tab === "queue" ? (
          <div className="flex flex-col items-center text-center">
            <span className="text-8xl font-bold leading-none tracking-tight">{queue.length}</span>
            <button
              type="button"
              className="btn btn-primary mt-10 w-full"
              style={{ borderRadius: 999, justifyContent: "center", padding: "13px 17px", fontSize: 15 }}
              disabled={accepting || !nextOrder}
              onClick={takeNext}
            >
              {accepting ? "Accepting…" : "Accept"}
            </button>
          </div>
        ) : tab === "past" ? (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="text-base font-semibold text-foreground">{group.label}</p>
                <div className="orders-list mt-2">
                  {group.orders.map((o) => (
                    <OrderRow key={o.id} o={o} onAccept={acceptOrder} history />
                  ))}
                </div>
                <div className="mt-2 flex justify-end border-t border-border pt-2">
                  <p className="text-sm font-semibold text-foreground">{fmt(group.total)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="orders-list">
            {list.map((o) => <OrderRow key={o.id} o={o} onAccept={acceptOrder} />)}
          </div>
        )}
      </div>
    </>
  );
}

