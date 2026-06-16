import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma.module";
import {
  ReplyReviewDto,
  UpdateSettingsDto,
  UpsertItemDto,
  UpsertPromotionDto,
} from "./store.dto";

const DEFAULT_HOURS = {
  mon: { open: "09:00", close: "21:00", closed: false },
  tue: { open: "09:00", close: "21:00", closed: false },
  wed: { open: "09:00", close: "21:00", closed: false },
  thu: { open: "09:00", close: "21:00", closed: false },
  fri: { open: "10:00", close: "22:00", closed: false },
  sat: { open: "10:00", close: "22:00", closed: false },
  sun: { open: "10:00", close: "20:00", closed: false },
};

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(outletId: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
      include: { brand: true },
    });
    if (!outlet) throw new NotFoundException("Outlet not found");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todays = await this.prisma.subOrder.findMany({
      where: {
        outletId,
        order: { paymentIntentId: { not: null }, placedAt: { gte: startOfDay } },
        status: { notIn: ["rejected", "cancelled"] },
      },
      select: {
        foodSubtotalCents: true,
        prepStartAt: true,
        readyAt: true,
        status: true,
      },
    });

    const salesTodayCents = todays.reduce((sum, s) => sum + s.foodSubtotalCents, 0);
    const ordersToday = todays.length;
    const prepDurations = todays
      .filter((s) => s.prepStartAt && s.readyAt)
      .map((s) => (s.readyAt!.getTime() - s.prepStartAt!.getTime()) / 60000);
    const avgPrepMinutes =
      prepDurations.length > 0
        ? prepDurations.reduce((a, b) => a + b, 0) / prepDurations.length
        : null;
    const activeOrders = todays.filter((s) =>
      ["pending", "accepted", "preparing", "ready"].includes(s.status),
    ).length;

    const ratingAgg = await this.prisma.review.aggregate({
      where: { outletId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      outlet: {
        id: outlet.id,
        name: outlet.name,
        brand: outlet.brand.name,
        locationInMall: outlet.locationInMall,
      },
      salesTodayCents,
      ordersToday,
      activeOrders,
      avgPrepMinutes,
      rating: {
        average: ratingAgg._avg.rating ?? null,
        count: ratingAgg._count._all,
      },
    };
  }

  async listOrders(outletId: string, scope: "active" | "past" = "active") {
    const activeStatuses = ["pending", "accepted", "preparing", "ready"];
    const pastStatuses = ["collected", "rejected", "cancelled"];
    const subOrders = await this.prisma.subOrder.findMany({
      where: {
        outletId,
        order: { paymentIntentId: { not: null } },
        status: { in: scope === "active" ? activeStatuses : pastStatuses },
      },
      orderBy: { order: { placedAt: "desc" } },
      take: scope === "past" ? 50 : undefined,
      include: {
        order: { include: { customer: true, address: true } },
        orderItems: { include: { item: true } },
      },
    });
    return subOrders.map((s) => ({
      id: s.id,
      orderId: s.orderId,
      status: s.status,
      foodSubtotalCents: s.foodSubtotalCents,
      placedAt: s.order.placedAt,
      readyAt: s.readyAt,
      customerName: s.order.customer.name,
      addressLine: s.order.address.line1,
      fulfilmentMode: s.order.fulfilmentMode,
      items: s.orderItems.map((oi) => ({
        id: oi.id,
        name: oi.item.name,
        qty: oi.qty,
        fulfilledQty: oi.fulfilledQty,
        notes: oi.notes,
        unitPriceCents: oi.unitPriceCents,
        totalCents: oi.totalCents,
      })),
    }));
  }

  async listMenu(outletId: string) {
    const items = await this.prisma.item.findMany({
      where: { outletId, archivedAt: null },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    const categories = [...new Set(items.map((i) => i.category))];
    return {
      categories,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        priceCents: i.priceCents,
        prepTimeMinutes: i.prepTimeMinutes,
        category: i.category,
        available: i.available,
        imageUrl: i.imageUrl,
      })),
    };
  }

  async createItem(outletId: string, dto: UpsertItemDto) {
    return this.prisma.item.create({
      data: {
        outletId,
        name: dto.name,
        description: dto.description,
        priceCents: dto.priceCents,
        prepTimeMinutes: dto.prepTimeMinutes,
        category: dto.category,
        available: dto.available,
        imageUrl: dto.imageUrl ?? null,
        modifiers: [],
      },
    });
  }

  async updateItem(outletId: string, itemId: string, dto: UpsertItemDto) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.outletId !== outletId) {
      throw new NotFoundException("Item not found");
    }
    return this.prisma.item.update({
      where: { id: itemId },
      data: {
        name: dto.name,
        description: dto.description,
        priceCents: dto.priceCents,
        prepTimeMinutes: dto.prepTimeMinutes,
        category: dto.category,
        available: dto.available,
        imageUrl: dto.imageUrl ?? null,
      },
    });
  }

  async toggleItemAvailability(outletId: string, itemId: string, available: boolean) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.outletId !== outletId) {
      throw new NotFoundException("Item not found");
    }
    return this.prisma.item.update({
      where: { id: itemId },
      data: { available },
    });
  }

  async deleteItem(outletId: string, itemId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.outletId !== outletId) {
      throw new NotFoundException("Item not found");
    }
    const activeOrders = await this.prisma.orderItem.count({
      where: {
        itemId,
        subOrder: { status: { in: ["pending", "accepted", "preparing", "ready"] } },
      },
    });
    if (activeOrders > 0) {
      throw new ConflictException(
        "This item is part of active orders. You can delete it once those orders are completed.",
      );
    }
    const inUse = await this.prisma.orderItem.count({ where: { itemId } });
    if (inUse > 0) {
      await this.prisma.item.update({
        where: { id: itemId },
        data: { available: false, archivedAt: new Date() },
      });
      return { id: itemId, deleted: true };
    }
    await this.prisma.item.delete({ where: { id: itemId } });
    return { id: itemId, deleted: true };
  }

  async getSettings(outletId: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
      include: { settings: true, brand: true },
    });
    if (!outlet) throw new NotFoundException("Outlet not found");
    const s = outlet.settings;
    return {
      outletId: outlet.id,
      name: outlet.name,
      brand: outlet.brand.name,
      locationInMall: outlet.locationInMall,
      phone: s?.phone ?? null,
      email: s?.email ?? null,
      addressLine: s?.addressLine ?? null,
      hours: (s?.hoursJson as unknown) ?? DEFAULT_HOURS,
      autoAcceptOrders: s?.autoAcceptOrders ?? false,
      pauseNewOrders: s?.pauseNewOrders ?? false,
      showPrepTime: s?.showPrepTime ?? true,
      allowTipping: s?.allowTipping ?? true,
    };
  }

  async updateSettings(outletId: string, dto: UpdateSettingsDto) {
    if (dto.name) {
      await this.prisma.outlet.update({
        where: { id: outletId },
        data: { name: dto.name },
      });
    }
    const settingsData: Record<string, unknown> = {};
    if (dto.phone !== undefined) settingsData.phone = dto.phone;
    if (dto.email !== undefined) settingsData.email = dto.email;
    if (dto.addressLine !== undefined) settingsData.addressLine = dto.addressLine;
    if (dto.hours !== undefined) settingsData.hoursJson = dto.hours as unknown as object;
    if (dto.autoAcceptOrders !== undefined) settingsData.autoAcceptOrders = dto.autoAcceptOrders;
    if (dto.pauseNewOrders !== undefined) settingsData.pauseNewOrders = dto.pauseNewOrders;
    if (dto.showPrepTime !== undefined) settingsData.showPrepTime = dto.showPrepTime;
    if (dto.allowTipping !== undefined) settingsData.allowTipping = dto.allowTipping;

    if (Object.keys(settingsData).length === 0 && !dto.name) {
      throw new BadRequestException("Nothing to update");
    }

    if (Object.keys(settingsData).length > 0) {
      await this.prisma.outletSettings.upsert({
        where: { outletId },
        update: settingsData,
        create: {
          outletId,
          hoursJson: (settingsData.hoursJson ?? DEFAULT_HOURS) as object,
          phone: (settingsData.phone as string | undefined) ?? null,
          email: (settingsData.email as string | undefined) ?? null,
          addressLine: (settingsData.addressLine as string | undefined) ?? null,
          autoAcceptOrders: (settingsData.autoAcceptOrders as boolean | undefined) ?? false,
          pauseNewOrders: (settingsData.pauseNewOrders as boolean | undefined) ?? false,
          showPrepTime: (settingsData.showPrepTime as boolean | undefined) ?? true,
          allowTipping: (settingsData.allowTipping as boolean | undefined) ?? true,
        },
      });
    }

    return this.getSettings(outletId);
  }

  async listReviews(outletId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { outletId },
      orderBy: { createdAt: "desc" },
      include: { customer: true, reply: true },
    });

    const breakdown = await this.prisma.review.groupBy({
      by: ["rating"],
      where: { outletId },
      _count: { _all: true },
    });
    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of breakdown) {
      const r = row.rating as 1 | 2 | 3 | 4 | 5;
      distribution[r] = row._count._all;
    }
    const total = reviews.length;
    const average =
      total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : null;

    return {
      summary: { total, average, distribution },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        customerName: r.customer.name,
        reply: r.reply
          ? { id: r.reply.id, text: r.reply.text, createdAt: r.reply.createdAt }
          : null,
      })),
    };
  }

  async replyToReview(outletId: string, reviewId: string, authorId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException("Review not found");
    if (review.outletId !== outletId) {
      throw new ForbiddenException("This review belongs to another outlet");
    }
    return this.prisma.reviewReply.upsert({
      where: { reviewId },
      update: { text: dto.text, authorId },
      create: { reviewId, text: dto.text, authorId },
    });
  }

  async listPayouts(outletId: string) {
    const lines = await this.prisma.payoutLine.findMany({
      where: { partyId: outletId },
      orderBy: { id: "desc" },
      take: 60,
      include: { run: true },
    });
    return lines.map((l) => ({
      id: l.id,
      amountCents: l.amountCents,
      ref: l.ref,
      runId: l.run.id,
      runDate: l.run.runDate,
      kind: l.run.kind,
      status: l.run.status,
    }));
  }

  async getDailySales(outletId: string, days = 7) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const subs = await this.prisma.subOrder.findMany({
      where: {
        outletId,
        order: { paymentIntentId: { not: null }, placedAt: { gte: start, lte: end } },
        status: { notIn: ["rejected", "cancelled"] },
      },
      select: { foodSubtotalCents: true, order: { select: { placedAt: true } } },
    });

    const buckets = new Map<string, { dateKey: string; salesCents: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { dateKey: key, salesCents: 0, orders: 0 });
    }
    for (const s of subs) {
      const key = s.order.placedAt.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.salesCents += s.foodSubtotalCents;
      bucket.orders += 1;
    }
    return [...buckets.values()];
  }

  async getSalesSeries(
    outletId: string,
    granularity: "today" | "daily" | "weekly" | "monthly" | "yearly",
  ) {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hourLabel = (h: number) =>
      h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const startOfWeek = (d: Date) => {
      const r = new Date(d);
      r.setHours(0, 0, 0, 0);
      const dow = (r.getDay() + 6) % 7;
      r.setDate(r.getDate() - dow);
      return r;
    };

    type Bucket = { label: string; salesCents: number; orders: number };
    const buckets: Bucket[] = [];
    const index = new Map<string, Bucket>();
    const add = (key: string, label: string) => {
      const b: Bucket = { label, salesCents: 0, orders: 0 };
      buckets.push(b);
      index.set(key, b);
    };

    const now = new Date();
    let start: Date;
    let keyOf: (d: Date) => string;

    if (granularity === "today") {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) add(`h${h}`, hourLabel(h));
      keyOf = (d) => `h${d.getHours()}`;
    } else if (granularity === "daily") {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 13);
      for (let i = 0; i < 14; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        add(dayKey(d), `${d.getDate()} ${MONTHS[d.getMonth()]}`);
      }
      keyOf = (d) => dayKey(d);
    } else if (granularity === "weekly") {
      const thisWeek = startOfWeek(now);
      start = new Date(thisWeek);
      start.setDate(start.getDate() - 7 * 11);
      for (let i = 0; i < 12; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + 7 * i);
        add(dayKey(d), `${d.getDate()} ${MONTHS[d.getMonth()]}`);
      }
      keyOf = (d) => dayKey(startOfWeek(d));
    } else if (granularity === "monthly") {
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      for (let i = 0; i < 12; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        add(`${d.getFullYear()}-${d.getMonth()}`, MONTHS[d.getMonth()]!);
      }
      keyOf = (d) => `${d.getFullYear()}-${d.getMonth()}`;
    } else {
      const yr = now.getFullYear();
      start = new Date(yr - 4, 0, 1);
      for (let i = 0; i < 5; i++) add(`${yr - 4 + i}`, String(yr - 4 + i));
      keyOf = (d) => `${d.getFullYear()}`;
    }

    const subs = await this.prisma.subOrder.findMany({
      where: {
        outletId,
        order: { paymentIntentId: { not: null }, placedAt: { gte: start, lte: now } },
        status: { notIn: ["rejected", "cancelled"] },
      },
      select: { foodSubtotalCents: true, order: { select: { placedAt: true } } },
    });
    for (const s of subs) {
      const bucket = index.get(keyOf(s.order.placedAt));
      if (!bucket) continue;
      bucket.salesCents += s.foodSubtotalCents;
      bucket.orders += 1;
    }
    return buckets;
  }

  async getHourlyDistribution(outletId: string, days = 30) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    const subs = await this.prisma.subOrder.findMany({
      where: {
        outletId,
        order: { paymentIntentId: { not: null }, placedAt: { gte: start, lte: end } },
        status: { notIn: ["rejected", "cancelled"] },
      },
      select: { order: { select: { placedAt: true } } },
    });
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 }));
    for (const s of subs) {
      const h = s.order.placedAt.getHours();
      buckets[h]!.orders += 1;
    }
    return buckets;
  }

  async getTopItems(outletId: string, days = 30) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    const items = await this.prisma.orderItem.findMany({
      where: {
        subOrder: {
          outletId,
          order: { paymentIntentId: { not: null }, placedAt: { gte: start, lte: end } },
          status: { notIn: ["rejected", "cancelled"] },
        },
      },
      include: { item: true },
    });
    const map = new Map<string, { itemId: string; name: string; qty: number; revenueCents: number }>();
    for (const oi of items) {
      const cur = map.get(oi.itemId) ?? {
        itemId: oi.itemId,
        name: oi.item.name,
        qty: 0,
        revenueCents: 0,
      };
      cur.qty += oi.qty;
      cur.revenueCents += oi.totalCents;
      map.set(oi.itemId, cur);
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);
  }

  async getRevenueSummary(outletId: string, days = 30) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    const subs = await this.prisma.subOrder.findMany({
      where: {
        outletId,
        order: { paymentIntentId: { not: null }, placedAt: { gte: start, lte: end } },
        status: { notIn: ["rejected", "cancelled"] },
      },
      select: { foodSubtotalCents: true, commissionCents: true, prepStartAt: true, readyAt: true },
    });
    const ratingAgg = await this.prisma.review.aggregate({
      where: { outletId, createdAt: { gte: start, lte: end } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const grossCents = subs.reduce((s, x) => s + x.foodSubtotalCents, 0);
    const commissionCents = subs.reduce((s, x) => s + x.commissionCents, 0);
    const prepDurations = subs
      .filter((s) => s.prepStartAt && s.readyAt)
      .map((s) => (s.readyAt!.getTime() - s.prepStartAt!.getTime()) / 60000);
    const avgPrepMinutes =
      prepDurations.length > 0
        ? prepDurations.reduce((a, b) => a + b, 0) / prepDurations.length
        : null;
    return {
      windowDays: days,
      grossCents,
      commissionCents,
      netCents: grossCents - commissionCents,
      orders: subs.length,
      avgPrepMinutes,
      rating: {
        average: ratingAgg._avg.rating ?? null,
        count: ratingAgg._count._all,
      },
    };
  }

  async listPromotions(outletId: string) {
    const promotions = await this.prisma.promotion.findMany({
      where: { outletId },
      orderBy: { createdAt: "desc" },
    });
    const itemMap = await this.promotionItemMap(promotions);
    const mapped = promotions.map((p) => this.toPromotionView(p, itemMap));
    const summary = {
      total: mapped.length,
      active: mapped.filter((p) => p.status === "active").length,
      scheduled: mapped.filter((p) => p.status === "scheduled").length,
      redemptions: mapped.reduce((sum, p) => sum + p.redemptionCount, 0),
    };
    return { summary, promotions: mapped };
  }

  async createPromotion(outletId: string, dto: UpsertPromotionDto) {
    const data = await this.promotionData(outletId, dto);
    const promo = await this.prisma.promotion.create({
      data: { outletId, ...data },
    });
    return this.toPromotionView(promo, await this.promotionItemMap([promo]));
  }

  async updatePromotion(outletId: string, id: string, dto: UpsertPromotionDto) {
    await this.ownedPromotion(outletId, id);
    const data = await this.promotionData(outletId, dto);
    const promo = await this.prisma.promotion.update({
      where: { id },
      data,
    });
    return this.toPromotionView(promo, await this.promotionItemMap([promo]));
  }

  async setPromotionPaused(outletId: string, id: string, paused: boolean) {
    await this.ownedPromotion(outletId, id);
    const promo = await this.prisma.promotion.update({
      where: { id },
      data: { paused },
    });
    return this.toPromotionView(promo, await this.promotionItemMap([promo]));
  }

  async deletePromotion(outletId: string, id: string) {
    await this.ownedPromotion(outletId, id);
    await this.prisma.promotion.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ownedPromotion(outletId: string, id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo || promo.outletId !== outletId) {
      throw new NotFoundException("Promotion not found");
    }
    return promo;
  }

  private async promotionItemMap(
    promos: {
      buyItemId: string | null;
      getItemId: string | null;
      freeItemId: string | null;
      itemIds: string[];
    }[],
  ) {
    const ids = Array.from(
      new Set(
        promos
          .flatMap((p) => [p.buyItemId, p.getItemId, p.freeItemId, ...p.itemIds])
          .filter((x): x is string => !!x),
      ),
    );
    if (ids.length === 0) return new Map<string, string>();
    const items = await this.prisma.item.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return new Map(items.map((i) => [i.id, i.name]));
  }

  private async assertOwnedItems(outletId: string, ids: string[]) {
    const unique = Array.from(new Set(ids));
    const count = await this.prisma.item.count({
      where: { id: { in: unique }, outletId },
    });
    if (count !== unique.length) {
      throw new BadRequestException("Choose an item from your own menu");
    }
  }

  private async assertOwnedCategory(outletId: string, category: string) {
    const count = await this.prisma.item.count({
      where: { outletId, category },
    });
    if (count === 0) {
      throw new BadRequestException("Choose a category from your own menu");
    }
  }

  private async promotionData(outletId: string, dto: UpsertPromotionDto) {
    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (startAt && endAt && endAt.getTime() <= startAt.getTime()) {
      throw new BadRequestException("The end date must be after the start date");
    }

    const base = {
      type: dto.type,
      percentOff: 0,
      amountOffCents: 0,
      minSpendCents: dto.minSpendCents ?? 0,
      buyItemId: null as string | null,
      getItemId: null as string | null,
      freeItemId: null as string | null,
      itemIds: [] as string[],
      category: null as string | null,
      buyQuantity: 1,
      getQuantity: 1,
      days: [] as number[],
      startTime: null as string | null,
      endTime: null as string | null,
      startAt,
      endAt,
    };

    switch (dto.type) {
      case "percentage":
        if (!dto.percentOff) {
          throw new BadRequestException("Enter a percentage between 1 and 100");
        }
        return { ...base, percentOff: dto.percentOff };
      case "fixed":
        if (!dto.amountOffCents) {
          throw new BadRequestException("Enter a discount amount");
        }
        return { ...base, amountOffCents: dto.amountOffCents };
      case "free_delivery":
        return base;
      case "free_item":
        if (!dto.freeItemId) {
          throw new BadRequestException("Choose the free item");
        }
        await this.assertOwnedItems(outletId, [dto.freeItemId]);
        return { ...base, freeItemId: dto.freeItemId };
      case "bogo":
        if (!dto.buyItemId || !dto.getItemId) {
          throw new BadRequestException("Choose both items for the offer");
        }
        await this.assertOwnedItems(outletId, [dto.buyItemId, dto.getItemId]);
        return {
          ...base,
          buyItemId: dto.buyItemId,
          getItemId: dto.getItemId,
          buyQuantity: dto.buyQuantity ?? 1,
          getQuantity: dto.getQuantity ?? 1,
          percentOff: dto.percentOff ?? 100,
        };
      case "happy_hour": {
        const days = Array.from(new Set(dto.days ?? [])).sort((a, b) => a - b);
        if (days.length === 0) {
          throw new BadRequestException("Choose at least one day");
        }
        if (!dto.startTime || !dto.endTime) {
          throw new BadRequestException("Set a start and end time");
        }
        if (dto.startTime >= dto.endTime) {
          throw new BadRequestException("The end time must be after the start time");
        }
        if (!dto.percentOff && !dto.amountOffCents) {
          throw new BadRequestException("Enter a discount");
        }
        return {
          ...base,
          percentOff: dto.percentOff ?? 0,
          amountOffCents: dto.amountOffCents ?? 0,
          days,
          startTime: dto.startTime,
          endTime: dto.endTime,
        };
      }
      case "item_discount": {
        const itemIds = Array.from(new Set(dto.itemIds ?? []));
        const category = dto.category?.trim() || null;
        if (itemIds.length === 0 && !category) {
          throw new BadRequestException("Choose items or a category");
        }
        if (itemIds.length > 0 && category) {
          throw new BadRequestException("Choose either items or a category, not both");
        }
        if (!dto.percentOff && !dto.amountOffCents) {
          throw new BadRequestException("Enter a discount");
        }
        if (itemIds.length > 0) {
          await this.assertOwnedItems(outletId, itemIds);
        } else if (category) {
          await this.assertOwnedCategory(outletId, category);
        }
        return {
          ...base,
          percentOff: dto.percentOff ?? 0,
          amountOffCents: dto.amountOffCents ?? 0,
          itemIds,
          category,
        };
      }
      case "buy_save": {
        if (!dto.buyItemId) {
          throw new BadRequestException("Choose the item to buy");
        }
        if (!dto.amountOffCents) {
          throw new BadRequestException("Enter an amount to save");
        }
        await this.assertOwnedItems(outletId, [dto.buyItemId]);
        return {
          ...base,
          buyItemId: dto.buyItemId,
          buyQuantity: dto.buyQuantity ?? 1,
          amountOffCents: dto.amountOffCents,
        };
      }
      default:
        throw new BadRequestException("Unsupported promotion type");
    }
  }

  private toPromotionView(
    p: {
      id: string;
      type: string;
      percentOff: number;
      amountOffCents: number;
      minSpendCents: number;
      buyItemId: string | null;
      getItemId: string | null;
      freeItemId: string | null;
      itemIds: string[];
      category: string | null;
      buyQuantity: number;
      getQuantity: number;
      days: number[];
      startTime: string | null;
      endTime: string | null;
      paused: boolean;
      startAt: Date | null;
      endAt: Date | null;
      redemptionCount: number;
      createdAt: Date;
    },
    itemMap: Map<string, string>,
  ) {
    const now = Date.now();
    let status: "active" | "scheduled" | "ended" | "paused";
    if (p.paused) {
      status = "paused";
    } else if (p.endAt && p.endAt.getTime() <= now) {
      status = "ended";
    } else if (p.startAt && p.startAt.getTime() > now) {
      status = "scheduled";
    } else {
      status = "active";
    }
    return {
      id: p.id,
      type: p.type as
        | "percentage"
        | "fixed"
        | "free_delivery"
        | "free_item"
        | "bogo"
        | "happy_hour"
        | "item_discount"
        | "buy_save",
      percentOff: p.percentOff,
      amountOffCents: p.amountOffCents,
      minSpendCents: p.minSpendCents,
      buyItemId: p.buyItemId,
      getItemId: p.getItemId,
      freeItemId: p.freeItemId,
      itemIds: p.itemIds,
      category: p.category,
      buyItemName: p.buyItemId ? itemMap.get(p.buyItemId) ?? null : null,
      getItemName: p.getItemId ? itemMap.get(p.getItemId) ?? null : null,
      freeItemName: p.freeItemId ? itemMap.get(p.freeItemId) ?? null : null,
      itemNames: p.itemIds
        .map((id) => itemMap.get(id))
        .filter((n): n is string => !!n),
      buyQuantity: p.buyQuantity,
      getQuantity: p.getQuantity,
      days: p.days,
      startTime: p.startTime,
      endTime: p.endTime,
      paused: p.paused,
      startAt: p.startAt ? p.startAt.toISOString() : null,
      endAt: p.endAt ? p.endAt.toISOString() : null,
      redemptionCount: p.redemptionCount,
      createdAt: p.createdAt.toISOString(),
      status,
    };
  }
}
