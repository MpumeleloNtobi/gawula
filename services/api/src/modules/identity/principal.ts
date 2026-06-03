export type PrincipalRole = "customer" | "rider" | "partner" | "admin";

export interface JwtPayload {
  sub: string;
  roles: PrincipalRole[];
  role?: PrincipalRole;
  phone?: string;
  email?: string;
  complexId?: string | null;
  outletId?: string | null;
}

export interface Principal {
  id: string;
  roles: PrincipalRole[];
  phone?: string;
  email?: string;
  name?: string | null;
  complexId?: string | null;
  outletId?: string | null;
}
