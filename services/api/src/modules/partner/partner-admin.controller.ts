import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { PartnerService } from "./partner.service";
import {
  BulkPartnerApplicationIdsDto,
  BulkRejectPartnerApplicationDto,
  BulkSetPartnerStageDto,
  RejectPartnerApplicationDto,
  SetPartnerStageDto,
} from "./partner.dto";
import { CurrentUser, JwtAuthGuard, Roles } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";

@Controller("admin/partner-applications")
@UseGuards(JwtAuthGuard)
@Roles("admin")
export class PartnerAdminController {
  constructor(private readonly partner: PartnerService) {}

  @Get()
  list() {
    return this.partner.listForAdmin();
  }

  @Post("bulk/stage")
  @HttpCode(200)
  bulkStage(@CurrentUser() user: Principal, @Body() dto: BulkSetPartnerStageDto) {
    return this.partner.bulkSetStage(dto.ids, user.id, dto.stage);
  }

  @Post("bulk/promote")
  @HttpCode(200)
  bulkPromote(@CurrentUser() user: Principal, @Body() dto: BulkPartnerApplicationIdsDto) {
    return this.partner.bulkPromoteFromWaitlist(dto.ids, user.id);
  }

  @Post("bulk/reject")
  @HttpCode(200)
  bulkReject(
    @CurrentUser() user: Principal,
    @Body() dto: BulkRejectPartnerApplicationDto,
  ) {
    return this.partner.bulkReject(dto.ids, user.id, dto.reason);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.partner.getForAdmin(id);
  }

  @Post(":id/stage")
  @HttpCode(200)
  setStage(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: SetPartnerStageDto,
  ) {
    return this.partner.setStage(id, user.id, dto.stage);
  }

  @Post(":id/reject")
  @HttpCode(200)
  reject(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: RejectPartnerApplicationDto,
  ) {
    return this.partner.reject(id, user.id, dto.reason);
  }

  @Post(":id/promote")
  @HttpCode(200)
  promote(@CurrentUser() user: Principal, @Param("id") id: string) {
    return this.partner.promoteFromWaitlist(id, user.id);
  }
}
