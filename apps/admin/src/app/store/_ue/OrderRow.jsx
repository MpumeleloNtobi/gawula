"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuX as X } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fmt, statusMeta } from "./data";
import { useOrders } from "./OrdersContext";

const NEXT_ACTION = {
  accepted: { label: "Prepare", status: "preparing" },
  preparing: { label: "Ready", status: "ready" },
  ready: { label: "Collected", status: "collected" },
};

export function OrderRow({ o, onAccept, history = false }) {
  const m = statusMeta[o.status];
  const { transition, adjustItems } = useOrders();
  const [busy, setBusy] = useState(false);
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [codePrompt, setCodePrompt] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [adjustPrompt, setAdjustPrompt] = useState(false);
  const [draft, setDraft] = useState({});
  const [adjustError, setAdjustError] = useState("");
  const codeRefs = useRef([]);

  useEffect(() => {
    if (!cancelPrompt) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setCancelPrompt(false);
        setCancelReason("");
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [cancelPrompt]);

  useEffect(() => {
    if (!codePrompt) return;
    setCode("");
    setCodeError("");
    const onKey = (e) => {
      if (e.key === "Escape") setCodePrompt(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [codePrompt]);

  useEffect(() => {
    if (!adjustPrompt) return;
    const onKey = (e) => {
      if (e.key === "Escape") setAdjustPrompt(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [adjustPrompt]);

  const next = NEXT_ACTION[o.backendStatus];
  const isTerminal = ["collected", "rejected", "cancelled"].includes(o.backendStatus);
  const adjustable = !history && ["pending", "accepted", "preparing"].includes(o.backendStatus);
  const effQty = (it) => (it.fulfilledQty == null ? it.qty : it.fulfilledQty);

  const advance = async () => {
    if (!next) return;
    if (next.status === "collected") {
      setCodePrompt(true);
      return;
    }
    setBusy(true);
    try {
      await transition(o.id, next.status);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setCodeError("");
    try {
      await transition(o.id, "collected", undefined, code.trim());
      setCodePrompt(false);
    } catch (e) {
      setCodeError(e?.message || "Could not verify the code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const closeCode = () => setCodePrompt(false);

  const openCancel = () => setCancelPrompt(true);

  const submitCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelPrompt(false);
    setBusy(true);
    try {
      await transition(o.id, "rejected", cancelReason.trim());
    } finally {
      setBusy(false);
      setCancelReason("");
    }
  };

  const closeCancel = () => {
    setCancelPrompt(false);
    setCancelReason("");
  };

  const openAdjust = () => {
    const init = {};
    for (const it of o.rawItems) init[it.id] = effQty(it);
    setDraft(init);
    setAdjustError("");
    setAdjustPrompt(true);
  };

  const closeAdjust = () => setAdjustPrompt(false);

  const setQty = (id, val) => setDraft((prev) => ({ ...prev, [id]: val }));

  const adjustChanges = o.rawItems
    .filter((it) => draft[it.id] != null && draft[it.id] !== effQty(it))
    .map((it) => ({ orderItemId: it.id, fulfilledQty: draft[it.id] }));

  const submitAdjust = async () => {
    if (adjustChanges.length === 0) return;
    setBusy(true);
    setAdjustError("");
    try {
      await adjustItems(o.id, adjustChanges, "Sold out");
      setAdjustPrompt(false);
    } catch (e) {
      setAdjustError(e?.message || "Could not update the order. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="list-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 3 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            #{o.refId ?? o.id}
          </span>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 1 }}>
            {o.time}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
            justifyContent: "flex-start",
            position: "relative",
          }}
        >
          {history ? (
            <>
              <span className={`pill ${m.c}`}>{m.l}</span>
              <span style={{ color: "var(--ink)", fontWeight: 600, fontSize: 13 }}>
                {fmt(o.total)}
              </span>
            </>
          ) : (
            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <span className={`pill ${m.c}`}>{m.l}</span>
              {o.status === "new" ? (
                <>
                  <button
                    className="btn btn-sm"
                    style={{ color: "var(--red, #c0392b)", borderColor: "var(--red, #c0392b)" }}
                    onClick={openCancel}
                    disabled={busy}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onAccept(o.id)}
                    disabled={busy}
                  >
                    Accept
                  </button>
                </>
              ) : (
                <>
                  {!isTerminal && (
                    <button
                      className="btn btn-sm"
                      style={{ color: "var(--red, #c0392b)", borderColor: "var(--red, #c0392b)" }}
                      onClick={openCancel}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                  )}
                  {next && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={advance}
                      disabled={busy}
                    >
                      {next.label}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {!history && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {o.rawItems.map((it, i) => {
            const unit = it.totalCents / it.qty / 100;
            const eq = effQty(it);
            const reduced = it.fulfilledQty != null && it.fulfilledQty < it.qty;
            return (
              <div
                key={i}
                style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}
              >
                <span style={{ color: eq === 0 ? "var(--muted)" : "var(--ink)", minWidth: 0 }}>
                  {reduced ? `${eq}/${it.qty}` : eq} {it.name}
                  {eq === 0 && <span className="muted"> (unavailable)</span>}
                </span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <span className="muted">{fmt(unit)}</span>
                  <span className="muted">{fmt(unit * eq)}</span>
                </div>
              </div>
            );
          })}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--ink)",
              marginTop: 1,
            }}
          >
            <span>Total</span>
            <span>{fmt(o.total)}</span>
          </div>
          {adjustable && (
            <button
              type="button"
              onClick={openAdjust}
              disabled={busy}
              className="muted"
              style={{
                alignSelf: "flex-start",
                marginTop: 2,
                fontSize: 12.5,
                background: "none",
                padding: 0,
                cursor: "pointer",
                color: "var(--green-dark)",
              }}
            >
              Item unavailable?
            </button>
          )}
        </div>
      )}
      {adjustPrompt &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`adjust-order-title-${o.id}`}
            className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-foreground/30"
              onClick={busy ? undefined : closeAdjust}
            />
            <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-lg">
              <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
                <h3
                  id={`adjust-order-title-${o.id}`}
                  className="text-base font-semibold tracking-tight"
                >
                  Update Availability
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeAdjust}
                  disabled={busy}
                  className="inline-grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-2">
                <div className="flex flex-col gap-3">
                  {o.rawItems.map((it) => {
                    const max = effQty(it);
                    const value = draft[it.id] ?? max;
                    const unit = it.totalCents / it.qty / 100;
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {it.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{fmt(unit)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Reduce ${it.name}`}
                            onClick={() => setQty(it.id, Math.max(0, value - 1))}
                            disabled={busy || value <= 0}
                            className="inline-grid h-8 w-8 place-items-center rounded-full border border-solid border-border text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-medium tabular-nums">
                            {value}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${it.name}`}
                            onClick={() => setQty(it.id, Math.min(max, value + 1))}
                            disabled={busy || value >= max}
                            className="inline-grid h-8 w-8 place-items-center rounded-full border border-solid border-border text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {adjustError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {adjustError}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-6 pb-5 pt-4">
                <span className="text-sm text-muted-foreground">
                  Refund{" "}
                  <span className="font-medium text-foreground">
                    {fmt(
                      o.rawItems.reduce(
                        (s, it) =>
                          s +
                          (it.totalCents / it.qty) * (effQty(it) - (draft[it.id] ?? effQty(it))),
                        0,
                      ) / 100,
                    )}
                  </span>
                </span>
                <Button
                  type="button"
                  onClick={submitAdjust}
                  disabled={busy || adjustChanges.length === 0}
                >
                  {busy ? "Updating…" : "Apply"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {cancelPrompt &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`cancel-order-title-${o.id}`}
            className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-foreground/30"
              onClick={busy ? undefined : closeCancel}
            />
            <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-lg">
              <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
                <h3
                  id={`cancel-order-title-${o.id}`}
                  className="text-base font-semibold tracking-tight"
                >
                  Cancel Order
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeCancel}
                  disabled={busy}
                  className="inline-grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Reason
                  </span>
                  <Textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    autoFocus
                    className="min-h-[72px] resize-none border border-border bg-transparent text-sm font-normal focus-visible:ring-0"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={submitCancel}
                  disabled={busy || !cancelReason.trim()}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {codePrompt &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`pickup-code-title-${o.id}`}
            className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-foreground/30"
              onClick={busy ? undefined : closeCode}
            />
            <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-lg">
              <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
                <h3
                  id={`pickup-code-title-${o.id}`}
                  className="text-base font-semibold tracking-tight"
                >
                  Confirm Collection
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeCode}
                  disabled={busy}
                  className="inline-grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Pickup code
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {o.type === "pickup"
                      ? `Ask ${o.cust} for the code in their app, then enter it to release the order.`
                      : "Ask the rider for the order code, then enter it to release the order."}
                  </span>
                  <div className="mt-1 flex gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          codeRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={1}
                        value={code[i] ?? ""}
                        aria-label={`Pickup code digit ${i + 1}`}
                        autoFocus={i === 0}
                        onChange={(e) => {
                          const digit = e.target.value.replace(/\D/g, "").slice(-1);
                          setCode((prev) => {
                            const arr = prev.split("");
                            arr[i] = digit;
                            return arr.join("").slice(0, 4);
                          });
                          if (digit && i < 3) codeRefs.current[i + 1]?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            submitCode();
                            return;
                          }
                          if (e.key === "Backspace" && !code[i] && i > 0) {
                            codeRefs.current[i - 1]?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const digits = e.clipboardData
                            .getData("text")
                            .replace(/\D/g, "")
                            .slice(0, 4);
                          if (!digits) return;
                          setCode(digits);
                          codeRefs.current[Math.min(digits.length, 3)]?.focus();
                        }}
                        className="h-14 w-14 rounded-lg border border-border bg-transparent text-center text-2xl font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                      />
                    ))}
                  </div>
                </div>
                {codeError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {codeError}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
                <Button
                  type="button"
                  onClick={submitCode}
                  disabled={busy || !code.trim()}
                >
                  {busy ? "Verifying…" : "Continue"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

