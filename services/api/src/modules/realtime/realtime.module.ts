import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { RealtimeGateway } from "./realtime.gateway";

@Module({
  imports: [IdentityModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
