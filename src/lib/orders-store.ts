"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/cart-store";

export type OrderStatus =
  | "received"
  | "preparing"
  | "ready"
  | "on-the-way"
  | "delivered";

export const ORDER_STATUSES: { id: OrderStatus; label: string }[] = [
  { id: "received", label: "Order received" },
  { id: "preparing", label: "Kitchen preparing" },
  { id: "ready", label: "Ready for pickup" },
  { id: "on-the-way", label: "Rider on the way" },
  { id: "delivered", label: "Delivered" },
];

export type Order = {
  id: string;
  createdAt: number;
  hub: string | null;
  address: string;
  contactName: string;
  contactPhone: string;
  paymentMethod: "card" | "cash";
  tipCents: number;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  status: OrderStatus;
};

type OrdersState = {
  orders: Order[];
  addOrder: (order: Order) => void;
  advanceStatus: (id: string, status: OrderStatus) => void;
};

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      advanceStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),
    }),
    { name: "foodcourt-orders" }
  )
);

export function statusIndex(status: OrderStatus) {
  return ORDER_STATUSES.findIndex((s) => s.id === status);
}

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = statusIndex(status);
  if (i < 0 || i >= ORDER_STATUSES.length - 1) return null;
  return ORDER_STATUSES[i + 1].id;
}
