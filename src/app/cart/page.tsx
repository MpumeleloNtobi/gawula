"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, MapPin, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, cartTotals, linesByBrand } from "@/lib/cart-store";
import { BRANDS, HUBS, getItem } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const hubId = useCart((s) => s.hub);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeLine = useCart((s) => s.removeLine);
  const clear = useCart((s) => s.clear);
  const hub = HUBS.find((h) => h.id === hubId);
  const totals = cartTotals(lines);
  const grouped = linesByBrand(lines);

  if (lines.length === 0) {
    return (
      <div className="container max-w-2xl py-16 sm:py-24">
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
            Your basket is empty
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a few dishes and they&apos;ll show up here.
          </p>
          <Button asChild variant="dark" size="lg" className="mt-6">
            <Link href="/menu">Browse restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Your basket
          </h1>
          {hub ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Delivering to {hub.name}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          Clear basket
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([brandId, brandLines]) => {
            const brand = BRANDS.find((b) => b.id === brandId);
            if (!brand) return null;
            const displayName = brand.name.split("—")[1]?.trim() ?? brand.name;
            return (
              <div key={brandId} className="overflow-hidden rounded-2xl border bg-card">
                <div className="flex items-center gap-3 border-b bg-secondary/40 px-5 py-4">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: brand.logoColor }}
                    aria-hidden
                  >
                    {displayName.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{displayName}</h2>
                    <p className="text-xs text-muted-foreground">{brand.tagline}</p>
                  </div>
                  <Link
                    href={`/menu/${brand.id}`}
                    className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Add more
                  </Link>
                </div>
                <ul className="divide-y">
                  {brandLines.map((line) => {
                    const item = getItem(line.itemId);
                    if (!item) return null;
                    return (
                      <li key={line.lineId} className="flex gap-4 p-5">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm font-semibold leading-tight">
                              {item.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeLine(line.lineId)}
                              aria-label="Remove item"
                              className="text-muted-foreground hover:text-foreground"
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
                            <div className="inline-flex items-center gap-1 rounded-full border bg-card p-0.5">
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
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
              Summary
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatPrice(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium">{formatPrice(totals.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Service fee</dt>
                <dd className="font-medium">{formatPrice(totals.serviceFee)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-semibold">{formatPrice(totals.total)}</span>
            </div>
            <Button
              variant="dark"
              size="lg"
              className="mt-5 w-full"
              onClick={() => router.push("/checkout")}
            >
              Go to checkout
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {hub ? `Ready in ${hub.etaMinutes[0]}–${hub.etaMinutes[1]} min` : null}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
