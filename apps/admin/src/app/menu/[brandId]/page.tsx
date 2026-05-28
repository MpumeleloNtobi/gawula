"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Search } from "lucide-react";
import { MenuItemCard } from "@/components/menu-item-card";
import { FloatingCartButton } from "@/components/floating-cart-button";
import { Input } from "@/components/ui/input";
import { MENU_ITEMS, getBrand } from "@/lib/mock-data";

export default function BrandMenuPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const brand = getBrand(brandId);
  if (!brand) notFound();

  const [query, setQuery] = useState("");

  const displayName = brand.name.split("—")[1]?.trim() ?? brand.name;
  const monogram = displayName.charAt(0);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
      if (item.brandId !== brand.id) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [brand.id, query]);

  return (
    <div className="pb-32">
      <section className="relative">
        <div className="relative h-56 w-full overflow-hidden bg-secondary sm:h-72">
          <Image
            src={brand.cover}
            alt={brand.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
        </div>
        <div className="container relative -mt-12 pb-6">
          <div className="flex items-end gap-4">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-background text-2xl font-semibold text-white shadow-sm sm:h-24 sm:w-24"
              style={{ backgroundColor: brand.logoColor }}
              aria-hidden
            >
              {monogram}
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{brand.tagline}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="sticky top-16 z-20 -mx-4 border-b bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/menu"
              className="text-xs font-medium tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              ← All restaurants
            </Link>
            <div className="relative ml-auto w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${displayName}`}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="py-8">
          {items.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
              No dishes match your search.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      <FloatingCartButton />
    </div>
  );
}
