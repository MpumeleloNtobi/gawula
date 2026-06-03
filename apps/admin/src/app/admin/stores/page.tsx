"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type PartnerApplication,
  PARTNER_STAGE_FLOW,
  PARTNER_STAGE_LABEL,
  nextPartnerStage,
} from "../_lib/types";
import { ErrorState, PageHeading, StatusBadge, type BadgeTone, useFlash } from "../_components/ui";
import { RejectDialog } from "../_components/reject-dialog";

const STAGE_TONE: Record<PartnerApplication["stage"], BadgeTone> = {
  submitted: "warning",
  "in-review": "info",
  verification: "info",
  live: "success",
  rejected: "danger",
};

export default function AdminStoresPage() {
  const token = useAuth((s) => s.token);
  const {
    data: applications,
    error: loadError,
    refresh,
  } = useApiData<PartnerApplication[]>("/admin/partner-applications", { token, pollMs: 8000 });
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const { notice, flash } = useFlash();

  const setStage = async (id: string, stage: (typeof PARTNER_STAGE_FLOW)[number]) => {
    setPendingId(id);
    setError(null);
    try {
      await api(`/admin/partner-applications/${id}/stage`, {
        method: "POST",
        token,
        body: { stage },
      });
      await refresh();
      flash(`Moved to ${PARTNER_STAGE_LABEL[stage]}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update application");
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
      await api(`/admin/partner-applications/${id}/reject`, {
        method: "POST",
        token,
        body: { reason },
      });
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
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="mt-2 text-sm text-foreground">{notice}</p> : null}

      {loadError && !applications ? (
        <div className="mt-6">
          <ErrorState message={loadError} onRetry={refresh} />
        </div>
      ) : (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Store</th>
                  <th scope="col" className="px-4 py-3 font-medium">Contact</th>
                  <th scope="col" className="px-4 py-3 font-medium">Area</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!applications
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
                        <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-40" /></td>
                      </tr>
                    ))
                  : applications.map((a) => {
                      const next = nextPartnerStage(a.stage);
                      const decided = a.stage === "live" || a.stage === "rejected";
                      return (
                        <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                          <td className="px-4 py-3 font-medium">{a.storeName}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <div>{a.contactName}</div>
                            <div className="text-xs">{a.contactEmail}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {a.areaLabel}
                            {a.waitlisted ? " (waitlisted)" : ""}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge tone={STAGE_TONE[a.stage]} dot>
                              {PARTNER_STAGE_LABEL[a.stage]}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3">
                            {!decided ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setRejectId(a.id)}
                                  disabled={pendingId === a.id}
                                >
                                  Reject
                                </Button>
                                {next ? (
                                  <Button
                                    variant="dark"
                                    size="sm"
                                    onClick={() => setStage(a.id, next)}
                                    disabled={pendingId === a.id}
                                  >
                                    {pendingId === a.id ? "…" : `Move to ${PARTNER_STAGE_LABEL[next]}`}
                                  </Button>
                                ) : null}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                {applications && applications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No store applications yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <RejectDialog
        open={rejectId !== null}
        title="Reject store application"
        subtitle="Let the store know why this did not go through."
        busy={pendingId !== null && pendingId === rejectId}
        onCancel={() => setRejectId(null)}
        onConfirm={reject}
      />
    </main>
  );
}
