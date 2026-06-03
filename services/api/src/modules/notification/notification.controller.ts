import { Controller, Get, UseGuards } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { JwtAuthGuard, Roles, CurrentUser } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
@Roles("customer")
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@CurrentUser() user: Principal) {
    return this.notifications.forCustomer(user.id);
  }
}
