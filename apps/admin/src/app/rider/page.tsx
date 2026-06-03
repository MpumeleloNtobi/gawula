"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { RoleGate } from "@/components/role-gate";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AvailableTrip = {
  orderId: string;
  complexName: string;
  dropoffSuburb: string;
  earningsCents: number;
  outlets: { subOrderId: string; outletName: string; status: string; locationInMall: string }[];
};

type RiderMe = {
  id: string;
  name: string;
  status: string;
};

type TripDetail = {
  tripId: string | null;
  orderId: string;
  status: string;
  complexName: string;
  customerName: string;
  dropoff: { line1: string; suburb: string | null; city: string; instructions: string | null };
  earningsCents: number;
  stops: {
    subOrderId: string;
    outletName: string;
    locationInMall: string;
    status: string;
    pickupCode: string;
    collected: boolean;
    items: { name: string; qty: number }[];
  }[];
};

export default function RiderPage() {
  return (
    <RoleGate role="rider" title="Rider sign in">
      <RiderBoard />
    </RoleGate>
  );
}

function RiderBoard() {
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);
  const { data: me, refresh: refreshMe } = useApiData<RiderMe>("/dispatch/me", {
    token,
    pollMs: 8000,
  });
  const { data: available, refresh: refreshAvailable } = useApiData<AvailableTrip[]>(
    "/dispatch/trips/available",
    { token, pollMs: 4000 },
  );
  const { data: mine, refresh: refreshMine } = useApiData<TripDetail[]>("/dispatch/trips/mine", {
    token,
    pollMs: 4000,
  });
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const online = me?.status === "online" || me?.status === "on_trip";
  const onTrip = me?.status === "on_trip";

  async function run(key: string, action: () => Promise<unknown>) {
    setPending(key);
    setError(null);
    try {
      await action();
      await Promise.all([refreshAvailable(), refreshMine(), refreshMe()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setPending(null);
    }
  }

  const toggleAvailability = () =>
    run("availability", () =>
      api("/dispatch/availability", { method: "POST", token, body: { online: !online } }),
    );
  const claim = (orderId: string) =>
    run(`claim:${orderId}`, () =>
      api("/dispatch/trips/claim", { method: "POST", token, body: { orderId } }),
    );
  const pickup = (tripId: string, subOrderId: string) =>
    run(`pickup:${subOrderId}`, () =>
      api(`/dispatch/trips/${tripId}/pickup`, { method: "POST", token, body: { subOrderId } }),
    );
  const deliver = (tripId: string) =>
    run(`deliver:${tripId}`, () =>
      api(`/dispatch/trips/${tripId}/deliver`, { method: "POST", token }),
    );

  return (
    <div className="container max-w-3xl pb-24 pt-6 md:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rider dispatch</h1>
        <Button variant="ghost" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
        <div>
          <p className="font-semibold">
            {online ? "You're online" : "You're offline"}
          </p>
          <p className="text-sm text-muted-foreground">
            {onTrip
              ? "Finish your active trip to change availability."
              : online
                ? "You can claim and run trips."
                : "Go online to start claiming trips."}
          </p>
        </div>
        <Button
          variant={online ? "secondary" : "dark"}
          onClick={toggleAvailability}
          disabled={pending === "availability" || onTrip}
        >
          {pending === "availability"
            ? "Working\u2026"
            : online
              ? "Go offline"
              : "Go online"}
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Your active trips</h2>
        {(mine ?? []).length === 0 ? (
          <p className="mt-3 rounded-2xl border border-border bg-secondary/40 px-4 py-5 text-sm text-muted-foreground">
            No active trips.
          </p>
        ) : (
          <div className="mt-3 grid gap-4">
            {(mine ?? []).map((trip) => {
              const allCollected = trip.stops.every((s) => s.collected);
              return (
                <div key={trip.orderId} className="rounded-2xl border border-border bg-secondary/40 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{trip.customerName}</p>
                    <span className="text-sm font-medium">{formatPrice(trip.earningsCents)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {trip.dropoff.line1}, {trip.dropoff.suburb ?? trip.dropoff.city}
                  </p>
                  {trip.dropoff.instructions && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Note: {trip.dropoff.instructions}
                    </p>
                  )}
                  <div className="mt-3 grid gap-2">
                    {trip.stops.map((stop) => (
                      <div
                        key={stop.subOrderId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{stop.outletName}</p>
                          <p className="text-xs text-muted-foreground">
                            {stop.locationInMall} &middot; code {stop.pickupCode}
                          </p>
                        </div>
                        {stop.collected ? (
                          <span className="text-xs text-muted-foreground">Collected</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={pending !== null || stop.status !== "ready"}
                            onClick={() => trip.tripId && pickup(trip.tripId, stop.subOrderId)}
                          >
                            {pending === `pickup:${stop.subOrderId}`
                              ? "Working\u2026"
                              : stop.status === "ready"
                                ? "Pick up"
                                : "Not ready"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    className="mt-4 w-full"
                    disabled={pending !== null || !allCollected || !trip.tripId}
                    onClick={() => trip.tripId && deliver(trip.tripId)}
                  >
                    {pending === `deliver:${trip.tripId}`
                      ? "Working\u2026"
                      : allCollected
                        ? "Mark delivered"
                        : "Collect all items first"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Available trips</h2>
        {!online ? (
          <p className="mt-3 rounded-2xl border border-border bg-secondary/40 px-4 py-5 text-sm text-muted-foreground">
            Go online to see trips waiting nearby.
          </p>
        ) : (available ?? []).length === 0 ? (
          <p className="mt-3 rounded-2xl border border-border bg-secondary/40 px-4 py-5 text-sm text-muted-foreground">
            No trips waiting nearby.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {(available ?? []).map((trip) => (
              <div key={trip.orderId} className="rounded-2xl border border-border bg-secondary/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{trip.complexName}</p>
                  <span className="text-sm font-medium">{formatPrice(trip.earningsCents)}</span>
                </div>
                <p className="text-xs text-muted-foreground">To {trip.dropoffSuburb}</p>
                <ul className="mt-2 grid gap-0.5 text-sm text-muted-foreground">
                  {trip.outlets.map((o) => (
                    <li key={o.subOrderId}>{o.outletName}</li>
                  ))}
                </ul>
                <Button
                  className="mt-3 w-full"
                  disabled={pending !== null}
                  onClick={() => claim(trip.orderId)}
                >
                  {pending === `claim:${trip.orderId}` ? "Working\u2026" : "Claim trip"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
