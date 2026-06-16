"use client";

import * as React from "react";
import { LuCheck as Check, LuFileText as FileText, LuUserCheck as UserCheck, LuX as X } from "react-icons/lu";
import { useAuth } from "@/lib/auth-store";
import { api, ApiError } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type RiderApplication, VEHICLE_LABEL } from "../../../_lib/types";
import { ErrorState, Flash, PageHeading, StatusBadge, type BadgeTone, useFlash } from "../../../_components/ui";
import { RejectDialog } from "../../../_components/reject-dialog";

const dateFmt = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" });
const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "Not decided");

const STAGE_LABEL: Record<RiderApplication["stage"], string> = {
  submitted: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

const STAGE_TONE: Record<RiderApplication["stage"], BadgeTone> = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
};

export default function RiderApplicationDetailPage({ params }: { params: { id: string } }) {
  const token = useAuth((store) => store.token);
  const { data: application, error: loadError, refresh } = useApiData<RiderApplication>(
    `/admin/rider-applications/${params.id}`,
    { token, pollMs: 10000 },
  );
  const [busy, setBusy] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const { notice, flash } = useFlash();

  const runAction = async (busyKey: string, message: string, action: () => Promise<void>) => {
    setBusy(busyKey);
    setActionError(null);
    try {
      await action();
      await refresh();
      flash(message);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Could not update application");
    } finally {
      setBusy(null);
    }
  };

  const approve = () =>
    runAction("approve", "Rider application approved.", async () => {
      await api(`/admin/rider-applications/${params.id}/approve`, { method: "POST", token });
    });

  const promote = () =>
    runAction("promote", "Rider application promoted from waitlist.", async () => {
      await api(`/admin/rider-applications/${params.id}/promote`, { method: "POST", token });
    });

  const reject = async (reason: string) => {
    await runAction("reject", "Rider application rejected.", async () => {
      await api(`/admin/rider-applications/${params.id}/reject`, {
        method: "POST",
        token,
        body: { reason },
      });
    });
    setRejectOpen(false);
  };

  if (loadError && !application) {
    return (
      <main className="mx-auto max-w-5xl">
        <PageHeading title="Rider application" />
        <div className="mt-6">
          <ErrorState message={loadError} onRetry={refresh} />
        </div>
      </main>
    );
  }

  if (!application) {
    return (
      <main className="mx-auto max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </main>
    );
  }

  const canReview = application.stage === "submitted";
  const documentRows = [
    ["ID front", application.idFrontDocName],
    ["ID back", application.idBackDocName],
    ["Selfie", application.selfieDocName],
    ["Full body photo", application.fullBodyDocName],
    ["Driver's licence", application.licenceDocName],
  ];

  return (
    <main className="mx-auto max-w-5xl">
      <PageHeading
        title={application.name || "Rider application"}
        action={
          canReview ? (
            <>
              {application.waitlisted ? (
                <Button variant="secondary" onClick={promote} disabled={busy !== null}>
                  <UserCheck className="h-4 w-4" />
                  Promote
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setRejectOpen(true)} disabled={busy !== null}>
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button variant="dark" onClick={approve} disabled={busy !== null}>
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
            </>
          ) : null
        }
      />

      {actionError ? (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="grid gap-6 lg:col-span-2">
          <Panel title="Applicant">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Name" value={application.name} />
              <Info label="Email" value={application.email} />
              <Info label="Phone" value={application.phone} />
              <Info label="Area" value={application.areaLabel} />
              <Info label="Vehicle" value={VEHICLE_LABEL[application.vehicleType] ?? application.vehicleType} />
              <Info label="Smartphone" value={application.hasSmartphone ? "Yes" : "No"} />
              <Info label="ID or passport" value={application.idNumber} />
            </dl>
          </Panel>

          <Panel title="Documents">
            <div className="grid gap-3">
              {documentRows.map(([label, value]) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background text-muted-foreground">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="truncate text-xs text-muted-foreground">{value || "Not uploaded"}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="grid gap-6 content-start">
          <Panel title="Review status">
            <div className="grid gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <StatusBadge tone={STAGE_TONE[application.stage]} dot>
                    {STAGE_LABEL[application.stage]}
                  </StatusBadge>
                  {application.waitlisted ? <StatusBadge tone="muted">Waitlisted</StatusBadge> : null}
                </div>
              </div>
              <Info label="Submitted" value={formatDate(application.createdAt)} />
              <Info label="Decided" value={formatDate(application.decidedAt)} />
              {application.rejectionReason ? (
                <Info label="Rejection reason" value={application.rejectionReason} />
              ) : null}
            </div>
          </Panel>
        </aside>
      </div>

      <RejectDialog
        open={rejectOpen}
        title="Reject rider application"
        subtitle="Let the applicant know why this did not go through."
        busy={busy === "reject"}
        onCancel={() => setRejectOpen(false)}
        onConfirm={reject}
      />
      <Flash message={notice} />
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}