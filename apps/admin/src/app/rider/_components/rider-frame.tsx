"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { useRiderStore, type RiderStatus } from "@/lib/rider-store";
import { RoleGate } from "@/components/role-gate";

type RiderMe = { status: string; onTrip: boolean };

function RiderSync() {
  const token = useAuth((s) => s.token);
  const { data: me, refresh } = useApiData<RiderMe>("/dispatch/me", { token, pollMs: 8000 });
  const setStatus = useRiderStore((s) => s.setStatus);
  const setOnTrip = useRiderStore((s) => s.setOnTrip);
  const setRefresh = useRiderStore((s) => s.setRefresh);

  useEffect(() => {
    setStatus((me?.status as RiderStatus) ?? null);
  }, [me?.status, setStatus]);

  useEffect(() => {
    setOnTrip(Boolean(me?.onTrip));
  }, [me?.onTrip, setOnTrip]);

  useEffect(() => {
    setRefresh(refresh);
    return () => setRefresh(null);
  }, [refresh, setRefresh]);

  return null;
}

export function RiderFrame({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate role="rider" title="Rider sign in">
      <RiderSync />
      {children}
    </RoleGate>
  );
}
