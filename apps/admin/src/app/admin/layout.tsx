"use client";

import { RoleGate } from "@/components/role-gate";
import { AdminShell } from "./_components/shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate role="admin" title="Admin sign in">
      <AdminShell>{children}</AdminShell>
    </RoleGate>
  );
}
