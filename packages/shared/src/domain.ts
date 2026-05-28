export type ComplexId = string;
export type BrandId = string;
export type OutletId = string;
export type ItemId = string;
export type CustomerId = string;
export type OrderId = string;
export type SubOrderId = string;
export type RiderId = string;
export type TripId = string;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface OpeningHours {
  [dayOfWeek: number]: { open: string; close: string } | null;
}

export interface Complex {
  id: ComplexId;
  name: string;
  slug: string;
  centroid: GeoPoint;
  deliveryRadiusKm: number;
  baseDeliveryFeeCents: number;
  openingHours: OpeningHours;
  status: "active" | "paused";
}

export interface Brand {
  id: BrandId;
  name: string;
  slug: string;
  logoUrl?: string;
  logoColor?: string;
}

export interface Outlet {
  id: OutletId;
  brandId: BrandId;
  complexId: ComplexId;
  name: string;
  locationInMall: string;
  prepBufferMinutes: number;
  commissionPct: number;
  status: "active" | "paused" | "closed";
  coverUrl?: string;
  tagline?: string;
}

export type ModifierKind = "single" | "multiple";

export interface ModifierOption {
  id: string;
  name: string;
  priceDeltaCents: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  kind: ModifierKind;
  required: boolean;
  options: ModifierOption[];
}

export interface Item {
  id: ItemId;
  outletId: OutletId;
  name: string;
  description: string;
  priceCents: number;
  prepTimeMinutes: number;
  imageUrl?: string;
  available: boolean;
  category: string;
  modifiers: ModifierGroup[];
}

export interface SelectedModifier {
  groupId: string;
  optionIds: string[];
}

export interface CartLine {
  id: string;
  outletId: OutletId;
  itemId: ItemId;
  qty: number;
  modifiers: SelectedModifier[];
  notes?: string;
  unitPriceCents: number;
}

export interface Cart {
  id: string;
  customerId: CustomerId;
  complexId: ComplexId;
  lines: CartLine[];
  createdAt: string;
  expiresAt: string;
}
