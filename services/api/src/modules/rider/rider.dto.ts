import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;
const NAME_RE = /^\p{L}[\p{L} '-]*\p{L}$/u;
const VEHICLES = ["bicycle", "scooter", "motorbike", "car"] as const;

export class CreateRiderApplicationDto {
  @IsString() @MinLength(2) @Matches(NAME_RE) firstName!: string;
  @IsString() @MinLength(2) @Matches(NAME_RE) lastName!: string;
  @IsEmail() email!: string;
  @IsString() @Matches(PHONE_RE, { message: "phone must be a valid phone number" }) phone!: string;
  @IsString() areaId!: string;
  @IsString() areaLabel!: string;
  @IsBoolean() waitlisted!: boolean;
  @IsIn(VEHICLES) vehicleType!: (typeof VEHICLES)[number];
  @IsBoolean() hasSmartphone!: boolean;
  @IsString() @MinLength(6) idNumber!: string;
  @IsOptional() @IsString() idFrontDocName?: string;
  @IsOptional() @IsString() idBackDocName?: string;
  @IsOptional() @IsString() selfieDocName?: string;
  @IsOptional() @IsString() fullBodyDocName?: string;
  @IsOptional() @IsString() licenceDocName?: string;
}

export class RejectRiderApplicationDto {
  @IsString() @MinLength(3) reason!: string;
}
