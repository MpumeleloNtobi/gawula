"use client";
import { useEffect, useMemo, useState } from "react";
import { EditHoursModal } from "../_ue/EditHoursModal";
import { useAuth } from "@/lib/auth-store";
import { storeApi } from "@/lib/store";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

function time12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${period}`;
}

function hoursLabel(window) {
  if (!window || window.closed) return "Closed";
  return `${time12(window.open)} – ${time12(window.close)}`;
}

const TOGGLE_FIELDS = [
  { key: "autoAcceptOrders", t: "Auto-accept orders", d: "New orders are accepted automatically" },
  { key: "pauseNewOrders", t: "Pause new orders", d: "Temporarily stop receiving orders" },
  { key: "showPrepTime", t: "Show estimated prep time", d: "Display ETA to customers at checkout" },
  { key: "allowTipping", t: "Allow tipping", d: "Let customers add a tip to their order" },
];

export default function SettingsPage() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingToggle, setSavingToggle] = useState(null);
  const [editDay, setEditDay] = useState(null);
  const [details, setDetails] = useState({ name: "", phone: "", email: "", addressLine: "" });
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await storeApi.settings(token);
        if (cancelled) return;
        setSettings(s);
        setDetails({
          name: s.name ?? "",
          phone: s.phone ?? "",
          email: s.email ?? "",
          addressLine: s.addressLine ?? "",
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token]);

  const days = useMemo(
    () => (settings ? DAYS.map((d) => ({ ...d, window: settings.hours[d.key] })) : []),
    [settings],
  );

  const toggle = async (key) => {
    if (!token || !settings) return;
    const next = !settings[key];
    setSavingToggle(key);
    try {
      const updated = await storeApi.updateSettings(token, { [key]: next });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingToggle(null);
    }
  };

  const saveHours = async (dayKey, next) => {
    if (!token || !settings) return;
    const newHours = { ...settings.hours, [dayKey]: next };
    try {
      const updated = await storeApi.updateSettings(token, { hours: newHours });
      setSettings(updated);
      setEditDay(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save hours");
    }
  };

  const saveDetails = async () => {
    if (!token) return;
    const name = details.name.trim();
    const phone = details.phone.trim();
    const email = details.email.trim();
    const addressLine = details.addressLine.trim();
    if (!name) {
      setDetailsMsg("Store name is required");
      return;
    }
    if (phone && !/^[+\d][\d\s()-]{6,}$/.test(phone)) {
      setDetailsMsg("Enter a valid phone number");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDetailsMsg("Enter a valid email address");
      return;
    }
    setSavingDetails(true);
    setDetailsMsg(null);
    try {
      const updated = await storeApi.updateSettings(token, {
        name,
        phone,
        email: email || undefined,
        addressLine,
      });
      setSettings(updated);
      setDetailsMsg("Saved");
      setTimeout(() => setDetailsMsg(null), 2000);
    } catch (err) {
      setDetailsMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingDetails(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-head">
          <h1 className="page-title">Settings</h1>
        </div>
        <div className="card muted" style={{ padding: 18 }}>
          Loading…
        </div>
      </>
    );
  }
  if (!settings) {
    return (
      <>
        <div className="page-head">
          <h1 className="page-title">Settings</h1>
        </div>
        <div className="card" style={{ padding: 18, color: "var(--red)" }}>{error ?? "Settings unavailable"}</div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
        </div>
      </div>
      {error && (
        <div className="card" style={{ padding: 14, color: "var(--red)", marginBottom: 14 }}>
          {error}
        </div>
      )}
      <div className="grid set-grid stagger">
        <div className="card set-block">
          <h4>Store hours</h4>
          <div className="sd">When customers can place orders</div>
          {days.map((d) => (
            <button
              type="button"
              className={`hour-row hour-row-btn ${d.window?.closed ? "closed" : ""}`}
              key={d.key}
              onClick={() => setEditDay(d)}
            >
              <span className="day">{d.label}</span>
              <span className="tm">{hoursLabel(d.window)}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card set-block">
            <h4>Ordering</h4>
            <div className="sd">Control how orders come in</div>
            {TOGGLE_FIELDS.map((row) => (
              <div className="toggle-row" key={row.key}>
                <div>
                  <div className="t">{row.t}</div>
                  <div className="d">{row.d}</div>
                </div>
                <div
                  className={`mini-switch ${settings[row.key] ? "on" : ""}`}
                  onClick={() => savingToggle === null && toggle(row.key)}
                  style={{ opacity: savingToggle === row.key ? 0.5 : 1 }}
                >
                  <i />
                </div>
              </div>
            ))}
          </div>
          <div className="card set-block">
            <h4>Store details</h4>
            <div className="sd">Public information shown to customers</div>
            <div className="field">
              <label>Store name</label>
              <div className="val">
                <input
                  value={details.name}
                  onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 14 }}
                />
              </div>
            </div>
            <div className="field">
              <label>Address</label>
              <div className="val">
                <input
                  value={details.addressLine}
                  onChange={(e) => setDetails((d) => ({ ...d, addressLine: e.target.value }))}
                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 14 }}
                />
              </div>
            </div>
            <div className="field">
              <label>Phone</label>
              <div className="val">
                <input
                  value={details.phone}
                  onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 14 }}
                />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <div className="val">
                <input
                  type="email"
                  value={details.email}
                  onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 14 }}
                />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <button
                className="btn btn-dark btn-sm"
                onClick={saveDetails}
                disabled={savingDetails}
              >
                {savingDetails ? "Saving…" : "Save changes"}
              </button>
              {detailsMsg && (
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {detailsMsg}
                </span>
              )}
            </div>
          </div>
        </div>
        {editDay && (
          <EditHoursModal
            day={editDay.label}
            initial={{
              open: !editDay.window?.closed,
              start: editDay.window?.open ?? "09:00",
              end: editDay.window?.close ?? "21:00",
            }}
            onSave={(next) =>
              saveHours(editDay.key, {
                open: next.start,
                close: next.end,
                closed: !next.open,
              })
            }
            onClose={() => setEditDay(null)}
          />
        )}
      </div>
    </>
  );
}
