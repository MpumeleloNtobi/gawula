"use client";

import { useState } from "react";
import { LuStore as Store, LuMapPin as MapPin, LuCheck as Check } from "react-icons/lu";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TripDetail = {
  tripId: string | null;
  orderId: string;
  status: string;
  complexName: string;
  customerName: string;
  customerPhone: string | null;
  placedAt: string | null;
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

export function ActiveDeliveries({ onBrowse }: { onBrowse: () => void }) {
  const token = useAuth((s) => s.token);
  const { data: mine, refresh: refreshMine } = useApiData<TripDetail[]>("/dispatch/trips/mine", {
    token,
    pollMs: 4000,
  });
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<unknown>) {
    setPending(key);
    setError(null);
    try {
      await action();
      await refreshMine();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setPending(null);
    }
  }

  const pickup = (tripId: string, subOrderId: string) =>
    run(`pickup:${subOrderId}`, () =>
      api(`/dispatch/trips/${tripId}/pickup`, { method: "POST", token, body: { subOrderId } }),
    );
  const deliver = (tripId: string) =>
    run(`deliver:${tripId}`, () =>
      api(`/dispatch/trips/${tripId}/deliver`, { method: "POST", token }),
    );

  return (
    <div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {(mine ?? []).length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">No active trips</div>
      ) : (
        <div className="grid gap-8">
          {(mine ?? []).map((trip) => {
            const allCollected = trip.stops.every((s) => s.collected);
            return (
              <div key={trip.orderId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{trip.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      Order #{trip.orderId.slice(-5).toUpperCase()}
                      {trip.placedAt && (
                        <>
                          {" \u00b7 "}
                          {new Date(trip.placedAt).toLocaleTimeString("en-ZA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-base font-semibold text-primary">
                    {formatPrice(trip.earningsCents)}
                  </span>
                </div>

                <div className="mt-5">
                  {trip.stops.map((stop) => (
                    <div key={stop.subOrderId} className="relative flex gap-3 pb-5">
                      <span
                        aria-hidden
                        className="absolute left-4 top-9 bottom-0 w-0.5 -translate-x-1/2 bg-border"
                      />
                      <span
                        className={cn(
                          "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                          stop.collected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {stop.collected ? <Check className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                      </span>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={
                              stop.collected
                                ? "truncate text-sm text-muted-foreground line-through"
                                : "truncate text-sm font-medium"
                            }
                          >
                            {stop.outletName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {stop.locationInMall} &middot; Code {stop.pickupCode}
                          </p>
                        </div>
                        {stop.collected ? null : stop.status === "ready" ? (
                          <Button
                            size="sm"
                            className="shrink-0 rounded-full"
                            disabled={pending !== null}
                            onClick={() => trip.tripId && pickup(trip.tripId, stop.subOrderId)}
                          >
                            {pending === `pickup:${stop.subOrderId}` ? "Working\u2026" : "Pick up"}
                          </Button>
                        ) : (
                          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                            Not ready
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="relative flex gap-3">
                    <span
                      className={cn(
                        "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                        allCollected ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {trip.dropoff.line1}, {trip.dropoff.suburb ?? trip.dropoff.city}
                      </p>
                      {trip.dropoff.instructions && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {trip.dropoff.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  {trip.customerPhone && (
                    <Button size="sm" variant="secondary" className="shrink-0 rounded-full" asChild>
                      <a href={`tel:${trip.customerPhone}`}>Call customer</a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="flex-1 rounded-full"
                    disabled={pending !== null || !allCollected || !trip.tripId}
                    onClick={() => trip.tripId && deliver(trip.tripId)}
                  >
                    {pending === `deliver:${trip.tripId}` ? "Working\u2026" : "Delivered"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
