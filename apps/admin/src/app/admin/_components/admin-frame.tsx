"use client";

import { RoleGate } from "@/components/role-gate";
import { AdminShell } from "./shell";

export function AdminFrame({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate role="admin" title="Admin sign in">
      <AdminShell>{children}</AdminShell>
    </RoleGate>
  );
}
