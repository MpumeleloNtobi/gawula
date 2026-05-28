import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreateCartDto {
  @IsString()
  customerId!: string;

  @IsString()
  complexId!: string;
}

export class SelectedModifierDto {
  @IsString() groupId!: string;
  @IsArray() @IsString({ each: true }) optionIds!: string[];
}

export class AddCartItemDto {
  @IsString() outletId!: string;
  @IsString() itemId!: string;
  @IsInt() @Min(1) qty!: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SelectedModifierDto)
  modifiers?: SelectedModifierDto[];
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCartItemDto {
  @IsInt() @Min(0) qty!: number;
}
