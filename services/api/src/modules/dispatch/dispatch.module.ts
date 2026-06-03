import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { OrderModule } from "../order/order.module";
import { DispatchService } from "./dispatch.service";
import { DispatchController } from "./dispatch.controller";

@Module({
  imports: [IdentityModule, OrderModule],
  providers: [DispatchService],
  controllers: [DispatchController],
})
export class DispatchModule {}
