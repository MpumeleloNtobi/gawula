"use client";

import * as React from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuClipboardList as ClipboardList, LuClock as Clock, LuEye as Eye, LuShieldCheck as ShieldCheck, LuUserCheck as UserCheck, LuX as X } from "react-icons/lu";
import { MdOutlineStorefront as Store } from "react-icons/md";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { Button } from "@/components/ui/button";
import {
  PARTNER_STAGE_FLOW,
  PARTNER_STAGE_LABEL,
  nextPartnerStage,
  type PartnerApplication,
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

const STAGE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...(["submitted", "in-review", "verification", "live", "rejected"] as PartnerApplication["stage"][]).map(
    (stage) => ({ value: stage, label: PARTNER_STAGE_LABEL[stage] }),
  ),
];

const STAGE_TONE: Record<PartnerApplication["stage"], BadgeTone> = {
  submitted: "warning",
  "in-review": "info",
  verification: "info",
  live: "success",
  rejected: "danger",
};

export default function AdminStoresPage() {
  const token = useAuth((store) => store.token);
  const { data: applications, error: loadError, refresh } = useApiData<PartnerApplication[]>(
    "/admin/partner-applications",
    { token, pollMs: 8000 },
  );
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const { notice, flash } = useFlash();

  const needsReview = (applications ?? []).filter(
    (application) => !application.waitlisted && application.stage !== "live" && application.stage !== "rejected",
  );
  const waitlisted = (applications ?? []).filter((application) => application.waitlisted && application.stage !== "rejected");
  const verification = (applications ?? []).filter((application) => application.stage === "verification");
  const live = (applications ?? []).filter((application) => application.stage === "live");

  const setStage = async (id: string, stage: (typeof PARTNER_STAGE_FLOW)[number]) => {
    setPendingId(id);
    setError(null);
    try {
      await api(`/admin/partner-applications/${id}/stage`, { method: "POST", token, body: { stage } });
      await refresh();
      flash(`Moved to ${PARTNER_STAGE_LABEL[stage]}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update application");
    } finally {
      setPendingId(null);
    }
  };

  const promote = async (id: string) => {
    setPendingId(id);
    setError(null);
    try {
      await api(`/admin/partner-applications/${id}/promote`, { method: "POST", token });
      await refresh();
      flash("Store application promoted from waitlist.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not promote application");
    } finally {
      setPendingId(null);
    }
  };

  const reject = async (reason: string) => {
    const id = rejectId;
    if (!id) return;
    setPendingId(id);
    setError(null);
    try {
      await api(`/admin/partner-applications/${id}/reject`, { method: "POST", token, body: { reason } });
      await refresh();
      setRejectId(null);
      flash("Store application rejected.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reject application");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <main>
      <PageHeading title="Store applications" />

      <StatRow>
        <Stat label="Pending review" value={applications ? String(needsReview.length) : "-"} icon={<ClipboardList />} />
        <Stat label="Waitlisted" value={applications ? String(waitlisted.length) : "-"} icon={<Clock />} />
        <Stat label="Verification" value={applications ? String(verification.length) : "-"} icon={<ShieldCheck />} />
        <Stat label="Live stores" value={applications ? String(live.length) : "-"} icon={<Store />} />
      </StatRow>

      {error ? <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

      {loadError && !applications ? (
        <div className="mt-4">
          <ErrorState message={loadError} onRetry={refresh} />
        </div>
      ) : (
        <div className="mt-5">
          <DataTable
            rows={applications}
            getRowKey={(application) => application.id}
            minWidth="min-w-[900px]"
            emptyTitle="No store applications yet"
            emptyFilteredTitle="No store applications match your filters"
            initialSort={[{ id: "store", dir: "asc" }]}
            columns={[
              {
                id: "store",
                header: "Store",
                sortable: true,
                sortAccessor: (a) => a.storeName,
                filter: { type: "text", accessor: (a) => `${a.storeName} ${a.tradeTypeLabel}` },
                cell: (a) => (
                  <>
                    <p className="font-medium">{a.storeName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.tradeTypeLabel}</p>
                  </>
                ),
              },
              {
                id: "contact",
                header: "Contact",
                className: "text-muted-foreground",
                filter: { type: "text", accessor: (a) => `${a.contactName} ${a.contactEmail}` },
                cell: (a) => (
                  <>
                    <p>{a.contactName}</p>
                    <p className="mt-0.5 text-xs">{a.contactEmail}</p>
                  </>
                ),
              },
              {
                id: "area",
                header: "Area",
                className: "text-muted-foreground",
                sortable: true,
                sortAccessor: (a) => a.areaLabel,
                filter: { type: "text", accessor: (a) => a.areaLabel },
                cell: (a) => (
                  <>
                    {a.areaLabel}
                    {a.waitlisted ? " (waitlisted)" : ""}
                  </>
                ),
              },
              {
                id: "status",
                header: "Status",
                sortable: true,
                sortAccessor: (a) => PARTNER_STAGE_LABEL[a.stage],
                filter: {
                  type: "select",
                  options: STAGE_FILTER_OPTIONS,
                  match: (a, value) => a.stage === value,
                },
                cell: (a) => (
                  <StatusBadge tone={STAGE_TONE[a.stage]} dot>
                    {PARTNER_STAGE_LABEL[a.stage]}
                  </StatusBadge>
                ),
              },
              {
                id: "actions",
                header: "Actions",
                align: "right",
                cell: (application) => {
                  const next = nextPartnerStage(application.stage);
                  const decided = application.stage === "live" || application.stage === "rejected";
                  return (
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/admin/applications/stores/${application.id}`}>
                          <Eye className="h-4 w-4" />
                          Review
                        </Link>
                      </Button>
                      {application.waitlisted && !decided ? (
                        <Button variant="secondary" size="sm" onClick={() => promote(application.id)} disabled={pendingId === application.id}>
                          <UserCheck className="h-4 w-4" />
                          Promote
                        </Button>
                      ) : null}
                      {!application.waitlisted && !decided ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => setRejectId(application.id)} disabled={pendingId === application.id}>
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                          {next ? (
                            <Button variant="dark" size="sm" onClick={() => setStage(application.id, next)} disabled={pendingId === application.id}>
                              <ArrowRight className="h-4 w-4" />
                              {PARTNER_STAGE_LABEL[next]}
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      )}

      <RejectDialog
        open={rejectId !== null}
        title="Reject store application"
        subtitle="Let the store know why this did not go through."
        busy={pendingId !== null && pendingId === rejectId}
        onCancel={() => setRejectId(null)}
        onConfirm={reject}
      />
      <Flash message={notice} />
    </main>
  );
}
