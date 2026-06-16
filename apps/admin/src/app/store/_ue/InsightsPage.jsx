"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Stat } from "../_ue/Stat";
import { tipStyle, fmt0, fmt } from "../_ue/data";
import { useAuth } from "@/lib/auth-store";
import { storeApi } from "@/lib/store";
import { PeriodSelect } from "../_ue/PeriodSelect";

function hourLabel(h) {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

export default function InsightsPage() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const [range, setRange] = useState("1d");
  const [revenue, setRevenue] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const [r, h, t] = await Promise.all([
          storeApi.revenue(token, range),
          storeApi.hourly(token, range),
          storeApi.topItems(token, range),
        ]);
        if (cancelled) return;
        setRevenue(r);
        setHourly(h.map((x) => ({ h: hourLabel(x.hour), o: x.orders })));
        setTopItems(t.slice(0, 8));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load insights");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, range]);

  const peakHour = hourly.reduce((max, x) => (x.o > max.o ? x : max), { h: "—", o: 0 });
  const peakValue = peakHour.o > 0 ? Math.max(...hourly.map((x) => x.o)) : 0;
  const avgOrderCents =
    revenue && revenue.orders > 0 ? Math.round(revenue.grossCents / revenue.orders) : 0;
  const totalRevenue = topItems.reduce((s, t) => s + t.revenueCents, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Insights</h1>
        </div>
        <div className="head-actions">
          <PeriodSelect value={range} onChange={setRange} />
        </div>
      </div>
      {error && (
        <div role="alert" aria-live="polite" className="card" style={{ padding: 14, color: "var(--red)", marginBottom: 14 }}>
          {error}
        </div>
      )}
      <div className="grid stats stagger" style={{ marginBottom: 18 }}>
        <Stat
          label="Net payout"
          value={fmt0((revenue?.netCents ?? 0) / 100)}
        />
        <Stat
          label="Gross sales"
          value={fmt0((revenue?.grossCents ?? 0) / 100)}
        />
        <Stat
          label="Total orders"
          value={String(revenue?.orders ?? 0)}
        />
        <Stat
          label="Avg. order value"
          value={fmt(avgOrderCents / 100)}
        />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", marginBottom: 18 }}>
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
          <div className="sec-title">Range</div>
          <div className="muted" style={{ fontSize: 13 }}>
            All numbers are based on the past {revenue?.windowDays ?? "—"} days of paid orders.
          </div>
        </div>
      </div>
      <div className="card">
        <div className="sec-title" style={{ padding: "18px 20px 4px" }}>
          Best performers
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Item</th>
              <th className="tar">Orders</th>
              <th className="tar">Revenue</th>
              <th className="tar">Share</th>
            </tr>
          </thead>
          <tbody>
            {topItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted" style={{ padding: 18 }}>
                  No data yet for this window.
                </td>
              </tr>
            ) : (
              topItems.map((it) => (
                <tr key={it.itemId}>
                  <td className="fw7">{it.name}</td>
                  <td className="tar">{it.qty}</td>
                  <td className="tar fw7">{fmt0(it.revenueCents / 100)}</td>
                  <td className="tar">
                    <span className="muted">
                      {totalRevenue > 0
                        ? Math.round((it.revenueCents / totalRevenue) * 100)
                        : 0}
                      %
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
