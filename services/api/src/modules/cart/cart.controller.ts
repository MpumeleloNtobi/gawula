import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddCartItemDto, CreateCartDto, UpdateCartItemDto } from "./cart.dto";
import { CurrentUser, JwtAuthGuard, Roles } from "../identity/jwt-auth.guard";
import type { Principal } from "../identity/principal";

@Controller("cart")
@UseGuards(JwtAuthGuard)
@Roles("customer")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Post()
  create(@CurrentUser() user: Principal, @Body() dto: CreateCartDto) {
    return this.cart.create(user.id, dto);
  }

  @Get(":id")
  get(@CurrentUser() user: Principal, @Param("id") id: string) {
    return this.cart.getOwned(id, user.id);
  }

  @Post(":id/items")
  add(@CurrentUser() user: Principal, @Param("id") id: string, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(id, user.id, dto);
  }

  @Patch(":id/items/:lineId")
  update(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Param("lineId") lineId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(id, user.id, lineId, dto);
  }

  @Delete(":id/items/:lineId")
  remove(@CurrentUser() user: Principal, @Param("id") id: string, @Param("lineId") lineId: string) {
    return this.cart.removeItem(id, user.id, lineId);
  }
}
