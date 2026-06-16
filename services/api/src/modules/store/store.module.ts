import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { OrderModule } from "../order/order.module";
import { StoreService } from "./store.service";
import { StoreController } from "./store.controller";

@Module({
  imports: [IdentityModule, OrderModule],
  providers: [StoreService],
  controllers: [StoreController],
})
export class StoreModule {}
