import { Injectable, Logger, ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma.module";
import { MailService } from "../../infrastructure/mail.module";
import { generateResetToken, hashResetToken } from "../identity/reset-token.util";
import { CreatePartnerApplicationDto, PARTNER_STAGE_FLOW, VerifyPartnerEmailDto } from "./partner.dto";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PartnerService {
  private readonly logger = new Logger(PartnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async createApplication(dto: CreatePartnerApplicationDto) {
    const application = await this.prisma.partnerApplication.create({
      data: {
        storeName: dto.storeName.trim(),
        description: dto.description.trim(),
        logoDocName: dto.logoDocName,
        tradeType: dto.tradeType,
        tradeTypeLabel: dto.tradeTypeLabel,
        locationName: dto.locationName?.trim() || null,
        address: dto.address.trim(),
        areaId: dto.areaId,
        areaLabel: dto.areaLabel,
        waitlisted: dto.waitlisted,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        storeEmail: dto.storeEmail?.trim().toLowerCase() || null,
        storePhone: dto.storePhone?.trim() || null,
        contactEmail: dto.contactEmail.trim().toLowerCase(),
        contactPhone: dto.contactPhone.trim(),
        soleProprietor: dto.soleProprietor,
        registrationNumber: dto.registrationNumber?.trim() || null,
        registrationDocName: dto.registrationDocName || null,
        storefrontDocName: dto.storefrontDocName || null,
        logoData: dto.logoData || null,
        registrationData: dto.registrationData || null,
        storefrontData: dto.storefrontData || null,
        stage: "submitted",
      },
    });

    await this.sendVerificationEmail(
      application.id,
      application.contactEmail,
      application.firstName,
    );

    return {
      id: application.id,
      stage: application.stage,
      waitlisted: application.waitlisted,
      contactEmail: application.contactEmail,
    };
  }

  async verifyEmail(dto: VerifyPartnerEmailDto) {
    const tokenHash = hashResetToken(dto.token);
    const record = await this.prisma.partnerEmailVerificationToken.findUnique({
      where: { tokenHash },
      include: { application: true },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("This verification link is invalid or has expired");
    }

    await this.prisma.$transaction([
      this.prisma.partnerApplication.update({
        where: { id: record.applicationId },
        data: { contactEmailVerifiedAt: new Date() },
      }),
      this.prisma.partnerEmailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.partnerEmailVerificationToken.deleteMany({
        where: { applicationId: record.applicationId, usedAt: null, NOT: { id: record.id } },
      }),
    ]);

    return {
      ok: true as const,
      storeName: record.application.storeName,
      firstName: record.application.firstName,
      waitlisted: record.application.waitlisted,
      areaLabel: record.application.areaLabel,
    };
  }

  async resendVerification(applicationId: string) {
    const application = await this.prisma.partnerApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException("Application not found");
    if (application.contactEmailVerifiedAt) {
      return { ok: true as const, alreadyVerified: true };
    }
    await this.sendVerificationEmail(
      application.id,
      application.contactEmail,
      application.firstName,
    );
    return { ok: true as const, alreadyVerified: false };
  }

  async listForAdmin() {
    const applications = await this.prisma.partnerApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
    return applications.map((a) => ({
      id: a.id,
      storeName: a.storeName,
      description: a.description,
      contactName: `${a.firstName} ${a.lastName}`.trim(),
      contactEmail: a.contactEmail,
      contactPhone: a.contactPhone,
      contactEmailVerified: a.contactEmailVerifiedAt !== null,
      tradeTypeLabel: a.tradeTypeLabel,
      locationName: a.locationName,
      address: a.address,
      areaLabel: a.areaLabel,
      waitlisted: a.waitlisted,
      soleProprietor: a.soleProprietor,
      registrationNumber: a.registrationNumber,
      logoDocName: a.logoDocName,
      registrationDocName: a.registrationDocName,
      storefrontDocName: a.storefrontDocName,
      stage: a.stage,
      rejectionReason: a.rejectionReason,
      createdAt: a.createdAt,
      decidedAt: a.decidedAt,
    }));
  }

  async getForAdmin(id: string) {
    const a = await this.prisma.partnerApplication.findUnique({ where: { id } });
    if (!a) throw new NotFoundException("Application not found");
    return {
      id: a.id,
      storeName: a.storeName,
      description: a.description,
      firstName: a.firstName,
      lastName: a.lastName,
      contactName: `${a.firstName} ${a.lastName}`.trim(),
      contactEmail: a.contactEmail,
      contactPhone: a.contactPhone,
      contactEmailVerified: a.contactEmailVerifiedAt !== null,
      storeEmail: a.storeEmail,
      storePhone: a.storePhone,
      tradeTypeLabel: a.tradeTypeLabel,
      locationName: a.locationName,
      address: a.address,
      areaLabel: a.areaLabel,
      waitlisted: a.waitlisted,
      soleProprietor: a.soleProprietor,
      registrationNumber: a.registrationNumber,
      logoDocName: a.logoDocName,
      registrationDocName: a.registrationDocName,
      storefrontDocName: a.storefrontDocName,
      logoData: a.logoData,
      registrationData: a.registrationData,
      storefrontData: a.storefrontData,
      stage: a.stage,
      rejectionReason: a.rejectionReason,
      createdAt: a.createdAt,
      decidedAt: a.decidedAt,
    };
  }

  async setStage(id: string, reviewerId: string, stage: (typeof PARTNER_STAGE_FLOW)[number]) {
    const application = await this.prisma.partnerApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException("Application not found");
    if (application.stage === "rejected") {
      throw new ConflictException("Cannot change the stage of a rejected application");
    }
    const updated = await this.prisma.partnerApplication.update({
      where: { id },
      data: {
        stage,
        reviewerId,
        rejectionReason: null,
        decidedAt: stage === "live" ? new Date() : null,
      },
    });
    this.logger.log(`Partner application ${id} moved to stage "${stage}" by ${reviewerId}`);
    return { id, stage: updated.stage };
  }

  async reject(id: string, reviewerId: string, reason: string) {
    const application = await this.prisma.partnerApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException("Application not found");
    if (application.stage === "live") {
      throw new ConflictException("Cannot reject an application that is already live");
    }
    await this.prisma.partnerApplication.update({
      where: { id },
      data: { stage: "rejected", rejectionReason: reason.trim(), reviewerId, decidedAt: new Date() },
    });
    return { id, stage: "rejected" as const };
  }

  private async sendVerificationEmail(applicationId: string, email: string, firstName: string) {
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    await this.prisma.$transaction([
      this.prisma.partnerEmailVerificationToken.deleteMany({
        where: { applicationId, usedAt: null },
      }),
      this.prisma.partnerEmailVerificationToken.create({
        data: { applicationId, tokenHash, expiresAt },
      }),
    ]);

    const appBaseUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const verifyUrl = `${appBaseUrl}/partners/verify-email?token=${token}`;
    const greeting = firstName ? `Hi ${firstName},` : "Hi,";

    await this.mail.send({
      to: email,
      subject: "Confirm your email to list your store on Gawula",
      text: `${greeting}\n\nThanks for applying to list your store on Gawula.\n\nConfirm your email address to complete your application:\n${verifyUrl}\n\nThis link expires in 24 hours. If you did not apply, you can safely ignore this email.\n\nGawula`,
      html: this.buildVerificationEmailHtml(greeting, verifyUrl),
    });

    this.logger.log(`Partner verification email queued for ${email}. Link: ${verifyUrl}`);
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
<p style="margin:0 0 36px 0;font-size:15px;line-height:1.65;color:#52525b;">Verify your address to complete your store application. We will use it to keep you updated as your application moves forward.</p>
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
<p style="margin:0 0 4px 0;font-size:12px;line-height:1.6;color:#a1a1aa;">This link expires in 24 hours. If you did not apply to Gawula, you can ignore this email.</p>
<p style="margin:0;font-size:12px;color:#c4c4cc;">&copy; 2026 Gawula</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }
}
