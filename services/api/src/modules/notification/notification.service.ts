import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma.module";

interface NotificationEvent {
  orderId: string;
  kind: string;
  message: string;
  at: Date;
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async forCustomer(customerId: string): Promise<NotificationEvent[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      orderBy: { placedAt: "desc" },
      take: 10,
      include: {
        subOrders: { include: { outlet: true } },
        trip: true,
      },
    });

    const events: NotificationEvent[] = [];
    for (const order of orders) {
      const ref = order.id.slice(-5).toUpperCase();
      events.push({
        orderId: order.id,
        kind: "placed",
        message: `Order #${ref} placed`,
        at: order.placedAt,
      });
      for (const sub of order.subOrders) {
        if (sub.prepStartAt) {
          events.push({
            orderId: order.id,
            kind: "preparing",
            message: `${sub.outlet.name} started preparing your order`,
            at: sub.prepStartAt,
          });
        }
        if (sub.readyAt) {
          events.push({
            orderId: order.id,
            kind: "ready",
            message: `${sub.outlet.name} is ready for collection`,
            at: sub.readyAt,
          });
        }
      }
      if (order.trip?.claimedAt) {
        events.push({
          orderId: order.id,
          kind: "rider_assigned",
          message: `A rider is on the way to collect order #${ref}`,
          at: order.trip.claimedAt,
        });
      }
      if (order.trip?.deliveryStartedAt) {
        events.push({
          orderId: order.id,
          kind: "on_the_way",
          message: `Order #${ref} is on the way to you`,
          at: order.trip.deliveryStartedAt,
        });
      }
      if (order.trip?.deliveredAt) {
        events.push({
          orderId: order.id,
          kind: "delivered",
          message: `Order #${ref} delivered. Enjoy.`,
          at: order.trip.deliveredAt,
        });
      }
    }

    return events.sort((a, b) => b.at.getTime() - a.at.getTime());
  }
}
