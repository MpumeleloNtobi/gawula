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
export const PARTNER_STAGE_FLOW = ["submitted", "in-review", "verification", "live"] as const;

export class CreatePartnerApplicationDto {
  @IsString() @MinLength(2) storeName!: string;
  @IsString() @MinLength(10) description!: string;
  @IsOptional() @IsString() logoDocName?: string;
  @IsString() tradeType!: string;
  @IsString() tradeTypeLabel!: string;
  @IsOptional() @IsString() locationName?: string;
  @IsString() @MinLength(5) address!: string;
  @IsString() areaId!: string;
  @IsString() areaLabel!: string;
  @IsBoolean() waitlisted!: boolean;
  @IsString() @MinLength(2) @Matches(NAME_RE) firstName!: string;
  @IsString() @MinLength(2) @Matches(NAME_RE) lastName!: string;
  @IsOptional() @IsEmail() storeEmail?: string;
  @IsOptional() @IsString() @Matches(PHONE_RE, { message: "storePhone must be a valid phone number" }) storePhone?: string;
  @IsEmail() contactEmail!: string;
  @IsString() @Matches(PHONE_RE, { message: "contactPhone must be a valid phone number" }) contactPhone!: string;
  @IsBoolean() soleProprietor!: boolean;
  @IsOptional() @IsString() registrationNumber?: string;
  @IsOptional() @IsString() registrationDocName?: string;
  @IsOptional() @IsString() storefrontDocName?: string;
  @IsOptional() @IsString() logoData?: string;
  @IsOptional() @IsString() registrationData?: string;
  @IsOptional() @IsString() storefrontData?: string;
}

export class VerifyPartnerEmailDto {
  @IsString() @MinLength(10) token!: string;
}

export class SetPartnerStageDto {
  @IsIn(PARTNER_STAGE_FLOW) stage!: (typeof PARTNER_STAGE_FLOW)[number];
}

export class RejectPartnerApplicationDto {
  @IsString() @MinLength(3) reason!: string;
}
