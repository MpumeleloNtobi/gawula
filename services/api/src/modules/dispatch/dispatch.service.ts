import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma.module";
import { OrderService } from "../order/order.service";

@Injectable()
export class DispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrderService,
  ) {}

  async availableTrips(accountId: string) {
    const rider = await this.requireRider(accountId);
    const orders = await this.prisma.order.findMany({
      where: {
        complexId: rider.homeComplexId,
        paymentIntentId: { not: null },
        trip: { is: null },
      },
      orderBy: { placedAt: "asc" },
      include: {
        complex: true,
        address: true,
        subOrders: { include: { outlet: true } },
      },
    });
    return orders
      .filter((o) => o.subOrders.some((s) => s.status !== "rejected" && s.status !== "cancelled"))
      .map((o) => ({
        orderId: o.id,
        complexName: o.complex.name,
        dropoffSuburb: o.address.suburb ?? o.address.city,
        status: this.orders.publicStatus(o.subOrders, null),
        outlets: o.subOrders.map((s) => ({
          subOrderId: s.id,
          outletName: s.outlet.name,
          status: s.status,
          locationInMall: s.outlet.locationInMall,
        })),
        earningsCents: o.deliveryFeeCents + o.tipCents,
        placedAt: o.placedAt,
      }));
  }

  async claim(accountId: string, orderId: string) {
    const rider = await this.requireRider(accountId);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { trip: true, subOrders: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (!order.paymentIntentId) throw new BadRequestException("Order is not paid yet");
    if (order.trip) throw new BadRequestException("Order already has a trip");

    const deliverable = order.subOrders.filter(
      (s) => s.status !== "rejected" && s.status !== "cancelled",
    );
    if (deliverable.length === 0) {
      throw new BadRequestException("No deliverable sub-orders on this order");
    }

    const now = new Date();
    await this.prisma.trip.create({
      data: {
        orderId: order.id,
        riderId: rider.id,
        status: "claimed",
        earningsCents: order.deliveryFeeCents + order.tipCents,
        stops: {
          create: deliverable.map((s, index) => ({
            subOrderId: s.id,
            sequence: index + 1,
            etaAt: new Date(now.getTime() + (index + 1) * 5 * 60 * 1000),
          })),
        },
      },
    });
    await this.prisma.rider.update({ where: { id: rider.id }, data: { status: "on_trip" } });
    await this.orders.recomputeOrderStatus(order.id);
    return this.tripDetail(order.id);
  }

  async pickup(accountId: string, tripId: string, subOrderId: string) {
    const rider = await this.requireRider(accountId);
    const trip = await this.requireOwnedTrip(rider.id, tripId);
    const stop = trip.stops.find((s) => s.subOrderId === subOrderId);
    if (!stop) throw new NotFoundException("Sub-order is not part of this trip");

    const subOrder = await this.prisma.subOrder.findUniqueOrThrow({ where: { id: subOrderId } });
    if (subOrder.status !== "ready") {
      throw new BadRequestException("Sub-order is not ready for collection yet");
    }

    const now = new Date();
    await this.prisma.subOrder.update({
      where: { id: subOrderId },
      data: { status: "collected", riderCollectedAt: now },
    });
    await this.prisma.tripStop.update({
      where: { id: stop.id },
      data: { arrivedAt: now, collectedAt: now },
    });

    const refreshed = await this.prisma.trip.findUniqueOrThrow({
      where: { id: tripId },
      include: { stops: true },
    });
    const allCollected = refreshed.stops.every((s) => s.collectedAt);
    if (allCollected) {
      await this.prisma.trip.update({
        where: { id: tripId },
        data: { status: "in_delivery", deliveryStartedAt: now },
      });
    } else if (trip.status === "claimed") {
      await this.prisma.trip.update({
        where: { id: tripId },
        data: { status: "pickup_loop", pickupStartedAt: now },
      });
    }
    await this.orders.recomputeOrderStatus(trip.orderId);
    return this.tripDetail(trip.orderId);
  }

  async deliver(accountId: string, tripId: string) {
    const rider = await this.requireRider(accountId);
    const trip = await this.requireOwnedTrip(rider.id, tripId);
    const outstanding = trip.stops.filter((s) => !s.collectedAt);
    if (outstanding.length > 0) {
      throw new BadRequestException("Collect every sub-order before delivering");
    }
    const now = new Date();
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: "delivered", deliveredAt: now },
    });
    await this.prisma.order.update({ where: { id: trip.orderId }, data: { status: "delivered" } });

    const remaining = await this.prisma.trip.count({
      where: { riderId: rider.id, status: { notIn: ["delivered", "cancelled_by_ops"] } },
    });
    if (remaining === 0) {
      await this.prisma.rider.update({ where: { id: rider.id }, data: { status: "online" } });
    }
    return this.tripDetail(trip.orderId);
  }

  async myTrips(accountId: string) {
    const rider = await this.requireRider(accountId);
    const trips = await this.prisma.trip.findMany({
      where: { riderId: rider.id, status: { notIn: ["delivered", "cancelled_by_ops"] } },
      orderBy: { claimedAt: "desc" },
    });
    return Promise.all(trips.map((t) => this.tripDetail(t.orderId)));
  }

  async me(accountId: string) {
    const rider = await this.requireRider(accountId);
    return { id: rider.id, name: rider.name, status: rider.status };
  }

  async setAvailability(accountId: string, online: boolean) {
    const rider = await this.requireRider(accountId);
    if (rider.status === "on_trip") {
      throw new BadRequestException("Finish your active trip before changing availability");
    }
    const status = online ? "online" : "offline";
    const updated = await this.prisma.rider.update({
      where: { id: rider.id },
      data: { status },
    });
    return { id: updated.id, name: updated.name, status: updated.status };
  }

  private async tripDetail(orderId: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        complex: true,
        address: true,
        customer: true,
        trip: { include: { stops: true } },
        subOrders: { include: { outlet: true, orderItems: { include: { item: true } } } },
      },
    });
    return {
      tripId: order.trip?.id ?? null,
      orderId: order.id,
      status: order.trip?.status ?? "available",
      complexName: order.complex.name,
      customerName: order.customer.name,
      dropoff: {
        line1: order.address.line1,
        suburb: order.address.suburb,
        city: order.address.city,
        instructions: order.address.instructions,
      },
      earningsCents: order.trip?.earningsCents ?? order.deliveryFeeCents + order.tipCents,
      stops: order.subOrders.map((s) => ({
        subOrderId: s.id,
        outletName: s.outlet.name,
        locationInMall: s.outlet.locationInMall,
        status: s.status,
        pickupCode: s.pickupCode,
        collected: Boolean(s.riderCollectedAt),
        items: s.orderItems.map((oi) => ({ name: oi.item.name, qty: oi.qty })),
      })),
    };
  }

  private async requireRider(accountId: string) {
    const rider = await this.prisma.rider.findUnique({ where: { customerId: accountId } });
    if (!rider) throw new NotFoundException("Rider profile not found for this account");
    return rider;
  }

  private async requireOwnedTrip(riderId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { stops: true },
    });
    if (!trip) throw new NotFoundException("Trip not found");
    if (trip.riderId !== riderId) throw new ForbiddenException("This trip belongs to another rider");
    return trip;
  }
}
