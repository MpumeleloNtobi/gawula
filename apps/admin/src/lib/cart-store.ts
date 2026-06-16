"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DELIVERY_FEE,
  FULFILLMENT_ROUTES,
  SERVICE_FEE,
  MENU_ITEMS,
  getBrandDisplayName,
  getBrandLocation,
  type Hub,
  type StoreLocation,
} from "@/lib/mock-data";

export type CartLine = {
  lineId: string;
  itemId: string;
  quantity: number;
  modifiers: { groupId: string; optionId: string; name: string; priceDelta: number }[];
  specialInstructions?: string;
  unitPrice: number;
};

export type AddLineResult =
  | { ok: true; mode?: FulfillmentMode; label?: string; reason?: string; effortFee?: number }
  | { ok: false; code: "unknown-item" | "unknown-store"; reason: string };

export type FulfillmentMode = "single-store" | "same-location" | "planned-route" | "nearby-radius" | "custom-route";

export type DeliveryQuote = {
  mode: FulfillmentMode;
  modeLabel: string;
  label: string;
  description: string;
  baseFee: number;
  effortFee: number;
  totalFee: number;
  distanceKm: number;
  pickupDistanceKm: number;
  dropoffDistanceKm: number;
  pickupStops: number;
  destinationName?: string;
};

function lineSignature(line: Pick<CartLine, "itemId" | "modifiers" | "specialInstructions">) {
  const mods = [...line.modifiers]
    .map((m) => `${m.groupId}:${m.optionId}`)
    .sort()
    .join("|");
  return `${line.itemId}::${mods}::${line.specialInstructions ?? ""}`;
}

const NEARBY_RADIUS_KM = 6;

function uniqueLocations(locations: StoreLocation[]) {
  return Array.from(new Map(locations.map((location) => [location.id, location])).values());
}

function distanceKm(first: StoreLocation, second: StoreLocation) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadians(second.coordinates.lat - first.coordinates.lat);
  const lngDelta = toRadians(second.coordinates.lng - first.coordinates.lng);
  const firstLat = toRadians(first.coordinates.lat);
  const secondLat = toRadians(second.coordinates.lat);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function routeDistanceKm(locations: StoreLocation[]) {
  if (locations.length < 2) return 0;
  const remaining = locations.slice(1);
  let current = locations[0];
  let distance = 0;

  while (remaining.length > 0) {
    let nextIndex = 0;
    let nextDistance = distanceKm(current, remaining[0]);
    for (let index = 1; index < remaining.length; index += 1) {
      const candidateDistance = distanceKm(current, remaining[index]);
      if (candidateDistance < nextDistance) {
        nextDistance = candidateDistance;
        nextIndex = index;
      }
    }
    distance += nextDistance;
    current = remaining[nextIndex];
    remaining.splice(nextIndex, 1);
  }

  return distance;
}

function maxDistanceKm(locations: StoreLocation[]) {
  let maxDistance = 0;
  for (let firstIndex = 0; firstIndex < locations.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < locations.length; secondIndex += 1) {
      maxDistance = Math.max(maxDistance, distanceKm(locations[firstIndex], locations[secondIndex]));
    }
  }
  return maxDistance;
}

function roundFee(value: number) {
  return Math.ceil(value / 100) * 100;
}

function nearestDistanceTo(
  origin: { lat: number; lng: number },
  locations: StoreLocation[],
): number {
  if (locations.length === 0) return 0;
  const ghost: StoreLocation = {
    id: "__destination",
    name: "destination",
    type: "cluster",
    area: "",
    coordinates: origin,
    proximityGroupId: "",
    proximityLabel: "",
    routeIds: [],
    pickupPoint: "",
    rating: 0,
    hasOffer: false,
  };
  return Math.min(...locations.map((location) => distanceKm(ghost, location)));
}

function resolvePlannedRoute(locations: StoreLocation[]) {
  const maximumDistance = maxDistanceKm(locations);
  return FULFILLMENT_ROUTES.find(
    (route) =>
      locations.every((location) => route.locationIds.includes(location.id)) &&
      maximumDistance <= route.radiusKm,
  );
}

type CartState = {
  hub: string | null;
  address: string | null;
  coords: { lat: number; lng: number } | null;
  lines: CartLine[];
  drawerOpen: boolean;
  hydrated: boolean;
  setHydrated: () => void;
  setHub: (hubId: string, address: string) => void;
  setCoords: (coords: { lat: number; lng: number } | null) => void;
  addLine: (line: Omit<CartLine, "lineId">) => AddLineResult;
  updateQuantity: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  setDrawerOpen: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      hub: null,
      address: null,
      coords: null,
      lines: [],
      drawerOpen: false,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setHub: (hubId, address) => set({ hub: hubId, address }),
      setCoords: (coords) => set({ coords }),
      addLine: (line) => {
        const compatibility = canAddItemToCart(get().lines, line.itemId);
        if (!compatibility.ok) return compatibility;

        set((state) => {
          const sig = lineSignature(line);
          const existing = state.lines.find((l) => lineSignature(l) === sig);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.lineId === existing.lineId
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              { ...line, lineId: Math.random().toString(36).slice(2, 10) },
            ],
          };
        });
        return { ok: true };
      },
      updateQuantity: (lineId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.lineId !== lineId)
              : state.lines.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l)),
        })),
      removeLine: (lineId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),
      clear: () => set({ lines: [] }),
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
    }),
    {
      name: "foodcourt-cart",
      version: 2,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as { lines?: CartLine[] };
        const merged: CartLine[] = [];
        const bySig = new Map<string, number>();
        for (const line of state.lines ?? []) {
          const sig = lineSignature(line);
          const idx = bySig.get(sig);
          if (idx !== undefined) {
            merged[idx] = {
              ...merged[idx],
              quantity: merged[idx].quantity + line.quantity,
            };
          } else {
            bySig.set(sig, merged.length);
            merged.push(line);
          }
        }
        return { ...state, lines: merged } as never;
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);

export function deliveryQuoteForBrandIds(brandIds: string[], destination?: Hub | null): DeliveryQuote {
  const locations = uniqueLocations(
    brandIds
      .map((brandId) => getBrandLocation(brandId))
      .filter((location): location is StoreLocation => Boolean(location)),
  );
  const storeCount = new Set(brandIds).size;
  const extraStores = Math.max(storeCount - 1, 0);
  const dropoffDistance = destination ? nearestDistanceTo(destination.coordinates, locations) : 0;
  const destinationName = destination?.name;

  if (locations.length === 0) {
    return {
      mode: "single-store",
      modeLabel: "No stores",
      label: "No route yet",
      description: "Add a store to calculate delivery.",
      baseFee: 0,
      effortFee: 0,
      totalFee: 0,
      distanceKm: 0,
      pickupDistanceKm: 0,
      dropoffDistanceKm: 0,
      pickupStops: 0,
      destinationName,
    };
  }

  const baseFee = DELIVERY_FEE;
  const dropoffFee = roundFee(dropoffDistance * 380);

  if (locations.length === 1) {
    const location = locations[0];
    const effortFee = roundFee(extraStores * 500) + dropoffFee;
    return {
      mode: storeCount > 1 ? "same-location" : "single-store",
      modeLabel: storeCount > 1 ? "Same mall or complex" : "Single store",
      label: location.name,
      description: destination
        ? `${storeCount > 1 ? `Same ${location.type} pickup` : location.pickupPoint}, then ${dropoffDistance.toFixed(1)} km to ${destination.name}.`
        : storeCount > 1
        ? `Same ${location.type} pickup with a small counter-effort fee.`
        : location.pickupPoint,
      baseFee,
      effortFee,
      totalFee: baseFee + effortFee,
      distanceKm: dropoffDistance,
      pickupDistanceKm: 0,
      dropoffDistanceKm: dropoffDistance,
      pickupStops: 1,
      destinationName,
    };
  }

  const pickupDistance = routeDistanceKm(locations);
  const pickupStops = locations.length;
  const extraStops = Math.max(pickupStops - 1, 0);
  const plannedRoute = resolvePlannedRoute(locations);
  const totalDistance = pickupDistance + dropoffDistance;

  if (plannedRoute) {
    const effortFee = roundFee(extraStops * 900 + extraStores * 400 + pickupDistance * 220) + dropoffFee;
    return {
      mode: "planned-route",
      modeLabel: "Planned route",
      label: plannedRoute.label,
      description: `${plannedRoute.name}, priced by pickup stops and ${totalDistance.toFixed(1)} km total (${pickupDistance.toFixed(1)} km collecting${dropoffDistance > 0 ? `, ${dropoffDistance.toFixed(1)} km to ${destinationName ?? "you"}` : ""}).`,
      baseFee,
      effortFee,
      totalFee: baseFee + effortFee,
      distanceKm: totalDistance,
      pickupDistanceKm: pickupDistance,
      dropoffDistanceKm: dropoffDistance,
      pickupStops,
      destinationName,
    };
  }

  const maximumDistance = maxDistanceKm(locations);
  if (maximumDistance <= NEARBY_RADIUS_KM) {
    const effortFee = roundFee(extraStops * 1500 + extraStores * 500 + pickupDistance * 350) + dropoffFee;
    return {
      mode: "nearby-radius",
      modeLabel: "Nearby radius",
      label: `Within ${NEARBY_RADIUS_KM} km`,
      description: `Nearby stores combined within ${NEARBY_RADIUS_KM} km, then ${dropoffDistance.toFixed(1)} km to ${destinationName ?? "you"}.`,
      baseFee,
      effortFee,
      totalFee: baseFee + effortFee,
      distanceKm: totalDistance,
      pickupDistanceKm: pickupDistance,
      dropoffDistanceKm: dropoffDistance,
      pickupStops,
      destinationName,
    };
  }

  const effortFee = roundFee(2500 + extraStops * 2200 + extraStores * 600 + pickupDistance * 450) + dropoffFee;
  return {
    mode: "custom-route",
    modeLabel: "Custom route",
    label: "Custom pickup route",
    description: `Custom pickup route for ${pickupStops} stops over ${pickupDistance.toFixed(1)} km${dropoffDistance > 0 ? `, plus ${dropoffDistance.toFixed(1)} km to ${destinationName ?? "you"}` : ""}.`,
    baseFee,
    effortFee,
    totalFee: baseFee + effortFee,
    distanceKm: totalDistance,
    pickupDistanceKm: pickupDistance,
    dropoffDistanceKm: dropoffDistance,
    pickupStops,
    destinationName,
  };
}

export function deliveryQuoteForLines(lines: CartLine[], destination?: Hub | null) {
  return deliveryQuoteForBrandIds(cartBrandIds(lines), destination);
}

export function cartTotals(lines: CartLine[], destination?: Hub | null) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const deliveryQuote = deliveryQuoteForLines(lines, destination);
  const deliveryFee = lines.length > 0 ? deliveryQuote.totalFee : 0;
  const serviceFee = lines.length > 0 ? SERVICE_FEE : 0;
  return {
    subtotal,
    deliveryFee,
    serviceFee,
    total: subtotal + deliveryFee + serviceFee,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    deliveryQuote,
  };
}

export function cartBrandIds(lines: CartLine[]) {
  return Array.from(
    new Set(
      lines
        .map((line) => MENU_ITEMS.find((item) => item.id === line.itemId)?.brandId)
        .filter((brandId): brandId is string => Boolean(brandId)),
    ),
  );
}

export function canAddBrandToCart(lines: CartLine[], nextBrandId: string): AddLineResult {
  const existingBrandIds = cartBrandIds(lines);
  const nextLocation = getBrandLocation(nextBrandId);

  if (!nextLocation) {
    return {
      ok: false,
      code: "unknown-store",
      reason: `${getBrandDisplayName(nextBrandId)} is not available for multi-store delivery yet.`,
    };
  }

  const nextBrandIds = existingBrandIds.includes(nextBrandId)
    ? existingBrandIds
    : [...existingBrandIds, nextBrandId];
  const quote = deliveryQuoteForBrandIds(nextBrandIds);

  return {
    ok: true,
    mode: quote.mode,
    label: quote.modeLabel,
    reason: quote.description,
    effortFee: quote.effortFee,
  };
}

export function canAddItemToCart(lines: CartLine[], itemId: string): AddLineResult {
  const item = MENU_ITEMS.find((menuItem) => menuItem.id === itemId);
  if (!item) {
    return {
      ok: false,
      code: "unknown-item",
      reason: "This item is no longer available.",
    };
  }
  return canAddBrandToCart(lines, item.brandId);
}

export function cartFulfillmentContext(lines: CartLine[]) {
  const brandIds = cartBrandIds(lines);
  const locations = brandIds.map(getBrandLocation).filter((location): location is NonNullable<typeof location> => Boolean(location));
  const firstLocation = locations[0];
  const deliveryQuote = deliveryQuoteForBrandIds(brandIds);

  if (!firstLocation) return null;

  const locationIds = new Set(locations.map((location) => location.id));

  return {
    brandIds,
    storeCount: brandIds.length,
    isMultiStore: brandIds.length > 1,
    locationName: deliveryQuote.label,
    area: firstLocation.area,
    pickupPoint: deliveryQuote.description,
    proximityLabel: deliveryQuote.modeLabel,
    sameLocation: locationIds.size === 1,
    deliveryQuote,
  };
}

export function linesByBrand(lines: CartLine[]) {
  const groups = new Map<string, CartLine[]>();
  for (const line of lines) {
    const item = MENU_ITEMS.find((m) => m.id === line.itemId);
    if (!item) continue;
    const arr = groups.get(item.brandId) ?? [];
    arr.push(line);
    groups.set(item.brandId, arr);
  }
  return groups;
}

export type ResolvedOrderLine = { outletId: string; itemId: string; qty: number; notes?: string };

export function resolveOrderLines(lines: CartLine[], complexId: string): ResolvedOrderLine[] {
  const resolved: ResolvedOrderLine[] = [];
  for (const line of lines) {
    const item = MENU_ITEMS.find((m) => m.id === line.itemId);
    if (!item) continue;
    const outletId = `${complexId}:${item.brandId}`;
    const slug = item.id.slice(item.id.indexOf("-") + 1);
    resolved.push({
      outletId,
      itemId: `${outletId}:${slug}`,
      qty: line.quantity,
      notes: line.specialInstructions || undefined,
    });
  }
  return resolved;
}
