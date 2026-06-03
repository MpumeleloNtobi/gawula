import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { PartnerService } from "./partner.service";
import { RejectPartnerApplicationDto, SetPartnerStageDto } from "./partner.dto";
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
}
