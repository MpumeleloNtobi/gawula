"use client";

import * as React from "react";
import { LuX as X } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RejectDialog({
  open,
  title,
  subtitle,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setReason("");
    const id = window.setTimeout(() => ref.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;
  const valid = reason.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-foreground/30" onClick={busy ? undefined : onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h3 id="reject-title" className="text-base font-semibold">
          {title}
        </h3>
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          disabled={busy}
          className="absolute right-4 top-4 inline-grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <Textarea
          ref={ref}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Share a clear reason. The applicant may see this."
          className="mt-4"
          disabled={busy}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onConfirm(reason.trim())}
            disabled={!valid || busy}
          >
            {busy ? "Rejecting..." : "Reject application"}
          </Button>
        </div>
      </div>
    </div>
  );
}
