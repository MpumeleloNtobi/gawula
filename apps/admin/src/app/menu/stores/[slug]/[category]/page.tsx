"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { LuCheck as Check, LuMapPin as MapPin, LuPlus as Plus } from "react-icons/lu";
import { NearbyShopLogo } from "@/components/nearby-shop";
import { getNearbyShopBySlug, shopSlug } from "@/components/nearby-shop-data";
import { canAddBrandToCart, useCart } from "@/lib/cart-store";
import { categorySlug, getNearbyStoreCategory, getNearbyStoreMenu, type MenuItem } from "@/lib/mock-data";
import { cn, formatPrice } from "@/lib/utils";

export default function NearbyStoreCategoryPage() {
  const { slug, category } = useParams<{ slug: string; category: string }>();
  const shop = getNearbyShopBySlug(slug);
  if (!shop) notFound();

  const brandId = shopSlug(shop.name);
  const aisles = getNearbyStoreMenu(brandId);
  const section = getNearbyStoreCategory(brandId, category);
  if (!section) notFound();

  const lines = useCart((s) => s.lines);
  const addLine = useCart((s) => s.addLine);
  const [addedItemId, setAddedItemId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const compatibility = React.useMemo(() => canAddBrandToCart(lines, brandId), [brandId, lines]);

  const quickAdd = (item: MenuItem) => {
    const result = addLine({ itemId: item.id, quantity: 1, modifiers: [], unitPrice: item.price });
    if (!result.ok) {
      setNotice(result.reason);
      return;
    }
    setNotice(null);
    setAddedItemId(item.id);
    window.setTimeout(() => setAddedItemId((current) => (current === item.id ? null : current)), 1400);
  };

  return (
    <main className="container pb-24 pt-12 md:pt-16">
      <header className="flex items-center gap-5">
        <Link href={`/menu/stores/${slug}`} aria-label={`Back to ${shop.name}`}>
          <NearbyShopLogo shop={shop} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{section.title}</h1>
          <div className="mt-2 flex flex-col gap-0.5 text-sm font-medium text-muted-foreground sm:flex-row sm:items-center sm:gap-1.5">
            <Link
              href={`/menu/stores/${slug}`}
              className="inline-flex items-center gap-1.5 font-semibold text-foreground transition-opacity hover:opacity-70"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              {shop.name}
            </Link>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span className="pl-[1.375rem] sm:pl-0">{shop.area}</span>
          </div>
        </div>
      </header>

      <nav
        aria-label="Aisles"
        className="mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {aisles.map((aisle) => {
          const aisleSlug = categorySlug(aisle.title);
          const isActive = aisleSlug === category;
          return (
            <Link
              key={aisle.title}
              href={`/menu/stores/${slug}/${aisleSlug}`}
              replace
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-secondary/70",
              )}
            >
              {aisle.title}
            </Link>
          );
        })}
      </nav>

      {notice ? (
        <div className="mt-8 rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-foreground">
          {notice}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-4">
        {section.items.map((item) => (
          <article key={item.id} className="w-40 sm:w-44">
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
              <Image src={item.image} alt={item.name} fill sizes="176px" className="object-cover" />
              <button
                type="button"
                aria-label={addedItemId === item.id ? `${item.name} added to cart` : `Add ${item.name} to cart`}
                title={compatibility.ok ? undefined : compatibility.reason}
                disabled={!compatibility.ok}
                onClick={() => quickAdd(item)}
                className={cn(
                  "absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full border border-border shadow-md transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100",
                  addedItemId === item.id ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
                )}
              >
                {addedItemId === item.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="mt-2 text-sm font-semibold">{formatPrice(item.price)}</div>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.name}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
