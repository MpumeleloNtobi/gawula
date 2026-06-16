"use client";

import * as React from "react";
import { LuArrowRight as ArrowRight, LuCircleCheck as CheckCircle2, LuFileText as FileText, LuUserCheck as UserCheck, LuX as X } from "react-icons/lu";
import { useAuth } from "@/lib/auth-store";
import { api, ApiError } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PARTNER_STAGE_LABEL,
  nextPartnerStage,
  type PartnerApplicationDetail,
} from "../../../_lib/types";
import { ErrorState, Flash, PageHeading, StatusBadge, type BadgeTone, useFlash } from "../../../_components/ui";
import { RejectDialog } from "../../../_components/reject-dialog";

const dateFmt = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" });
const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "Not decided");

const STAGE_TONE: Record<PartnerApplicationDetail["stage"], BadgeTone> = {
  submitted: "warning",
  "in-review": "info",
  verification: "info",
  live: "success",
  rejected: "danger",
};

export default function StoreApplicationDetailPage({ params }: { params: { id: string } }) {
  const token = useAuth((store) => store.token);
  const { data: application, error: loadError, refresh } = useApiData<PartnerApplicationDetail>(
    `/admin/partner-applications/${params.id}`,
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

  const promote = () =>
    runAction("promote", "Store application promoted from waitlist.", async () => {
      await api(`/admin/partner-applications/${params.id}/promote`, { method: "POST", token });
    });

  const setStage = (stage: NonNullable<ReturnType<typeof nextPartnerStage>>) =>
    runAction("stage", `Moved to ${PARTNER_STAGE_LABEL[stage]}.`, async () => {
      await api(`/admin/partner-applications/${params.id}/stage`, {
        method: "POST",
        token,
        body: { stage },
      });
    });

  const reject = async (reason: string) => {
    await runAction("reject", "Store application rejected.", async () => {
      await api(`/admin/partner-applications/${params.id}/reject`, {
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
        <PageHeading title="Store application" />
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

  const next = nextPartnerStage(application.stage);
  const canReview = application.stage !== "live" && application.stage !== "rejected";

  return (
    <main className="mx-auto max-w-5xl">
      <PageHeading
        title={application.storeName}
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
                  {next ? (
                    <Button variant="dark" onClick={() => setStage(next)} disabled={busy !== null}>
                      <ArrowRight className="h-4 w-4" />
                      {PARTNER_STAGE_LABEL[next]}
                    </Button>
                  ) : null}
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
          <Panel title="Store">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Store name" value={application.storeName} />
              <Info label="Trade type" value={application.tradeTypeLabel} />
              <Info label="Location" value={application.locationName ?? "Standalone"} />
              <Info label="Area" value={application.areaLabel} />
              <Info label="Address" value={application.address} />
              <Info label="Description" value={application.description} />
            </dl>
          </Panel>

          <Panel title="Contact">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Contact person" value={application.contactName} />
              <Info label="Contact email" value={application.contactEmail} />
              <Info label="Contact phone" value={application.contactPhone} />
              <Info label="Email verified" value={application.contactEmailVerified ? "Yes" : "No"} />
              <Info label="Store email" value={application.storeEmail ?? "Not provided"} />
              <Info label="Store phone" value={application.storePhone ?? "Not provided"} />
            </dl>
          </Panel>

          <Panel title="Documents">
            <div className="grid gap-3 sm:grid-cols-3">
              <DocumentPreview label="Logo" fileName={application.logoDocName} data={application.logoData} />
              <DocumentPreview
                label="Registration"
                fileName={application.registrationDocName}
                data={application.registrationData}
              />
              <DocumentPreview label="Storefront" fileName={application.storefrontDocName} data={application.storefrontData} />
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
                    {PARTNER_STAGE_LABEL[application.stage]}
                  </StatusBadge>
                  {application.waitlisted ? <StatusBadge tone="muted">Waitlisted</StatusBadge> : null}
                </div>
              </div>
              <Info label="Submitted" value={formatDate(application.createdAt)} />
              <Info label="Decided" value={formatDate(application.decidedAt)} />
              <Info label="Business type" value={application.soleProprietor ? "Sole proprietor" : "Registered business"} />
              <Info label="Registration number" value={application.registrationNumber ?? "Not provided"} />
              {application.rejectionReason ? (
                <Info label="Rejection reason" value={application.rejectionReason} />
              ) : null}
            </div>
          </Panel>
        </aside>
      </div>

      <RejectDialog
        open={rejectOpen}
        title="Reject store application"
        subtitle="Let the store know why this did not go through."
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

function DocumentPreview({ label, fileName, data }: { label: string; fileName: string | null; data: string | null }) {
  const imageData = data?.startsWith("data:image") ? data : null;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-secondary/30">
      <div className="aspect-[4/3] bg-background">
        {imageData ? (
          <img src={imageData} alt={`${label} preview`} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <FileText className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="px-3 py-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {data ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
          {label}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{fileName || "Not uploaded"}</p>
      </div>
    </div>
  );
}