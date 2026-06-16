"use client";

import * as React from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuCheck as Check, LuCircleCheck as CheckCircle2, LuClipboardList as ClipboardList, LuClock as Clock, LuEye as Eye, LuLayers as Layers, LuUserCheck as UserCheck, LuX as X } from "react-icons/lu";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { Button } from "@/components/ui/button";
import {
  type BulkApplicationResponse,
  PARTNER_STAGE_LABEL,
  nextPartnerStage,
  type PartnerApplication,
  type RiderApplication,
} from "../_lib/types";
import {
  ErrorState,
  Flash,
  PageHeading,
  Stat,
  StatRow,
  StatusBadge,
  type BadgeTone,
  useFlash,
} from "../_components/ui";
import { DataTable } from "../_components/data-table";
import { RejectDialog } from "../_components/reject-dialog";

const dateFmt = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" });
const formatDate = (iso: string) => dateFmt.format(new Date(iso));

const RIDER_STAGE_LABEL: Record<RiderApplication["stage"], string> = {
  submitted: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

const RIDER_STAGE_TONE: Record<RiderApplication["stage"], BadgeTone> = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
};

const PARTNER_STAGE_TONE: Record<PartnerApplication["stage"], BadgeTone> = {
  submitted: "warning",
  "in-review": "info",
  verification: "info",
  live: "success",
  rejected: "danger",
};

type QueueItem = {
  key: string;
  id: string;
  kind: "rider" | "store";
  name: string;
  meta: string;
  contact: string;
  areaLabel: string;
  stage: string;
  stageLabel: string;
  stageTone: BadgeTone;
  waitlisted: boolean;
  pending: boolean;
  decided: boolean;
  createdAt: string;
  href: string;
  rider?: RiderApplication;
  partner?: PartnerApplication;
};

type RejectTarget = { kind: "rider" | "store"; id: string } | { kind: "bulk" };

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "rider", label: "Rider" },
  { value: "store", label: "Store" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "needs-review", label: "Needs review" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "approved", label: "Approved riders" },
  { value: "live", label: "Live stores" },
  { value: "rejected", label: "Rejected" },
];

function matchStatusFilter(item: QueueItem, value: string) {
  if (value === "needs-review") return item.pending && !item.waitlisted;
  if (value === "waitlisted") return item.waitlisted;
  if (value === "approved") return item.stage === "approved";
  if (value === "live") return item.stage === "live";
  if (value === "rejected") return item.stage === "rejected";
  return true;
}

export default function AdminApplicationsPage() {
  const token = useAuth((store) => store.token);
  const riders = useApiData<RiderApplication[]>("/admin/rider-applications", { token, pollMs: 10000 });
  const partners = useApiData<PartnerApplication[]>("/admin/partner-applications", { token, pollMs: 10000 });
  const { notice, flash } = useFlash();

  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [visibleItems, setVisibleItems] = React.useState<QueueItem[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<RejectTarget | null>(null);

  const loading = !riders.data || !partners.data;
  const loadError = riders.error ?? partners.error;

  const items = React.useMemo<QueueItem[]>(() => {
    const riderItems: QueueItem[] = (riders.data ?? []).map((rider) => ({
      key: `rider:${rider.id}`,
      id: rider.id,
      kind: "rider",
      name: rider.name,
      meta: rider.vehicleType,
      contact: rider.email,
      areaLabel: rider.areaLabel,
      stage: rider.stage,
      stageLabel: RIDER_STAGE_LABEL[rider.stage],
      stageTone: RIDER_STAGE_TONE[rider.stage],
      waitlisted: rider.waitlisted,
      pending: rider.stage === "submitted",
      decided: rider.stage !== "submitted",
      createdAt: rider.createdAt,
      href: `/admin/applications/riders/${rider.id}`,
      rider,
    }));
    const storeItems: QueueItem[] = (partners.data ?? []).map((partner) => ({
      key: `store:${partner.id}`,
      id: partner.id,
      kind: "store",
      name: partner.storeName,
      meta: partner.tradeTypeLabel,
      contact: partner.contactEmail,
      areaLabel: partner.areaLabel,
      stage: partner.stage,
      stageLabel: PARTNER_STAGE_LABEL[partner.stage],
      stageTone: PARTNER_STAGE_TONE[partner.stage],
      waitlisted: partner.waitlisted,
      pending: partner.stage !== "live" && partner.stage !== "rejected",
      decided: partner.stage === "live" || partner.stage === "rejected",
      createdAt: partner.createdAt,
      href: `/admin/applications/stores/${partner.id}`,
      partner,
    }));
    return [...riderItems, ...storeItems].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [riders.data, partners.data]);

  React.useEffect(() => {
    setSelected((current) => {
      const validKeys = new Set(items.map((item) => item.key));
      const next = new Set([...current].filter((key) => validKeys.has(key)));
      return next.size === current.size ? current : next;
    });
  }, [items]);

  const counts = React.useMemo(
    () => ({
      all: items.length,
      needsReview: items.filter((item) => item.pending && !item.waitlisted).length,
      waitlisted: items.filter((item) => item.waitlisted).length,
      decided: items.filter((item) => item.decided).length,
    }),
    [items],
  );

  const selectedItems = React.useMemo(() => items.filter((item) => selected.has(item.key)), [items, selected]);
  const selectedRiders = selectedItems.flatMap((item) => (item.rider ? [item.rider] : []));
  const selectedStores = selectedItems.flatMap((item) => (item.partner ? [item.partner] : []));
  const promotableRiders = selectedRiders.filter((rider) => rider.stage === "submitted" && rider.waitlisted);
  const promotableStores = selectedStores.filter((store) => store.waitlisted && store.stage !== "live" && store.stage !== "rejected");
  const approvableRiders = selectedRiders.filter((rider) => rider.stage === "submitted" && !rider.waitlisted);
  const rejectableRiders = selectedRiders.filter((rider) => rider.stage === "submitted");
  const rejectableStores = selectedStores.filter((store) => store.stage !== "live" && store.stage !== "rejected");
  const stageableStores = selectedStores.filter(
    (store) => !store.waitlisted && store.stage !== "live" && store.stage !== "rejected" && nextPartnerStage(store.stage),
  );
  const nextStoreStages = new Set(stageableStores.map((store) => nextPartnerStage(store.stage)));
  const sharedNextStoreStage = nextStoreStages.size === 1 ? [...nextStoreStages][0] : null;
  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((item) => selected.has(item.key));

  const handleVisibleRows = React.useCallback((rows: QueueItem[]) => setVisibleItems(rows), []);

  const refreshAll = React.useCallback(async () => {
    await Promise.all([riders.refresh(), partners.refresh()]);
  }, [riders, partners]);

  const runAction = async (busyKey: string, successMessage: string, action: () => Promise<void>) => {
    setBusy(busyKey);
    setActionError(null);
    try {
      await action();
      await refreshAll();
      flash(successMessage);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Could not update application");
    } finally {
      setBusy(null);
    }
  };

  const runBulk = async (busyKey: string, action: () => Promise<BulkApplicationResponse[]>) => {
    setBusy(busyKey);
    setActionError(null);
    try {
      const results = (await action()).flatMap((response) => response.results);
      const failed = results.filter((result) => !result.ok);
      await refreshAll();
      setSelected(new Set());
      if (failed.length > 0) {
        setActionError(`${results.length - failed.length} updated, ${failed.length} failed. ${failed[0]?.message ?? "Some rows could not be updated"}`);
      } else {
        flash(`${results.length} application${results.length === 1 ? "" : "s"} updated.`);
      }
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Could not update selected applications");
    } finally {
      setBusy(null);
    }
  };

  const toggleSelected = (key: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleItems.forEach((item) => next.delete(item.key));
      else visibleItems.forEach((item) => next.add(item.key));
      return next;
    });
  };

  const approveRider = (id: string) =>
    runAction(`rider:${id}:approve`, "Rider application approved.", async () => {
      await api(`/admin/rider-applications/${id}/approve`, { method: "POST", token });
    });

  const promoteRider = (id: string) =>
    runAction(`rider:${id}:promote`, "Rider application promoted from waitlist.", async () => {
      await api(`/admin/rider-applications/${id}/promote`, { method: "POST", token });
    });

  const promoteStore = (id: string) =>
    runAction(`store:${id}:promote`, "Store application promoted from waitlist.", async () => {
      await api(`/admin/partner-applications/${id}/promote`, { method: "POST", token });
    });

  const setStoreStage = (id: string, stage: NonNullable<ReturnType<typeof nextPartnerStage>>) =>
    runAction(`store:${id}:stage`, `Moved to ${PARTNER_STAGE_LABEL[stage]}.`, async () => {
      await api(`/admin/partner-applications/${id}/stage`, { method: "POST", token, body: { stage } });
    });

  const confirmReject = async (reason: string) => {
    const target = rejectTarget;
    if (!target) return;
    if (target.kind === "bulk") {
      await runBulk("bulk:reject", async () => {
        const calls: Promise<BulkApplicationResponse>[] = [];
        if (rejectableRiders.length > 0) {
          calls.push(api("/admin/rider-applications/bulk/reject", { method: "POST", token, body: { ids: rejectableRiders.map((rider) => rider.id), reason } }));
        }
        if (rejectableStores.length > 0) {
          calls.push(api("/admin/partner-applications/bulk/reject", { method: "POST", token, body: { ids: rejectableStores.map((store) => store.id), reason } }));
        }
        return Promise.all(calls);
      });
      setRejectTarget(null);
      return;
    }
    const endpoint = target.kind === "rider" ? `/admin/rider-applications/${target.id}/reject` : `/admin/partner-applications/${target.id}/reject`;
    await runAction(`${target.kind}:${target.id}:reject`, "Application rejected.", async () => {
      await api(endpoint, { method: "POST", token, body: { reason } });
    });
    setRejectTarget(null);
  };

  const promoteSelected = () =>
    runBulk("bulk:promote", async () => {
      const calls: Promise<BulkApplicationResponse>[] = [];
      if (promotableRiders.length > 0) {
        calls.push(api("/admin/rider-applications/bulk/promote", { method: "POST", token, body: { ids: promotableRiders.map((rider) => rider.id) } }));
      }
      if (promotableStores.length > 0) {
        calls.push(api("/admin/partner-applications/bulk/promote", { method: "POST", token, body: { ids: promotableStores.map((store) => store.id) } }));
      }
      return Promise.all(calls);
    });

  const approveSelectedRiders = () =>
    runBulk("bulk:approve-riders", async () => [
      await api<BulkApplicationResponse>("/admin/rider-applications/bulk/approve", { method: "POST", token, body: { ids: approvableRiders.map((rider) => rider.id) } }),
    ]);

  const stageSelectedStores = () => {
    if (!sharedNextStoreStage) return;
    return runBulk("bulk:stage-stores", async () => [
      await api<BulkApplicationResponse>("/admin/partner-applications/bulk/stage", { method: "POST", token, body: { ids: stageableStores.map((store) => store.id), stage: sharedNextStoreStage } }),
    ]);
  };

  if (loadError && loading) {
    return (
      <main>
        <PageHeading title="Applications" />
        <div className="mt-6">
          <ErrorState message={loadError} onRetry={refreshAll} />
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHeading title="Applications" />

      <StatRow>
        <Stat label="Pending review" value={loading ? "-" : String(counts.needsReview)} icon={<ClipboardList />} />
        <Stat label="Waitlisted" value={loading ? "-" : String(counts.waitlisted)} icon={<Clock />} />
        <Stat label="Decided" value={loading ? "-" : String(counts.decided)} icon={<CheckCircle2 />} />
        <Stat label="Total" value={loading ? "-" : String(counts.all)} icon={<Layers />} />
      </StatRow>

      {actionError ? <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{actionError}</p> : null}

      {selectedItems.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3">
          <p className="mr-auto text-sm font-medium">{selectedItems.length} selected</p>
          <BulkButton icon={<UserCheck className="h-4 w-4" />} label="Promote waitlisted" onClick={promoteSelected} disabled={busy !== null || promotableRiders.length + promotableStores.length === 0} />
          <BulkButton icon={<Check className="h-4 w-4" />} label="Approve riders" onClick={approveSelectedRiders} disabled={busy !== null || approvableRiders.length === 0} />
          <BulkButton
            icon={<ArrowRight className="h-4 w-4" />}
            label={sharedNextStoreStage ? `Move to ${PARTNER_STAGE_LABEL[sharedNextStoreStage]}` : "Move stores"}
            onClick={stageSelectedStores}
            disabled={busy !== null || stageableStores.length === 0 || !sharedNextStoreStage}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setRejectTarget({ kind: "bulk" })} disabled={busy !== null || rejectableRiders.length + rejectableStores.length === 0}>
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      ) : null}

      <div className="mt-5">
        <DataTable
          rows={loading ? undefined : items}
          getRowKey={(item) => item.key}
          minWidth="min-w-[980px]"
          emptyTitle="No applications yet"
          emptyFilteredTitle="No applications match your filters"
          initialSort={[{ id: "submitted", dir: "desc" }]}
          onVisibleRowsChange={handleVisibleRows}
          columns={[
            {
              id: "select",
              header: (
                <input
                  type="checkbox"
                  aria-label="Select all filtered applications"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  disabled={visibleItems.length === 0}
                  className="h-4 w-4 rounded border-border accent-foreground"
                />
              ),
              headerClassName: "w-10",
              className: "w-10",
              cell: (item) => (
                <input
                  type="checkbox"
                  aria-label={`Select ${item.name}`}
                  checked={selected.has(item.key)}
                  onChange={() => toggleSelected(item.key)}
                  className="mt-1 h-4 w-4 rounded border-border accent-foreground"
                />
              ),
            },
            {
              id: "type",
              header: "Type",
              className: "text-muted-foreground",
              sortable: true,
              sortAccessor: (item) => item.kind,
              filter: { type: "select", options: TYPE_FILTER_OPTIONS, match: (item, value) => item.kind === value },
              cell: (item) => (item.kind === "rider" ? "Rider" : "Store"),
            },
            {
              id: "applicant",
              header: "Applicant",
              sortable: true,
              sortAccessor: (item) => item.name,
              filter: { type: "text", accessor: (item) => `${item.name} ${item.contact} ${item.meta}` },
              cell: (item) => (
                <>
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.contact}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.meta}</p>
                </>
              ),
            },
            {
              id: "area",
              header: "Area",
              className: "text-muted-foreground",
              sortable: true,
              sortAccessor: (item) => item.areaLabel,
              filter: { type: "text", accessor: (item) => item.areaLabel },
              cell: (item) => item.areaLabel,
            },
            {
              id: "submitted",
              header: "Submitted",
              className: "whitespace-nowrap text-muted-foreground",
              sortable: true,
              sortAccessor: (item) => new Date(item.createdAt).getTime(),
              cell: (item) => formatDate(item.createdAt),
            },
            {
              id: "status",
              header: "Status",
              filter: { type: "select", options: STATUS_FILTER_OPTIONS, match: matchStatusFilter },
              cell: (item) => (
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge tone={item.stageTone} dot>{item.stageLabel}</StatusBadge>
                  {item.waitlisted ? <StatusBadge tone="muted">Waitlisted</StatusBadge> : null}
                </div>
              ),
            },
            {
              id: "actions",
              header: "Actions",
              align: "right",
              cell: (item) => (
                <RowActions item={item} busy={busy} onApproveRider={approveRider} onPromoteRider={promoteRider} onPromoteStore={promoteStore} onReject={setRejectTarget} onSetStoreStage={setStoreStage} />
              ),
            },
          ]}
        />
      </div>

      <RejectDialog
        open={rejectTarget !== null}
        title={rejectTarget?.kind === "bulk" ? "Reject selected applications" : "Reject application"}
        subtitle="Let the applicant know why this did not go through."
        busy={busy !== null && (busy.includes(":reject") || busy === "bulk:reject")}
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
      />
      <Flash message={notice} />
    </main>
  );
}

function RowActions({ item, busy, onApproveRider, onPromoteRider, onPromoteStore, onReject, onSetStoreStage }: {
  item: QueueItem;
  busy: string | null;
  onApproveRider: (id: string) => void;
  onPromoteRider: (id: string) => void;
  onPromoteStore: (id: string) => void;
  onReject: (target: RejectTarget) => void;
  onSetStoreStage: (id: string, stage: NonNullable<ReturnType<typeof nextPartnerStage>>) => void;
}) {
  const disabled = busy !== null;
  const nextStage = item.partner ? nextPartnerStage(item.partner.stage) : null;
  return (
    <div className="flex justify-end gap-2">
      <Button asChild variant="secondary" size="sm">
        <Link href={item.href}><Eye className="h-4 w-4" />Review</Link>
      </Button>
      {item.rider?.stage === "submitted" && item.rider.waitlisted ? <ActionButton icon={<UserCheck className="h-4 w-4" />} label="Promote" onClick={() => onPromoteRider(item.rider!.id)} disabled={disabled} /> : null}
      {item.rider?.stage === "submitted" && !item.rider.waitlisted ? (
        <>
          <Button type="button" variant="ghost" size="sm" onClick={() => onReject({ kind: "rider", id: item.rider!.id })} disabled={disabled}><X className="h-4 w-4" />Reject</Button>
          <Button type="button" variant="dark" size="sm" onClick={() => onApproveRider(item.rider!.id)} disabled={disabled}><Check className="h-4 w-4" />Approve</Button>
        </>
      ) : null}
      {item.partner?.waitlisted && item.partner.stage !== "live" && item.partner.stage !== "rejected" ? <ActionButton icon={<UserCheck className="h-4 w-4" />} label="Promote" onClick={() => onPromoteStore(item.partner!.id)} disabled={disabled} /> : null}
      {item.partner && !item.partner.waitlisted && item.partner.stage !== "live" && item.partner.stage !== "rejected" ? (
        <>
          <Button type="button" variant="ghost" size="sm" onClick={() => onReject({ kind: "store", id: item.partner!.id })} disabled={disabled}><X className="h-4 w-4" />Reject</Button>
          {nextStage ? <Button type="button" variant="dark" size="sm" onClick={() => onSetStoreStage(item.partner!.id, nextStage)} disabled={disabled}><ArrowRight className="h-4 w-4" />{PARTNER_STAGE_LABEL[nextStage]}</Button> : null}
        </>
      ) : null}
    </div>
  );
}

function ActionButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean }) {
  return <Button type="button" variant="secondary" size="sm" onClick={onClick} disabled={disabled}>{icon}{label}</Button>;
}

function BulkButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick?: () => void; disabled: boolean }) {
  return <Button type="button" variant="secondary" size="sm" onClick={onClick} disabled={disabled}>{icon}{label}</Button>;
}
