import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { JwtAuthGuard, Roles } from "../identity/jwt-auth.guard";

@Controller("admin")
@UseGuards(JwtAuthGuard)
@Roles("admin")
export class AdminController {
  constructor(private readonly orders: OrderService) {}

  @Get("orders")
  listOrders() {
    return this.orders.listAllForAdmin();
  }

  @Get("overview")
  overview(@Query("period") period?: string) {
    return this.orders.adminOverview(period);
  }

  @Get("customers")
  customers() {
    return this.orders.listCustomersForAdmin();
  }

  @Get("analytics")
  analytics() {
    return this.orders.adminAnalytics();
  }

  @Get("payouts")
  payouts() {
    return this.orders.listPayoutsForAdmin();
  }
}
