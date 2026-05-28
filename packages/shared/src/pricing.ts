export const SERVICE_FEE_PCT = 0.05;
export const SERVICE_FEE_CAP_CENTS = 1500;

export type SurgeReason = "peak" | "weather" | null;

export interface PricingInput {
  foodSubtotalCents: number;
  baseDeliveryFeeCents: number;
  surgeMultiplier: number;
  mallPassActive: boolean;
  tipCents: number;
}

export interface PricingResult {
  foodSubtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  tipCents: number;
  totalCents: number;
  surgeMultiplier: number;
  mallPassApplied: boolean;
}

export function computePricing(input: PricingInput): PricingResult {
  const deliveryFeeCents = input.mallPassActive
    ? 0
    : Math.round(input.baseDeliveryFeeCents * input.surgeMultiplier);
  const serviceFeeCents = Math.min(
    Math.round(input.foodSubtotalCents * SERVICE_FEE_PCT),
    SERVICE_FEE_CAP_CENTS,
  );
  return {
    foodSubtotalCents: input.foodSubtotalCents,
    deliveryFeeCents,
    serviceFeeCents,
    tipCents: input.tipCents,
    totalCents:
      input.foodSubtotalCents + deliveryFeeCents + serviceFeeCents + input.tipCents,
    surgeMultiplier: input.surgeMultiplier,
    mallPassApplied: input.mallPassActive,
  };
}

export function surgeForTime(date: Date): { multiplier: number; reason: SurgeReason } {
  const day = date.getDay();
  const hour = date.getHours();
  if ((day === 5 || day === 6) && hour >= 18 && hour < 21) {
    return { multiplier: 1.3, reason: "peak" };
  }
  if (day === 0 && hour >= 12 && hour < 14) {
    return { multiplier: 1.3, reason: "peak" };
  }
  return { multiplier: 1.0, reason: null };
}
