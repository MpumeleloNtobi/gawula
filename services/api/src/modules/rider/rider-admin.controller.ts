import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { RiderService } from "./rider.service";
import { BulkRejectRiderApplicationDto, BulkRiderApplicationIdsDto, RejectRiderApplicationDto } from "./rider.dto";
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

  @Post("bulk/approve")
  @HttpCode(200)
  bulkApprove(@CurrentUser() user: Principal, @Body() dto: BulkRiderApplicationIdsDto) {
    return this.rider.bulkApprove(dto.ids, user.id);
  }

  @Post("bulk/promote")
  @HttpCode(200)
  bulkPromote(@CurrentUser() user: Principal, @Body() dto: BulkRiderApplicationIdsDto) {
    return this.rider.bulkPromoteFromWaitlist(dto.ids, user.id);
  }

  @Post("bulk/reject")
  @HttpCode(200)
  bulkReject(
    @CurrentUser() user: Principal,
    @Body() dto: BulkRejectRiderApplicationDto,
  ) {
    return this.rider.bulkReject(dto.ids, user.id, dto.reason);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.rider.getForAdmin(id);
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

  @Post(":id/promote")
  @HttpCode(200)
  promote(@CurrentUser() user: Principal, @Param("id") id: string) {
    return this.rider.promoteFromWaitlist(id, user.id);
  }
}
