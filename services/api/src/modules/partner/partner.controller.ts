import { Body, Controller, HttpCode, Param, Post } from "@nestjs/common";
import { PartnerService } from "./partner.service";
import { CreatePartnerApplicationDto, VerifyPartnerEmailDto } from "./partner.dto";

@Controller("partners")
export class PartnerController {
  constructor(private readonly partner: PartnerService) {}

  @Post("applications")
  @HttpCode(201)
  create(@Body() dto: CreatePartnerApplicationDto) {
    return this.partner.createApplication(dto);
  }

  @Post("applications/verify-email")
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyPartnerEmailDto) {
    return this.partner.verifyEmail(dto);
  }

  @Post("applications/:id/resend-verification")
  @HttpCode(200)
  resendVerification(@Param("id") id: string) {
    return this.partner.resendVerification(id);
  }
}
