import { BadRequestException, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { OrderService } from "../order/order.service";

const PROVIDER = process.env.PAYMENTS_PROVIDER ?? "stub";

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly orders: OrderService) {}

  onModuleInit() {
    if (PROVIDER === "stub") {
      this.logger.warn(
        "Payments are running in STUB mode (no real charge). Set PAYMENTS_PROVIDER and integrate a gateway before production launch.",
      );
    }
  }

  async confirm(orderId: string, customerId: string) {
    if (PROVIDER !== "stub") {
      throw new BadRequestException(
        `Payment provider "${PROVIDER}" is not implemented yet.`,
      );
    }
    return this.orders.markPaid(orderId, customerId);
  }
}
