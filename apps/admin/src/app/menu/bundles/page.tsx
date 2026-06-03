"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import { BRANDS, STORE_LOCATIONS } from "@/lib/mock-data";
import { buildShopClusters } from "@/components/nearby-shop-data";
import { cn } from "@/lib/utils";

const SHOP_CLUSTERS = buildShopClusters();

const LOCATION_DISTANCE_KM: Record<string, number> = {
  "mall-of-africa-food-court": 4.2,
  "waterfall-corner": 3.1,
  "the-zone-rosebank": 8.6,
};

const TILES = STORE_LOCATIONS.map((location) => {
  const restaurantCount = BRANDS.filter((b) => b.storeLocationId === location.id).length;
  const distanceKm = LOCATION_DISTANCE_KM[location.id] ?? 0;
  return { location, restaurantCount, distanceKm };
}).sort((a, b) => a.distanceKm - b.distanceKm);

type BundleType = "mall" | "complex" | "cluster";

const BUNDLE_TYPE_OPTIONS: { value: BundleType; label: string }[] = [
  { value: "mall", label: "Mall" },
  { value: "complex", label: "Complex" },
  { value: "cluster", label: "Cluster" },
];

export default function AllBundlesPage() {
  const [selectedTypes, setSelectedTypes] = React.useState<BundleType[]>([]);
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isActive = selectedTypes.length > 0;
  const activeLabel = "Bundle type";

  const toggleType = (value: BundleType) =>
    setSelectedTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );

  const visibleTiles = TILES.filter(
    (tile) => !isActive || selectedTypes.includes(tile.location.type),
  );
  const showClusters = !isActive && SHOP_CLUSTERS.length > 0;

  return (
    <main className="container pb-24 pt-12 md:pt-16">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Bundle stores near you</h1>
      </header>

      <div ref={wrapperRef} className="relative mb-6">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-full px-4 text-sm font-semibold",
            isActive ? "bg-foreground text-background" : "bg-secondary text-foreground",
          )}
        >
          {activeLabel}
          <ChevronDown className="h-4 w-4" />
        </button>
        {open ? (
          <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-2xl border border-border bg-background p-2 shadow-lg">
            {BUNDLE_TYPE_OPTIONS.map((option) => {
              const selected = selectedTypes.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={selected}
                  onClick={() => toggleType(option.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium",
                    selected ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary/60",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 shrink-0 place-items-center rounded border-2 bg-background",
                      selected ? "border-foreground bg-foreground" : "border-muted-foreground/70",
                    )}
                  >
                    {selected ? <Check className="h-3 w-3 text-background" strokeWidth={3} /> : null}
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTiles.map((tile) => {
          return (
            <div key={tile.location.id} className="flex flex-col gap-3">
              <Link
                href={`/menu?location=${tile.location.id}`}
                className="relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden rounded-3xl bg-[#FFF1E6] p-6 text-center text-[#3D1D00]"
              >
                <div className="flex flex-col items-center gap-1">
                  <h2 className="max-w-[220px] text-2xl font-semibold leading-tight tracking-tight">
                    {tile.location.name}
                  </h2>
                  <p className="text-sm font-medium opacity-70">
                    {tile.location.type === "mall" ? "Mall" : tile.location.type === "complex" ? "Complex" : "Cluster"}
                  </p>
                </div>
              </Link>
              <div className="flex flex-col items-center gap-0.5 text-center">
                <p className="text-sm font-medium text-foreground">
                  {tile.restaurantCount} stores in this bundle
                </p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {tile.distanceKm.toFixed(1)} km away
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {visibleTiles.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No bundles match this type yet.</p>
      ) : null}

      {showClusters ? (
        <section className="mt-12">
          <header className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Bundles around you</h2>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHOP_CLUSTERS.map((cluster) => {
              const total = cluster.members.length + 1;
              return (
                <div key={cluster.id} className="flex flex-col gap-3">
                  <article
                    id={cluster.id}
                    className="relative flex aspect-[5/4] scroll-mt-28 w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-[#FFF1E6] p-6 text-center text-[#3D1D00]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <h3 className="max-w-[240px] text-2xl font-semibold leading-tight tracking-tight">
                        Around {cluster.anchor.name}
                      </h3>
                      <p className="text-sm font-medium opacity-70">Cluster</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm opacity-90">
                      {[cluster.anchor, ...cluster.members].map((shop) => (
                        <span key={shop.name} className="font-medium">
                          {shop.name}
                        </span>
                      ))}
                    </div>
                  </article>
                  <div className="flex flex-col items-center gap-0.5 text-center">
                    <p className="text-sm font-medium text-foreground">{total} stores nearby</p>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      {cluster.radiusKm.toFixed(1)} km · {cluster.anchor.area}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
