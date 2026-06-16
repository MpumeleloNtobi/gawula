"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuRotateCcw as RotateCcw, LuMinus as Minus, LuPlus as Plus, LuChevronDown as ChevronDown } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useCart, cartTotals, linesByBrand, cartFulfillmentContext, deliveryQuoteForBrandIds } from "@/lib/cart-store";
import { BRANDS, HUBS, getItem } from "@/lib/mock-data";
import { StoreLogo } from "@/components/store-logo";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const hubId = useCart((s) => s.hub);
  const address = useCart((s) => s.address);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeLine = useCart((s) => s.removeLine);
  const clear = useCart((s) => s.clear);
  const hub = HUBS.find((h) => h.id === hubId);
  const totals = cartTotals(lines, hub ?? null);
  const grouped = linesByBrand(lines);
  const fulfillment = cartFulfillmentContext(lines);
  const storeCount = grouped.size;
  const storeLabel = `${storeCount} ${storeCount === 1 ? "store" : "stores"}`;
  const itemLabel = `${totals.itemCount} ${totals.itemCount === 1 ? "item" : "items"}`;
  const deliveryLabel = address ?? hub?.name;

  const brandIdsInOrder = Array.from(grouped.keys());
  const pickupStops = brandIdsInOrder.map((brandId) => {
    const brand = BRANDS.find((b) => b.id === brandId);
    const displayName = brand ? (brand.name.split("—")[1]?.trim() ?? brand.name) : brandId;
    const initials = displayName
      .split(/\s+/)
      .filter((part) => part !== "&")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    return { brandId, displayName, initials, color: brand?.logoColor ?? "#111" };
  });

  const separateDeliveryTotal =
    storeCount > 1
      ? brandIdsInOrder.reduce((sum, brandId) => sum + deliveryQuoteForBrandIds([brandId], hub ?? null).totalFee, 0)
      : 0;
  const savings = separateDeliveryTotal > 0 ? separateDeliveryTotal - totals.deliveryFee : 0;

  if (lines.length === 0) {
    return (
      <div className="container max-w-2xl py-24 text-center text-sm text-muted-foreground">
        Your cart is empty
      </div>
    );
  }

  return (
    <div className="container max-w-6xl pb-28 pt-6 md:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div></div>
        <button
          type="button"
          onClick={clear}
          aria-label="Clear cart"
          title="Clear cart"
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="divide-y divide-border/60">
          {Array.from(grouped.entries()).map(([brandId, brandLines]) => {
            const brand = BRANDS.find((b) => b.id === brandId);
            if (!brand) return null;
            const displayName = brand.name.split("—")[1]?.trim() ?? brand.name;
            const logoText = displayName
              .split(/\s+/)
              .filter((p) => p !== "&")
              .slice(0, 2)
              .map((p) => p[0])
              .join("");
            const brandItemCount = brandLines.reduce((s, l) => s + l.quantity, 0);
            return (
              <StoreAccordion
                key={brandId}
                brand={brand}
                displayName={displayName}
                logoText={logoText}
                brandItemCount={brandItemCount}
                brandLines={brandLines}
                updateQuantity={updateQuantity}
              />
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-secondary p-5">
            <h2 className="text-base font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold">{formatPrice(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-semibold">{formatPrice(totals.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Service fee</dt>
                <dd className="font-semibold">{formatPrice(totals.serviceFee)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-semibold">{formatPrice(totals.total)}</span>
            </div>
            <Button
              variant="dark"
              size="lg"
              className="mt-5 w-full rounded-full"
              onClick={() => router.push("/checkout")}
            >
              Checkout
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

type CartLine = ReturnType<typeof import("@/lib/cart-store").useCart> extends (s: infer S) => infer R ? never : never;

function StoreAccordion({
  brand,
  displayName,
  logoText,
  brandItemCount,
  brandLines,
  updateQuantity,
}: {
  brand: (typeof import("@/lib/mock-data").BRANDS)[number];
  displayName: string;
  logoText: string;
  brandItemCount: number;
  brandLines: { lineId: string; itemId: string; quantity: number; unitPrice: number; modifiers: { name: string }[] }[];
  updateQuantity: (lineId: string, qty: number) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <StoreLogo
          name={displayName}
          initials={logoText}
          color={brand.logoColor}
          logoUrl={brand.logoUrl}
          className="h-8 w-8 rounded-full text-[10px]"
        />
        <span className="flex-1 text-sm font-semibold">{displayName}</span>
        <span className="text-xs text-muted-foreground">
          {brandItemCount} {brandItemCount === 1 ? "item" : "items"}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul className="divide-y divide-border/40 pb-2">
          {brandLines.map((line) => {
            const item = getItem(line.itemId);
            if (!item) return null;
            return (
              <li key={line.lineId} className="flex items-center gap-3 py-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized={item.image.endsWith(".svg")}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  {line.modifiers.length > 0 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {line.modifiers.map((m) => m.name).join(" · ")}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatPrice(line.unitPrice)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="grid h-7 w-7 place-items-center rounded-full bg-secondary hover:bg-border"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-4 text-center text-sm font-semibold">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                    aria-label="Increase quantity"
                    className="grid h-7 w-7 place-items-center rounded-full bg-secondary hover:bg-border"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <span className="w-12 text-right text-sm font-semibold">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
