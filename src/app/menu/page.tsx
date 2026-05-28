"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { FloatingCartButton } from "@/components/floating-cart-button";
import { BRANDS, HUBS, MENU_ITEMS } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-store";

export default function MenuPage() {
  const hubId = useCart((s) => s.hub);
  const setHub = useCart((s) => s.setHub);
  const hub = HUBS.find((h) => h.id === hubId);

  return (
    <div className="pb-32">
      <section className="border-b bg-secondary/30">
        <div className="container py-8 sm:py-10">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">
            Delivering to
          </p>
          {hub ? (
            <>
              <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                <MapPin className="h-5 w-5 text-primary" />
                {hub.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hub.area} · {hub.etaMinutes[0]}–{hub.etaMinutes[1]} min
              </p>
            </>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {HUBS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHub(h.id, h.area)}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:border-foreground/40"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {h.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Meet the restaurants
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A curated set of kitchens, all delivered together from one basket.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BRANDS.map((brand) => {
            const displayName = brand.name.split("—")[1]?.trim() ?? brand.name;
            const monogram = displayName.charAt(0);
            const itemCount = MENU_ITEMS.filter((i) => i.brandId === brand.id).length;
            return (
              <Link
                key={brand.id}
                href={`/menu/${brand.id}`}
                className="group block overflow-hidden rounded-2xl border bg-card transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-secondary">
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={brand.cover}
                      alt={brand.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div
                    className="absolute -bottom-7 left-4 grid h-14 w-14 place-items-center rounded-full border-4 border-background text-base font-semibold text-white shadow-sm"
                    style={{ backgroundColor: brand.logoColor }}
                    aria-hidden
                  >
                    {monogram}
                  </div>
                </div>
                <div className="p-4 pt-9">
                  <h3 className="text-base font-semibold leading-tight">{displayName}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {brand.tagline}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">{itemCount} dishes</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <FloatingCartButton />
    </div>
  );
}
