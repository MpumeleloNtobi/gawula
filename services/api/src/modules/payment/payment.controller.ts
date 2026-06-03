import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { JwtAuthGuard, Roles, CurrentUser } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";

@Controller("payments")
@UseGuards(JwtAuthGuard)
@Roles("customer")
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post(":orderId/confirm")
  confirm(@CurrentUser() user: Principal, @Param("orderId") orderId: string) {
    return this.payments.confirm(orderId, user.id);
  }
}
