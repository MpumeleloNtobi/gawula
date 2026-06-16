"use client";
import { useEffect, useState } from "react";
import { LuCircleCheck as CheckCircle2 } from "react-icons/lu";
import { Stat } from "../_ue/Stat";
import { fmt, fmt0 } from "../_ue/data";
import { useAuth } from "@/lib/auth-store";
import { storeApi } from "@/lib/store";

function formatRange(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export default function PaymentsPage() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const [payouts, setPayouts] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const [p, r] = await Promise.all([
          storeApi.payouts(token),
          storeApi.revenue(token, "30d"),
        ]);
        if (cancelled) return;
        setPayouts(p);
        setRevenue(r);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load payments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token]);

  const balance = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const paidThisMonth = payouts
    .filter((p) => p.status === "paid" && new Date(p.runDate).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.amountCents, 0);
  const recentWeeks = payouts.slice(0, 4);
  const avgWeekly = recentWeeks.length > 0
    ? recentWeeks.reduce((s, p) => s + p.amountCents, 0) / recentWeeks.length
    : 0;

  return (
    <div className="pay-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Payments</h1>
        </div>
      </div>
      {error && (
        <div role="alert" aria-live="polite" className="card" style={{ padding: 14, color: "var(--red)", marginBottom: 14 }}>
          {error}
        </div>
      )}
      <div className="grid pay-hero stagger" style={{ marginBottom: 18 }}>
        <div className="pay-balance">
          <div className="lbl">Current balance</div>
          <div className="amt">{fmt(balance / 100)}</div>
          <div className="nx">
            <CheckCircle2 size={15} />
            {revenue ? `Net revenue last 30 days: ${fmt0(revenue.netCents / 100)}` : "Awaiting payouts"}
          </div>
        </div>
        <Stat
          label="Paid out (this month)"
          value={fmt0(paidThisMonth / 100)}
          sub="settled"
        />
        <Stat
          label="Avg. recent payout"
          value={fmt0(avgWeekly / 100)}
          sub={`${recentWeeks.length} runs`}
        />
      </div>
      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 4px",
          }}
        >
          <div className="sec-title" style={{ marginBottom: 0 }}>
            Payout history
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Status</th>
              <th className="tar">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="muted" style={{ padding: 18 }}>
                  Loading…
                </td>
              </tr>
            ) : payouts.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted" style={{ padding: 18 }}>
                  No payouts yet. Earnings appear here after settlement.
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id}>
                  <td className="fw7">{formatRange(p.runDate)}</td>
                  <td className="muted">{p.ref ?? "—"}</td>
                  <td>
                    <span
                      className={`pill ${p.status === "paid" ? "st-done" : "st-ready"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="tar fw8">{fmt(p.amountCents / 100)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
