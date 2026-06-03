import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { PartnerController } from "./partner.controller";
import { AdminController } from "./admin.controller";

@Module({
  imports: [IdentityModule],
  providers: [OrderService],
  controllers: [OrderController, PartnerController, AdminController],
  exports: [OrderService],
})
export class OrderModule {}
