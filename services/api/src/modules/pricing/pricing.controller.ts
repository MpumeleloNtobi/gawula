import { Controller, Get, Param, Query } from "@nestjs/common";
import { PricingService } from "./pricing.service";

@Controller("pricing")
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get("cart/:cartId")
  preview(
    @Param("cartId") cartId: string,
    @Query("tipCents") tipCents?: string,
    @Query("mallPass") mallPass?: string,
  ) {
    return this.pricing.previewForCart(cartId, {
      tipCents: tipCents ? Number.parseInt(tipCents, 10) : 0,
      mallPassActive: mallPass === "true",
    });
  }
}
