import { IsEmail, IsString, Matches, MinLength } from "class-validator";

const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_MESSAGE =
  "password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character";

const NAME_RE = /^\p{L}[\p{L} '-]*\p{L}$/u;
const NAME_MESSAGE = "name may only contain letters, spaces, hyphens and apostrophes";

export class EmailPasswordLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class StaffLoginDto extends EmailPasswordLoginDto {}

export class CustomerSignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(PASSWORD_RE, { message: PASSWORD_MESSAGE })
  password!: string;

  @IsString()
  @MinLength(2)
  @Matches(NAME_RE, { message: NAME_MESSAGE })
  name!: string;

  @IsString()
  @Matches(PHONE_RE, { message: "phone must be a valid phone number" })
  phone!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @Matches(PASSWORD_RE, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(1)
  token!: string;
}
