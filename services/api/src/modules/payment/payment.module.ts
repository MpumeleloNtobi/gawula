import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { OrderModule } from "../order/order.module";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";

@Module({
  imports: [IdentityModule, OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
