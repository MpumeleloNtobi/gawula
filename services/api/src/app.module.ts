import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./infrastructure/prisma.module";
import { RedisModule } from "./infrastructure/redis.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CartModule } from "./modules/cart/cart.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { OrderModule } from "./modules/order/order.module";
import { SyncModule } from "./modules/sync/sync.module";
import { DispatchModule } from "./modules/dispatch/dispatch.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { SupportModule } from "./modules/support/support.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    IdentityModule,
    CatalogModule,
    CartModule,
    PricingModule,
    OrderModule,
    SyncModule,
    DispatchModule,
    PaymentModule,
    NotificationModule,
    AnalyticsModule,
    SupportModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
