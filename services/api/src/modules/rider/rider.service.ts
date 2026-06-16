import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { RiderApplication } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma.module";
import { CreateRiderApplicationDto } from "./rider.dto";

const FALLBACK_COMPLEX_SLUG = "sandton-city";

@Injectable()
export class RiderService {
  private readonly logger = new Logger(RiderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createApplication(accountId: string, dto: CreateRiderApplicationDto) {
    const existingProfile = await this.prisma.rider.findUnique({
      where: { customerId: accountId },
    });
    if (existingProfile) {
      throw new ConflictException("You are already registered as a rider");
    }
    const pending = await this.prisma.riderApplication.findFirst({
      where: { customerId: accountId, stage: { in: ["submitted", "approved"] } },
    });
    if (pending) {
      throw new ConflictException("You already have a rider application in progress");
    }
    const application = await this.prisma.riderApplication.create({
      data: {
        customerId: accountId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        areaId: dto.areaId,
        areaLabel: dto.areaLabel,
        waitlisted: dto.waitlisted,
        vehicleType: dto.vehicleType,
        hasSmartphone: dto.hasSmartphone,
        idNumber: dto.idNumber.trim(),
        idFrontDocName: dto.idFrontDocName,
        idBackDocName: dto.idBackDocName,
        selfieDocName: dto.selfieDocName,
        fullBodyDocName: dto.fullBodyDocName,
        licenceDocName: dto.licenceDocName,
        stage: "submitted",
      },
    });
    return { id: application.id, stage: application.stage, waitlisted: application.waitlisted };
  }

  async applicationStatus(accountId: string, id: string) {
    const application = await this.prisma.riderApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException("Application not found");
    if (application.customerId && application.customerId !== accountId) {
      throw new ForbiddenException("This application belongs to another account");
    }
    return {
      id: application.id,
      firstName: application.firstName,
      email: application.email,
      areaLabel: application.areaLabel,
      waitlisted: application.waitlisted,
      stage: application.stage,
      rejectionReason: application.rejectionReason,
    };
  }

  async listForAdmin() {
    const applications = await this.prisma.riderApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
    return applications.map((application) => this.toAdminDto(application));
  }

  async getForAdmin(id: string) {
    const application = await this.prisma.riderApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException("Application not found");
    return this.toAdminDto(application);
  }

  async approve(id: string, reviewerId: string) {
    const application = await this.prisma.riderApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException("Application not found");
    if (application.stage === "approved") {
      throw new ConflictException("Application is already approved");
    }
    if (application.waitlisted) {
      throw new BadRequestException("Cannot approve a waitlisted application");
    }
    if (!application.customerId) {
      throw new BadRequestException("Application is not linked to an account");
    }
    const accountId = application.customerId;

    const complex =
      (await this.prisma.complex.findUnique({ where: { slug: FALLBACK_COMPLEX_SLUG } })) ??
      (await this.prisma.complex.findFirst({ where: { status: "active" } }));
    if (!complex) throw new BadRequestException("No active complex to assign this rider to");

    const existingProfile = await this.prisma.rider.findUnique({
      where: { customerId: accountId },
    });
    if (existingProfile) {
      throw new ConflictException("This account is already registered as a rider");
    }

    const rider = await this.prisma.$transaction(async (tx) => {
      const created = await tx.rider.create({
        data: {
          customerId: accountId,
          name: `${application.firstName} ${application.lastName}`.trim(),
          phone: application.phone,
          vehicleType: application.vehicleType,
          homeComplexId: complex.id,
          status: "offline",
        },
      });
      await tx.roleGrant.upsert({
        where: { customerId_role: { customerId: accountId, role: "rider" } },
        update: { revokedAt: null },
        create: { customerId: accountId, role: "rider" },
      });
      await tx.riderApplication.update({
        where: { id },
        data: {
          stage: "approved",
          riderId: created.id,
          reviewerId,
          rejectionReason: null,
          decidedAt: new Date(),
        },
      });
      return created;
    });

    this.logger.log(`Rider application ${id} approved; account ${accountId} granted rider role`);
    return { id, stage: "approved" as const, riderId: rider.id };
  }

  async reject(id: string, reviewerId: string, reason: string) {
    const application = await this.prisma.riderApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException("Application not found");
    if (application.stage === "approved") {
      throw new ConflictException("Cannot reject an approved application");
    }
    await this.prisma.riderApplication.update({
      where: { id },
      data: { stage: "rejected", rejectionReason: reason.trim(), reviewerId, decidedAt: new Date() },
    });
    return { id, stage: "rejected" };
  }

  async promoteFromWaitlist(id: string, reviewerId: string) {
    const application = await this.prisma.riderApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException("Application not found");
    if (application.stage !== "submitted") {
      throw new ConflictException("Only submitted applications can be promoted from the waitlist");
    }
    if (!application.waitlisted) {
      throw new BadRequestException("Application is not waitlisted");
    }
    await this.prisma.riderApplication.update({
      where: { id },
      data: { waitlisted: false, reviewerId },
    });
    return { id, waitlisted: false };
  }

  bulkApprove(ids: string[], reviewerId: string) {
    return this.bulk(ids, (id) => this.approve(id, reviewerId));
  }

  bulkReject(ids: string[], reviewerId: string, reason: string) {
    return this.bulk(ids, (id) => this.reject(id, reviewerId, reason));
  }

  bulkPromoteFromWaitlist(ids: string[], reviewerId: string) {
    return this.bulk(ids, (id) => this.promoteFromWaitlist(id, reviewerId));
  }

  private async bulk<T extends Record<string, unknown>>(
    ids: string[],
    action: (id: string) => Promise<T>,
  ) {
    const results = [];
    for (const id of [...new Set(ids)]) {
      try {
        results.push({ ok: true as const, ...(await action(id)) });
      } catch (error) {
        results.push({
          id,
          ok: false as const,
          message: error instanceof Error ? error.message : "Action failed",
        });
      }
    }
    return { results };
  }

  private toAdminDto(application: RiderApplication) {
    return {
      id: application.id,
      name: `${application.firstName} ${application.lastName}`.trim(),
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.email,
      phone: application.phone,
      areaLabel: application.areaLabel,
      waitlisted: application.waitlisted,
      vehicleType: application.vehicleType,
      hasSmartphone: application.hasSmartphone,
      idNumber: application.idNumber,
      idFrontDocName: application.idFrontDocName,
      idBackDocName: application.idBackDocName,
      selfieDocName: application.selfieDocName,
      fullBodyDocName: application.fullBodyDocName,
      licenceDocName: application.licenceDocName,
      stage: application.stage,
      rejectionReason: application.rejectionReason,
      createdAt: application.createdAt,
      decidedAt: application.decidedAt,
    };
  }
}
