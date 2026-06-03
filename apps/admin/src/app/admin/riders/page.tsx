"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type RiderApplication, VEHICLE_LABEL } from "../_lib/types";
import { ErrorState, PageHeading, StatusBadge, useFlash } from "../_components/ui";
import { RejectDialog } from "../_components/reject-dialog";

const STAGE_TONE = { submitted: "warning", approved: "success", rejected: "danger" } as const;
const STAGE_LABEL = { submitted: "Pending", approved: "Approved", rejected: "Rejected" };

export default function AdminRidersPage() {
  const token = useAuth((s) => s.token);
  const {
    data: applications,
    error: loadError,
    refresh,
  } = useApiData<RiderApplication[]>("/admin/rider-applications", { token, pollMs: 8000 });
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const { notice, flash } = useFlash();

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

  const reject = async (reason: string) => {
    const id = rejectId;
    if (!id) return;
    setPendingId(id);
    setError(null);
    try {
      await api(`/admin/rider-applications/${id}/reject`, {
        method: "POST",
        token,
        body: { reason },
      });
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
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="mt-2 text-sm text-foreground">{notice}</p> : null}

      {loadError && !applications ? (
        <div className="mt-6">
          <ErrorState message={loadError} onRetry={refresh} />
        </div>
      ) : (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Contact</th>
                  <th scope="col" className="px-4 py-3 font-medium">Area</th>
                  <th scope="col" className="px-4 py-3 font-medium">Vehicle</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!applications
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                        <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-32" /></td>
                      </tr>
                    ))
                  : applications.map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                        <td className="px-4 py-3 font-medium">{a.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div>{a.email}</div>
                          <div className="text-xs">{a.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {a.areaLabel}
                          {a.waitlisted ? " (waitlisted)" : ""}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {VEHICLE_LABEL[a.vehicleType] ?? a.vehicleType}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={STAGE_TONE[a.stage]} dot>
                            {STAGE_LABEL[a.stage]}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          {a.stage === "submitted" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setRejectId(a.id)}
                                disabled={pendingId === a.id || a.waitlisted}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="dark"
                                size="sm"
                                onClick={() => approve(a.id)}
                                disabled={pendingId === a.id || a.waitlisted}
                              >
                                {pendingId === a.id ? "…" : "Approve"}
                              </Button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                {applications && applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No rider applications yet.
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
        title="Reject rider application"
        subtitle="Let the applicant know why this did not go through."
        busy={pendingId !== null && pendingId === rejectId}
        onCancel={() => setRejectId(null)}
        onConfirm={reject}
      />
    </main>
  );
}
