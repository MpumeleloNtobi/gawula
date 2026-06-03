import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { PrismaModule } from "./infrastructure/prisma.module";
import { RedisModule } from "./infrastructure/redis.module";
import { MailModule } from "./infrastructure/mail.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CartModule } from "./modules/cart/cart.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { OrderModule } from "./modules/order/order.module";
import { SyncModule } from "./modules/sync/sync.module";
import { DispatchModule } from "./modules/dispatch/dispatch.module";
import { RiderModule } from "./modules/rider/rider.module";
import { PartnerModule } from "./modules/partner/partner.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { SupportModule } from "./modules/support/support.module";
import { HealthController } from "./health.controller";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([
      { ttl: Number(process.env.THROTTLE_TTL ?? 60_000), limit: Number(process.env.THROTTLE_LIMIT ?? 120) },
    ]),
    PrismaModule,
    RedisModule,
    MailModule,
    IdentityModule,
    CatalogModule,
    CartModule,
    PricingModule,
    OrderModule,
    SyncModule,
    DispatchModule,
    RiderModule,
    PartnerModule,
    PaymentModule,
    NotificationModule,
    AnalyticsModule,
    SupportModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
