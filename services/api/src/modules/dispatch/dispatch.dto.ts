import { IsBoolean, IsString } from "class-validator";

export class ClaimTripDto {
  @IsString() orderId!: string;
}

export class PickupDto {
  @IsString() subOrderId!: string;
}

export class AvailabilityDto {
  @IsBoolean() online!: boolean;
}
