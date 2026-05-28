import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddCartItemDto, CreateCartDto, UpdateCartItemDto } from "./cart.dto";

@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Post()
  create(@Body() dto: CreateCartDto) {
    return this.cart.create(dto);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.cart.get(id);
  }

  @Post(":id/items")
  add(@Param("id") id: string, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(id, dto);
  }

  @Patch(":id/items/:lineId")
  update(
    @Param("id") id: string,
    @Param("lineId") lineId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(id, lineId, dto);
  }

  @Delete(":id/items/:lineId")
  remove(@Param("id") id: string, @Param("lineId") lineId: string) {
    return this.cart.removeItem(id, lineId);
  }
}
