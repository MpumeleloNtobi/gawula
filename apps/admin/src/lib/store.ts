"use client";
import { api } from "./api";

export type StoreOverview = {
  outlet: { id: string; name: string; brand: string; locationInMall: string };
  salesTodayCents: number;
  ordersToday: number;
  activeOrders: number;
  avgPrepMinutes: number | null;
  rating: { average: number | null; count: number };
};

export type StoreOrderItem = {
  id: string;
  name: string;
  qty: number;
  fulfilledQty: number | null;
  notes: string | null;
  totalCents: number;
};

export type StoreOrder = {
  id: string;
  orderId: string;
  status: "pending" | "accepted" | "preparing" | "ready" | "collected" | "rejected" | "cancelled";
  foodSubtotalCents: number;
  placedAt: string;
  readyAt: string | null;
  customerName: string | null;
  addressLine: string | null;
  fulfilmentMode: "delivery" | "pickup";
  items: StoreOrderItem[];
};

export type StoreMenuItem = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  prepTimeMinutes: number;
  category: string;
  available: boolean;
  imageUrl: string | null;
};

export type StoreMenu = {
  categories: string[];
  items: StoreMenuItem[];
};

export type HoursWindow = { open: string; close: string; closed?: boolean };
export type WeeklyHours = {
  mon: HoursWindow;
  tue: HoursWindow;
  wed: HoursWindow;
  thu: HoursWindow;
  fri: HoursWindow;
  sat: HoursWindow;
  sun: HoursWindow;
};

export type StoreSettings = {
  outletId: string;
  name: string;
  brand: string;
  locationInMall: string;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  hours: WeeklyHours;
  autoAcceptOrders: boolean;
  pauseNewOrders: boolean;
  showPrepTime: boolean;
  allowTipping: boolean;
};

export type StoreReview = {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  customerName: string | null;
  reply: { id: string; text: string; createdAt: string } | null;
};

export type StoreReviews = {
  summary: {
    total: number;
    average: number | null;
    distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  };
  reviews: StoreReview[];
};

export type StorePayout = {
  id: string;
  amountCents: number;
  ref: string | null;
  runId: string;
  runDate: string;
  kind: string;
  status: string;
};

export type DailySalesPoint = { dateKey: string; salesCents: number; orders: number };
export type SalesSeriesPoint = { label: string; salesCents: number; orders: number };
export type HourlyPoint = { hour: number; orders: number };
export type TopItem = { itemId: string; name: string; qty: number; revenueCents: number };
export type RevenueSummary = {
  windowDays: number;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  orders: number;
  avgPrepMinutes: number | null;
  rating: { average: number | null; count: number };
};

export type AnalyticsRange = "1d" | "7d" | "30d" | "90d" | "365d";
export type SalesGranularity = "today" | "daily" | "weekly" | "monthly" | "yearly";

export type PromotionStatus = "active" | "scheduled" | "ended" | "paused";

export type PromotionType =
  | "percentage"
  | "fixed"
  | "free_delivery"
  | "free_item"
  | "bogo"
  | "happy_hour"
  | "item_discount"
  | "buy_save";

export type Promotion = {
  id: string;
  type: PromotionType;
  percentOff: number;
  amountOffCents: number;
  minSpendCents: number;
  buyItemId: string | null;
  getItemId: string | null;
  freeItemId: string | null;
  itemIds: string[];
  category: string | null;
  buyItemName: string | null;
  getItemName: string | null;
  freeItemName: string | null;
  itemNames: string[];
  buyQuantity: number;
  getQuantity: number;
  days: number[];
  startTime: string | null;
  endTime: string | null;
  paused: boolean;
  startAt: string | null;
  endAt: string | null;
  redemptionCount: number;
  createdAt: string;
  status: PromotionStatus;
};

export type PromotionList = {
  summary: { total: number; active: number; scheduled: number; redemptions: number };
  promotions: Promotion[];
};

export type PromotionInput = {
  type: PromotionType;
  percentOff?: number;
  amountOffCents?: number;
  minSpendCents?: number;
  buyItemId?: string;
  getItemId?: string;
  freeItemId?: string;
  itemIds?: string[];
  category?: string;
  buyQuantity?: number;
  getQuantity?: number;
  days?: number[];
  startTime?: string | null;
  endTime?: string | null;
  startAt?: string | null;
  endAt?: string | null;
};

const auth = (token: string | null) => ({ token: token ?? undefined });

export const storeApi = {
  overview: (token: string | null) =>
    api<StoreOverview>("/store/overview", auth(token)),
  orders: (token: string | null, scope: "active" | "past") =>
    api<StoreOrder[]>(`/store/orders?scope=${scope}`, auth(token)),
  transitionOrder: (
    token: string | null,
    id: string,
    status: "accepted" | "preparing" | "ready" | "collected" | "rejected",
    reason?: string,
    code?: string,
  ) =>
    api<StoreOrder>(`/store/orders/${id}/status`, {
      method: "PATCH",
      body: { status, ...(reason ? { reason } : {}), ...(code ? { code } : {}) },
      ...auth(token),
    }),
  adjustOrderItems: (
    token: string | null,
    id: string,
    adjustments: { orderItemId: string; fulfilledQty: number }[],
    reason?: string,
  ) =>
    api<StoreOrder>(`/store/orders/${id}/items`, {
      method: "PATCH",
      body: { adjustments, ...(reason ? { reason } : {}) },
      ...auth(token),
    }),
  menu: (token: string | null) => api<StoreMenu>("/store/menu", auth(token)),
  createItem: (token: string | null, payload: Omit<StoreMenuItem, "id">) =>
    api<StoreMenuItem>("/store/menu/items", {
      method: "POST",
      body: payload,
      ...auth(token),
    }),
  updateItem: (token: string | null, id: string, payload: Omit<StoreMenuItem, "id">) =>
    api<StoreMenuItem>(`/store/menu/items/${id}`, {
      method: "PATCH",
      body: payload,
      ...auth(token),
    }),
  toggleItem: (token: string | null, id: string, available: boolean) =>
    api<StoreMenuItem>(`/store/menu/items/${id}/availability`, {
      method: "PATCH",
      body: { available },
      ...auth(token),
    }),
  deleteItem: (token: string | null, id: string) =>
    api<{ id: string; deleted: boolean }>(`/store/menu/items/${id}`, {
      method: "DELETE",
      ...auth(token),
    }),
  settings: (token: string | null) =>
    api<StoreSettings>("/store/settings", auth(token)),
  updateSettings: (token: string | null, payload: Partial<StoreSettings>) =>
    api<StoreSettings>("/store/settings", {
      method: "PATCH",
      body: payload,
      ...auth(token),
    }),
  reviews: (token: string | null) => api<StoreReviews>("/store/reviews", auth(token)),
  replyReview: (token: string | null, id: string, text: string) =>
    api<unknown>(`/store/reviews/${id}/reply`, {
      method: "POST",
      body: { text },
      ...auth(token),
    }),
  payouts: (token: string | null) => api<StorePayout[]>("/store/payouts", auth(token)),
  promotions: (token: string | null) =>
    api<PromotionList>("/store/promotions", auth(token)),
  createPromotion: (token: string | null, payload: PromotionInput) =>
    api<Promotion>("/store/promotions", {
      method: "POST",
      body: payload,
      ...auth(token),
    }),
  updatePromotion: (token: string | null, id: string, payload: PromotionInput) =>
    api<Promotion>(`/store/promotions/${id}`, {
      method: "PATCH",
      body: payload,
      ...auth(token),
    }),
  setPromotionPaused: (token: string | null, id: string, paused: boolean) =>
    api<Promotion>(`/store/promotions/${id}/status`, {
      method: "PATCH",
      body: { paused },
      ...auth(token),
    }),
  deletePromotion: (token: string | null, id: string) =>
    api<{ id: string; deleted: boolean }>(`/store/promotions/${id}`, {
      method: "DELETE",
      ...auth(token),
    }),
  dailySales: (token: string | null, range: AnalyticsRange = "7d") =>
    api<DailySalesPoint[]>(`/store/analytics/daily-sales?range=${range}`, auth(token)),
  salesSeries: (token: string | null, granularity: SalesGranularity = "daily") =>
    api<SalesSeriesPoint[]>(`/store/analytics/sales-series?granularity=${granularity}`, auth(token)),
  hourly: (token: string | null, range: AnalyticsRange = "30d") =>
    api<HourlyPoint[]>(`/store/analytics/hourly?range=${range}`, auth(token)),
  topItems: (token: string | null, range: AnalyticsRange = "30d") =>
    api<TopItem[]>(`/store/analytics/top-items?range=${range}`, auth(token)),
  revenue: (token: string | null, range: AnalyticsRange = "30d") =>
    api<RevenueSummary>(`/store/analytics/revenue?range=${range}`, auth(token)),
};
