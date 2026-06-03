import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";

@Module({
  imports: [IdentityModule],
  providers: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
