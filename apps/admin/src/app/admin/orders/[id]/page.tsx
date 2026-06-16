"use client";

import * as React from "react";
import { LuBan as Ban, LuBike as Bike, LuBuilding2 as Building2, LuCreditCard as CreditCard, LuMapPin as MapPin, LuRotateCcw as RotateCcw, LuShoppingBag as ShoppingBag, LuUser as User, LuWallet as Wallet } from "react-icons/lu";
import { MdOutlineStorefront as Store } from "react-icons/md";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dropdown } from "@/components/ui/dropdown";
import {
  ADMIN_SUB_ORDER_STATUSES,
  STATUS_LABEL,
  SUB_ORDER_STATUS_LABEL,
  type AdminOrderDetail,
  type AdminRiderOption,
  type AdminSubOrder,
} from "../../_lib/types";
import { ErrorState, PageHeading, StatusBadge, orderStatusTone } from "../../_components/ui";

const dateFormat = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

const ACTION_LABEL: Record<string, string> = {
  order_cancelled: "Order cancelled",
  suborder_cancelled: "Outlet cancelled",
  suborder_status_override: "Status override",
  trip_cancelled: "Trip cancelled",
  trip_reassigned: "Rider reassigned",
  refund_recorded: "Refund recorded",
  note_added: "Note added",
};

type DialogState =
  | { kind: "cancelOrder" }
  | { kind: "cancelSubOrder"; subOrder: AdminSubOrder }
  | { kind: "transition"; subOrder: AdminSubOrder; status: string }
  | { kind: "cancelTrip" }
  | { kind: "reassign" }
  | { kind: "refund" }
  | { kind: "note" }
  | null;

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const orderId = params.id;
  const token = useAuth((s) => s.token);

  const { data: detail, error, refresh } = useApiData<AdminOrderDetail>(
    `/admin/orders/${orderId}`,
    { token, pollMs: 5000 },
  );

  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const runAction = React.useCallback(
    async (path: string, method: "PATCH" | "POST", body: Record<string, unknown>) => {
      setBusy(true);
      setActionError(null);
      try {
        await api(path, { method, body, token });
        await refresh();
        setDialog(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      } finally {
        setBusy(false);
      }
    },
    [token, refresh],
  );

  const ref = `#${orderId.slice(-5).toUpperCase()}`;

  if (error && !detail) {
    return (
      <main>
        <PageHeading title={`Order ${ref}`} />
        <div className="mt-6">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="grid gap-6 lg:col-span-2">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <div className="grid gap-6">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  const isCancelled = detail.status === "cancelled";
  const refunded = detail.refundCents > 0;
  const itemCount = detail.subOrders.reduce(
    (n, s) => n + s.items.reduce((m, it) => m + it.qty, 0),
    0,
  );
  const addressLine = [detail.address.line1, detail.address.suburb, detail.address.city]
    .filter(Boolean)
    .join(", ");
  const tripCancelled = detail.trip?.status === "cancelled_by_ops";

  return (
    <main className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Order {ref}</h1>
            <StatusBadge tone={orderStatusTone(detail.status)} dot>
              {STATUS_LABEL[detail.status] ?? detail.status}
            </StatusBadge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {dateFormat.format(new Date(detail.placedAt))}
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={isCancelled}
          onClick={() => setDialog({ kind: "cancelOrder" })}
        >
          Cancel order
        </Button>
      </div>

      {actionError ? (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {isCancelled ? (
        <Banner
          icon={Ban}
          tone="danger"
          title="Order cancelled"
          detail={detail.cancelReason}
          meta={detail.cancelledAt ? dateFormat.format(new Date(detail.cancelledAt)) : null}
        />
      ) : null}

      {refunded ? (
        <Banner
          icon={RotateCcw}
          tone="muted"
          title={`Refunded ${formatPrice(detail.refundCents)}`}
          detail={detail.refundReason}
          meta={detail.refundedAt ? dateFormat.format(new Date(detail.refundedAt)) : null}
        />
      ) : null}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Order total" value={formatPrice(detail.totalCents)} icon={<Wallet />} />
        <Stat label="Items" value={String(itemCount)} icon={<ShoppingBag />} />
        <Stat label="Outlets" value={String(detail.subOrders.length)} icon={<Store />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="grid gap-6 lg:col-span-2">
          <Panel title="Outlets">
            <ul className="divide-y divide-border">
              {detail.subOrders.map((s) => {
                const closed = s.status === "cancelled" || s.status === "rejected";
                return (
                  <li
                    key={s.id}
                    className={cn("py-4 first:pt-0 last:pb-0", closed && "opacity-70")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium">{s.outletName}</span>
                      <StatusBadge tone={closed ? "danger" : "neutral"}>
                        {SUB_ORDER_STATUS_LABEL[s.status] ?? s.status}
                      </StatusBadge>
                    </div>
                    <ul className="mt-2.5 grid gap-1 text-sm text-muted-foreground">
                      {s.items.map((it) => (
                        <li key={it.id} className="flex justify-between gap-3">
                          <span className="truncate">
                            {it.qty}x {it.name}
                          </span>
                          <span className="tabular-nums">{formatPrice(it.totalCents)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2.5 flex justify-between text-sm font-medium">
                      <span>Subtotal</span>
                      <span className="tabular-nums">{formatPrice(s.foodSubtotalCents)}</span>
                    </div>
                    {s.cancelReason ? (
                      <p className="mt-2 text-xs text-muted-foreground">Reason: {s.cancelReason}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusSelect
                        current={s.status}
                        disabled={busy}
                        onPick={(status) =>
                          setDialog({ kind: "transition", subOrder: s, status })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={closed}
                        onClick={() => setDialog({ kind: "cancelSubOrder", subOrder: s })}
                      >
                        Cancel outlet
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel
            title="Activity"
            action={
              <Button variant="ghost" size="sm" onClick={() => setDialog({ kind: "note" })}>
                Add note
              </Button>
            }
          >
            {detail.auditLog.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No admin actions yet</p>
            ) : (
              <ol className="grid gap-4 border-l border-border pl-5">
                {detail.auditLog.map((a) => (
                  <li key={a.id} className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-[1.45rem] top-1.5 h-2 w-2 rounded-full bg-foreground/40 ring-4 ring-background"
                    />
                    <p className="text-sm font-medium">{ACTION_LABEL[a.action] ?? a.action}</p>
                    {a.reason ? (
                      <p className="text-sm text-muted-foreground">{a.reason}</p>
                    ) : null}
                    {a.note ? <p className="text-sm text-muted-foreground">{a.note}</p> : null}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[a.actorEmail, dateFormat.format(new Date(a.createdAt))]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <aside className="grid gap-6">
          <Panel title="Customer">
            <dl className="grid gap-4">
              <InfoRow icon={User} label="Name" value={detail.customerName} />
              <InfoRow
                icon={CreditCard}
                label="Payment"
                value={
                  <StatusBadge tone={detail.paid ? "success" : "muted"}>
                    {detail.paid ? "Paid" : "Pending"}
                  </StatusBadge>
                }
              />
              <InfoRow icon={MapPin} label={detail.address.label || "Address"} value={addressLine} />
            </dl>
          </Panel>

          <Panel title="Delivery">
            <dl className="grid gap-4">
              <InfoRow icon={Building2} label="Complex" value={detail.complexName} />
              <InfoRow
                icon={Bike}
                label="Rider"
                value={
                  detail.trip ? (
                    <span>
                      {detail.trip.riderName}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {detail.trip.status.replace(/_/g, " ")}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )
                }
              />
            </dl>
            {detail.trip ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDialog({ kind: "reassign" })}
                >
                  Reassign rider
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={tripCancelled}
                  onClick={() => setDialog({ kind: "cancelTrip" })}
                >
                  Cancel trip
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                Waiting for a rider to claim this order.
              </p>
            )}
          </Panel>

          <Panel
            title="Payment summary"
            action={
              <Button
                variant="ghost"
                size="sm"
                disabled={!detail.paid || refunded}
                onClick={() => setDialog({ kind: "refund" })}
              >
                {refunded ? "Refunded" : "Mark refunded"}
              </Button>
            }
          >
            <dl className="space-y-2.5">
              <PriceRow label="Food" cents={detail.foodSubtotalCents} />
              <PriceRow label="Delivery" cents={detail.deliveryFeeCents} />
              <PriceRow label="Service" cents={detail.serviceFeeCents} />
              <PriceRow label="Tip" cents={detail.tipCents} />
              <div className="flex items-baseline justify-between border-t border-border pt-2.5">
                <dt className="text-sm font-semibold">Total</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {formatPrice(detail.totalCents)}
                </dd>
              </div>
              {refunded ? (
                <div className="flex items-baseline justify-between text-destructive">
                  <dt className="text-sm">Refunded</dt>
                  <dd className="text-sm font-medium tabular-nums">
                    -{formatPrice(detail.refundCents)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Panel>
        </aside>
      </div>

      {dialog?.kind === "cancelOrder" ? (
        <ReasonDialog
          title="Cancel order"
          subtitle="Cancels every outlet and the rider trip. The customer will be notified."
          confirmLabel="Cancel order"
          busy={busy}
          requireReason
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => runAction(`/admin/orders/${orderId}/cancel`, "PATCH", { reason })}
        />
      ) : null}

      {dialog?.kind === "cancelSubOrder" ? (
        <ReasonDialog
          title={`Cancel ${dialog.subOrder.outletName}`}
          subtitle="Cancels just this outlet's items. Other outlets are unaffected."
          confirmLabel="Cancel outlet"
          busy={busy}
          requireReason
          onCancel={() => setDialog(null)}
          onConfirm={(reason) =>
            runAction(`/admin/suborders/${dialog.subOrder.id}/cancel`, "PATCH", { reason })
          }
        />
      ) : null}

      {dialog?.kind === "transition" ? (
        <ReasonDialog
          title={`Set ${dialog.subOrder.outletName} to ${
            SUB_ORDER_STATUS_LABEL[dialog.status] ?? dialog.status
          }`}
          subtitle="Admin override of the normal outlet flow."
          confirmLabel="Update status"
          busy={busy}
          requireReason={dialog.status === "cancelled" || dialog.status === "rejected"}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) =>
            runAction(`/admin/suborders/${dialog.subOrder.id}/status`, "PATCH", {
              status: dialog.status,
              reason: reason || undefined,
            })
          }
        />
      ) : null}

      {dialog?.kind === "cancelTrip" ? (
        <ReasonDialog
          title="Cancel trip"
          subtitle="Releases the delivery. The order returns to the dispatch pool."
          confirmLabel="Cancel trip"
          busy={busy}
          requireReason
          onCancel={() => setDialog(null)}
          onConfirm={(reason) =>
            runAction(`/admin/orders/${orderId}/trip/cancel`, "POST", { reason })
          }
        />
      ) : null}

      {dialog?.kind === "reassign" ? (
        <ReassignDialog
          token={token}
          currentRiderId={detail.trip?.riderId ?? null}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(riderId, reason) =>
            runAction(`/admin/orders/${orderId}/trip/reassign`, "POST", { riderId, reason })
          }
        />
      ) : null}

      {dialog?.kind === "refund" ? (
        <RefundDialog
          totalCents={detail.totalCents}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(amountCents, reason) =>
            runAction(`/admin/orders/${orderId}/refund`, "POST", { amountCents, reason })
          }
        />
      ) : null}

      {dialog?.kind === "note" ? (
        <NoteDialog
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(note) => runAction(`/admin/orders/${orderId}/notes`, "POST", { note })}
        />
      ) : null}
    </main>
  );
}

function StatusSelect({
  current,
  disabled,
  onPick,
}: {
  current: string;
  disabled: boolean;
  onPick: (status: string) => void;
}) {
  const options = ADMIN_SUB_ORDER_STATUSES.filter((s) => s !== current).map((s) => ({
    value: s,
    label: SUB_ORDER_STATUS_LABEL[s],
  }));
  return (
    <Dropdown
      value=""
      options={options}
      placeholder="Set status..."
      ariaLabel="Override outlet status"
      disabled={disabled}
      onSelect={onPick}
    />
  );
}

function ModalShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-foreground/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );
}

function ReasonDialog({
  title,
  subtitle,
  confirmLabel,
  busy,
  requireReason,
  onCancel,
  onConfirm,
}: {
  title: string;
  subtitle: string;
  confirmLabel: string;
  busy: boolean;
  requireReason: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");
  const valid = !requireReason || reason.trim().length >= 3;
  return (
    <ModalShell title={title} subtitle={subtitle}>
      <Textarea
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={requireReason ? "Add a reason (required)" : "Add a reason (optional)"}
        className="mt-4"
        disabled={busy}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Back
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onConfirm(reason.trim())}
          disabled={!valid || busy}
        >
          {busy ? "Working..." : confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
}

function ReassignDialog({
  token,
  currentRiderId,
  busy,
  onCancel,
  onConfirm,
}: {
  token: string | null;
  currentRiderId: string | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (riderId: string, reason: string) => void;
}) {
  const { data: riders } = useApiData<AdminRiderOption[]>("/admin/riders", { token });
  const [riderId, setRiderId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const options = (riders ?? [])
    .filter((r) => r.id !== currentRiderId)
    .map((r) => ({ value: r.id, label: r.name, hint: r.complexName }));
  const valid = riderId && reason.trim().length >= 3;
  return (
    <ModalShell title="Reassign rider" subtitle="Move this delivery to another rider.">
      <div className="mt-4">
        <Dropdown
          value={riderId}
          options={options}
          placeholder="Select a rider..."
          ariaLabel="Rider"
          disabled={busy}
          triggerClassName="h-11 w-full justify-between rounded-lg border-0 bg-secondary px-3 hover:bg-secondary"
          onSelect={setRiderId}
        />
      </div>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Add a reason (required)"
        className="mt-3"
        disabled={busy}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Back
        </Button>
        <Button
          variant="dark"
          size="sm"
          onClick={() => onConfirm(riderId, reason.trim())}
          disabled={!valid || busy}
        >
          {busy ? "Working..." : "Reassign"}
        </Button>
      </div>
    </ModalShell>
  );
}

function RefundDialog({
  totalCents,
  busy,
  onCancel,
  onConfirm,
}: {
  totalCents: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (amountCents: number, reason: string) => void;
}) {
  const [amount, setAmount] = React.useState((totalCents / 100).toFixed(2));
  const [reason, setReason] = React.useState("");
  const amountCents = Math.round(Number(amount) * 100);
  const valid =
    Number.isFinite(amountCents) &&
    amountCents > 0 &&
    amountCents <= totalCents &&
    reason.trim().length >= 3;
  return (
    <ModalShell
      title="Mark refunded"
      subtitle="Records a refund against this order. No charge is reversed in stub mode."
    >
      <label className="mt-4 block text-xs text-muted-foreground">
        Amount (max {formatPrice(totalCents)})
      </label>
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={busy}
        className="mt-1"
      />
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Add a reason (required)"
        className="mt-3"
        disabled={busy}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Back
        </Button>
        <Button
          variant="dark"
          size="sm"
          onClick={() => onConfirm(amountCents, reason.trim())}
          disabled={!valid || busy}
        >
          {busy ? "Working..." : "Record refund"}
        </Button>
      </div>
    </ModalShell>
  );
}

function NoteDialog({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = React.useState("");
  const valid = note.trim().length >= 3;
  return (
    <ModalShell title="Add note" subtitle="Internal note saved to the order activity log.">
      <Textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write an internal note"
        className="mt-4"
        disabled={busy}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Back
        </Button>
        <Button
          variant="dark"
          size="sm"
          onClick={() => onConfirm(note.trim())}
          disabled={!valid || busy}
        >
          {busy ? "Working..." : "Save note"}
        </Button>
      </div>
    </ModalShell>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action ?? null}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        {icon ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  full,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn("flex items-start gap-3", full && "sm:col-span-2")}>
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

function Banner({
  icon: Icon,
  tone,
  title,
  detail,
  meta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "danger" | "muted";
  title: string;
  detail?: string | null;
  meta?: string | null;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-3 rounded-xl px-4 py-3",
        tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 text-sm">
        <p className="font-medium">{title}</p>
        {detail ? <p className="mt-0.5 opacity-90">{detail}</p> : null}
        {meta ? <p className="mt-0.5 text-xs opacity-70">{meta}</p> : null}
      </div>
    </div>
  );
}

function PriceRow({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{formatPrice(cents)}</dd>
    </div>
  );
}
