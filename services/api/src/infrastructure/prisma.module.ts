import { Global, Module, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

export { PrismaService };
