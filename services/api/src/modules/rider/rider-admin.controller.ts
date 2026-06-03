import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { RiderService } from "./rider.service";
import { RejectRiderApplicationDto } from "./rider.dto";
import { CurrentUser, JwtAuthGuard, Roles } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";

@Controller("admin/rider-applications")
@UseGuards(JwtAuthGuard)
@Roles("admin")
export class RiderAdminController {
  constructor(private readonly rider: RiderService) {}

  @Get()
  list() {
    return this.rider.listForAdmin();
  }

  @Post(":id/approve")
  @HttpCode(200)
  approve(@CurrentUser() user: Principal, @Param("id") id: string) {
    return this.rider.approve(id, user.id);
  }

  @Post(":id/reject")
  @HttpCode(200)
  reject(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: RejectRiderApplicationDto,
  ) {
    return this.rider.reject(id, user.id, dto.reason);
  }
}
