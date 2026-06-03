"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { type AdminOrder, STATUS_LABEL } from "../_lib/types";

const dateFormat = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function OrderDetailDrawer({
  order,
  onClose,
}: {
  order: AdminOrder | null;
  onClose: () => void;
}) {
  const [render, setRender] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [current, setCurrent] = React.useState<AdminOrder | null>(order);

  React.useEffect(() => {
    if (order) {
      setCurrent(order);
      setRender(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = window.setTimeout(() => setRender(false), 200);
    return () => window.clearTimeout(t);
  }, [order]);

  React.useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  if (!render || !current) return null;

  const ref = `#${current.id.slice(-5).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close order details"
        className={cn(
          "absolute inset-0 bg-foreground/30 transition-opacity duration-200 ease-out",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${ref}`}
        className={cn(
          "absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-200 ease-out will-change-transform",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Order {ref}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {dateFormat.format(new Date(current.placedAt))}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                current.status === "cancelled"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-foreground"
              )}
            >
              {STATUS_LABEL[current.status] ?? current.status}
            </span>
            <span className="text-lg font-semibold tabular-nums">
              {formatPrice(current.totalCents)}
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
            <Field label="Customer" value={current.customerName} />
            <Field
              label="Payment"
              value={current.paid ? "Paid" : "Pending"}
            />
            <Field label="Complex" value={current.complexName} />
            <Field
              label="Stores"
              value={String(current.outletCount)}
            />
            <Field
              label="Rider"
              value={current.riderName ?? "Unassigned"}
              full
            />
          </dl>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
