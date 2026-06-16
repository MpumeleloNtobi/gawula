"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LuChevronRight as ChevronRight,
} from "react-icons/lu";
import { tipStyle, fmt0 } from "../_ue/data";
import { useAuth } from "@/lib/auth-store";
import { storeApi } from "@/lib/store";
import { PeriodSelect, PERIOD_OPTIONS } from "../_ue/PeriodSelect";

function hourLabel(h) {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

const GRANULARITY_WINDOW = {
  today: "1d",
  daily: "7d",
  weekly: "30d",
  monthly: "90d",
  yearly: "365d",
};

export default function HomePage() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const [overview, setOverview] = useState(null);
  const [range, setRange] = useState("daily");
  const [salesData, setSalesData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [error, setError] = useState(null);

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === range)?.label ?? "";

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const ov = await storeApi.overview(token);
        if (cancelled) return;
        setOverview(ov);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load overview");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token]);

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const window = GRANULARITY_WINDOW[range] ?? "7d";
        const [series, top, rev, hours] = await Promise.all([
          storeApi.salesSeries(token, range),
          storeApi.topItems(token, window),
          storeApi.revenue(token, window),
          storeApi.hourly(token, window),
        ]);
        if (cancelled) return;
        setSalesData(
          series.map((d) => ({ day: d.label, sales: Math.round(d.salesCents / 100) })),
        );
        setTopItems(
          top.slice(0, 5).map((t) => ({
            name: t.name,
            orders: t.qty,
            rev: Math.round(t.revenueCents / 100),
          })),
        );
        setRevenue(rev);
        setHourly(hours.map((x) => ({ h: hourLabel(x.hour), o: x.orders })));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load overview");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, range]);

  const ratingValue =
    revenue?.rating?.average != null ? revenue.rating.average.toFixed(1) : "0.0";
  const prepValue =
    revenue?.avgPrepMinutes != null && Math.round(revenue.avgPrepMinutes) > 0
      ? `${Math.round(revenue.avgPrepMinutes)} min`
      : "—";
  const peakHour = hourly.reduce((max, x) => (x.o > max.o ? x : max), { h: "—", o: 0 });
  const peakValue = peakHour.o > 0 ? Math.max(...hourly.map((x) => x.o)) : 0;

  return (
    <div className="overview-flat">
      <div className="page-head">
        <div>
          <h1 className="page-title">Overview</h1>
        </div>
        <PeriodSelect value={range} onChange={setRange} />
      </div>
      {error && (
        <div className="card" style={{ padding: 18, color: "var(--red)", marginBottom: 14 }}>
          {error}
        </div>
      )}
      <div className="ov-metrics stagger" style={{ marginBottom: 18 }}>
        <Link href="/store/orders" className="ov-metric">
          <span className="ov-metric-main">
            <span className="ov-metric-val">{String(revenue?.orders ?? 0)}</span>
            <span className="ov-metric-label">Orders</span>
          </span>
          <ChevronRight className="ov-metric-chev" size={18} aria-hidden />
        </Link>
        <div className="ov-metric">
          <span className="ov-metric-main">
            <span className="ov-metric-val">{prepValue}</span>
            <span className="ov-metric-label">Avg. prep time</span>
          </span>
        </div>
        <Link href="/store/reviews" className="ov-metric">
          <span className="ov-metric-main">
            <span className="ov-metric-val">{ratingValue}</span>
            <span className="ov-metric-label">Store rating</span>
            <span className="ov-metric-sub">{revenue?.rating?.count ?? 0} reviews</span>
          </span>
          <ChevronRight className="ov-metric-chev" size={18} aria-hidden />
        </Link>
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: "1fr", marginBottom: 18 }}
      >
        <div className="card" style={{ padding: 22 }}>
          <div className="chart-head">
            <div>
              <div className="sec-title" style={{ marginBottom: 2 }}>
                Sales
              </div>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesData}
                margin={{ top: 12, right: 6, left: -14, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#9a9a9a", fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#9a9a9a" }}
                  tickFormatter={(v) => "R" + (v >= 1000 ? v / 1000 + "k" : v)}
                />
                <Tooltip
                  contentStyle={tipStyle}
                  formatter={(v) => [fmt0(v), "Sales"]}
                  cursor={{ fill: "rgba(240,68,26,.08)" }}
                />
                <Bar dataKey="sales" fill="#f0441a" radius={[6, 6, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="chart-head">
            <div className="sec-title" style={{ marginBottom: 0 }}>
              Orders by hour
            </div>
            <span className="muted fw7" style={{ fontSize: 12.5 }}>
              {peakHour.o > 0 ? `Peak at ${peakHour.h}` : "No data yet"}
            </span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly} margin={{ top: 12, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="h"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11.5, fill: "#9a9a9a", fontWeight: 600 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9a9a9a" }} />
                <Tooltip
                  contentStyle={tipStyle}
                  formatter={(v) => [v, "Orders"]}
                  cursor={{ fill: "rgba(240,68,26,.08)" }}
                />
                <Bar dataKey="o" radius={[6, 6, 0, 0]} maxBarSize={18}>
                  {hourly.map((e, i) => (
                    <Cell key={i} fill={e.o >= peakValue && peakValue > 0 ? "#f0441a" : "#f9d2c4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="sec-title">Top selling items</div>
          {topItems.length === 0 ? (
            <div className="muted" style={{ padding: "12px 0", fontSize: 13 }}>
              No data yet. Sales from {periodLabel.toLowerCase()} will appear here.
            </div>
          ) : (
            topItems.map((it, i) => (
              <div
                key={it.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 0",
                  borderBottom: i < topItems.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                <span
                  style={{
                    width: 24,
                    fontWeight: 600,
                    color: "#c4c4c4",
                    fontSize: 14,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="fw7"
                    style={{
                      fontSize: 13.5,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {it.name}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {it.orders} orders
                  </div>
                </div>
                <span className="fw8" style={{ fontSize: 13.5 }}>
                  {fmt0(it.rev)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
