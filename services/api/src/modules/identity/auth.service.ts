import { Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../infrastructure/prisma.module";
import { MailService } from "../../infrastructure/mail.module";
import { hashPassword, verifyPassword } from "./password.util";
import { generateResetToken, hashResetToken } from "./reset-token.util";
import {
  CustomerSignupDto,
  EmailPasswordLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  StaffLoginDto,
  VerifyEmailDto,
} from "./auth.dto";
import { JwtPayload, Principal, PrincipalRole } from "./principal";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async login(dto: EmailPasswordLoginDto) {
    const email = normaliseEmail(dto.email);
    const customer = await this.prisma.customer.findUnique({
      where: { email },
      include: { roleGrants: true },
    });
    if (!customer || !(await verifyPassword(dto.password, customer.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueAccount(customer);
  }

  async customerSignup(dto: CustomerSignupDto) {
    const email = normaliseEmail(dto.email);
    const existing = await this.prisma.customer.findUnique({ where: { email } });
    if (existing) {
      throw new UnauthorizedException("An account already exists for that email");
    }
    const phone = dto.phone.trim();
    const phoneTaken = await this.prisma.customer.findUnique({ where: { phone } });
    if (phoneTaken) {
      throw new UnauthorizedException("An account already exists for that phone number");
    }
    const customer = await this.prisma.customer.create({
      data: {
        email,
        passwordHash: await hashPassword(dto.password),
        name: dto.name,
        phone,
      },
    });
    await this.sendVerificationEmail(customer.id, customer.email, customer.name);
    return this.issueAccount({ ...customer, roleGrants: [] });
  }

  private async sendVerificationEmail(customerId: string, email: string, name: string | null) {
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({
        where: { customerId, usedAt: null },
      }),
      this.prisma.emailVerificationToken.create({
        data: { customerId, tokenHash, expiresAt },
      }),
    ]);

    const appBaseUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const verifyUrl = `${appBaseUrl}/verify-email?token=${token}`;
    const firstName = name ? name.split(" ")[0] : null;
    const greeting = firstName ? `Hi ${firstName},` : "Hi,";

    await this.mail.send({
      to: email,
      subject: "Confirm your email to start ordering on Gawula",
      text: `${greeting}\n\nWelcome to Gawula, food from your favourites, all in one order.\n\nConfirm your email address to start ordering:\n${verifyUrl}\n\nThis link expires in 24 hours. If you did not create an account, you can safely ignore this email.\n\nGawula`,
      html: this.buildVerificationEmailHtml(greeting, verifyUrl),
    });

    this.logger.log(`Verification email queued for ${email}. Link: ${verifyUrl}`);
  }

  private buildVerificationEmailHtml(greeting: string, verifyUrl: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light only" />
<title>Confirm your email</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:56px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;width:100%;">
<tr>
<td style="padding-bottom:40px;font-family:'Helvetica Neue',Arial,sans-serif;">
<span style="font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#ed4317;">Gawula</span>
</td>
</tr>
<tr>
<td style="font-family:'Helvetica Neue',Arial,sans-serif;color:#0a0a0a;">
<p style="margin:0 0 20px 0;font-size:15px;color:#52525b;">${greeting}</p>
<h1 style="margin:0 0 14px 0;font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-0.6px;color:#0a0a0a;">Confirm your email</h1>
<p style="margin:0 0 36px 0;font-size:15px;line-height:1.65;color:#52525b;">Verify your address to start ordering from your favourite stores, all in one basket.</p>
</td>
</tr>
<tr>
<td style="padding-bottom:36px;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0">
<tr><td bgcolor="#0a0a0a" style="border-radius:10px;">
<a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:10px;">Confirm email</a>
</td></tr>
</table>
</td>
</tr>
<tr>
<td style="font-family:'Helvetica Neue',Arial,sans-serif;">
<p style="margin:0 0 6px 0;font-size:13px;color:#a1a1aa;">Or open this link</p>
<p style="margin:0 0 40px 0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${verifyUrl}" style="color:#ed4317;text-decoration:none;">${verifyUrl}</a></p>
</td>
</tr>
<tr>
<td style="border-top:1px solid #f0f0f0;padding-top:24px;font-family:'Helvetica Neue',Arial,sans-serif;">
<p style="margin:0 0 4px 0;font-size:12px;line-height:1.6;color:#a1a1aa;">This link expires in 24 hours. If you did not create a Gawula account, you can ignore this email.</p>
<p style="margin:0;font-size:12px;color:#c4c4cc;">&copy; 2026 Gawula</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = hashResetToken(dto.token);
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("This verification link is invalid or has expired");
    }

    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id: record.customerId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.deleteMany({
        where: { customerId: record.customerId, usedAt: null, NOT: { id: record.id } },
      }),
    ]);

    return { ok: true as const };
  }

  async resendVerification(principal: Principal) {
    const customer = await this.prisma.customer.findUnique({ where: { id: principal.id } });
    if (!customer) throw new NotFoundException("Customer not found");
    if (customer.emailVerifiedAt) {
      return { ok: true as const, alreadyVerified: true };
    }
    await this.sendVerificationEmail(customer.id, customer.email, customer.name);
    return { ok: true as const, alreadyVerified: false };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const email = normaliseEmail(dto.email);
    const customer = await this.prisma.customer.findUnique({ where: { email } });

    const response: { ok: true; devResetToken?: string } = { ok: true };

    if (!customer) {
      return response;
    }

    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: { customerId: customer.id, usedAt: null },
      }),
      this.prisma.passwordResetToken.create({
        data: { customerId: customer.id, tokenHash, expiresAt },
      }),
    ]);

    const isProduction = process.env.NODE_ENV === "production";
    const appBaseUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const resetUrl = `${appBaseUrl}/reset-password?token=${token}`;

    this.logger.log(
      `Password reset requested for ${email}. Reset link (stub email delivery): ${resetUrl}`,
    );

    if (!isProduction) {
      response.devResetToken = token;
    }

    return response;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashResetToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("This reset link is invalid or has expired. Please request a new one.");
    }

    const passwordHash = await hashPassword(dto.password);

    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id: record.customerId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { customerId: record.customerId, usedAt: null, NOT: { id: record.id } },
      }),
    ]);

    return { ok: true as const };
  }

  async staffLogin(dto: StaffLoginDto) {
    const email = normaliseEmail(dto.email);
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid email or password");
    const ok = await verifyPassword(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid email or password");
    const role: PrincipalRole = user.role === "partner" ? "partner" : "admin";
    const roles: PrincipalRole[] = [role];
    const token = this.sign({
      sub: user.id,
      roles,
      email: user.email,
      complexId: user.complexId,
      outletId: user.outletId,
    });
    return {
      token,
      principal: {
        id: user.id,
        roles,
        email: user.email,
        name: user.name,
        complexId: user.complexId,
        outletId: user.outletId,
      },
    };
  }

  async me(principal: Principal) {
    const isStaffOnly =
      (principal.roles.includes("partner") || principal.roles.includes("admin")) &&
      !principal.roles.includes("customer");

    if (isStaffOnly) {
      const u = await this.prisma.adminUser.findUnique({ where: { id: principal.id } });
      if (!u) throw new NotFoundException("Staff user not found");
      const role: PrincipalRole = u.role === "partner" ? "partner" : "admin";
      return {
        id: u.id,
        roles: [role],
        email: u.email,
        name: u.name,
        complexId: u.complexId,
        outletId: u.outletId,
      };
    }

    const c = await this.prisma.customer.findUnique({
      where: { id: principal.id },
      include: { roleGrants: true, riderProfile: true },
    });
    if (!c) throw new NotFoundException("Account not found");
    const roles = accountRoles(c.roleGrants);
    return {
      id: c.id,
      roles,
      email: c.email,
      phone: c.phone,
      name: c.name,
      emailVerified: Boolean(c.emailVerifiedAt),
      mallPassActive: c.mallPassActive,
      riderStatus: c.riderProfile?.status ?? null,
      homeComplexId: c.riderProfile?.homeComplexId ?? null,
    };
  }

  async refresh(principal: Principal) {
    const isStaffOnly =
      (principal.roles.includes("partner") || principal.roles.includes("admin")) &&
      !principal.roles.includes("customer");

    if (isStaffOnly) {
      const u = await this.prisma.adminUser.findUnique({ where: { id: principal.id } });
      if (!u) throw new NotFoundException("Staff user not found");
      const role: PrincipalRole = u.role === "partner" ? "partner" : "admin";
      const roles: PrincipalRole[] = [role];
      const token = this.sign({
        sub: u.id,
        roles,
        email: u.email,
        complexId: u.complexId,
        outletId: u.outletId,
      });
      return {
        token,
        principal: {
          id: u.id,
          roles,
          email: u.email,
          name: u.name,
          complexId: u.complexId,
          outletId: u.outletId,
        },
      };
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: principal.id },
      include: { roleGrants: true },
    });
    if (!customer) throw new NotFoundException("Account not found");
    return this.issueAccount(customer);
  }

  private issueAccount(customer: {
    id: string;
    email: string;
    phone: string | null;
    name: string | null;
    emailVerifiedAt: Date | null;
    mallPassActive: boolean;
    roleGrants: { role: string; revokedAt: Date | null }[];
  }) {
    const roles = accountRoles(customer.roleGrants);
    const token = this.sign({ sub: customer.id, roles, email: customer.email });
    return {
      token,
      principal: {
        id: customer.id,
        roles,
        email: customer.email,
        phone: customer.phone,
        name: customer.name,
        emailVerified: Boolean(customer.emailVerifiedAt),
        mallPassActive: customer.mallPassActive,
      },
    };
  }

  private sign(payload: JwtPayload): string {
    return this.jwt.sign(payload);
  }
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function accountRoles(grants: { role: string; revokedAt: Date | null }[]): PrincipalRole[] {
  const granted = grants
    .filter((g) => !g.revokedAt)
    .map((g) => g.role as PrincipalRole);
  return ["customer", ...granted];
}
