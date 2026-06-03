"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PARTNER_STAGE_LABEL,
  type PartnerApplication,
  type RiderApplication,
} from "../_lib/types";
import { ErrorState, PageHeading, StatusBadge } from "../_components/ui";

const dateFmt = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" });
const formatDate = (iso: string) => dateFmt.format(new Date(iso));

type QueueItem = {
  id: string;
  kind: "rider" | "store";
  name: string;
  meta: string;
  areaLabel: string;
  stageLabel: string;
  pending: boolean;
  createdAt: string;
  href: string;
};

export default function AdminApplicationsPage() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const riders = useApiData<RiderApplication[]>("/admin/rider-applications", {
    token,
    pollMs: 10000,
  });
  const partners = useApiData<PartnerApplication[]>("/admin/partner-applications", {
    token,
    pollMs: 10000,
  });

  const loading = !riders.data || !partners.data;
  const loadError = riders.error ?? partners.error;

  const items = React.useMemo<QueueItem[]>(() => {
    const riderItems: QueueItem[] = (riders.data ?? []).map((r) => ({
      id: r.id,
      kind: "rider",
      name: r.name,
      meta: r.vehicleType,
      areaLabel: r.areaLabel,
      stageLabel: r.stage === "submitted" ? "Awaiting review" : r.stage === "approved" ? "Approved" : "Rejected",
      pending: r.stage === "submitted",
      createdAt: r.createdAt,
      href: "/admin/riders",
    }));
    const partnerItems: QueueItem[] = (partners.data ?? []).map((p) => ({
      id: p.id,
      kind: "store",
      name: p.storeName,
      meta: p.tradeTypeLabel,
      areaLabel: p.areaLabel,
      stageLabel: PARTNER_STAGE_LABEL[p.stage],
      pending: p.stage !== "live" && p.stage !== "rejected",
      createdAt: p.createdAt,
      href: "/admin/stores",
    }));
    return [...riderItems, ...partnerItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [riders.data, partners.data]);

  if (loadError && loading) {
    return (
      <main>
        <PageHeading title="Applications" />
        <div className="mt-6">
          <ErrorState
            message={loadError}
            onRetry={() => {
              riders.refresh();
              partners.refresh();
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHeading title="Applications" />

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Area</th>
                <th scope="col" className="px-4 py-3 font-medium">Submitted</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    </tr>
                  ))
                : items.map((item) => (
                    <tr
                      key={`${item.kind}-${item.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(item.href)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(item.href);
                        }
                      }}
                      className="cursor-pointer border-b border-border outline-none transition-colors last:border-0 hover:bg-secondary/40 focus-visible:bg-secondary/40"
                    >
                      <td className="px-4 py-3 capitalize text-muted-foreground">{item.kind}</td>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.areaLabel}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={item.pending ? "warning" : "muted"} dot={item.pending}>
                          {item.stageLabel}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
