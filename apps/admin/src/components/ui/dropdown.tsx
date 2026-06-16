"use client";

import * as React from "react";
import { LuCheck as Check, LuChevronDown as ChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";

export type DropdownOption = {
  value: string;
  label: string;
  hint?: string;
};

export function Dropdown({
  value,
  options,
  onSelect,
  placeholder = "Select…",
  ariaLabel,
  disabled,
  align = "start",
  triggerClassName,
  listClassName,
  radio = false,
}: {
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  align?: "start" | "end";
  triggerClassName?: string;
  listClassName?: string;
  radio?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

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

  React.useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setActive(idx >= 0 ? idx : 0);
    }
  }, [open, value, options]);

  const choose = (next: string) => {
    onSelect(next);
    setOpen(false);
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[active];
      if (opt) choose(opt.value);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        className={cn(
          "inline-flex h-9 items-center justify-between gap-2 rounded-full border border-border bg-background px-3 text-sm outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName,
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          onKeyDown={onListKey}
          className={cn(
            "absolute z-50 mt-2 max-h-64 min-w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-lg focus:outline-none",
            align === "end" ? "right-0" : "left-0",
            listClassName,
          )}
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No options</p>
          ) : (
            options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    radio ? "justify-start" : "justify-between",
                    i === active ? "bg-secondary" : "hover:bg-secondary",
                  )}
                >
                  {radio ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 bg-background",
                        isSelected ? "border-foreground" : "border-muted-foreground/70",
                      )}
                    >
                      {isSelected ? <span className="h-1.5 w-1.5 rounded-full bg-foreground" /> : null}
                    </span>
                  ) : null}
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.label}</span>
                    {o.hint ? (
                      <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>
                    ) : null}
                  </span>
                  {!radio && isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
