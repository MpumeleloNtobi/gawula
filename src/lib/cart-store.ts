"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DELIVERY_FEE, SERVICE_FEE, MENU_ITEMS } from "@/lib/mock-data";

export type CartLine = {
  lineId: string;
  itemId: string;
  quantity: number;
  modifiers: { groupId: string; optionId: string; name: string; priceDelta: number }[];
  specialInstructions?: string;
  unitPrice: number;
};

function lineSignature(line: Pick<CartLine, "itemId" | "modifiers" | "specialInstructions">) {
  const mods = [...line.modifiers]
    .map((m) => `${m.groupId}:${m.optionId}`)
    .sort()
    .join("|");
  return `${line.itemId}::${mods}::${line.specialInstructions ?? ""}`;
}

type CartState = {
  hub: string | null;
  address: string | null;
  lines: CartLine[];
  drawerOpen: boolean;
  setHub: (hubId: string, address: string) => void;
  addLine: (line: Omit<CartLine, "lineId">) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  setDrawerOpen: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      hub: null,
      address: null,
      lines: [],
      drawerOpen: false,
      setHub: (hubId, address) => set({ hub: hubId, address }),
      addLine: (line) =>
        set((state) => {
          const sig = lineSignature(line);
          const existing = state.lines.find((l) => lineSignature(l) === sig);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.lineId === existing.lineId
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              { ...line, lineId: Math.random().toString(36).slice(2, 10) },
            ],
          };
        }),
      updateQuantity: (lineId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.lineId !== lineId)
              : state.lines.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l)),
        })),
      removeLine: (lineId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),
      clear: () => set({ lines: [] }),
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
    }),
    {
      name: "foodcourt-cart",
      version: 2,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as { lines?: CartLine[] };
        const merged: CartLine[] = [];
        const bySig = new Map<string, number>();
        for (const line of state.lines ?? []) {
          const sig = lineSignature(line);
          const idx = bySig.get(sig);
          if (idx !== undefined) {
            merged[idx] = {
              ...merged[idx],
              quantity: merged[idx].quantity + line.quantity,
            };
          } else {
            bySig.set(sig, merged.length);
            merged.push(line);
          }
        }
        return { ...state, lines: merged } as never;
      },
    }
  )
);

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const deliveryFee = lines.length > 0 ? DELIVERY_FEE : 0;
  const serviceFee = lines.length > 0 ? SERVICE_FEE : 0;
  return {
    subtotal,
    deliveryFee,
    serviceFee,
    total: subtotal + deliveryFee + serviceFee,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
  };
}

export function linesByBrand(lines: CartLine[]) {
  const groups = new Map<string, CartLine[]>();
  for (const line of lines) {
    const item = MENU_ITEMS.find((m) => m.id === line.itemId);
    if (!item) continue;
    const arr = groups.get(item.brandId) ?? [];
    arr.push(line);
    groups.set(item.brandId, arr);
  }
  return groups;
}
