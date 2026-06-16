import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard, Roles, CurrentUser } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";
import { StoreService } from "./store.service";
import { OrderService } from "../order/order.service";
import { UpdateSubOrderStatusDto, AdjustSubOrderItemsDto } from "../order/order.dto";
import {
  AnalyticsRangeDto,
  SalesSeriesDto,
  OrdersQueryDto,
  PromotionStatusDto,
  ReplyReviewDto,
  UpdateSettingsDto,
  UpsertItemDto,
  UpsertPromotionDto,
} from "./store.dto";

@Controller("store")
@UseGuards(JwtAuthGuard)
@Roles("partner")
export class StoreController {
  constructor(
    private readonly store: StoreService,
    private readonly orders: OrderService,
  ) {}

  @Get("overview")
  overview(@CurrentUser() user: Principal) {
    return this.store.getOverview(this.outletId(user));
  }

  @Get("orders")
  listOrders(@CurrentUser() user: Principal, @Query() q: OrdersQueryDto) {
    return this.store.listOrders(this.outletId(user), q.scope ?? "active");
  }

  @Patch("orders/:id/status")
  transitionOrder(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: UpdateSubOrderStatusDto,
  ) {
    return this.orders.transitionSubOrder(this.outletId(user), id, dto.status, dto.reason, dto.code);
  }

  @Patch("orders/:id/items")
  adjustOrderItems(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: AdjustSubOrderItemsDto,
  ) {
    return this.orders.adjustSubOrderItems(
      this.outletId(user),
      id,
      dto.adjustments,
      dto.reason,
    );
  }

  @Get("menu")
  listMenu(@CurrentUser() user: Principal) {
    return this.store.listMenu(this.outletId(user));
  }

  @Post("menu/items")
  createItem(@CurrentUser() user: Principal, @Body() dto: UpsertItemDto) {
    return this.store.createItem(this.outletId(user), dto);
  }

  @Patch("menu/items/:id")
  updateItem(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: UpsertItemDto,
  ) {
    return this.store.updateItem(this.outletId(user), id, dto);
  }

  @Patch("menu/items/:id/availability")
  toggleItem(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() body: { available: boolean },
  ) {
    return this.store.toggleItemAvailability(this.outletId(user), id, !!body.available);
  }

  @Delete("menu/items/:id")
  deleteItem(@CurrentUser() user: Principal, @Param("id") id: string) {
    return this.store.deleteItem(this.outletId(user), id);
  }

  @Get("settings")
  getSettings(@CurrentUser() user: Principal) {
    return this.store.getSettings(this.outletId(user));
  }

  @Patch("settings")
  updateSettings(@CurrentUser() user: Principal, @Body() dto: UpdateSettingsDto) {
    return this.store.updateSettings(this.outletId(user), dto);
  }

  @Get("reviews")
  listReviews(@CurrentUser() user: Principal) {
    return this.store.listReviews(this.outletId(user));
  }

  @Post("reviews/:id/reply")
  replyReview(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.store.replyToReview(this.outletId(user), id, user.id, dto);
  }

  @Get("payouts")
  listPayouts(@CurrentUser() user: Principal) {
    return this.store.listPayouts(this.outletId(user));
  }

  @Get("promotions")
  listPromotions(@CurrentUser() user: Principal) {
    return this.store.listPromotions(this.outletId(user));
  }

  @Post("promotions")
  createPromotion(@CurrentUser() user: Principal, @Body() dto: UpsertPromotionDto) {
    return this.store.createPromotion(this.outletId(user), dto);
  }

  @Patch("promotions/:id")
  updatePromotion(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: UpsertPromotionDto,
  ) {
    return this.store.updatePromotion(this.outletId(user), id, dto);
  }

  @Patch("promotions/:id/status")
  setPromotionStatus(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body() dto: PromotionStatusDto,
  ) {
    return this.store.setPromotionPaused(this.outletId(user), id, dto.paused);
  }

  @Delete("promotions/:id")
  deletePromotion(@CurrentUser() user: Principal, @Param("id") id: string) {
    return this.store.deletePromotion(this.outletId(user), id);
  }

  @Get("analytics/daily-sales")
  dailySales(@CurrentUser() user: Principal, @Query() q: AnalyticsRangeDto) {
    return this.store.getDailySales(this.outletId(user), this.toDays(q.range, 7));
  }

  @Get("analytics/sales-series")
  salesSeries(@CurrentUser() user: Principal, @Query() q: SalesSeriesDto) {
    return this.store.getSalesSeries(this.outletId(user), q.granularity ?? "daily");
  }

  @Get("analytics/hourly")
  hourly(@CurrentUser() user: Principal, @Query() q: AnalyticsRangeDto) {
    return this.store.getHourlyDistribution(this.outletId(user), this.toDays(q.range, 30));
  }

  @Get("analytics/top-items")
  topItems(@CurrentUser() user: Principal, @Query() q: AnalyticsRangeDto) {
    return this.store.getTopItems(this.outletId(user), this.toDays(q.range, 30));
  }

  @Get("analytics/revenue")
  revenue(@CurrentUser() user: Principal, @Query() q: AnalyticsRangeDto) {
    return this.store.getRevenueSummary(this.outletId(user), this.toDays(q.range, 30));
  }

  private outletId(user: Principal): string {
    if (!user.outletId) {
      throw new ForbiddenException("This account is not linked to an outlet");
    }
    return user.outletId;
  }

  private toDays(range: "1d" | "7d" | "30d" | "90d" | "365d" | undefined, fallback: number): number {
    if (range === "1d") return 1;
    if (range === "7d") return 7;
    if (range === "30d") return 30;
    if (range === "90d") return 90;
    if (range === "365d") return 365;
    return fallback;
  }
}
