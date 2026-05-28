"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BRANDS, getItem } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-store";
import { formatPrice, cn } from "@/lib/utils";

type Selection = Record<string, string[]>;

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const item = getItem(id);
  if (!item) notFound();

  const brand = BRANDS.find((b) => b.id === item.brandId);
  const addLine = useCart((s) => s.addLine);
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);

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
    addLine({
      itemId: item.id,
      quantity: qty,
      modifiers: selected,
      unitPrice,
      specialInstructions: notes.trim() || undefined,
    });
    setDrawerOpen(false);
    router.push("/cart");
  };

  const displayBrand = brand?.name.split("—")[1]?.trim() ?? brand?.name;

  return (
    <div className="pb-40">
      <div className="container max-w-3xl pt-6 sm:pt-10">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="relative aspect-[16/10] bg-secondary">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="p-6 sm:p-8">
            {displayBrand ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: brand?.logoColor }}
                  aria-hidden
                />
                {displayBrand}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                {item.name}
              </h1>
              <div className="text-lg font-semibold">{formatPrice(item.price)}</div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {item.description}
            </p>
            {item.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {item.modifiers?.length ? (
          <div className="mt-8 space-y-6">
            {item.modifiers.map((group) => {
              const single = group.required;
              return (
                <div key={group.id} className="rounded-2xl border bg-card p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold">{group.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      {group.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.options.map((opt) => {
                      const checked = (selection[group.id] ?? []).includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                            checked
                              ? "border-foreground bg-secondary/60"
                              : "border-border hover:border-foreground/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type={single ? "radio" : "checkbox"}
                              name={group.id}
                              checked={checked}
                              onChange={() => toggleOption(group.id, opt.id, single)}
                              className="h-4 w-4 accent-foreground"
                            />
                            <span className="font-medium">{opt.name}</span>
                          </div>
                          {opt.priceDelta > 0 ? (
                            <span className="text-muted-foreground">
                              +{formatPrice(opt.priceDelta)}
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border bg-card p-6">
          <h2 className="text-base font-semibold">Special instructions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Tell the kitchen about allergies or preferences.
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. No onions, please."
            className="mt-3 min-h-[80px]"
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur">
        <div className="container flex max-w-3xl items-center justify-between gap-4 py-4">
          <div className="inline-flex items-center gap-1 rounded-full border bg-card p-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="dark"
            size="lg"
            className="flex-1 justify-between"
            onClick={handleAdd}
          >
            <span>Add to basket</span>
            <span>{formatPrice(unitPrice * qty)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
