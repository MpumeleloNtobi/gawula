"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuUtensilsCrossed as UtensilsCrossed } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import { ADMIN_NAV_GROUPS, isAdminSectionActive } from "../_lib/nav-sections";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary/20 text-foreground lg:flex">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col bg-neutral-950 text-neutral-300 lg:flex">
        <SidebarBrand />
        <div className="flex-1 overflow-y-auto px-3 pb-5">
          <AdminNav pathname={pathname} />
        </div>
        <SidebarAccount />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="container max-w-7xl pb-6 pt-2 lg:py-8">{children}</div>
      </div>
    </div>
  );
}

function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg px-4 pb-4 pt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <UtensilsCrossed className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-base font-semibold text-white">Gawula</span>
        <span className="block text-xs text-neutral-500">Admin console</span>
      </span>
    </Link>
  );
}

function AdminNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin sections" className="grid gap-5">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.label} className="grid gap-0.5">
          <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-neutral-500">{group.label}</p>
          {group.items.map(({ href, label, Icon }) => {
            const active = isAdminSectionActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950",
                  active ? "bg-primary/15 text-primary" : "text-neutral-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                  />
                ) : null}
                <Icon
                  className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-neutral-500")}
                 
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarAccount() {
  const [mounted, setMounted] = React.useState(false);
  const principal = useAuth((state) => state.principal);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const name = mounted ? principal?.name?.trim() || "Admin" : "Admin";
  const subtitle = mounted ? principal?.email || "Operations" : "Operations";

  return (
    <div className="border-t border-white/10 px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {accountInitials(name, mounted ? principal?.email ?? "" : "")}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-medium text-white">{name}</span>
          <span className="block truncate text-xs text-neutral-500">{subtitle}</span>
        </span>
      </div>
    </div>
  );
}

function accountInitials(name: string, email: string) {
  const source = name && name !== "Admin" ? name : email || name;
  const parts = source
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
  return (letters || "A").toUpperCase();
}
