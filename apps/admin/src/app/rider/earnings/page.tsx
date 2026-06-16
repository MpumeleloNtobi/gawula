"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
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
  riderBreakdownLabel,
  riderEarningsTotal,
  riderPeriodOptions,
  type EarningsPoint,
  type RiderHistoryTrip,
  type RiderPeriod,
} from "@/lib/rider-earnings";

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
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{point.label}</p>
      <p className="text-muted-foreground">{formatPrice(point.earningsCents)}</p>
      <p className="text-muted-foreground">
        {point.count === 1 ? "1 delivery" : `${point.count} deliveries`}
      </p>
    </div>
  );
}

export default function RiderEarningsPage() {
  const token = useAuth((s) => s.token);
  const { data: history } = useApiData<RiderHistoryTrip[]>("/dispatch/trips/history", { token });
  const [period, setPeriod] = useState<RiderPeriod>("today");

  const series = useMemo(() => buildRiderEarningsSeries(history ?? [], period), [history, period]);
  const current = useMemo(() => riderEarningsTotal(series), [series]);
  const hasEarnings = series.some((p) => p.earningsCents > 0);

  return (
    <div className="container pb-24 pt-6 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Earnings</h1>
        <Dropdown
          value={period}
          options={riderPeriodOptions}
          onSelect={(value) => setPeriod(value as RiderPeriod)}
          ariaLabel="Earnings period"
          align="end"
          radio
        />
      </div>

      <section className="mt-8 rounded-2xl">
        <p className="text-4xl font-semibold">{formatPrice(current.earnings)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {current.count === 1 ? "1 delivery completed" : `${current.count} deliveries completed`}
        </p>
      </section>

      <section className="mt-10 rounded-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Earnings trend</p>
        </div>
        {hasEarnings ? (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} accessibilityLayer={false}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => (v >= 1000 ? `R${v / 1000}k` : `R${v}`)}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                />
                <Bar dataKey="rand" radius={[6, 6, 0, 0]} maxBarSize={28}>
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
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No earnings to chart for this period yet
          </p>
        )}
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Earnings reflect delivery fees and tips from your completed trips
      </p>
    </div>
  );
}
