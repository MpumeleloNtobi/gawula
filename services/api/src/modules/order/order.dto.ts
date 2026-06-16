import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { SubOrderStatus } from "@foyer/shared";

export class OrderModifierDto {
  @IsString() groupId!: string;
  @IsArray() @IsString({ each: true }) optionIds!: string[];
}

export class OrderLineDto {
  @IsString() outletId!: string;
  @IsString() itemId!: string;
  @IsInt() @Min(1) qty!: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OrderModifierDto)
  modifiers?: OrderModifierDto[];
  @IsOptional() @IsString() notes?: string;
}

export class NewAddressDto {
  @IsOptional() @IsString() label?: string;
  @IsString() line1!: string;
  @IsOptional() @IsString() suburb?: string;
  @IsString() city!: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}

export class PlaceOrderDto {
  @IsString() complexId!: string;
  @IsOptional() @IsString() addressId?: string;
  @IsOptional() @ValidateNested() @Type(() => NewAddressDto) address?: NewAddressDto;
  @IsOptional() @IsInt() @Min(0) tipCents?: number;
  @IsOptional() @IsIn(["card", "cash"]) paymentMethod?: "card" | "cash";
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderLineDto) lines!: OrderLineDto[];
}

export class UpdateSubOrderStatusDto {
  @IsIn(["accepted", "preparing", "ready", "collected", "rejected"])
  status!: "accepted" | "preparing" | "ready" | "collected" | "rejected";
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() code?: string;
}

export class SubOrderItemAdjustmentDto {
  @IsString() orderItemId!: string;
  @IsInt() @Min(0) fulfilledQty!: number;
}

export class AdjustSubOrderItemsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SubOrderItemAdjustmentDto)
  adjustments!: SubOrderItemAdjustmentDto[];
  @IsOptional() @IsString() reason?: string;
}

export class AdminReasonDto {
  @IsString() reason!: string;
}

export class AdminTransitionSubOrderDto {
  @IsIn(["pending", "accepted", "preparing", "ready", "collected", "rejected", "cancelled"])
  status!: SubOrderStatus;
  @IsOptional() @IsString() reason?: string;
}

export class AdminReassignRiderDto {
  @IsString() riderId!: string;
  @IsString() reason!: string;
}

export class AdminRefundDto {
  @IsInt() @Min(1) amountCents!: number;
  @IsString() reason!: string;
}

export class AdminNoteDto {
  @IsString() note!: string;
}
