import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { DispatchService } from "./dispatch.service";
import { AvailabilityDto, ClaimTripDto, PickupDto } from "./dispatch.dto";
import { JwtAuthGuard, Roles, CurrentUser } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";

@Controller("dispatch")
@UseGuards(JwtAuthGuard)
@Roles("rider")
export class DispatchController {
  constructor(private readonly dispatch: DispatchService) {}

  @Get("me")
  me(@CurrentUser() user: Principal) {
    return this.dispatch.me(user.id);
  }

  @Post("availability")
  @HttpCode(200)
  setAvailability(@CurrentUser() user: Principal, @Body() dto: AvailabilityDto) {
    return this.dispatch.setAvailability(user.id, dto.online);
  }

  @Get("trips/available")
  available(@CurrentUser() user: Principal) {
    return this.dispatch.availableTrips(user.id);
  }

  @Get("trips/mine")
  mine(@CurrentUser() user: Principal) {
    return this.dispatch.myTrips(user.id);
  }

  @Post("trips/claim")
  claim(@CurrentUser() user: Principal, @Body() dto: ClaimTripDto) {
    return this.dispatch.claim(user.id, dto.orderId);
  }

  @Post("trips/:id/pickup")
  pickup(@CurrentUser() user: Principal, @Param("id") id: string, @Body() dto: PickupDto) {
    return this.dispatch.pickup(user.id, id, dto.subOrderId);
  }

  @Post("trips/:id/deliver")
  deliver(@CurrentUser() user: Principal, @Param("id") id: string) {
    return this.dispatch.deliver(user.id, id);
  }
}
