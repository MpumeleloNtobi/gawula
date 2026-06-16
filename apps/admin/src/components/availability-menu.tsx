"use client";

import * as React from "react";
import { LuChevronDown as ChevronDown, LuX as X } from "react-icons/lu";
import { cn } from "@/lib/utils";

type AvailabilityOption<T> = { label: string; value: T };

export function AvailabilityMenu<T extends string | number | boolean>({
  value,
  options,
  triggerLabel,
  title = "Availability",
  disabled = false,
  onApply,
}: {
  value: T;
  options: AvailabilityOption<T>[];
  triggerLabel: string;
  title?: string;
  disabled?: boolean;
  onApply: (value: T) => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<T>(value);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const apply = () => {
    setOpen(false);
    onApply(draft);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          setDraft(value);
          setOpen((v) => !v);
        }}
        className="flex h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-foreground outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{triggerLabel}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={title}
          className="absolute left-0 z-50 mt-2 w-[220px] rounded-xl border border-border bg-card p-2 shadow-[0_0_28px_rgba(0,0,0,0.18)]"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[17px] font-semibold">{title}</span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-0.5">
            {options.map((o) => {
              const isSelected = draft === o.value;
              return (
                <button
                  key={o.label}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => setDraft(o.value)}
                  className="flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors hover:bg-secondary"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 bg-background",
                      isSelected ? "border-foreground" : "border-muted-foreground/70",
                    )}
                  >
                    {isSelected ? <span className="h-[7px] w-[7px] rounded-full bg-foreground" /> : null}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
          <div className="px-1 pt-2">
            <button
              type="button"
              onClick={apply}
              className="h-10 w-full rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
