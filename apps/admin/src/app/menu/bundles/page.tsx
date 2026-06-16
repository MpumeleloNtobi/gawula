"use client";

import * as React from "react";
import Link from "next/link";
import { LuChevronDown as ChevronDown, LuCheck as Check } from "react-icons/lu";
import { BRANDS, HUBS, STORE_LOCATIONS } from "@/lib/mock-data";
import { buildShopClusters } from "@/components/nearby-shop-data";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const SHOP_CLUSTERS = buildShopClusters();

const SERVICE_RADIUS_KM = 30;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const STORE_TILES = STORE_LOCATIONS.map((location) => ({
  location,
  restaurantCount: BRANDS.filter((b) => b.storeLocationId === location.id).length,
}));

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
  const hubId = useCart((s) => s.hub);
  const coords = useCart((s) => s.coords);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

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

  const origin = React.useMemo(() => {
    const hubCoords = hubId ? HUBS.find((hub) => hub.id === hubId)?.coordinates ?? null : null;
    return hubCoords ?? coords;
  }, [hubId, coords]);

  const tiles = React.useMemo(() => {
    return STORE_TILES.map((tile) => {
      let distanceKm: number | null = null;
      if (mounted && origin) {
        const d = haversineKm(origin, tile.location.coordinates);
        if (d <= SERVICE_RADIUS_KM) distanceKm = d;
      }
      return { ...tile, distanceKm };
    }).sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [origin, mounted]);

  const visibleTiles = tiles.filter(
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
                    {selected ? <Check className="h-3 w-3 text-background" /> : null}
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
                  {tile.distanceKm != null
                    ? `${tile.distanceKm.toFixed(1)} km away`
                    : tile.location.area}
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
              const clusterDistance =
                mounted && origin ? haversineKm(origin, cluster.anchor.coordinates) : null;
              const showClusterDistance =
                clusterDistance != null && clusterDistance <= SERVICE_RADIUS_KM;
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
                      {showClusterDistance
                        ? `${clusterDistance.toFixed(1)} km · ${cluster.anchor.area}`
                        : cluster.anchor.area}
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
