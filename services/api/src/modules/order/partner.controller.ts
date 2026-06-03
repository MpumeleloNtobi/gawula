import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { UpdateSubOrderStatusDto } from "./order.dto";
import { JwtAuthGuard, Roles, CurrentUser } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";

@Controller("partner")
@UseGuards(JwtAuthGuard)
@Roles("partner")
export class PartnerController {
  constructor(private readonly orders: OrderService) {}

  @Get("suborders")
  list(@CurrentUser() user: Principal) {
    return this.orders.listForOutlet(this.outletId(user));
  }

  @Patch("suborders/:id/status")
  update(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: UpdateSubOrderStatusDto,
  ) {
    return this.orders.transitionSubOrder(this.outletId(user), id, dto.status);
  }

  private outletId(user: Principal): string {
    if (!user.outletId) {
      throw new ForbiddenException("This partner account is not linked to an outlet");
    }
    return user.outletId;
  }
}
