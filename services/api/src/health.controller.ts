import { Controller, Get, Inject } from "@nestjs/common";
import type Redis from "ioredis";
import { PrismaService } from "./infrastructure/prisma.module";
import { REDIS } from "./infrastructure/redis.module";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  check() {
    return { status: "ok", service: "foyer-api", time: new Date().toISOString() };
  }

  @Get("ready")
  async ready() {
    const [database, cache] = await Promise.all([this.pingDatabase(), this.pingRedis()]);
    const ok = database && cache;
    return {
      status: ok ? "ok" : "degraded",
      checks: { database, cache },
      time: new Date().toISOString(),
    };
  }

  private async pingDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async pingRedis() {
    try {
      return (await this.redis.ping()) === "PONG";
    } catch {
      return false;
    }
  }
}
