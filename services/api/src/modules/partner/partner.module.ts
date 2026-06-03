import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { PartnerService } from "./partner.service";
import { PartnerController } from "./partner.controller";
import { PartnerAdminController } from "./partner-admin.controller";

@Module({
  imports: [IdentityModule],
  providers: [PartnerService],
  controllers: [PartnerController, PartnerAdminController],
  exports: [PartnerService],
})
export class PartnerModule {}
