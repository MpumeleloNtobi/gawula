"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LuChevronRight as ChevronRight } from "react-icons/lu";
import {
  Bar,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { formatPrice } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import {
  buildRiderEarningsSeries,
  riderEarningsTotal,
  riderPeriodOptions,
  riderPeriodStart,
  type EarningsPoint,
  type RiderPeriod,
} from "@/lib/rider-earnings";

type HistoryTrip = {
  tripId: string | null;
  orderId: string;
  complexName: string;
  customerName: string;
  dropoffSuburb: string | null;
  earningsCents: number;
  deliveredAt: string | null;
};

type ActiveTrip = { orderId: string };
type AvailableTrip = { orderId: string };

const deliveredFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function CursorBlock(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  const { x, y, width, height } = props;
  if (x == null || width == null) return null;
  return (
    <rect
      x={x}
      y={y ?? 0}
      width={width}
      height={height ?? 0}
      rx={8}
      fill="hsl(var(--primary) / 0.1)"
    />
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: EarningsPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{point.label}</p>
      <p className="mt-0.5 text-primary">{formatPrice(point.earningsCents)}</p>
      <p className="text-muted-foreground">
        {point.count === 1 ? "1 order" : `${point.count} orders`}
      </p>
    </div>
  );
}

export default function RiderDashboardPage() {
  const token = useAuth((s) => s.token);
  const { data: mine } = useApiData<ActiveTrip[]>("/dispatch/trips/mine", { token, pollMs: 4000 });
  const { data: available } = useApiData<AvailableTrip[]>("/dispatch/trips/available", {
    token,
    pollMs: 4000,
  });
  const { data: history } = useApiData<HistoryTrip[]>("/dispatch/trips/history", { token });

  const [period, setPeriod] = useState<RiderPeriod>("daily");

  const series = useMemo(() => buildRiderEarningsSeries(history ?? [], period), [history, period]);
  const summary = useMemo(() => riderEarningsTotal(series), [series]);
  const periodTrips = useMemo(() => {
    const start = riderPeriodStart(period);
    return (history ?? []).filter(
      (trip) => trip.deliveredAt && (!start || new Date(trip.deliveredAt) >= start),
    );
  }, [history, period]);

  const hasEarnings = series.some((p) => p.earningsCents > 0);
  const hasOrders = series.some((p) => p.count > 0);
  const recent = periodTrips.slice(0, 4);

  return (
    <div className="container pb-24 pt-6 md:py-10">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="mt-8 divide-y divide-border">
        <Link
          href="/rider/orders?tab=active"
          className="flex items-center justify-between gap-3 py-4 transition-opacity hover:opacity-70"
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{mine?.length ?? 0}</p>
            <p className="text-sm font-semibold text-muted-foreground">Active trips</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
        <Link
          href="/rider/orders?tab=queue"
          className="flex items-center justify-between gap-3 py-4 transition-opacity hover:opacity-70"
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{available?.length ?? 0}</p>
            <p className="text-sm font-semibold text-muted-foreground">Available now</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg font-semibold">Earnings</p>
          <Dropdown
            value={period}
            options={riderPeriodOptions}
            onSelect={(value) => setPeriod(value as RiderPeriod)}
            ariaLabel="Period"
            align="end"
            radio
          />
        </div>
        <div className="mt-4">
          <p className="text-3xl font-semibold tracking-tight text-primary tabular-nums sm:text-4xl">
            {formatPrice(summary.earnings)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.count === 1 ? "1 delivery" : `${summary.count} deliveries`}
          </p>
        </div>
      </div>

      <section className="mt-8">
        {hasEarnings || hasOrders ? (
          <div className="mt-6">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 44, right: 8, bottom: 0, left: 8 }} accessibilityLayer={false}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis yAxisId="rand" hide />
                  <YAxis yAxisId="count" orientation="right" hide />
                  <Tooltip content={<ChartTooltip />} cursor={<CursorBlock />} />
                  <Bar yAxisId="rand" dataKey="rand" radius={[6, 6, 0, 0]} maxBarSize={32} isAnimationActive={false}>
                    {series.map((point, i) => (
                      <Cell
                        key={i}
                        fill={
                          point.earningsCents > 0
                            ? "hsl(var(--primary))"
                            : "hsl(var(--muted-foreground) / 0.18)"
                        }
                      />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="top"
                      offset={22}
                      formatter={(value) => {
                        const v = Number(value);
                        return v > 0 ? v : "";
                      }}
                      style={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--foreground))" }}
                    />
                    <LabelList
                      dataKey="rand"
                      position="top"
                      offset={7}
                      formatter={(value) => {
                        const v = Number(value);
                        return v > 0 ? (v >= 1000 ? `R${v / 1000}k` : `R${v}`) : "";
                      }}
                      style={{ fontSize: 11, fontWeight: 500, fill: "hsl(var(--muted-foreground))" }}
                    />
                  </Bar>
                  <Line
                    yAxisId="count"
                    type="linear"
                    dataKey="count"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--foreground))", strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No activity to chart for this period yet
          </p>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Recent Deliveries</p>
          <Link href="/rider/orders?tab=history" className="flex items-center gap-1 text-sm text-primary">
            View history
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No completed deliveries in this period</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/70">
            {recent.map((trip) => (
              <li key={trip.orderId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{trip.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {trip.complexName}
                    {trip.dropoffSuburb ? ` to ${trip.dropoffSuburb}` : ""}
                  </p>
                  {trip.deliveredAt && (
                    <p className="text-xs text-muted-foreground">
                      {deliveredFormatter.format(new Date(trip.deliveredAt))}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-medium">{formatPrice(trip.earningsCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
