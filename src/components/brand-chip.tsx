"use client";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  active?: boolean;
  color?: string;
  onClick?: () => void;
};

export function BrandChip({ label, active, color, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground hover:border-foreground/40"
      )}
    >
      {color ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      ) : null}
      {label}
    </button>
  );
}
