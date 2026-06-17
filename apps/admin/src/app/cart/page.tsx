"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuMinus as Minus, LuPlus as Plus, LuTrash2 as Trash2, LuChevronDown as ChevronDown, LuBike as Bike } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useCart, cartTotals, linesByBrand, deliveryQuoteForBrandIds } from "@/lib/cart-store";
import { BRANDS, HUBS, getItem } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const hubId = useCart((s) => s.hub);
  const address = useCart((s) => s.address);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const clear = useCart((s) => s.clear);
  const hydrated = useCart((s) => s.hydrated);
  const [confirmClear, setConfirmClear] = useState(false);
  const hub = HUBS.find((h) => h.id === hubId);
  const totals = cartTotals(lines, hub ?? null);
  const grouped = linesByBrand(lines);
  const storeCount = grouped.size;
  const deliveryLabel = address ?? hub?.name;

  const brandIdsInOrder = Array.from(grouped.keys());
  const separateDeliveryTotal =
    storeCount > 1
      ? brandIdsInOrder.reduce((sum, brandId) => sum + deliveryQuoteForBrandIds([brandId], hub ?? null).totalFee, 0)
      : 0;
  const savings = separateDeliveryTotal > 0 ? separateDeliveryTotal - totals.deliveryFee : 0;

  if (!hydrated) {
    return <div className="container max-w-6xl pb-28 pt-6 md:py-10" aria-hidden />;
  }

  if (lines.length === 0) {
    return (
      <div className="container max-w-2xl py-24 text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add dishes from a store and we will collect them in one trip.
        </p>
        <Button asChild variant="dark" size="lg" className="mt-6 rounded-full">
          <Link href="/menu/stores">Browse stores</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl pb-28 pt-6 md:py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-3xl">Cart</h1>
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Bike className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0">
              {storeCount > 1 ? `One delivery from ${storeCount} stores` : "One delivery"}
              {deliveryLabel ? ` to ${deliveryLabel}` : ""}
            </span>
          </p>
        </div>
        {confirmClear ? (
          <div className="flex shrink-0 items-center gap-3 text-sm" role="alertdialog" aria-label="Clear cart?">
            <button
              type="button"
              autoFocus
              onClick={() => {
                clear();
                setConfirmClear(false);
              }}
              className="rounded-full font-semibold text-destructive hover:text-destructive/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Clear cart
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Keep
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="shrink-0 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 divide-y divide-border/60">
          {Array.from(grouped.entries()).map(([brandId, brandLines]) => {
            const brand = BRANDS.find((b) => b.id === brandId);
            if (!brand) return null;
            const displayName = brand.name.split("—")[1]?.trim() ?? brand.name;
            const brandItemCount = brandLines.reduce((s, l) => s + l.quantity, 0);
            return (
              <StoreAccordion
                key={brandId}
                displayName={displayName}
                brandItemCount={brandItemCount}
                brandLines={brandLines}
                updateQuantity={updateQuantity}
              />
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg bg-secondary p-5">
            <h2 className="text-base font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold">{formatPrice(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Delivery{storeCount > 1 ? " (all stores)" : ""}
                </dt>
                <dd className="font-semibold">{formatPrice(totals.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Service fee</dt>
                <dd className="font-semibold">{formatPrice(totals.serviceFee)}</dd>
              </div>
              <div className="mt-5 flex items-baseline justify-between border-t border-border/60 pt-4">
                <dt className="text-sm font-semibold">Total</dt>
                <dd className="text-lg font-semibold">{formatPrice(totals.total)}</dd>
              </div>
            </dl>
            {savings > 0 ? (
              <p className="mt-3 text-xs font-semibold text-primary">
                You save {formatPrice(savings)} versus a separate delivery from each store.
              </p>
            ) : null}
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
  displayName,
  brandItemCount,
  brandLines,
  updateQuantity,
}: {
  displayName: string;
  brandItemCount: number;
  brandLines: {
    lineId: string;
    itemId: string;
    quantity: number;
    unitPrice: number;
    modifiers: { name: string }[];
    specialInstructions?: string;
  }[];
  updateQuantity: (lineId: string, qty: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 rounded-md py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{displayName}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {brandItemCount} {brandItemCount === 1 ? "item" : "items"}
        </span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul id={panelId} className="divide-y divide-border/40 pb-2">
          {brandLines.map((line) => {
            const item = getItem(line.itemId);
            if (!item) return null;
            return (
              <li key={line.lineId} className="flex items-center gap-3 py-3">
                <Link
                  href={`/menu/item/${line.itemId}`}
                  prefetch={false}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
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
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {line.modifiers.map((m) => m.name).join(", ")}
                      </p>
                    ) : null}
                    {line.specialInstructions ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {line.specialInstructions}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatPrice(line.unitPrice)}</p>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {line.quantity === 1 ? (
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.lineId, 0)}
                      aria-label={`Remove ${item.name}`}
                      className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground hover:bg-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span className="min-w-5 text-center text-sm font-semibold tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-14 text-right text-sm font-semibold tabular-nums">
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
