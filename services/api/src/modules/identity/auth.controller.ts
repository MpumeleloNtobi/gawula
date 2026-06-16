import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import {
  CustomerSignupDto,
  EmailPasswordLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  StaffLoginDto,
  VerifyEmailDto,
} from "./auth.dto";
import { CurrentUser, JwtAuthGuard } from "./jwt-auth.guard";
import { Principal } from "./principal";

const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @Throttle(AUTH_THROTTLE)
  login(@Body() dto: EmailPasswordLoginDto) {
    return this.auth.login(dto);
  }

  @Post("customer/signup")
  @Throttle(AUTH_THROTTLE)
  customerSignup(@Body() dto: CustomerSignupDto) {
    return this.auth.customerSignup(dto);
  }

  @Post("customer/forgot-password")
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.requestPasswordReset(dto);
  }

  @Post("customer/reset-password")
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post("customer/verify-email")
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @Post("customer/resend-verification")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  resendVerification(@CurrentUser() principal: Principal) {
    return this.auth.resendVerification(principal);
  }

  @Post("staff/login")
  @Throttle(AUTH_THROTTLE)
  staffLogin(@Body() dto: StaffLoginDto) {
    return this.auth.staffLogin(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() principal: Principal) {
    return this.auth.me(principal);
  }

  @Post("refresh")
  @UseGuards(JwtAuthGuard)
  refresh(@CurrentUser() principal: Principal) {
    return this.auth.refresh(principal);
  }
}
