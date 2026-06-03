import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomInt } from "node:crypto";
import {
  aggregatePublicStatus,
  computePricing,
  surgeForTime,
  type OrderPublicStatus,
  type SubOrderStatus,
  type TripStatus,
} from "@foyer/shared";
import { PrismaService } from "../../infrastructure/prisma.module";
import { PlaceOrderDto } from "./order.dto";

const SUBORDER_TRANSITIONS: Record<string, SubOrderStatus[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing", "rejected"],
  preparing: ["ready"],
  ready: ["collected"],
  collected: [],
  rejected: [],
  cancelled: [],
};

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async place(customerId: string, dto: PlaceOrderDto) {
    if (dto.lines.length === 0) {
      throw new BadRequestException("An order needs at least one item.");
    }
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException("Customer not found");
    if (!customer.emailVerifiedAt) {
      throw new ForbiddenException("Verify your email address before placing an order");
    }

    const complex = await this.prisma.complex.findUnique({ where: { id: dto.complexId } });
    if (!complex) throw new NotFoundException(`Complex ${dto.complexId} not found`);

    const addressId = await this.resolveAddressId(customerId, dto);

    const itemIds = [...new Set(dto.lines.map((l) => l.itemId))];
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
      include: { outlet: true },
    });
    const itemMap = new Map(items.map((i) => [i.id, i]));

    type ResolvedLine = {
      outletId: string;
      itemId: string;
      qty: number;
      modifiers: unknown;
      notes?: string;
      unitPriceCents: number;
      totalCents: number;
    };
    const byOutlet = new Map<string, ResolvedLine[]>();

    for (const line of dto.lines) {
      const item = itemMap.get(line.itemId);
      if (!item) throw new NotFoundException(`Item ${line.itemId} not found`);
      if (item.outletId !== line.outletId) {
        throw new BadRequestException(`Item ${line.itemId} is not sold by outlet ${line.outletId}`);
      }
      if (item.outlet.complexId !== complex.id) {
        throw new BadRequestException(`Outlet ${line.outletId} is not in complex ${complex.id}`);
      }
      if (!item.available) throw new BadRequestException(`${item.name} is currently unavailable`);

      const unitPriceCents = item.priceCents;
      const resolved: ResolvedLine = {
        outletId: line.outletId,
        itemId: line.itemId,
        qty: line.qty,
        modifiers: line.modifiers ?? [],
        notes: line.notes,
        unitPriceCents,
        totalCents: unitPriceCents * line.qty,
      };
      const list = byOutlet.get(line.outletId) ?? [];
      list.push(resolved);
      byOutlet.set(line.outletId, list);
    }

    const foodSubtotalCents = [...byOutlet.values()]
      .flat()
      .reduce((sum, l) => sum + l.totalCents, 0);

    const surge = surgeForTime(new Date());
    const pricing = computePricing({
      foodSubtotalCents,
      baseDeliveryFeeCents: complex.baseDeliveryFeeCents,
      surgeMultiplier: surge.multiplier,
      mallPassActive: customer.mallPassActive,
      tipCents: dto.tipCents ?? 0,
    });

    const outletRecords = await this.prisma.outlet.findMany({
      where: { id: { in: [...byOutlet.keys()] } },
    });
    const commissionByOutlet = new Map(outletRecords.map((o) => [o.id, o.commissionPct]));

    const order = await this.prisma.order.create({
      data: {
        customerId,
        complexId: complex.id,
        addressId,
        status: "received",
        foodSubtotalCents: pricing.foodSubtotalCents,
        deliveryFeeCents: pricing.deliveryFeeCents,
        serviceFeeCents: pricing.serviceFeeCents,
        tipCents: pricing.tipCents,
        totalCents: pricing.totalCents,
        surgeMultiplier: pricing.surgeMultiplier,
        mallPassApplied: pricing.mallPassApplied,
        subOrders: {
          create: [...byOutlet.entries()].map(([outletId, lines]) => {
            const outletSubtotal = lines.reduce((sum, l) => sum + l.totalCents, 0);
            const commissionPct = commissionByOutlet.get(outletId) ?? 0.13;
            return {
              outletId,
              status: "pending",
              pickupCode: this.pickupCode(),
              foodSubtotalCents: outletSubtotal,
              commissionCents: Math.round(outletSubtotal * commissionPct),
              orderItems: {
                create: lines.map((l) => ({
                  itemId: l.itemId,
                  qty: l.qty,
                  modifiers: l.modifiers as object,
                  notes: l.notes,
                  unitPriceCents: l.unitPriceCents,
                  totalCents: l.totalCents,
                })),
              },
            };
          }),
        },
      },
    });

    return this.getForCustomer(customerId, order.id);
  }

  async listForCustomer(customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      orderBy: { placedAt: "desc" },
      include: { subOrders: true, trip: true, complex: true },
    });
    return orders.map((o) => ({
      id: o.id,
      complexId: o.complexId,
      complexName: o.complex.name,
      status: this.publicStatus(o.subOrders, o.trip),
      totalCents: o.totalCents,
      itemOutletCount: o.subOrders.length,
      paid: Boolean(o.paymentIntentId),
      placedAt: o.placedAt,
    }));
  }

  async getForCustomer(customerId: string, orderId: string) {
    const order = await this.loadOrder(orderId);
    if (order.customerId !== customerId) {
      throw new ForbiddenException("This order belongs to another customer");
    }
    return this.toDetailDto(order);
  }

  async listForOutlet(outletId: string) {
    const subOrders = await this.prisma.subOrder.findMany({
      where: {
        outletId,
        order: { paymentIntentId: { not: null } },
        status: { notIn: ["rejected", "cancelled"] },
      },
      orderBy: { order: { placedAt: "desc" } },
      include: {
        order: { include: { customer: true, address: true } },
        orderItems: { include: { item: true } },
      },
    });
    return subOrders.map((s) => ({
      id: s.id,
      orderId: s.orderId,
      status: s.status,
      pickupCode: s.pickupCode,
      foodSubtotalCents: s.foodSubtotalCents,
      placedAt: s.order.placedAt,
      customerName: s.order.customer.name,
      addressLine: s.order.address.line1,
      items: s.orderItems.map((oi) => ({
        id: oi.id,
        name: oi.item.name,
        qty: oi.qty,
        notes: oi.notes,
        totalCents: oi.totalCents,
      })),
    }));
  }

  async transitionSubOrder(
    outletId: string,
    subOrderId: string,
    next: SubOrderStatus,
  ) {
    const subOrder = await this.prisma.subOrder.findUnique({ where: { id: subOrderId } });
    if (!subOrder) throw new NotFoundException("Sub-order not found");
    if (subOrder.outletId !== outletId) {
      throw new ForbiddenException("This sub-order belongs to another outlet");
    }
    const allowed = SUBORDER_TRANSITIONS[subOrder.status] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`Cannot move sub-order from ${subOrder.status} to ${next}`);
    }
    const data: Record<string, unknown> = { status: next };
    if (next === "preparing") data.prepStartAt = new Date();
    if (next === "ready") data.readyAt = new Date();
    await this.prisma.subOrder.update({ where: { id: subOrderId }, data });
    await this.recomputeOrderStatus(subOrder.orderId);
    return this.listOneSubOrder(subOrderId);
  }

  async listAllForAdmin() {
    const orders = await this.prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      include: {
        subOrders: true,
        trip: { include: { rider: true } },
        complex: true,
        customer: true,
      },
    });
    return orders.map((o) => ({
      id: o.id,
      complexName: o.complex.name,
      customerName: o.customer.name,
      status: this.publicStatus(o.subOrders, o.trip),
      paid: Boolean(o.paymentIntentId),
      totalCents: o.totalCents,
      outletCount: o.subOrders.length,
      riderName: o.trip?.rider.name ?? null,
      tripStatus: (o.trip?.status as TripStatus | undefined) ?? null,
      placedAt: o.placedAt,
    }));
  }

  async adminOverview(period?: string) {
    const windows: Record<string, number | null> = {
      today: 1,
      "7d": 7,
      "30d": 30,
      all: null,
    };
    const key = period && period in windows ? period : "7d";
    const days = windows[key];
    const now = new Date();
    let windowStart: Date | null = null;
    let prevStart: Date | null = null;
    if (days != null) {
      if (key === "today") {
        windowStart = new Date(now);
        windowStart.setHours(0, 0, 0, 0);
        prevStart = new Date(windowStart);
        prevStart.setDate(prevStart.getDate() - 1);
      } else {
        const span = days * 24 * 60 * 60 * 1000;
        windowStart = new Date(now.getTime() - span);
        prevStart = new Date(now.getTime() - span * 2);
      }
    }

    const orders = await this.prisma.order.findMany({
      where: prevStart ? { placedAt: { gte: prevStart } } : undefined,
      include: { subOrders: true, trip: true },
    });
    const counts: Record<OrderPublicStatus, number> = {
      received: 0,
      preparing: 0,
      ready: 0,
      on_the_way: 0,
      delivered: 0,
      cancelled: 0,
    };
    let revenueCents = 0;
    let totalOrders = 0;
    let prevRevenueCents = 0;
    let prevOrders = 0;
    for (const o of orders) {
      const inCurrent = !windowStart || o.placedAt >= windowStart;
      if (inCurrent) {
        counts[this.publicStatus(o.subOrders, o.trip)] += 1;
        totalOrders += 1;
        if (o.paymentIntentId) revenueCents += o.totalCents;
      } else if (prevStart && o.placedAt >= prevStart) {
        prevOrders += 1;
        if (o.paymentIntentId) prevRevenueCents += o.totalCents;
      }
    }
    const deltaPct = (current: number, previous: number) =>
      previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
    const [complexes, ridersOnline] = await Promise.all([
      this.prisma.complex.count({ where: { status: "active" } }),
      this.prisma.rider.count({ where: { status: { not: "offline" } } }),
    ]);
    return {
      period: key,
      totalOrders,
      counts,
      revenueCents,
      complexes,
      ridersOnline,
      ordersDeltaPct: windowStart ? deltaPct(totalOrders, prevOrders) : null,
      revenueDeltaPct: windowStart ? deltaPct(revenueCents, prevRevenueCents) : null,
    };
  }

  async listCustomersForAdmin() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orders: { select: { totalCents: true, paymentIntentId: true, placedAt: true } },
      },
    });
    const activeSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return customers.map((c) => {
      const paid = c.orders.filter((o) => o.paymentIntentId);
      const totalSpentCents = paid.reduce((sum, o) => sum + o.totalCents, 0);
      const lastOrderAt = c.orders.reduce<Date | null>(
        (latest, o) => (!latest || o.placedAt > latest ? o.placedAt : latest),
        null,
      );
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalOrders: c.orders.length,
        totalSpentCents,
        lastOrderAt,
        joinedAt: c.createdAt,
        mallPassActive: c.mallPassActive,
        active: lastOrderAt != null && lastOrderAt >= activeSince,
      };
    });
  }

  async adminAnalytics() {
    const days = 7;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const orders = await this.prisma.order.findMany({
      where: { placedAt: { gte: start }, paymentIntentId: { not: null } },
      include: {
        subOrders: {
          include: {
            outlet: { include: { brand: true } },
            orderItems: { include: { item: true } },
          },
        },
      },
    });

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const weekday = (d: Date) =>
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    const daily = new Map<string, { day: string; revenueCents: number; orders: number }>();
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      daily.set(dayKey(d), { day: weekday(d), revenueCents: 0, orders: 0 });
    }

    const storeTotals = new Map<string, { name: string; revenueCents: number; orders: number }>();
    const categoryTotals = new Map<string, number>();

    for (const o of orders) {
      const bucket = daily.get(dayKey(o.placedAt));
      if (bucket) {
        bucket.revenueCents += o.totalCents;
        bucket.orders += 1;
      }
      for (const sub of o.subOrders) {
        const name = sub.outlet.brand.name;
        const entry = storeTotals.get(sub.outletId) ?? { name, revenueCents: 0, orders: 0 };
        entry.revenueCents += sub.foodSubtotalCents;
        entry.orders += 1;
        storeTotals.set(sub.outletId, entry);
        for (const oi of sub.orderItems) {
          categoryTotals.set(
            oi.item.category,
            (categoryTotals.get(oi.item.category) ?? 0) + oi.totalCents,
          );
        }
      }
    }

    const topStores = [...storeTotals.values()]
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 5);

    const categoryTotal = [...categoryTotals.values()].reduce((s, v) => s + v, 0);
    const categoryBreakdown = [...categoryTotals.entries()]
      .map(([name, cents]) => ({
        name,
        cents,
        pct: categoryTotal > 0 ? Math.round((cents / categoryTotal) * 100) : 0,
      }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 5);

    const revenueCents = orders.reduce((s, o) => s + o.totalCents, 0);
    return {
      dailyRevenue: [...daily.values()],
      topStores,
      categoryBreakdown,
      totalOrders: orders.length,
      revenueCents,
    };
  }

  async listPayoutsForAdmin() {
    const runs = await this.prisma.payoutRun.findMany({
      orderBy: { runDate: "desc" },
      include: { lines: true },
    });
    return runs.map((r) => ({
      id: r.id,
      runDate: r.runDate,
      kind: r.kind,
      status: r.status,
      lineCount: r.lines.length,
      totalCents: r.lines.reduce((sum, l) => sum + l.amountCents, 0),
    }));
  }

  async markPaid(orderId: string, customerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.customerId !== customerId) {
      throw new ForbiddenException("This order belongs to another customer");
    }
    if (order.paymentIntentId) {
      return { orderId, paymentIntentId: order.paymentIntentId, status: "already_paid" };
    }
    const paymentIntentId = `pi_sim_${randomInt(1e9, 9e9).toString(36)}`;
    await this.prisma.order.update({ where: { id: orderId }, data: { paymentIntentId } });
    return { orderId, paymentIntentId, status: "paid" };
  }

  async recomputeOrderStatus(orderId: string) {
    const order = await this.loadOrder(orderId);
    const status = this.publicStatus(order.subOrders, order.trip);
    if (order.status !== status) {
      await this.prisma.order.update({ where: { id: orderId }, data: { status } });
    }
    return status;
  }

  publicStatus(
    subOrders: { status: string }[],
    trip: { status: string } | null,
  ): OrderPublicStatus {
    return aggregatePublicStatus({
      subOrders: subOrders.map((s) => ({ status: s.status as SubOrderStatus })),
      tripStatus: (trip?.status as TripStatus | undefined) ?? null,
    });
  }

  private async loadOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { subOrders: true, trip: true },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    return order;
  }

  private async toDetailDto(order: { id: string }) {
    const full = await this.prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: {
        complex: true,
        address: true,
        trip: { include: { rider: true, stops: true } },
        subOrders: {
          include: { outlet: true, orderItems: { include: { item: true } } },
        },
      },
    });
    return {
      id: full.id,
      complexId: full.complexId,
      complexName: full.complex.name,
      status: this.publicStatus(full.subOrders, full.trip),
      paid: Boolean(full.paymentIntentId),
      paymentIntentId: full.paymentIntentId,
      placedAt: full.placedAt,
      foodSubtotalCents: full.foodSubtotalCents,
      deliveryFeeCents: full.deliveryFeeCents,
      serviceFeeCents: full.serviceFeeCents,
      tipCents: full.tipCents,
      totalCents: full.totalCents,
      surgeMultiplier: full.surgeMultiplier,
      address: {
        label: full.address.label,
        line1: full.address.line1,
        suburb: full.address.suburb,
        city: full.address.city,
        instructions: full.address.instructions,
      },
      trip: full.trip
        ? {
            id: full.trip.id,
            status: full.trip.status,
            riderName: full.trip.rider.name,
            deliveredAt: full.trip.deliveredAt,
          }
        : null,
      subOrders: full.subOrders.map((s) => ({
        id: s.id,
        outletId: s.outletId,
        outletName: s.outlet.name,
        status: s.status,
        pickupCode: s.pickupCode,
        foodSubtotalCents: s.foodSubtotalCents,
        items: s.orderItems.map((oi) => ({
          id: oi.id,
          name: oi.item.name,
          qty: oi.qty,
          notes: oi.notes,
          unitPriceCents: oi.unitPriceCents,
          totalCents: oi.totalCents,
        })),
      })),
    };
  }

  private async listOneSubOrder(subOrderId: string) {
    const s = await this.prisma.subOrder.findUniqueOrThrow({
      where: { id: subOrderId },
      include: { orderItems: { include: { item: true } } },
    });
    return {
      id: s.id,
      orderId: s.orderId,
      status: s.status,
      pickupCode: s.pickupCode,
      foodSubtotalCents: s.foodSubtotalCents,
      items: s.orderItems.map((oi) => ({
        id: oi.id,
        name: oi.item.name,
        qty: oi.qty,
        totalCents: oi.totalCents,
      })),
    };
  }

  private async resolveAddressId(customerId: string, dto: PlaceOrderDto): Promise<string> {
    if (dto.addressId) {
      const address = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
      if (!address || address.customerId !== customerId) {
        throw new BadRequestException("Address not found for this customer");
      }
      return address.id;
    }
    if (dto.address) {
      const created = await this.prisma.address.create({
        data: {
          customerId,
          label: dto.address.label ?? "Delivery",
          line1: dto.address.line1,
          suburb: dto.address.suburb,
          city: dto.address.city,
          postalCode: dto.address.postalCode,
          instructions: dto.address.instructions,
          lat: dto.address.lat ?? 0,
          lng: dto.address.lng ?? 0,
        },
      });
      return created.id;
    }
    const existing = await this.prisma.address.findFirst({
      where: { customerId },
      orderBy: { createdAt: "asc" },
    });
    if (!existing) {
      throw new BadRequestException("No delivery address on file. Provide an address.");
    }
    return existing.id;
  }

  private pickupCode(): string {
    return randomInt(1000, 10000).toString();
  }
}
