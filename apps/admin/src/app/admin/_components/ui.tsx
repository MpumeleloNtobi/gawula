"use client";

import * as React from "react";
import { LuInfo as Info } from "react-icons/lu";
import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({
  className,
  padded = true,
  children,
}: {
  className?: string;
  padded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-background",
        padded && "p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-background", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action ?? null}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export function TableShell({
  children,
  minWidth = "min-w-[720px]",
  className,
}: {
  children: React.ReactNode;
  minWidth?: string;
  className?: string;
}) {
  return (
    <section className="overflow-x-auto">
      <table
        className={cn(
          "w-full text-sm [&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th:first-child]:pl-0 [&_th:last-child]:pr-0",
          minWidth,
          className
        )}
      >
        {children}
      </table>
    </section>
  );
}

export const tableHeadClass = "border-b-2 border-border/50 text-left text-sm text-muted-foreground";
export const tableRowClass = "border-b-2 border-border/50 transition-colors last:border-0 hover:bg-secondary/40";
export const tableCellClass = "px-4 py-3";

export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-12 mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  icon,
  hint,
  tooltip,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  hint?: string;
  tooltip?: string;
}) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
        {tooltip ? (
          <span title={tooltip} className="inline-flex cursor-help text-muted-foreground/70 transition-colors hover:text-foreground">
            <Info className="h-3.5 w-3.5" />
            <span className="sr-only">{tooltip}</span>
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StatBar({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-xs tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function DetailRow({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "muted";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "text-foreground",
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-destructive",
  info: "text-primary",
  muted: "text-muted-foreground",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  const dotTone: Record<BadgeTone, string> = {
    neutral: "bg-foreground/60",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-destructive",
    info: "bg-primary",
    muted: "bg-muted-foreground/50",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium",
        BADGE_TONES[tone],
        className
      )}
    >
      {dot ? <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dotTone[tone])} /> : null}
      {children}
    </span>
  );
}

export function EmptyState({
  title,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="py-16 text-center text-sm text-muted-foreground">{title}</div>
  );
}

export function useFlash() {
  const [notice, setNotice] = React.useState<string | null>(null);
  const flash = React.useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? null : n)), 4000);
  }, []);
  return { notice, flash };
}

export function Flash({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-in-bottom rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg"
    >
      {message}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6 text-center">
      <p className="text-sm font-medium text-foreground">Something went wrong</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {message ?? "We couldn't load this data. Please try again."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  received: "info",
  preparing: "warning",
  ready: "info",
  on_the_way: "info",
  delivered: "success",
  cancelled: "danger",
};

export function orderStatusTone(status: string): BadgeTone {
  return ORDER_STATUS_TONE[status] ?? "neutral";
}

const PAYOUT_STATUS_TONE: Record<string, BadgeTone> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
};

export function payoutStatusTone(status: string): BadgeTone {
  return PAYOUT_STATUS_TONE[status] ?? "neutral";
}
