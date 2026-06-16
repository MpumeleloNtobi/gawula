import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class HoursWindowDto {
  @IsString()
  open!: string;

  @IsString()
  close!: string;

  @IsOptional()
  @IsBoolean()
  closed?: boolean;
}

export class WeeklyHoursDto {
  @ValidateNested()
  @Type(() => HoursWindowDto)
  mon!: HoursWindowDto;

  @ValidateNested()
  @Type(() => HoursWindowDto)
  tue!: HoursWindowDto;

  @ValidateNested()
  @Type(() => HoursWindowDto)
  wed!: HoursWindowDto;

  @ValidateNested()
  @Type(() => HoursWindowDto)
  thu!: HoursWindowDto;

  @ValidateNested()
  @Type(() => HoursWindowDto)
  fri!: HoursWindowDto;

  @ValidateNested()
  @Type(() => HoursWindowDto)
  sat!: HoursWindowDto;

  @ValidateNested()
  @Type(() => HoursWindowDto)
  sun!: HoursWindowDto;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  addressLine?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyHoursDto)
  hours?: WeeklyHoursDto;

  @IsOptional()
  @IsBoolean()
  autoAcceptOrders?: boolean;

  @IsOptional()
  @IsBoolean()
  pauseNewOrders?: boolean;

  @IsOptional()
  @IsBoolean()
  showPrepTime?: boolean;

  @IsOptional()
  @IsBoolean()
  allowTipping?: boolean;
}

export class UpsertItemDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(400)
  description!: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsInt()
  @Min(0)
  @Max(120)
  prepTimeMinutes!: number;

  @IsString()
  @MaxLength(80)
  category!: string;

  @IsBoolean()
  available!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5_000_000)
  imageUrl?: string;
}

export class ReplyReviewDto {
  @IsString()
  @MaxLength(800)
  text!: string;
}

export class OrdersQueryDto {
  @IsOptional()
  @IsIn(["active", "past"])
  scope?: "active" | "past";
}

export class AnalyticsRangeDto {
  @IsOptional()
  @IsIn(["1d", "7d", "30d", "90d", "365d"])
  range?: "1d" | "7d" | "30d" | "90d" | "365d";
}

export class SalesSeriesDto {
  @IsOptional()
  @IsIn(["today", "daily", "weekly", "monthly", "yearly"])
  granularity?: "today" | "daily" | "weekly" | "monthly" | "yearly";
}

export class CreateMenuCategoryDto {
  @IsString()
  @MaxLength(80)
  name!: string;
}

export class ReorderItemsDto {
  @IsArray()
  @IsString({ each: true })
  itemIds!: string[];
}

export class UpsertPromotionDto {
  @IsIn([
    "percentage",
    "fixed",
    "free_delivery",
    "free_item",
    "bogo",
    "happy_hour",
    "item_discount",
    "buy_save",
  ])
  type!:
    | "percentage"
    | "fixed"
    | "free_delivery"
    | "free_item"
    | "bogo"
    | "happy_hour"
    | "item_discount"
    | "buy_save";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  percentOff?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  amountOffCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSpendCents?: number;

  @IsOptional()
  @IsString()
  buyItemId?: string;

  @IsOptional()
  @IsString()
  getItemId?: string;

  @IsOptional()
  @IsString()
  freeItemId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  buyQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  getQuantity?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days?: number[];

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Enter a valid time" })
  startTime?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Enter a valid time" })
  endTime?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class PromotionStatusDto {
  @IsBoolean()
  paused!: boolean;
}
