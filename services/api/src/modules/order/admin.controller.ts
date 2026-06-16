import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { CurrentUser, JwtAuthGuard, Roles } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";
import {
  AdminNoteDto,
  AdminReasonDto,
  AdminReassignRiderDto,
  AdminRefundDto,
  AdminTransitionSubOrderDto,
} from "./order.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard)
@Roles("admin")
export class AdminController {
  constructor(private readonly orders: OrderService) {}

  @Get("orders")
  listOrders() {
    return this.orders.listAllForAdmin();
  }

  @Get("orders/:id")
  orderDetail(@Param("id") id: string) {
    return this.orders.adminOrderDetail(id);
  }

  @Patch("orders/:id/cancel")
  cancelOrder(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: AdminReasonDto,
  ) {
    return this.orders.adminCancelOrder(id, this.actor(user), dto.reason);
  }

  @Patch("suborders/:id/cancel")
  cancelSubOrder(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: AdminReasonDto,
  ) {
    return this.orders.adminCancelSubOrder(id, this.actor(user), dto.reason);
  }

  @Patch("suborders/:id/status")
  transitionSubOrder(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: AdminTransitionSubOrderDto,
  ) {
    return this.orders.adminTransitionSubOrder(id, this.actor(user), dto.status, dto.reason);
  }

  @Post("orders/:id/trip/cancel")
  cancelTrip(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: AdminReasonDto,
  ) {
    return this.orders.adminCancelTrip(id, this.actor(user), dto.reason);
  }

  @Post("orders/:id/trip/reassign")
  reassignRider(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: AdminReassignRiderDto,
  ) {
    return this.orders.adminReassignRider(id, this.actor(user), dto.riderId, dto.reason);
  }

  @Post("orders/:id/refund")
  refund(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: AdminRefundDto,
  ) {
    return this.orders.adminRefund(id, this.actor(user), dto.amountCents, dto.reason);
  }

  @Post("orders/:id/notes")
  addNote(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: AdminNoteDto,
  ) {
    return this.orders.adminAddNote(id, this.actor(user), dto.note);
  }

  @Get("riders")
  riders() {
    return this.orders.listRidersForAdmin();
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

  private actor(user: Principal) {
    return { id: user.id, email: user.email ?? null };
  }
}
