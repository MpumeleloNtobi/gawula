"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

export type PrincipalRole = "customer" | "rider" | "partner" | "admin";

export type Principal = {
  id: string;
  roles: PrincipalRole[];
  name?: string | null;
  phone?: string | null;
  email?: string;
  emailVerified?: boolean;
  mallPassActive?: boolean;
  complexId?: string | null;
  outletId?: string | null;
  riderStatus?: string | null;
  homeComplexId?: string | null;
};

type LoginResult = { token: string; principal: Principal };

export type CustomerSignupInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

export function homePathForRole(role: PrincipalRole): string {
  switch (role) {
    case "rider":
      return "/rider";
    case "partner":
      return "/store";
    case "admin":
      return "/admin";
    default:
      return "/menu";
  }
}

function resolveActiveRole(
  roles: PrincipalRole[],
  remembered: PrincipalRole | null,
): PrincipalRole {
  if (remembered && roles.includes(remembered)) return remembered;
  return roles[0] ?? "customer";
}

type AuthState = {
  token: string | null;
  principal: Principal | null;
  activeRole: PrincipalRole | null;
  hydrated: boolean;
  setHydrated: () => void;
  login: (email: string, password: string) => Promise<Principal>;
  customerSignup: (input: CustomerSignupInput) => Promise<Principal>;
  forgotPassword: (email: string) => Promise<{ ok: true; devResetToken?: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<{ alreadyVerified: boolean }>;
  refreshMe: () => Promise<void>;
  refreshSession: () => Promise<void>;
  staffLogin: (email: string, password: string) => Promise<Principal>;
  setActiveMode: (role: PrincipalRole) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      principal: null,
      activeRole: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      login: async (email, password) => {
        const res = await api<LoginResult>("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        set({
          token: res.token,
          principal: res.principal,
          activeRole: resolveActiveRole(res.principal.roles, get().activeRole),
        });
        return res.principal;
      },
      customerSignup: async (input) => {
        const res = await api<LoginResult>("/auth/customer/signup", {
          method: "POST",
          body: input,
        });
        set({
          token: res.token,
          principal: res.principal,
          activeRole: resolveActiveRole(res.principal.roles, get().activeRole),
        });
        return res.principal;
      },
      forgotPassword: (email) =>
        api<{ ok: true; devResetToken?: string }>("/auth/customer/forgot-password", {
          method: "POST",
          body: { email },
        }),
      resetPassword: async (token, password) => {
        await api("/auth/customer/reset-password", {
          method: "POST",
          body: { token, password },
        });
      },
      verifyEmail: async (token) => {
        await api("/auth/customer/verify-email", {
          method: "POST",
          body: { token },
        });
        set((state) =>
          state.principal
            ? { principal: { ...state.principal, emailVerified: true } }
            : {},
        );
      },
      resendVerification: async () => {
        const token = get().token;
        const res = await api<{ ok: true; alreadyVerified: boolean }>(
          "/auth/customer/resend-verification",
          { method: "POST", token },
        );
        return { alreadyVerified: res.alreadyVerified };
      },
      refreshMe: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const me = await api<Principal>("/auth/me", { token });
          set((state) => {
            if (!state.principal) return {};
            const principal = { ...state.principal, ...me };
            return {
              principal,
              activeRole: resolveActiveRole(principal.roles, state.activeRole),
            };
          });
        } catch {
          // ignore refresh failures
        }
      },
      refreshSession: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const res = await api<LoginResult>("/auth/refresh", { method: "POST", token });
          set((state) => ({
            token: res.token,
            principal: res.principal,
            activeRole: resolveActiveRole(res.principal.roles, state.activeRole),
          }));
        } catch {
          // ignore refresh failures
        }
      },
      staffLogin: async (email, password) => {
        const res = await api<LoginResult>("/auth/staff/login", {
          method: "POST",
          body: { email, password },
        });
        set({
          token: res.token,
          principal: res.principal,
          activeRole: res.principal.roles[0] ?? null,
        });
        return res.principal;
      },
      setActiveMode: (role) => {
        const principal = get().principal;
        if (!principal || !principal.roles.includes(role)) return;
        set({ activeRole: role });
      },
      logout: () => set({ token: null, principal: null }),
    }),
    {
      name: "gawula-auth",
      partialize: (s) => ({ token: s.token, principal: s.principal, activeRole: s.activeRole }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
