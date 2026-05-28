export type SubOrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "collected"
  | "rejected"
  | "cancelled";

export type OrderPublicStatus =
  | "received"
  | "preparing"
  | "ready"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export type TripStatus =
  | "available"
  | "claimed"
  | "pickup_loop"
  | "awaiting_outlet"
  | "in_delivery"
  | "at_customer"
  | "delivered"
  | "cancelled_by_ops";

export interface SubOrderSnapshot {
  status: SubOrderStatus;
}

export interface OrderAggregateInput {
  subOrders: SubOrderSnapshot[];
  tripStatus: TripStatus | null;
}

export function aggregatePublicStatus(input: OrderAggregateInput): OrderPublicStatus {
  const { subOrders, tripStatus } = input;
  if (tripStatus === "delivered") return "delivered";
  if (tripStatus === "in_delivery" || tripStatus === "at_customer") return "on_the_way";
  if (tripStatus === "cancelled_by_ops") return "cancelled";

  const active = subOrders.filter((s) => s.status !== "rejected" && s.status !== "cancelled");
  if (active.length === 0) return "cancelled";

  const allReadyOrCollected = active.every(
    (s) => s.status === "ready" || s.status === "collected",
  );
  if (allReadyOrCollected || tripStatus === "pickup_loop") return "ready";

  const anyPreparing = active.some((s) => s.status === "preparing");
  if (anyPreparing) return "preparing";

  return "received";
}
