import { Injectable } from "@nestjs/common";
import { computePricing, surgeForTime } from "@foyer/shared";
import { PrismaService } from "../../infrastructure/prisma.module";
import { CartService } from "../cart/cart.service";

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async previewForCart(cartId: string, opts?: { tipCents?: number; mallPassActive?: boolean }) {
    const cart = await this.cartService.get(cartId);
    const complex = await this.prisma.complex.findUniqueOrThrow({ where: { id: cart.complexId } });

    const foodSubtotalCents = cart.lines.reduce((sum, l) => sum + l.unitPriceCents * l.qty, 0);
    const surge = surgeForTime(new Date());
    const result = computePricing({
      foodSubtotalCents,
      baseDeliveryFeeCents: complex.baseDeliveryFeeCents,
      surgeMultiplier: surge.multiplier,
      mallPassActive: opts?.mallPassActive ?? false,
      tipCents: opts?.tipCents ?? 0,
    });

    const outletIds = [...new Set(cart.lines.map((l) => l.outletId))];
    return {
      cartId: cart.id,
      complexId: cart.complexId,
      outletCount: outletIds.length,
      surgeReason: surge.reason,
      ...result,
    };
  }
}
