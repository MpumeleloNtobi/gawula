import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { RiderService } from "./rider.service";
import { RiderController } from "./rider.controller";
import { RiderAdminController } from "./rider-admin.controller";

@Module({
  imports: [IdentityModule],
  providers: [RiderService],
  controllers: [RiderController, RiderAdminController],
  exports: [RiderService],
})
export class RiderModule {}
