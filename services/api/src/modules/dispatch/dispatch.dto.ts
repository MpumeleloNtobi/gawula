import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class ClaimTripDto {
  @IsString() orderId!: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsIn(["bicycle", "scooter", "motorbike", "car"]) vehicleType?: string;
  @IsOptional() @IsString() @MaxLength(60) vehicleBrand?: string;
  @IsOptional() @IsString() @MaxLength(40) vehicleColour?: string;
  @IsOptional() @IsString() @MaxLength(20) vehicleReg?: string;
  @IsOptional() @IsString() @MaxLength(200) homeAddress?: string;
}

export class PickupDto {
  @IsString() subOrderId!: string;
}

export class AvailabilityDto {
  @IsBoolean() online!: boolean;
}
