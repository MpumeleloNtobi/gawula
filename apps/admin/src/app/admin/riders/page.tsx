"use client";

import * as React from "react";
import Link from "next/link";
import { LuCheck as Check, LuCircleCheck as CheckCircle2, LuClipboardList as ClipboardList, LuClock as Clock, LuEye as Eye, LuUserCheck as UserCheck, LuX as X, LuCircleX as XCircle } from "react-icons/lu";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { Button } from "@/components/ui/button";
import { type RiderApplication, VEHICLE_LABEL } from "../_lib/types";
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
  { value: "submitted", label: "Awaiting review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STAGE_TONE: Record<RiderApplication["stage"], BadgeTone> = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
};

const STAGE_LABEL: Record<RiderApplication["stage"], string> = {
  submitted: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function AdminRidersPage() {
  const token = useAuth((store) => store.token);
  const { data: applications, error: loadError, refresh } = useApiData<RiderApplication[]>(
    "/admin/rider-applications",
    { token, pollMs: 8000 },
  );
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const { notice, flash } = useFlash();

  const needsReview = (applications ?? []).filter((application) => application.stage === "submitted" && !application.waitlisted);
  const waitlisted = (applications ?? []).filter((application) => application.stage === "submitted" && application.waitlisted);
  const approved = (applications ?? []).filter((application) => application.stage === "approved");
  const rejected = (applications ?? []).filter((application) => application.stage === "rejected");

  const approve = async (id: string) => {
    setPendingId(id);
    setError(null);
    try {
      await api(`/admin/rider-applications/${id}/approve`, { method: "POST", token });
      await refresh();
      flash("Rider application approved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not approve application");
    } finally {
      setPendingId(null);
    }
  };

  const promote = async (id: string) => {
    setPendingId(id);
    setError(null);
    try {
      await api(`/admin/rider-applications/${id}/promote`, { method: "POST", token });
      await refresh();
      flash("Rider application promoted from waitlist.");
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
      await api(`/admin/rider-applications/${id}/reject`, { method: "POST", token, body: { reason } });
      await refresh();
      setRejectId(null);
      flash("Rider application rejected.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reject application");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <main>
      <PageHeading title="Rider applications" />

      <StatRow>
        <Stat label="Pending review" value={applications ? String(needsReview.length) : "-"} icon={<ClipboardList />} />
        <Stat label="Waitlisted" value={applications ? String(waitlisted.length) : "-"} icon={<Clock />} />
        <Stat label="Approved" value={applications ? String(approved.length) : "-"} icon={<CheckCircle2 />} />
        <Stat label="Rejected" value={applications ? String(rejected.length) : "-"} icon={<XCircle />} />
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
            minWidth="min-w-[860px]"
            emptyTitle="No rider applications yet"
            emptyFilteredTitle="No rider applications match your filters"
            initialSort={[{ id: "applicant", dir: "asc" }]}
            columns={[
              {
                id: "applicant",
                header: "Applicant",
                sortable: true,
                sortAccessor: (a) => a.name,
                filter: { type: "text", accessor: (a) => `${a.name} ${a.email} ${a.phone}` },
                cell: (a) => (
                  <>
                    <p className="font-medium">{a.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.email}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.phone}</p>
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
                id: "vehicle",
                header: "Vehicle",
                className: "text-muted-foreground",
                sortable: true,
                sortAccessor: (a) => VEHICLE_LABEL[a.vehicleType] ?? a.vehicleType,
                filter: { type: "text", accessor: (a) => VEHICLE_LABEL[a.vehicleType] ?? a.vehicleType },
                cell: (a) => VEHICLE_LABEL[a.vehicleType] ?? a.vehicleType,
              },
              {
                id: "status",
                header: "Status",
                sortable: true,
                sortAccessor: (a) => STAGE_LABEL[a.stage],
                filter: {
                  type: "select",
                  options: STAGE_FILTER_OPTIONS,
                  match: (a, value) => a.stage === value,
                },
                cell: (a) => (
                  <StatusBadge tone={STAGE_TONE[a.stage]} dot>
                    {STAGE_LABEL[a.stage]}
                  </StatusBadge>
                ),
              },
              {
                id: "actions",
                header: "Actions",
                align: "right",
                cell: (application) => (
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/applications/riders/${application.id}`}>
                        <Eye className="h-4 w-4" />
                        Review
                      </Link>
                    </Button>
                    {application.stage === "submitted" && application.waitlisted ? (
                      <Button variant="secondary" size="sm" onClick={() => promote(application.id)} disabled={pendingId === application.id}>
                        <UserCheck className="h-4 w-4" />
                        Promote
                      </Button>
                    ) : null}
                    {application.stage === "submitted" && !application.waitlisted ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setRejectId(application.id)} disabled={pendingId === application.id}>
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button variant="dark" size="sm" onClick={() => approve(application.id)} disabled={pendingId === application.id}>
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                      </>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      <RejectDialog
        open={rejectId !== null}
        title="Reject rider application"
        subtitle="Let the applicant know why this did not go through."
        busy={pendingId !== null && pendingId === rejectId}
        onCancel={() => setRejectId(null)}
        onConfirm={reject}
      />
      <Flash message={notice} />
    </main>
  );
}
