"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  LuMegaphone as Megaphone,
  LuPlus as Plus,
  LuX as X,
  LuEllipsis as MoreHorizontal,
} from "react-icons/lu";
import { Stat } from "../_ue/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-store";
import { storeApi } from "@/lib/store";
import { fmt } from "../_ue/data";

const STATUS_LABEL = {
  active: "Active",
  scheduled: "Scheduled",
  paused: "Paused",
  ended: "Ended",
};

const TYPE_OPTIONS = [
  { key: "percentage", label: "Percent off", desc: "A set percentage off the order" },
  { key: "fixed", label: "Amount off", desc: "A fixed amount off; spend more, save more" },
  { key: "free_delivery", label: "Free delivery", desc: "Waive the delivery fee" },
  { key: "free_item", label: "Free item", desc: "A free item with a qualifying order" },
  { key: "bogo", label: "Buy one, get one", desc: "Buy an item, get another free or discounted" },
  { key: "happy_hour", label: "Happy hour", desc: "A discount on set days and times" },
  { key: "item_discount", label: "Discount items", desc: "Reduce the price of chosen items or a category" },
  { key: "buy_save", label: "Buy more, save", desc: "Buy a quantity of an item, get a set amount off" },
];

const DAY_CHIPS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h < 12 ? "am" : "pm";
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${period}` : `${hour}${period}`;
}

function daysLabel(days) {
  if (!days || days.length === 0) return "";
  const sorted = [...days].sort((a, b) => a - b);
  const key = sorted.join(",");
  if (key === "0,1,2,3,4,5,6") return "Every day";
  if (key === "1,2,3,4,5") return "Mon to Fri";
  if (key === "0,6") return "Weekends";
  return sorted.map((d) => DAY_NAMES[d]).join(", ");
}

function discountLabel(p) {
  if (p.percentOff > 0) return `${p.percentOff}% off`;
  if (p.amountOffCents > 0) return `${fmt(p.amountOffCents / 100)} off`;
  return "";
}

function offerSummary(p) {
  const min = p.minSpendCents > 0 ? ` on orders over ${fmt(p.minSpendCents / 100)}` : "";
  switch (p.type) {
    case "percentage":
      return `${p.percentOff}% off${min}`;
    case "fixed":
      return `${fmt(p.amountOffCents / 100)} off${min}`;
    case "free_delivery":
      return `Free delivery${min}`;
    case "free_item":
      return `Free ${p.freeItemName ?? "item"}${min}`;
    case "bogo": {
      const buy = p.buyItemName ?? "item";
      const get = p.getItemName ?? "item";
      const buyQty = p.buyQuantity > 1 ? `${p.buyQuantity} ` : "";
      if (p.percentOff >= 100) return `Buy ${buyQty}${buy}, get ${get} free`;
      return `Buy ${buyQty}${buy}, get ${p.percentOff}% off ${get}`;
    }
    case "happy_hour":
      return `${discountLabel(p)}${min}`;
    case "item_discount": {
      const target = p.category
        ? p.category
        : p.itemNames?.length === 1
          ? p.itemNames[0]
          : `${p.itemNames?.length ?? 0} items`;
      return `${discountLabel(p)} ${target}`;
    }
    case "buy_save": {
      const buy = p.buyItemName ?? "item";
      const buyQty = p.buyQuantity > 1 ? `${p.buyQuantity} ` : "";
      return `Buy ${buyQty}${buy}, save ${fmt(p.amountOffCents / 100)}`;
    }
    default:
      return discountLabel(p);
  }
}

function scheduleNote(p) {
  if (p.type === "happy_hour" && p.days?.length && p.startTime && p.endTime) {
    return `${daysLabel(p.days)}, ${fmtTime(p.startTime)} to ${fmtTime(p.endTime)}`;
  }
  if (p.status === "scheduled" && p.startAt) return `Starts ${fmtDate(p.startAt)}`;
  if (p.status === "active" && p.endAt) return `Ends ${fmtDate(p.endAt)}`;
  if (p.status === "ended" && p.endAt) return `Ended ${fmtDate(p.endAt)}`;
  return null;
}

function redeemedNote(n) {
  return n > 0 ? `${n} redeemed` : null;
}

function statusOf(p) {
  if (p.paused) return "paused";
  const now = Date.now();
  if (p.endAt && new Date(p.endAt).getTime() <= now) return "ended";
  if (p.startAt && new Date(p.startAt).getTime() > now) return "scheduled";
  return "active";
}

function summarise(promotions) {
  return {
    total: promotions.length,
    active: promotions.filter((p) => p.status === "active").length,
    scheduled: promotions.filter((p) => p.status === "scheduled").length,
    redemptions: promotions.reduce((n, p) => n + (p.redemptionCount || 0), 0),
  };
}

export default function MarketingPage() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const [data, setData] = useState({
    summary: { total: 0, active: 0, scheduled: 0, redemptions: 0 },
    promotions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [items, setItems] = useState([]);

  const load = async ({ silent = false } = {}) => {
    if (!token) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const d = await storeApi.promotions(token);
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load promotions");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated || !token) return;
    load();
  }, [hydrated, token]);

  useEffect(() => {
    if (!hydrated || !token) return;
    storeApi
      .menu(token)
      .then((m) => setItems(m.items || []))
      .catch(() => {});
  }, [hydrated, token]);

  const submitPromotion = async (payload) => {
    if (editing) {
      await storeApi.updatePromotion(token, editing.id, payload);
    } else {
      await storeApi.createPromotion(token, payload);
    }
    await load({ silent: true });
  };

  const togglePaused = async (p) => {
    const next = !p.paused;
    setBusyId(p.id);
    setData((d) => {
      const promotions = d.promotions.map((x) => {
        if (x.id !== p.id) return x;
        const updated = { ...x, paused: next };
        return { ...updated, status: statusOf(updated) };
      });
      return { summary: summarise(promotions), promotions };
    });
    try {
      await storeApi.setPromotionPaused(token, p.id, next);
      await load({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the promotion");
      await load({ silent: true });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await storeApi.deletePromotion(token, deleting.id);
      setDeleting(null);
      await load({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the promotion");
    } finally {
      setBusyId(null);
    }
  };

  const { summary, promotions } = data;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Marketing</h1>
        <div className="head-actions">
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            New Promotion
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="card"
          style={{ padding: 18, color: "var(--red)", marginBottom: 14 }}
        >
          {error}
        </div>
      )}

      {promotions.length > 0 && (
        <div className="grid stats-3 stagger no-hover-stats" style={{ marginBottom: 28 }}>
          <Stat label="Active" value={String(summary.active)} />
          <Stat label="Scheduled" value={String(summary.scheduled)} />
          <Stat label="Redemptions" value={String(summary.redemptions)} />
        </div>
      )}

      <div className="sec-title">
        Your promotions
        {promotions.length > 0 && <span className="count">{summary.total}</span>}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 28 }}>
          <span className="muted">Loading…</span>
        </div>
      ) : promotions.length === 0 ? (
        <div
          style={{
            padding: "40px 28px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              width: 52,
              height: 52,
              display: "grid",
              placeItems: "center",
              color: "var(--muted)",
            }}
          >
            <Megaphone size={26} />
          </span>
          <div style={{ maxWidth: 320 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No promotions yet</h4>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
              Add a discount to bring customers back
            </p>
          </div>
        </div>
      ) : (
        <div className="grid promo-grid stagger">
          {promotions.map((p) => {
            const note = scheduleNote(p);
            const dim = p.status === "paused" || p.status === "ended";
            const redeemed = redeemedNote(p.redemptionCount);
            return (
              <div
                className="card promo"
                key={p.id}
                style={{ overflow: "visible", opacity: dim ? 0.66 : 1 }}
              >
                <div style={{ position: "absolute", top: 14, right: 14 }}>
                  <PromoActionsMenu
                    disabled={busyId === p.id}
                    onEdit={() => setEditing(p)}
                    onDelete={() => setDeleting(p)}
                  />
                </div>
                <h4 style={{ paddingRight: 28, marginBottom: 14 }}>{offerSummary(p)}</h4>
                <div className="meta" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span className={`pill ${p.status === "active" ? "st-ready" : "st-prep"}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                    {note && <span>· {note}</span>}
                    {redeemed && <span>· {redeemed}</span>}
                  </div>
                  <label className="switch" title={p.paused ? "Paused" : "Active"}>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={!p.paused}
                      onChange={() => togglePaused(p)}
                      aria-label={`Pause ${offerSummary(p)}`}
                    />
                    <span className="switch-track" aria-hidden="true">
                      <span className="switch-thumb" />
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(addOpen || editing) && (
        <PromotionModal
          mode={editing ? "edit" : "add"}
          initial={editing}
          items={items}
          onSubmit={submitPromotion}
          onClose={() => {
            setAddOpen(false);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <DeleteConfirm
          promo={deleting}
          busy={busyId === deleting.id}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}

function PromoActionsMenu({ disabled, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const optionStyle = (danger) => ({
    width: "100%",
    textAlign: "left",
    padding: "8px 10px",
    background: "transparent",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: 600,
    color: danger ? "var(--red, #c0392b)" : "inherit",
  });

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        type="button"
        className="icon-btn"
        style={{ width: 32, height: 32 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(13,13,13,.12)",
            minWidth: 160,
            zIndex: 30,
            padding: 4,
          }}
        >
          <button
            type="button"
            role="menuitem"
            style={optionStyle(false)}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            style={optionStyle(true)}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function PromotionField({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function PromotionModal({ mode, initial, items, onSubmit, onClose }) {
  const [type, setType] = useState(initial?.type ?? "percentage");
  const [percent, setPercent] = useState(
    initial?.type === "percentage" && initial?.percentOff ? String(initial.percentOff) : "",
  );
  const [amount, setAmount] = useState(
    initial?.type === "fixed" && initial?.amountOffCents
      ? (initial.amountOffCents / 100).toFixed(2)
      : "",
  );
  const [minSpend, setMinSpend] = useState(
    initial?.minSpendCents ? (initial.minSpendCents / 100).toFixed(2) : "",
  );
  const [startAt, setStartAt] = useState(initial?.startAt ? initial.startAt.slice(0, 10) : "");
  const [endAt, setEndAt] = useState(initial?.endAt ? initial.endAt.slice(0, 10) : "");
  const [freeItemId, setFreeItemId] = useState(initial?.freeItemId ?? "");
  const [buyItemId, setBuyItemId] = useState(initial?.buyItemId ?? "");
  const [getItemId, setGetItemId] = useState(initial?.getItemId ?? "");
  const [bogoFree, setBogoFree] = useState(
    initial?.type === "bogo" ? (initial.percentOff ?? 100) >= 100 : true,
  );
  const [bogoPercent, setBogoPercent] = useState(
    initial?.type === "bogo" && initial.percentOff && initial.percentOff < 100
      ? String(initial.percentOff)
      : "",
  );
  const [hhKind, setHhKind] = useState(
    initial?.type === "happy_hour" && initial.amountOffCents > 0 ? "fixed" : "percentage",
  );
  const [idTarget, setIdTarget] = useState(
    initial?.type === "item_discount" && initial.category ? "category" : "items",
  );
  const [idKind, setIdKind] = useState(
    initial?.type === "item_discount" && initial.amountOffCents > 0 ? "fixed" : "percentage",
  );
  const [itemIds, setItemIds] = useState(initial?.itemIds ?? []);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [buyQty, setBuyQty] = useState(
    initial?.type === "buy_save" && initial.buyQuantity ? String(initial.buyQuantity) : "2",
  );
  const [days, setDays] = useState(initial?.days ?? []);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, submitting]);

  if (typeof document === "undefined") return null;
  const isEdit = mode === "edit";
  const inputClass =
    "border border-border bg-transparent text-sm font-normal focus-visible:ring-0";
  const showMinSpend = type !== "bogo" && type !== "item_discount" && type !== "buy_save";
  const hasItems = items && items.length > 0;
  const categories = Array.from(
    new Set((items || []).map((it) => it.category).filter(Boolean)),
  );

  const toggleDay = (value) => {
    setDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    );
  };

  const toggleItemId = (id) => {
    setItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { type, startAt: startAt || null, endAt: endAt || null };

    if (type === "percentage") {
      const v = parseInt(percent, 10);
      if (!Number.isFinite(v) || v < 1 || v > 100) {
        setErr("Enter a percentage between 1 and 100.");
        return;
      }
      payload.percentOff = v;
    } else if (type === "fixed") {
      const v = parseFloat(amount);
      if (!Number.isFinite(v) || v <= 0) {
        setErr("Enter a discount amount.");
        return;
      }
      payload.amountOffCents = Math.round(v * 100);
    } else if (type === "free_item") {
      if (!freeItemId) {
        setErr("Choose the free item.");
        return;
      }
      payload.freeItemId = freeItemId;
    } else if (type === "bogo") {
      if (!buyItemId || !getItemId) {
        setErr("Choose both items for the offer.");
        return;
      }
      if (bogoFree) {
        payload.percentOff = 100;
      } else {
        const v = parseInt(bogoPercent, 10);
        if (!Number.isFinite(v) || v < 1 || v > 99) {
          setErr("Enter a discount between 1 and 99.");
          return;
        }
        payload.percentOff = v;
      }
      payload.buyItemId = buyItemId;
      payload.getItemId = getItemId;
    } else if (type === "happy_hour") {
      if (days.length === 0) {
        setErr("Choose at least one day.");
        return;
      }
      if (!startTime || !endTime) {
        setErr("Set a start and end time.");
        return;
      }
      if (startTime >= endTime) {
        setErr("The end time must be after the start time.");
        return;
      }
      if (hhKind === "percentage") {
        const v = parseInt(percent, 10);
        if (!Number.isFinite(v) || v < 1 || v > 100) {
          setErr("Enter a percentage between 1 and 100.");
          return;
        }
        payload.percentOff = v;
      } else {
        const v = parseFloat(amount);
        if (!Number.isFinite(v) || v <= 0) {
          setErr("Enter a discount amount.");
          return;
        }
        payload.amountOffCents = Math.round(v * 100);
      }
      payload.days = [...days].sort((a, b) => a - b);
      payload.startTime = startTime;
      payload.endTime = endTime;
    }

    if (type === "item_discount") {
      if (idTarget === "items") {
        if (itemIds.length === 0) {
          setErr("Choose at least one item.");
          return;
        }
        payload.itemIds = itemIds;
      } else {
        if (!category) {
          setErr("Choose a category.");
          return;
        }
        payload.category = category;
      }
      if (idKind === "percentage") {
        const v = parseInt(percent, 10);
        if (!Number.isFinite(v) || v < 1 || v > 100) {
          setErr("Enter a percentage between 1 and 100.");
          return;
        }
        payload.percentOff = v;
      } else {
        const v = parseFloat(amount);
        if (!Number.isFinite(v) || v <= 0) {
          setErr("Enter a discount amount.");
          return;
        }
        payload.amountOffCents = Math.round(v * 100);
      }
    }

    if (type === "buy_save") {
      if (!buyItemId) {
        setErr("Choose the item to buy.");
        return;
      }
      const q = parseInt(buyQty, 10);
      if (!Number.isFinite(q) || q < 1 || q > 20) {
        setErr("Enter a quantity between 1 and 20.");
        return;
      }
      const v = parseFloat(amount);
      if (!Number.isFinite(v) || v <= 0) {
        setErr("Enter an amount to save.");
        return;
      }
      payload.buyItemId = buyItemId;
      payload.buyQuantity = q;
      payload.amountOffCents = Math.round(v * 100);
    }

    if (showMinSpend) {
      payload.minSpendCents = minSpend ? Math.round(parseFloat(minSpend) * 100) : 0;
    }
    if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      setErr("The end date must be after the start date.");
      return;
    }

    setSubmitting(true);
    setErr(null);
    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const itemOptions = (items || []).map((it) => (
    <option key={it.id} value={it.id}>
      {it.name}
    </option>
  ));

  const percentField = (
    <PromotionField label="Percentage off">
      <Input
        type="text"
        inputMode="numeric"
        value={percent}
        autoFocus
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || /^\d{1,3}$/.test(v)) setPercent(v);
        }}
        placeholder="20"
        disabled={submitting}
        className={inputClass}
      />
    </PromotionField>
  );

  const amountField = (
    <PromotionField label="Amount off (R)">
      <Input
        type="text"
        inputMode="decimal"
        value={amount}
        autoFocus
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
        }}
        placeholder="50.00"
        disabled={submitting}
        className={inputClass}
      />
    </PromotionField>
  );

  const minSpendField = (
    <PromotionField label="Minimum spend (R)">
      <Input
        type="text"
        inputMode="decimal"
        value={minSpend}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setMinSpend(v);
        }}
        placeholder="0.00"
        disabled={submitting}
        className={inputClass}
      />
    </PromotionField>
  );

  const segBtn = (active, label, onClick) => (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      className={`inline-flex h-9 flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors ${
        active ? "bg-foreground text-background" : "bg-secondary text-foreground"
      }`}
    >
      {label}
    </button>
  );

  const selectClass = `h-9 w-full rounded-md px-3 ${inputClass}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-foreground/30"
        onClick={submitting ? undefined : onClose}
      />
      <form
        onSubmit={submit}
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
          <h3 id="promo-modal-title" className="text-base font-semibold tracking-tight">
            {isEdit ? "Edit Promotion" : "New Promotion"}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
            className="inline-grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-2">
          <div className="flex flex-col gap-1">
            {TYPE_OPTIONS.map((o) => (
              <label
                key={o.key}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{o.label}</span>
                  <span className="text-xs leading-snug text-muted-foreground">{o.desc}</span>
                </span>
                <input
                  type="radio"
                  name="promo-type"
                  value={o.key}
                  checked={type === o.key}
                  onChange={() => setType(o.key)}
                  disabled={submitting}
                  className="h-4 w-4 shrink-0 accent-foreground"
                />
              </label>
            ))}
          </div>

          {type === "percentage" && (
            <div className="grid grid-cols-2 gap-3">
              {percentField}
              {minSpendField}
            </div>
          )}

          {type === "fixed" && (
            <div className="grid grid-cols-2 gap-3">
              {amountField}
              {minSpendField}
            </div>
          )}

          {type === "free_delivery" && <div>{minSpendField}</div>}

          {type === "free_item" && (
            <>
              <PromotionField label="Free item">
                <select
                  value={freeItemId}
                  onChange={(e) => setFreeItemId(e.target.value)}
                  disabled={submitting || !hasItems}
                  className={selectClass}
                >
                  <option value="">Choose an item</option>
                  {itemOptions}
                </select>
              </PromotionField>
              {minSpendField}
            </>
          )}

          {type === "bogo" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <PromotionField label="Buy this">
                  <select
                    value={buyItemId}
                    onChange={(e) => setBuyItemId(e.target.value)}
                    disabled={submitting || !hasItems}
                    className={selectClass}
                  >
                    <option value="">Choose an item</option>
                    {itemOptions}
                  </select>
                </PromotionField>
                <PromotionField label="Get this">
                  <select
                    value={getItemId}
                    onChange={(e) => setGetItemId(e.target.value)}
                    disabled={submitting || !hasItems}
                    className={selectClass}
                  >
                    <option value="">Choose an item</option>
                    {itemOptions}
                  </select>
                </PromotionField>
              </div>
              <PromotionField label="What they get">
                <div className="flex gap-2">
                  {segBtn(bogoFree, "Free", () => setBogoFree(true))}
                  {segBtn(!bogoFree, "Discounted", () => setBogoFree(false))}
                </div>
              </PromotionField>
              {!bogoFree && (
                <PromotionField label="Discount on the second item (%)">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={bogoPercent}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^\d{1,2}$/.test(v)) setBogoPercent(v);
                    }}
                    placeholder="50"
                    disabled={submitting}
                    className={inputClass}
                  />
                </PromotionField>
              )}
            </>
          )}

          {type === "happy_hour" && (
            <>
              <PromotionField label="Discount">
                <div className="flex gap-2">
                  {segBtn(hhKind === "percentage", "Percentage", () => setHhKind("percentage"))}
                  {segBtn(hhKind === "fixed", "Fixed amount", () => setHhKind("fixed"))}
                </div>
              </PromotionField>
              <div className="grid grid-cols-2 gap-3">
                {hhKind === "percentage" ? percentField : amountField}
                {minSpendField}
              </div>
              <PromotionField label="Days">
                <div className="flex flex-wrap gap-2">
                  {DAY_CHIPS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      disabled={submitting}
                      className={`inline-flex h-9 w-12 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                        days.includes(d.value)
                          ? "bg-foreground text-background"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </PromotionField>
              <div className="grid grid-cols-2 gap-3">
                <PromotionField label="Starts">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={submitting}
                    className={inputClass}
                  />
                </PromotionField>
                <PromotionField label="Ends">
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={submitting}
                    className={inputClass}
                  />
                </PromotionField>
              </div>
            </>
          )}

          {type === "item_discount" && (
            <>
              <PromotionField label="Apply to">
                <div className="flex gap-2">
                  {segBtn(idTarget === "items", "Chosen items", () => setIdTarget("items"))}
                  {segBtn(idTarget === "category", "A category", () => setIdTarget("category"))}
                </div>
              </PromotionField>
              {idTarget === "items" ? (
                <PromotionField label="Items">
                  {hasItems ? (
                    <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                      {(items || []).map((it) => (
                        <label
                          key={it.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary"
                        >
                          <input
                            type="checkbox"
                            checked={itemIds.includes(it.id)}
                            onChange={() => toggleItemId(it.id)}
                            disabled={submitting}
                            className="h-4 w-4 accent-foreground"
                          />
                          <span className="text-sm">{it.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Add menu items first.</p>
                  )}
                </PromotionField>
              ) : (
                <PromotionField label="Category">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={submitting || categories.length === 0}
                    className={selectClass}
                  >
                    <option value="">Choose a category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </PromotionField>
              )}
              <PromotionField label="Discount">
                <div className="flex gap-2">
                  {segBtn(idKind === "percentage", "Percentage", () => setIdKind("percentage"))}
                  {segBtn(idKind === "fixed", "Fixed amount", () => setIdKind("fixed"))}
                </div>
              </PromotionField>
              {idKind === "percentage" ? percentField : amountField}
            </>
          )}

          {type === "buy_save" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <PromotionField label="Buy this">
                  <select
                    value={buyItemId}
                    onChange={(e) => setBuyItemId(e.target.value)}
                    disabled={submitting || !hasItems}
                    className={selectClass}
                  >
                    <option value="">Choose an item</option>
                    {itemOptions}
                  </select>
                </PromotionField>
                <PromotionField label="Quantity">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={buyQty}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^\d{1,2}$/.test(v)) setBuyQty(v);
                    }}
                    placeholder="2"
                    disabled={submitting}
                    className={inputClass}
                  />
                </PromotionField>
              </div>
              <PromotionField label="Amount off (R)">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
                  }}
                  placeholder="25.00"
                  disabled={submitting}
                  className={inputClass}
                />
              </PromotionField>
            </>
          )}

          {(type === "bogo" || type === "free_item" || type === "buy_save") && !hasItems && (
            <p className="text-sm text-muted-foreground">Add menu items first to use this offer.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <PromotionField label="Runs from (optional)">
              <Input
                type="date"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                disabled={submitting}
                className={inputClass}
              />
            </PromotionField>
            <PromotionField label="Runs until (optional)">
              <Input
                type="date"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                disabled={submitting}
                className={inputClass}
              />
            </PromotionField>
          </div>

          {err && <p className="text-sm font-medium text-destructive">{err}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
          <Button type="submit" variant="dark" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function DeleteConfirm({ promo, busy, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-delete-title"
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-foreground/30"
        onClick={busy ? undefined : onCancel}
      />
      <div className="relative flex w-full max-w-sm flex-col rounded-2xl border border-border bg-card text-foreground shadow-lg">
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
          <h3 id="promo-delete-title" className="text-base font-semibold tracking-tight">
            Delete Promotion
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            disabled={busy}
            className="inline-grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-6 pb-2 text-sm text-muted-foreground">
          Delete “{offerSummary(promo)}”? This cannot be undone.
        </p>
        <div className="flex justify-end px-6 pb-5 pt-4">
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
