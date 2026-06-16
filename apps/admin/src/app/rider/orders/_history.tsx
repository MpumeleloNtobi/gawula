"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";

type HistoryTrip = {
  tripId: string;
  orderId: string;
  complexName: string;
  customerName: string;
  dropoffSuburb: string;
  earningsCents: number;
  deliveredAt: string | null;
};

type HistoryDay = {
  key: string;
  label: string;
  sortValue: number;
  totalCents: number;
  trips: HistoryTrip[];
};

const dayFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-ZA", {
  hour: "2-digit",
  minute: "2-digit",
});

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayLabel(date: Date) {
  const diff = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86_400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return dayFormatter.format(date);
}

function formatTime(value: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return timeFormatter.format(parsed);
}

function groupByDay(trips: HistoryTrip[]): HistoryDay[] {
  const groups = new Map<string, HistoryDay>();
  for (const trip of trips) {
    const parsed = trip.deliveredAt ? new Date(trip.deliveredAt) : null;
    const valid = parsed && !Number.isNaN(parsed.getTime());
    const key = valid
      ? `${parsed!.getFullYear()}-${parsed!.getMonth()}-${parsed!.getDate()}`
      : "undated";
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: valid ? dayLabel(parsed!) : "Earlier",
        sortValue: valid ? startOfDay(parsed!).getTime() : 0,
        totalCents: 0,
        trips: [],
      };
      groups.set(key, group);
    }
    group.totalCents += trip.earningsCents;
    group.trips.push(trip);
  }

  const days = Array.from(groups.values());
  days.sort((a, b) => b.sortValue - a.sortValue);
  for (const day of days) {
    day.trips.sort((a, b) => {
      const at = a.deliveredAt ? new Date(a.deliveredAt).getTime() : 0;
      const bt = b.deliveredAt ? new Date(b.deliveredAt).getTime() : 0;
      return bt - at;
    });
  }
  return days;
}

export function OrdersHistory() {
  const token = useAuth((s) => s.token);
  const { data: history, loading } = useApiData<HistoryTrip[]>("/dispatch/trips/history", { token });

  const trips = history ?? [];
  const days = useMemo(() => groupByDay(trips), [trips]);

  if (loading && !history) {
    return <p className="text-sm text-muted-foreground">Loading your completed deliveries{"\u2026"}</p>;
  }

  if (trips.length === 0) {
    return <div className="py-16 text-center text-sm text-muted-foreground">No completed deliveries yet</div>;
  }

  return (
    <div className="space-y-8">
      {days.map((day) => (
        <div key={day.key}>
          <p className="text-base font-semibold text-foreground">{day.label}</p>
          <ul className="mt-2 divide-y-2 divide-border/50 border-b-2 border-border/50">
            {day.trips.map((trip) => {
              const time = formatTime(trip.deliveredAt);
              return (
                <li key={trip.tripId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      #{trip.orderId.slice(-5).toUpperCase()}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {trip.complexName} to {trip.dropoffSuburb}
                    </p>
                    {time ? <p className="text-xs text-muted-foreground">{time}</p> : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium">{formatPrice(trip.earningsCents)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex justify-end">
            <p className="text-sm font-semibold text-foreground">{formatPrice(day.totalCents)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
