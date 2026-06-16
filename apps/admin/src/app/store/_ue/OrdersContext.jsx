"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { storeApi } from "@/lib/store";
import { connectRealtime, releaseRealtime } from "@/lib/realtime";

const OrdersContext = createContext(null);

function mapStatusToUi(status) {
  switch (status) {
    case "pending":
      return "new";
    case "accepted":
      return "accepted";
    case "preparing":
      return "preparing";
    case "ready":
      return "ready";
    case "collected":
      return "completed";
    case "rejected":
    case "cancelled":
      return "canceled";
    default:
      return status;
  }
}

function relativeTime(iso) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function adapt(o) {
  return {
    id: o.id,
    refId: o.orderId.slice(-6).toUpperCase(),
    cust: o.customerName ?? "Customer",
    items: o.items.map((it) => `${it.qty}× ${it.name}`),
    rawItems: o.items,
    total: o.foodSubtotalCents / 100,
    status: mapStatusToUi(o.status),
    backendStatus: o.status,
    time: relativeTime(o.placedAt),
    placedAt: o.placedAt,
    type: o.fulfilmentMode === "pickup" ? "pickup" : "delivery",
  };
}

export function OrdersProvider({ children }) {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const [active, setActive] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [a, p] = await Promise.all([
        storeApi.orders(token, "active"),
        storeApi.orders(token, "past"),
      ]);
      setActive(a.map(adapt).sort((x, y) => new Date(x.placedAt) - new Date(y.placedAt)));
      setPast(p.map(adapt));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated || !token) return;
    refresh();
  }, [hydrated, token, refresh]);

  const refreshTimer = useRef(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) return;
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      refresh();
    }, 250);
  }, [refresh]);

  useEffect(() => {
    if (!hydrated || !token) return undefined;
    const socket = connectRealtime(token);
    const onNew = () => scheduleRefresh();
    const onUpdated = () => scheduleRefresh();
    socket.on("store.order.new", onNew);
    socket.on("store.order.updated", onUpdated);
    return () => {
      socket.off("store.order.new", onNew);
      socket.off("store.order.updated", onUpdated);
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
      releaseRealtime();
    };
  }, [hydrated, token, scheduleRefresh]);

  const acceptOrder = useCallback(
    async (id) => {
      if (!token) return;
      try {
        await storeApi.transitionOrder(token, id, "accepted");
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to accept order");
      }
    },
    [token, refresh],
  );

  const transition = useCallback(
    async (id, status, reason, code) => {
      if (!token) return;
      await storeApi.transitionOrder(token, id, status, reason, code);
      await refresh();
    },
    [token, refresh],
  );

  const adjustItems = useCallback(
    async (id, adjustments, reason) => {
      if (!token) return;
      await storeApi.adjustOrderItems(token, id, adjustments, reason);
      await refresh();
    },
    [token, refresh],
  );

  const value = useMemo(
    () => ({
      orders: [...active, ...past],
      active,
      past,
      loading,
      error,
      acceptOrder,
      transition,
      adjustItems,
      refresh,
    }),
    [active, past, loading, error, acceptOrder, transition, adjustItems, refresh],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
