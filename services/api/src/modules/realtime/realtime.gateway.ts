import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import type { Server, Socket } from "socket.io";
import { JwtPayload, PrincipalRole } from "../identity/principal";

type Authed = {
  sub: string;
  roles: PrincipalRole[];
  outletId: string | null;
};

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  path: "/socket.io",
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly log = new Logger(RealtimeGateway.name);

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (typeof client.handshake.headers.authorization === "string"
        ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
        : undefined);

    if (!token) {
      client.emit("auth.error", { reason: "missing_token" });
      client.disconnect(true);
      return;
    }

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token);
    } catch {
      client.emit("auth.error", { reason: "invalid_token" });
      client.disconnect(true);
      return;
    }

    const roles = payload.roles ?? (payload.role ? [payload.role] : []);
    const authed: Authed = {
      sub: payload.sub,
      roles,
      outletId: payload.outletId ?? null,
    };
    client.data.principal = authed;

    if (roles.includes("partner") && authed.outletId) {
      client.join(this.storeRoom(authed.outletId));
    }
    if (roles.includes("admin")) {
      client.join("admin");
    }
    if (roles.includes("rider")) {
      client.join(this.riderRoom(authed.sub));
      client.join("riders");
    }
    if (roles.includes("customer")) {
      client.join(this.customerRoom(authed.sub));
    }
  }

  handleDisconnect(client: Socket) {
    const p = client.data?.principal as Authed | undefined;
    if (p) this.log.debug(`disconnect ${p.sub}`);
  }

  emitStoreOrderNew(outletId: string, payload: unknown) {
    this.server.to(this.storeRoom(outletId)).emit("store.order.new", payload);
  }

  emitStoreOrderUpdate(outletId: string, payload: unknown) {
    this.server.to(this.storeRoom(outletId)).emit("store.order.updated", payload);
  }

  emitCustomerOrderUpdate(customerId: string, payload: unknown) {
    this.server.to(this.customerRoom(customerId)).emit("customer.order.updated", payload);
  }

  emitRiderTripAvailable(payload: unknown) {
    this.server.to("riders").emit("rider.trip.available", payload);
  }

  private storeRoom(outletId: string) {
    return `store:${outletId}`;
  }
  private riderRoom(userId: string) {
    return `rider:${userId}`;
  }
  private customerRoom(userId: string) {
    return `customer:${userId}`;
  }
}
