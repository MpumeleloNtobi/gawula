export type Overview = {
  period: string;
  totalOrders: number;
  counts: Record<string, number>;
  revenueCents: number;
  complexes: number;
  ridersOnline: number;
  ordersDeltaPct: number | null;
  revenueDeltaPct: number | null;
};

export type AdminOrder = {
  id: string;
  complexName: string;
  customerName: string;
  status: string;
  paid: boolean;
  totalCents: number;
  outletCount: number;
  riderName: string | null;
  placedAt: string;
};

export type RiderApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  areaLabel: string;
  waitlisted: boolean;
  vehicleType: string;
  hasSmartphone: boolean;
  idNumber: string;
  stage: "submitted" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
};

export type PartnerStage = "submitted" | "in-review" | "verification" | "live" | "rejected";

export type PartnerApplication = {
  id: string;
  storeName: string;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactEmailVerified: boolean;
  tradeTypeLabel: string;
  locationName: string | null;
  address: string;
  areaLabel: string;
  waitlisted: boolean;
  soleProprietor: boolean;
  registrationNumber: string | null;
  logoDocName: string | null;
  registrationDocName: string | null;
  storefrontDocName: string | null;
  stage: PartnerStage;
  rejectionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
};

export type PartnerApplicationDetail = PartnerApplication & {
  firstName: string;
  lastName: string;
  storeEmail: string | null;
  storePhone: string | null;
  logoData: string | null;
  registrationData: string | null;
  storefrontData: string | null;
};

export type AdminCustomer = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpentCents: number;
  lastOrderAt: string | null;
  joinedAt: string;
  mallPassActive: boolean;
  active: boolean;
};

export type Analytics = {
  dailyRevenue: { day: string; revenueCents: number; orders: number }[];
  topStores: { name: string; revenueCents: number; orders: number }[];
  categoryBreakdown: { name: string; cents: number; pct: number }[];
  totalOrders: number;
  revenueCents: number;
};

export type Payout = {
  id: string;
  runDate: string;
  kind: string;
  status: string;
  lineCount: number;
  totalCents: number;
};

export const STATUS_LABEL: Record<string, string> = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_ORDER = [
  "received",
  "preparing",
  "ready",
  "on_the_way",
  "delivered",
  "cancelled",
];

export const VEHICLE_LABEL: Record<string, string> = {
  bicycle: "Bicycle",
  scooter: "Scooter",
  motorbike: "Motorbike",
  car: "Car",
};

export const PARTNER_STAGE_FLOW = ["submitted", "in-review", "verification", "live"] as const;

export const PARTNER_STAGE_LABEL: Record<PartnerStage, string> = {
  submitted: "Application received",
  "in-review": "In review",
  verification: "Store verification",
  live: "Live on Gawula",
  rejected: "Rejected",
};

export function nextPartnerStage(
  stage: PartnerStage
): (typeof PARTNER_STAGE_FLOW)[number] | null {
  const i = (PARTNER_STAGE_FLOW as readonly string[]).indexOf(stage);
  if (i < 0 || i >= PARTNER_STAGE_FLOW.length - 1) return null;
  return PARTNER_STAGE_FLOW[i + 1];
}
