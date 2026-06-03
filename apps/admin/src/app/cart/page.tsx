"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw, Minus, Plus, Trash2, MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, cartTotals, linesByBrand, cartFulfillmentContext, deliveryQuoteForBrandIds } from "@/lib/cart-store";
import { BRANDS, HUBS, getItem } from "@/lib/mock-data";
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
      <div className="container max-w-2xl pb-28 pt-16 md:py-24">
        <div className="rounded-2xl border border-border bg-secondary/50 p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-background text-foreground">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a few dishes and they&apos;ll show up here.
          </p>
          <Button asChild variant="dark" size="lg" className="mt-6 rounded-full px-6">
            <Link href="/menu">Browse restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl pb-28 pt-6 md:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {itemLabel} from {storeLabel}
          </p>
          {deliveryLabel ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Delivering to {deliveryLabel}
            </p>
          ) : null}
        </div>
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
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([brandId, brandLines]) => {
            const brand = BRANDS.find((b) => b.id === brandId);
            if (!brand) return null;
            const displayName = brand.name.split("—")[1]?.trim() ?? brand.name;
            const logoText = displayName
              .split(/\s+/)
              .filter((part) => part !== "&")
              .slice(0, 2)
              .map((part) => part[0])
              .join("");
            const brandItemCount = brandLines.reduce((sum, line) => sum + line.quantity, 0);

            return (
              <section key={brandId} className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: brand.logoColor }}
                    aria-hidden
                  >
                    {logoText}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{displayName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {brandItemCount} {brandItemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <Link
                    href={`/menu/${brand.id}`}
                    className="ml-auto text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Add items
                  </Link>
                </div>
                <ul className="grid gap-3">
                  {brandLines.map((line) => {
                    const item = getItem(line.itemId);
                    if (!item) return null;
                    return (
                      <li key={line.lineId} className="rounded-2xl border border-border bg-secondary/40 p-4">
                        <div className="flex gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-background sm:h-24 sm:w-24">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                            unoptimized={item.image.endsWith(".svg")}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold leading-tight">{item.name}</h3>
                              <p className="mt-1 text-sm font-semibold">{formatPrice(line.unitPrice)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLine(line.lineId)}
                              aria-label="Remove item"
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {line.modifiers.length > 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {line.modifiers.map((m) => m.name).join(" · ")}
                            </p>
                          ) : null}
                          {line.specialInstructions ? (
                            <p className="mt-1 text-xs italic text-muted-foreground">
                              &ldquo;{line.specialInstructions}&rdquo;
                            </p>
                          ) : null}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex h-9 items-center rounded-full border border-border bg-background p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(line.lineId, line.quantity - 1)
                                }
                                aria-label="Decrease quantity"
                                className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-5 text-center text-xs font-semibold">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(line.lineId, line.quantity + 1)
                                }
                                aria-label="Increase quantity"
                                className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="text-sm font-semibold">
                              {formatPrice(line.unitPrice * line.quantity)}
                            </div>
                          </div>
                        </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-secondary p-5">
            {pickupStops.length > 0 ? (
              <div className="mb-5 rounded-xl border border-border/70 bg-background p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Pickup route</span>
                  {totals.deliveryQuote.distanceKm > 0 ? (
                    <span>{totals.deliveryQuote.distanceKm.toFixed(1)} km total</span>
                  ) : null}
                </div>
                <ol className="mt-3 flex items-center gap-1 overflow-x-auto">
                  {pickupStops.map((stop, index) => (
                    <li key={stop.brandId} className="flex items-center gap-1">
                      {index > 0 ? (
                        <span aria-hidden className="h-px w-4 shrink-0 bg-border sm:w-6" />
                      ) : null}
                      <span
                        title={stop.displayName}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: stop.color }}
                      >
                        {stop.initials}
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center gap-1">
                    <span aria-hidden className="h-px w-4 shrink-0 bg-border sm:w-6" />
                    <span
                      aria-label="Delivery"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground text-background"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                  </li>
                </ol>
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Order summary</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {storeCount} {storeCount === 1 ? "store" : "stores"} in this order
                </p>
                {fulfillment ? (
                  <p className="mt-1 text-xs font-semibold text-[#116B35]">
                    {fulfillment.pickupPoint}
                  </p>
                ) : null}
              </div>
              <span className="text-sm font-semibold">{itemLabel}</span>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold">{formatPrice(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-semibold">{formatPrice(totals.deliveryFee)}</dd>
              </div>
              {savings > 0 ? (
                <div className="flex items-center justify-between rounded-md bg-[#116B35]/10 px-3 py-2 text-xs text-[#116B35]">
                  <span className="font-semibold">Saved vs ordering separately</span>
                  <span className="font-semibold">−{formatPrice(savings)}</span>
                </div>
              ) : null}
              {totals.deliveryQuote.effortFee > 0 ? (
                <div className="rounded-xl border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {totals.deliveryQuote.modeLabel}
                  </span>{" "}
                  includes {formatPrice(totals.deliveryQuote.effortFee)} for {totals.deliveryQuote.pickupStops} pickup stops
                  {totals.deliveryQuote.pickupDistanceKm > 0
                    ? ` over ${totals.deliveryQuote.pickupDistanceKm.toFixed(1)} km collecting`
                    : ""}
                  {totals.deliveryQuote.dropoffDistanceKm > 0
                    ? ` and ${totals.deliveryQuote.dropoffDistanceKm.toFixed(1)} km drop-off`
                    : ""}
                  . Final fee is set when you place the order.
                </div>
              ) : null}
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
              Go to checkout
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
