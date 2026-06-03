import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RiderService } from "./rider.service";
import { CreateRiderApplicationDto } from "./rider.dto";
import { CurrentUser, JwtAuthGuard } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";

@Controller("riders")
@UseGuards(JwtAuthGuard)
export class RiderController {
  constructor(private readonly rider: RiderService) {}

  @Post("applications")
  create(@CurrentUser() user: Principal, @Body() dto: CreateRiderApplicationDto) {
    return this.rider.createApplication(user.id, dto);
  }

  @Get("applications/:id")
  status(@CurrentUser() user: Principal, @Param("id") id: string) {
    return this.rider.applicationStatus(user.id, id);
  }
}
