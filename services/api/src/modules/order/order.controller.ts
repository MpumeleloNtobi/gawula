import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { PlaceOrderDto } from "./order.dto";
import { JwtAuthGuard, Roles, CurrentUser } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";

@Controller("orders")
@UseGuards(JwtAuthGuard)
@Roles("customer")
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Post()
  place(@CurrentUser() user: Principal, @Body() dto: PlaceOrderDto) {
    return this.orders.place(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: Principal) {
    return this.orders.listForCustomer(user.id);
  }

  @Get(":id")
  get(@CurrentUser() user: Principal, @Param("id") id: string) {
    return this.orders.getForCustomer(user.id, id);
  }
}
