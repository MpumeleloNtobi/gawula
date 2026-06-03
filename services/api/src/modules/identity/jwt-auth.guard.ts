import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
  createParamDecorator,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { JwtPayload, Principal, PrincipalRole } from "./principal";

export const ROLES_KEY = "roles";
export const Roles = (...roles: PrincipalRole[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Principal => {
    const req = ctx.switchToHttp().getRequest<Request & { principal?: Principal }>();
    if (!req.principal) throw new UnauthorizedException("Not authenticated");
    return req.principal;
  },
);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { principal?: Principal }>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length).trim();
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
    const roles: PrincipalRole[] =
      payload.roles ?? (payload.role ? [payload.role] : []);
    req.principal = {
      id: payload.sub,
      roles,
      phone: payload.phone,
      email: payload.email,
      complexId: payload.complexId ?? null,
      outletId: payload.outletId ?? null,
    };

    const required = this.reflector.getAllAndOverride<PrincipalRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required && required.length > 0 && !required.some((role) => roles.includes(role))) {
      throw new ForbiddenException(`Requires role: ${required.join(" or ")}`);
    }
    return true;
  }
}
