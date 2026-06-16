import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";

@Module({
  imports: [IdentityModule],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
