"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { connectRealtime, releaseRealtime } from "@/lib/realtime";
import { Button } from "@/components/ui/button";

type AvailableTrip = {
  orderId: string;
  complexName: string;
  dropoffSuburb: string;
  earningsCents: number;
  outlets: { subOrderId: string; outletName: string; status: string; locationInMall: string }[];
};

// PREVIEW: sample queue so the design can be reviewed without live data.
const PREVIEW_QUEUE: AvailableTrip[] = [
  {
    orderId: "preview-sandton",
    complexName: "Sandton City",
    dropoffSuburb: "Sandown",
    earningsCents: 5800,
    outlets: [
      { subOrderId: "p1", outletName: "Ember & Char", status: "ready", locationInMall: "Level 2, Food Court" },
    ],
  },
  {
    orderId: "preview-benmore",
    complexName: "Benmore Gardens",
    dropoffSuburb: "Morningside",
    earningsCents: 6300,
    outlets: [
      { subOrderId: "p2", outletName: "Saffron Table", status: "preparing", locationInMall: "Ground floor" },
      { subOrderId: "p3", outletName: "Cold Press Co", status: "ready", locationInMall: "Ground floor" },
    ],
  },
  {
    orderId: "preview-nelson",
    complexName: "Nelson Mandela Square",
    dropoffSuburb: "Sandhurst",
    earningsCents: 5200,
    outlets: [
      { subOrderId: "p4", outletName: "Bao House", status: "ready", locationInMall: "Upper level" },
    ],
  },
];

export function AvailableOrders({ onClaimed }: { onClaimed: () => void }) {
  const token = useAuth((s) => s.token);
  const { data: available, refresh } = useApiData<AvailableTrip[]>("/dispatch/trips/available", {
    token,
    pollMs: 20000,
  });
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const socket = connectRealtime(token);
    const onAvailable = () => refresh();
    socket.on("rider.trip.available", onAvailable);
    return () => {
      socket.off("rider.trip.available", onAvailable);
      releaseRealtime();
    };
  }, [token, refresh]);

  // PREVIEW: force a populated Queue regardless of online status / live data.
  const queue = available && available.length ? available : PREVIEW_QUEUE;
  const waiting = queue.length;
  const next = queue[0];

  const claim = (orderId: string) => {
    setPending(orderId);
    setError(null);
    api("/dispatch/trips/claim", { method: "POST", token, body: { orderId } })
      .then(() => {
        refresh();
        onClaimed();
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not accept order");
        setPending(null);
      });
  };

  return (
    <div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {waiting === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">No orders waiting nearby</div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <span className="text-8xl font-bold leading-none tracking-tight">{waiting}</span>
          <Button
            size="lg"
            className="mt-10 w-full rounded-full"
            disabled={pending !== null || !next}
            onClick={() => next && claim(next.orderId)}
          >
            {pending !== null ? "Accepting\u2026" : "Take"}
          </Button>
        </div>
      )}
    </div>
  );
}
