"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Image from "next/image";
import { LuMinus as Minus, LuPlus as Plus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getItem, getMostLikedBadge } from "@/lib/mock-data";
import { canAddItemToCart, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

type Selection = Record<string, string[]>;

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const item = getItem(id);
  if (!item) notFound();

  const addLine = useCart((s) => s.addLine);
  const lines = useCart((s) => s.lines);
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);
  const mostLikedBadge = getMostLikedBadge(item);
  const compatibility = canAddItemToCart(lines, item.id);
  const compatibilityNotice = !compatibility.ok
    ? compatibility.reason
    : lines.length > 0 && compatibility.effortFee
      ? `${compatibility.reason} Delivery effort adds ${formatPrice(compatibility.effortFee)}.`
      : null;

  const [selection, setSelection] = useState<Selection>(() => {
    const init: Selection = {};
    item.modifiers?.forEach((g) => {
      if (g.required) init[g.id] = [g.options[0].id];
      else init[g.id] = [];
    });
    return init;
  });
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);

  const toggleOption = (groupId: string, optionId: string, single: boolean) => {
    setSelection((prev) => {
      const current = prev[groupId] ?? [];
      if (single) return { ...prev, [groupId]: [optionId] };
      return {
        ...prev,
        [groupId]: current.includes(optionId)
          ? current.filter((o) => o !== optionId)
          : [...current, optionId],
      };
    });
  };

  const { unitPrice, selected } = useMemo(() => {
    let extra = 0;
    const selectedFlat: {
      groupId: string;
      optionId: string;
      name: string;
      priceDelta: number;
    }[] = [];
    item.modifiers?.forEach((g) => {
      const picks = selection[g.id] ?? [];
      g.options.forEach((opt) => {
        if (picks.includes(opt.id)) {
          extra += opt.priceDelta;
          selectedFlat.push({
            groupId: g.id,
            optionId: opt.id,
            name: opt.name,
            priceDelta: opt.priceDelta,
          });
        }
      });
    });
    return { unitPrice: item.price + extra, selected: selectedFlat };
  }, [item, selection]);

  const handleAdd = () => {
    const result = addLine({
      itemId: item.id,
      quantity: qty,
      modifiers: selected,
      unitPrice,
      specialInstructions: notes.trim() || undefined,
    });
    if (!result.ok) return;
    setDrawerOpen(false);
    router.push("/cart");
  };

  return (
    <div className="bg-background pb-36">
      <div className="container grid max-w-6xl gap-8 pt-4 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start lg:gap-12">
        <div className="lg:sticky lg:top-24">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="pb-4">
          <section>
            <div>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{item.name}</h1>
              <div className="mt-2 text-lg font-semibold">{formatPrice(item.price)}</div>
              <p className="mt-3 text-base leading-7 text-muted-foreground">{item.description}</p>
            </div>
            {mostLikedBadge ? (
              <div className="mt-4">
                <span className="text-xs font-semibold text-[#116B35]">
                  {mostLikedBadge}
                </span>
              </div>
            ) : null}
          </section>

          {item.modifiers?.length ? (
            <div className="mt-8 space-y-8">
              {item.modifiers.map((group) => {
                const single = group.required;
                return (
                  <section key={group.id}>
                    <div className="mb-2">
                      <h2 className="text-lg font-semibold">Choose {group.name.toLowerCase()}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {group.required ? "Required" : "Optional"}
                      </p>
                    </div>
                    <div className="-mx-1">
                      {group.options.map((opt) => {
                        const checked = (selection[group.id] ?? []).includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className="flex cursor-pointer items-center justify-between gap-4 rounded-md px-1 py-3 text-sm transition-colors hover:bg-secondary/40"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type={single ? "radio" : "checkbox"}
                                name={group.id}
                                checked={checked}
                                onChange={() => toggleOption(group.id, opt.id, single)}
                                className="h-4 w-4 accent-foreground"
                              />
                              <span className="font-semibold">{opt.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-muted-foreground">
                              {opt.priceDelta > 0 ? `+${formatPrice(opt.priceDelta)}` : "Included"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Special instructions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Allergies, preferences, or anything the kitchen should know.
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="No onions, extra dressing, etc."
              className="mt-4 min-h-[96px] resize-none rounded-lg border-0 bg-secondary shadow-none focus-visible:ring-2 focus-visible:ring-foreground/15"
            />
          </section>
        </div>
      </div>

      {compatibilityNotice ? (
        <section className="container max-w-6xl pb-2">
          <div className="rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-foreground">
            {compatibilityNotice}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 bg-background/95 shadow-[0_-1px_0_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="container flex max-w-6xl items-center justify-between gap-4 py-4">
          <div className="inline-flex h-12 items-center rounded-full bg-secondary p-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-background"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-7 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-background"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="dark"
            size="lg"
            className="h-12 flex-1 justify-between rounded-full px-5 sm:max-w-md"
            onClick={handleAdd}
            disabled={!compatibility.ok}
          >
            <span>Add to cart</span>
            <span>{formatPrice(unitPrice * qty)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
