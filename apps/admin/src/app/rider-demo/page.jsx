"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LuBike as Bike, LuWallet as Wallet, LuClock as Clock, LuStar as Star, LuStar as StarOutline, LuSettings as Settings, LuSearch as Search, LuBell as Bell, LuChevronDown as ChevronDown, LuArrowUpRight as ArrowUpRight, LuArrowDownRight as ArrowDownRight, LuMapPin as MapPin, LuArrowLeft as ArrowLeft, LuPackage as Package, LuCheck as Check, LuCircleCheck as CheckCircle2, LuEllipsis as MoreHorizontal, LuZap as Zap, LuMenu as Menu } from "react-icons/lu";
import { MdOutlineStorefront as Store } from "react-icons/md";
import { LuLayoutGrid as LayoutGrid, LuCircleHelp as HelpCircle, LuNavigation as Navigation, LuDownload as Download } from "react-icons/lu";
import { UE_CSS } from "../_ue/theme";

const EXTRA = `
.route-step{display:flex;gap:13px;align-items:flex-start;position:relative;padding-bottom:20px}
.route-step:last-child{padding-bottom:0}
.route-step .ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:0 0 32px;z-index:1}
.route-step.line::before{content:"";position:absolute;left:15px;top:32px;bottom:-2px;width:2px;background:var(--line-2)}
.offer{display:flex;align-items:center;gap:13px;padding:15px 18px;border-bottom:1px solid var(--line)}
.offer:last-child{border-bottom:none}
.deliv-card{padding:18px;display:flex;gap:15px;align-items:center}
.pay-chip{background:var(--green-soft);color:var(--green-dark);font-weight:600;font-size:15px;padding:6px 12px;border-radius:11px;white-space:nowrap}
.st-active{background:var(--blue-soft);color:var(--blue)}
.st-queued{background:var(--amber-soft);color:#b9740f}
.st-done2{background:#f0f0f0;color:var(--muted)}
`;

const NAV = [
  {
    group: "Drive",
    items: [
      { id: "today", label: "Today", icon: LayoutGrid },
      { id: "deliveries", label: "Deliveries", icon: Bike, badge: 2 },
    ],
  },
  {
    group: "Money",
    items: [
      { id: "earnings", label: "Earnings", icon: Wallet },
      { id: "history", label: "History", icon: Clock },
    ],
  },
  {
    group: "Account",
    items: [
      { id: "ratings", label: "Ratings", icon: Star },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

const TITLES = {
  today: ["Good afternoon, Marcus 👋", "Here's how your shift is going."],
  deliveries: ["Deliveries", "Your active runs and offers."],
  earnings: ["Earnings", "What you've made and what's coming."],
  history: ["History", "Every trip you've completed."],
  ratings: ["Ratings", "What customers think of your service."],
  settings: ["Settings", "Vehicle, payouts, and availability."],
};

const earnWeek = [
  { day: "Mon", earn: 96, trips: 11 },
  { day: "Tue", earn: 112, trips: 13 },
  { day: "Wed", earn: 84, trips: 9 },
  { day: "Thu", earn: 138, trips: 16 },
  { day: "Fri", earn: 164, trips: 19 },
  { day: "Sat", earn: 192, trips: 22 },
  { day: "Sun", earn: 121, trips: 14 },
];

const DELIVERIES = [
  { id: "9918", store: "The Corner Kitchen", pickAddr: "214 Main St", cust: "Jordan Lee", dropAddr: "88 Oak Avenue, Apt 4B", dist: "3.2 km", mins: 16, pay: 8.6, status: "active" },
  { id: "9921", store: "Sushi Loft", pickAddr: "5 Lake Road", cust: "Elena Park", dropAddr: "12 Birch Lane", dist: "2.1 km", mins: 18, pay: 7.4, status: "queued" },
  { id: "9922", store: "Green Bowl Co.", pickAddr: "40 Pine Street", cust: "Sam Whitfield", dropAddr: "77 Cedar Court", dist: "1.4 km", mins: 12, pay: 5.8, status: "queued" },
  { id: "9910", store: "Noodle Bar 88", pickAddr: "9 Elm Street", cust: "Noah Brooks", dropAddr: "23 Maple Way", dist: "2.8 km", mins: 20, pay: 6.9, status: "done" },
  { id: "9905", store: "Taco Triangle", pickAddr: "61 King Street", cust: "Maya Cohen", dropAddr: "4 Sunset Blvd", dist: "1.9 km", mins: 14, pay: 5.2, status: "done" },
];

const HISTORY = [
  { id: "9910", route: "Noodle Bar 88 → Noah B.", date: "Today · 1:42 PM", dist: "2.8 km", pay: 6.9, rating: 5 },
  { id: "9905", route: "Taco Triangle → Maya C.", date: "Today · 12:58 PM", dist: "1.9 km", pay: 5.2, rating: 5 },
  { id: "9897", route: "Corner Kitchen → Liam O.", date: "Today · 12:14 PM", dist: "3.4 km", pay: 9.1, rating: 4 },
  { id: "9882", route: "Sushi Loft → Priya N.", date: "Today · 11:30 AM", dist: "2.2 km", pay: 7.0, rating: 5 },
  { id: "9871", route: "Green Bowl → Sam W.", date: "Today · 10:52 AM", dist: "1.5 km", pay: 5.6, rating: 5 },
];

const REVIEWS = [
  { name: "Jordan Lee", mins: "2h ago", n: 5, text: "Super fast and friendly, food arrived hot. Thank you!", av: "var(--green-soft)" },
  { name: "Elena Park", mins: "5h ago", n: 5, text: "Great communication on the route. Smooth handoff.", av: "var(--blue-soft)" },
  { name: "Liam Ortiz", mins: "Yesterday", n: 4, text: "Quick delivery, just a little hard to find the door.", av: "var(--amber-soft)" },
];

const ratingBreak = [
  { n: 5, pct: 86 },
  { n: 4, pct: 10 },
  { n: 3, pct: 3 },
  { n: 2, pct: 1 },
  { n: 1, pct: 0 },
];

const fmt = (n) =>
  "R" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => "R" + n.toLocaleString("en-US");

const tipStyle = {
  borderRadius: 12,
  border: "1px solid #ededed",
  boxShadow: "0 6px 24px rgba(13,13,13,.1)",
  fontSize: 12,
  fontWeight: 600,
  padding: "8px 12px",
};

function Stat({ label, value, delta, up, sub, icon: Icon }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-ic">
          <Icon size={17} />
        </span>
      </div>
      <div className="stat-val">{value}</div>
      <div className="stat-foot">
        {delta && (
          <span className={`delta ${up ? "up" : "down"}`}>
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {delta}
          </span>
        )}
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

const StarRow = ({ n, size = 14 }) => (
  <span style={{ display: "inline-flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => {
      const Icon = i <= n ? Star : StarOutline;
      return <Icon key={i} size={size} color={i <= n ? "#f0441a" : "#d8d8d8"} />;
    })}
  </span>
);

const delivStatus = {
  active: { l: "On the way", c: "st-active" },
  queued: { l: "Queued", c: "st-queued" },
  done: { l: "Completed", c: "st-done2" },
};

function Today({ deliveries, online, onAccept, onComplete }) {
  const current = deliveries.find((d) => d.status === "active");
  const offers = deliveries.filter((d) => d.status === "queued");
  const doneToday = deliveries.filter((d) => d.status === "done").length;
  return (
    <>
      <div className="grid stats stagger" style={{ marginBottom: 18 }}>
        <Stat label="Earnings today" value={fmt(142.6)} delta="11%" up sub="vs yesterday" icon={Wallet} />
        <Stat label="Deliveries" value={String(doneToday)} sub="completed today" icon={Bike} />
        <Stat label="Online hours" value="5.4h" sub="since 9:00 AM" icon={Clock} />
        <Stat label="Acceptance" value="96%" delta="2%" up sub="last 7 days" icon={CheckCircle2} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1.4fr", marginBottom: 18 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="sec-title" style={{ marginBottom: 14 }}>
            Current delivery
            {current && <span className="count">#{current.id}</span>}
          </div>
          {current ? (
            <>
              <div className="route">
                <div className="route-step line">
                  <div className="ic" style={{ background: "#0d0d0d", color: "#fff" }}>
                    <Store size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="muted" style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".04em" }}>
                      Pick up
                    </div>
                    <div className="fw7" style={{ fontSize: 14.5 }}>
                      {current.store}
                    </div>
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      {current.pickAddr} · Order ready
                    </div>
                  </div>
                </div>
                <div className="route-step">
                  <div className="ic" style={{ background: "var(--green-soft)", color: "var(--green-dark)" }}>
                    <MapPin size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="muted" style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".04em" }}>
                      Drop off
                    </div>
                    <div className="fw7" style={{ fontSize: 14.5 }}>
                      {current.cust}
                    </div>
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      {current.dropAddr} · {current.dist}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 14px" }}>
                <span className="muted fw7" style={{ fontSize: 13 }}>
                  Estimated payout
                </span>
                <span className="pay-chip">{fmt(current.pay)}</span>
              </div>
              <div style={{ display: "flex", gap: 9 }}>
                <button className="btn btn-dark" style={{ flex: 1, justifyContent: "center" }}>
                  <Navigation size={16} />
                  Navigate
                </button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => onComplete(current.id)}>
                  <Check size={16} />
                  Complete
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--green-soft)", color: "var(--green-dark)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                <CheckCircle2 size={26} />
              </div>
              <div className="fw7" style={{ fontSize: 15 }}>
                No active delivery
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                {online ? "Accept an offer below to get moving." : "Go online to start receiving offers."}
              </div>
            </div>
          )}
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="chart-head">
            <div>
              <div className="sec-title" style={{ marginBottom: 2 }}>
                Earnings this week
              </div>
              <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
                {fmt0(907)} total · 104 trips
              </span>
            </div>
            <div className="legend">
              <span>
                <i style={{ background: "#f0441a" }} />
                Earnings
              </span>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earnWeek} margin={{ top: 12, right: 6, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0441a" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#f0441a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9a9a9a", fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9a9a9a" }} tickFormatter={(v) => "R" + v} />
                <Tooltip contentStyle={tipStyle} formatter={(v) => [fmt(v), "Earnings"]} cursor={{ stroke: "#f0441a", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="earn" stroke="#f0441a" fill="url(#rg)" dot={{ r: 0 }} activeDot={{ r: 5, fill: "#f0441a" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="sec-title" style={{ padding: "18px 20px 6px", marginBottom: 0 }}>
          Next offers<span className="count">{offers.length}</span>
        </div>
        {offers.length === 0 ? (
          <div className="muted" style={{ padding: "14px 20px 20px", fontSize: 13 }}>
            No offers right now. Hang tight.
          </div>
        ) : (
          offers.map((q) => (
            <div className="offer" key={q.id}>
              <div className="thumb" style={{ background: "var(--amber-soft)", color: "#b9740f" }}>
                <Package size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fw7" style={{ fontSize: 14 }}>
                  {q.store}
                </div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  #{q.id} · {q.dist} · ~{q.mins} min
                </div>
              </div>
              <span className="pay-chip">{fmt(q.pay)}</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAccept(q.id)}
                disabled={!!current}
                style={{ opacity: current ? 0.45 : 1, cursor: current ? "not-allowed" : "pointer" }}
                title={current ? "Finish your current delivery first" : "Accept this offer"}
              >
                Accept
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id} className={`tab ${active === t.id ? "active" : ""}`} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count != null && <span className="tcount">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function Deliveries({ deliveries, current, onStart, onComplete }) {
  const [tab, setTab] = useState("active");
  const rows = deliveries.filter((d) =>
    tab === "active" ? d.status === "active" : tab === "queue" ? d.status === "queued" : d.status === "done",
  );
  return (
    <>
      <Tabs
        tabs={[
          { id: "active", label: "Active", count: deliveries.filter((d) => d.status === "active").length },
          { id: "queue", label: "Queue", count: deliveries.filter((d) => d.status === "queued").length },
          { id: "done", label: "Completed today", count: deliveries.filter((d) => d.status === "done").length },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="grid" style={{ gap: 14 }}>
        {rows.length === 0 && (
          <div className="card" style={{ padding: 22 }}>
            <span className="muted" style={{ fontSize: 13 }}>Nothing in this list right now.</span>
          </div>
        )}
        {rows.map((d) => {
          const m = delivStatus[d.status];
          return (
            <div className="card deliv-card" key={d.id}>
              <div className="thumb" style={{ background: "var(--green-soft)", color: "var(--green-dark)", width: 52, height: 52, flex: "0 0 52px", fontSize: 24 }}>
                <Bike size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span className="fw7" style={{ fontSize: 14.5 }}>
                    {d.store}
                  </span>
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    #{d.id}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={12} /> {d.cust} · {d.dist}
                </div>
              </div>
              <span className={`pill ${m.c}`} style={{ width: 124, justifyContent: "center" }}>
                {m.l}
              </span>
              <span className="pay-chip">{fmt(d.pay)}</span>
              {d.status === "active" ? (
                <button className="btn btn-primary btn-sm" onClick={() => onComplete(d.id)}>
                  <Check size={14} />
                  Complete
                </button>
              ) : d.status === "queued" ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onStart(d.id)}
                  disabled={!!current}
                  style={{ opacity: current ? 0.45 : 1, cursor: current ? "not-allowed" : "pointer" }}
                  title={current ? "Finish your current delivery first" : "Start this delivery"}
                >
                  Start
                </button>
              ) : (
                <button className="icon-btn" style={{ width: 34, height: 34 }}>
                  <MoreHorizontal size={18} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Earnings() {
  const [cashedOut, setCashedOut] = useState(false);
  return (
    <>
      <div className="grid pay-hero stagger" style={{ marginBottom: 18 }}>
        <div className="pay-balance">
          <div className="lbl">This week</div>
          <div className="amt">{fmt(907.4)}</div>
          <div className="nx">
            <Zap size={15} />
            104 trips · 38.2 online hours
          </div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="stat-label">Cash out balance</div>
          <div className="stat-val" style={{ marginTop: 10 }}>
            {cashedOut ? fmt(0) : fmt(142.6)}
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 12, opacity: cashedOut ? 0.5 : 1, cursor: cashedOut ? "default" : "pointer" }}
            onClick={() => setCashedOut(true)}
            disabled={cashedOut}
          >
            {cashedOut ? "Cashed out" : "Cash out now"}
          </button>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="stat-label">Next payout</div>
          <div className="stat-val" style={{ marginTop: 10 }}>
            {fmt(907.4)}
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            Monday · to ··· 4421
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: 22, marginBottom: 18 }}>
        <div className="sec-title">Daily earnings</div>
        <div className="chart-wrap" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earnWeek} margin={{ top: 12, right: 6, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9a9a9a", fontWeight: 600 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9a9a9a" }} tickFormatter={(v) => "R" + v} />
              <Tooltip contentStyle={tipStyle} formatter={(v) => [fmt(v), "Earnings"]} cursor={{ fill: "rgba(240,68,26,.06)" }} />
              <Bar dataKey="earn" radius={[6, 6, 0, 0]} fill="#f0441a" maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Day</th>
              <th className="tar">Trips</th>
              <th className="tar">Base</th>
              <th className="tar">Tips</th>
              <th className="tar">Total</th>
            </tr>
          </thead>
          <tbody>
            {earnWeek.map((d) => {
              const tips = Math.round(d.earn * 0.22 * 100) / 100;
              return (
                <tr key={d.day}>
                  <td className="fw7">{d.day}</td>
                  <td className="tar">{d.trips}</td>
                  <td className="tar">{fmt(d.earn - tips)}</td>
                  <td className="tar" style={{ color: "var(--green-dark)" }}>
                    {fmt(tips)}
                  </td>
                  <td className="tar fw8">{fmt(d.earn)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function History() {
  return (
    <div className="card">
      <table className="tbl">
        <thead>
          <tr>
            <th>Trip</th>
            <th>Route</th>
            <th>When</th>
            <th className="tar">Distance</th>
            <th className="tar">Rating</th>
            <th className="tar">Payout</th>
          </tr>
        </thead>
        <tbody>
          {HISTORY.map((h) => (
            <tr key={h.id}>
              <td className="fw7">#{h.id}</td>
              <td>{h.route}</td>
              <td className="muted">{h.date}</td>
              <td className="tar">{h.dist}</td>
              <td className="tar">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Star size={13} color="#f0441a" />
                  {h.rating}.0
                </span>
              </td>
              <td className="tar fw8">{fmt(h.pay)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Ratings() {
  return (
    <>
      <div className="grid rev-top card" style={{ marginBottom: 18 }}>
        <div className="rev-score" style={{ borderRight: "1px solid var(--line)" }}>
          <div className="rev-big">4.92</div>
          <div className="stars">
            <StarRow n={5} size={18} />
          </div>
          <div className="muted" style={{ fontSize: 12.5 }}>
            Based on 1,284 trips
          </div>
        </div>
        <div style={{ padding: 28 }}>
          {ratingBreak.map((r) => (
            <div className="bar-row" key={r.n}>
              <span className="n">{r.n}</span>
              <Star size={13} color="#f0441a" />
              <div className="bar-track">
                <div className="bar-fill" style={{ width: r.pct + "%" }} />
              </div>
              <span className="pc">{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        {REVIEWS.map((r) => (
          <div className="review" key={r.name}>
            <div className="rev-h">
              <div className="av" style={{ background: r.av, color: "var(--ink-2)" }}>
                {r.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div className="nm">{r.name}</div>
                <div className="mt">{r.mins}</div>
              </div>
              <StarRow n={r.n} />
            </div>
            <div className="rev-body">{r.text}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function Toggle({ on, onClick }) {
  return (
    <div className={`switch ${on ? "on" : ""}`} onClick={onClick} style={{ background: on ? "var(--green)" : "#d8d8d8" }}>
      <i />
    </div>
  );
}

function SettingsPage() {
  const [t, setT] = useState({ auto: true, longTrips: false, scheduled: true });
  const flip = (k) => setT((s) => ({ ...s, [k]: !s[k] }));
  return (
    <div className="grid set-grid">
      <div className="card set-block">
        <h4>Vehicle & payout</h4>
        <div className="sd">How you ride and get paid.</div>
        <div className="field">
          <label>Vehicle</label>
          <div className="val">
            <Bike size={15} />
            Bicycle · Green
          </div>
        </div>
        <div className="field">
          <label>Payout method</label>
          <div className="val">
            <Wallet size={15} />
            Bank ···· 4421
          </div>
        </div>
        <div className="field">
          <label>Service zone</label>
          <div className="val">
            <MapPin size={15} />
            Downtown
          </div>
        </div>
      </div>
      <div className="card set-block">
        <h4>Availability</h4>
        <div className="sd">Control the offers you receive.</div>
        <div className="toggle-row">
          <div>
            <div className="t">Auto-accept offers</div>
            <div className="d">Take the next best offer automatically</div>
          </div>
          <Toggle on={t.auto} onClick={() => flip("auto")} />
        </div>
        <div className="toggle-row">
          <div>
            <div className="t">Long trips</div>
            <div className="d">Allow deliveries over 5 km</div>
          </div>
          <Toggle on={t.longTrips} onClick={() => flip("longTrips")} />
        </div>
        <div className="toggle-row">
          <div>
            <div className="t">Scheduled shifts</div>
            <div className="d">Reserve hours during peak demand</div>
          </div>
          <Toggle on={t.scheduled} onClick={() => flip("scheduled")} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("today");
  const [online] = useState(true);
  const [deliveries, setDeliveries] = useState(DELIVERIES);
  const [navOpen, setNavOpen] = useState(false);
  const current = deliveries.find((d) => d.status === "active");
  const startDelivery = (id) =>
    setDeliveries((ds) => ds.map((d) => (d.id === id ? { ...d, status: "active" } : d)));
  const completeDelivery = (id) =>
    setDeliveries((ds) => ds.map((d) => (d.id === id ? { ...d, status: "done" } : d)));
  const [title, sub] = TITLES[active];
  const sections = {
    today: (
      <Today deliveries={deliveries} online={online} onAccept={startDelivery} onComplete={completeDelivery} />
    ),
    deliveries: (
      <Deliveries deliveries={deliveries} current={current} onStart={startDelivery} onComplete={completeDelivery} />
    ),
    earnings: <Earnings />,
    history: <History />,
    ratings: <Ratings />,
    settings: <SettingsPage />,
  };
  const headAction = {
    today: (
      <div className="daterange">
        Today <ChevronDown size={15} />
      </div>
    ),
    deliveries: null,
    earnings: (
      <button className="btn btn-ghost">
        <Download size={16} />
        Statements
      </button>
    ),
    history: <button className="btn btn-ghost">Filter</button>,
    ratings: (
      <div className="daterange">
        All time <ChevronDown size={15} />
      </div>
    ),
    settings: null,
  };
  return (
    <div className="ue-root">
      <style dangerouslySetInnerHTML={{ __html: UE_CSS + EXTRA }} />
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <a className="top-brand" href="#">Gawula</a>
          <button type="button" className="sidebar-close" onClick={() => setNavOpen(false)} aria-label="Close menu">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="sidebar-actions">
          <button type="button" className="sidebar-action" onClick={() => setNavOpen(false)}>
            Sign out
          </button>
        </div>
        <nav className="nav">
          {NAV.flatMap((g) => g.items).map((it) => {
            const Icon = it.icon;
            return (
              <button key={it.id} className={`nav-item ${active === it.id ? "active" : ""}`} onClick={() => { setActive(it.id); setNavOpen(false); }}>
                <Icon size={20} /> {it.label}
                {it.badge && <span className="nav-badge">{it.badge}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
      <div className={`sidebar-overlay ${navOpen ? "show" : ""}`} onClick={() => setNavOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <a className="top-brand" href="#">Gawula</a>
          <div className="topbar-search">
            <Search size={16} color="#000" />
            <input placeholder="Search trips, stores, payouts…" />
          </div>
          <div className="top-actions">
            <button className="icon-btn">
              <HelpCircle size={20} />
            </button>
            <button className="icon-btn">
              <Bell size={20} />
              <span className="ndot" />
            </button>
            <div className="top-avatar">MA</div>
          </div>
        </header>
        <div className="content">
          <div className="page" key={active}>
            <div className="page-head">
              <div>
                <h1 className="page-title">{title}</h1>
                <div className="page-sub">{sub}</div>
              </div>
              <div className="head-actions">{headAction[active]}</div>
            </div>
            {sections[active]}
          </div>
        </div>
      </div>
    </div>
  );
}
