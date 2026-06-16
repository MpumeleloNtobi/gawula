"use client";
import { useEffect, useState } from "react";
import { LuStar as Star, LuReply as Reply, LuSend as Send, LuX as X } from "react-icons/lu";
import { StarRow } from "../_ue/Stat";
import { useAuth } from "@/lib/auth-store";
import { storeApi } from "@/lib/store";

function formatTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

const COLORS = ["#f0441a", "#246bff", "#f3a52a", "#9c27b0", "#15803d", "#0d0d0d"];

export default function ReviewsPage() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const [data, setData] = useState({
    summary: { total: 0, average: null, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const d = await storeApi.reviews(token);
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated || !token) return;
    load();
  }, [hydrated, token]);

  const submitReply = async (id) => {
    if (!token || !replyText.trim()) return;
    setBusy(true);
    try {
      await storeApi.replyReview(token, id, replyText.trim());
      setReplyOpen(null);
      setReplyText("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setBusy(false);
    }
  };

  const total = data.summary.total;
  const average = data.summary.average;
  const breakdown = [5, 4, 3, 2, 1].map((s) => ({ s, c: data.summary.distribution[String(s)] ?? 0 }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reviews</h1>
        </div>
      </div>
      {error && (
        <div role="alert" aria-live="polite" className="card" style={{ padding: 18, color: "var(--red)", marginBottom: 14 }}>
          {error}
        </div>
      )}
      <div className="grid rev-top stagger" style={{ marginBottom: 18 }}>
        <div className="card rev-score">
          <div className="rev-big">{average != null ? average.toFixed(1) : "—"}</div>
          <div className="stars">
            <StarRow n={Math.round(average ?? 0)} size={18} />
          </div>
          <div className="muted fw7" style={{ fontSize: 13 }}>
            {total.toLocaleString()} ratings
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {breakdown.map((b) => (
            <div className="bar-row" key={b.s}>
              <span className="n">{b.s}</span>
              <Star size={12} color="#f0441a" fill="#f0441a" />
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: total > 0 ? (b.c / total) * 100 + "%" : "0%" }}
                />
              </div>
              <span className="pc">{b.c}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card stagger">
        <div className="sec-title" style={{ padding: "18px 22px 4px" }}>
          Recent reviews
        </div>
        {loading && data.reviews.length === 0 ? (
          <div style={{ padding: 18 }} className="muted">Loading…</div>
        ) : data.reviews.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No reviews yet</div>
        ) : (
          data.reviews.map((r, i) => {
            const initial = (r.customerName ?? "?").trim().charAt(0).toUpperCase();
            const color = COLORS[i % COLORS.length];
            return (
              <div className="review" key={r.id}>
                <div className="rev-h">
                  <div className="av" style={{ background: color, color: "#fff" }}>
                    {initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="nm">{r.customerName ?? "Anonymous"}</div>
                    <div className="mt">{formatTime(r.createdAt)}</div>
                  </div>
                  <StarRow n={r.rating} />
                </div>
                <div className="rev-body">{r.text}</div>
                {r.reply && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      background: "var(--surface-soft, #f7f7f7)",
                      borderRadius: 10,
                      fontSize: 13,
                    }}
                  >
                    <div className="muted fw7" style={{ marginBottom: 4, fontSize: 12 }}>
                      Your reply · {formatTime(r.reply.createdAt)}
                    </div>
                    {r.reply.text}
                  </div>
                )}
                {replyOpen === r.id ? (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Write a thoughtful reply…"
                      style={{
                        width: "100%",
                        resize: "none",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        padding: 10,
                        fontSize: 13.5,
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setReplyOpen(null);
                          setReplyText("");
                        }}
                        disabled={busy}
                      >
                        <X size={14} /> Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => submitReply(r.id)}
                        disabled={busy || !replyText.trim()}
                      >
                        <Send size={14} /> {r.reply ? "Update reply" : "Send reply"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      marginTop: 10,
                    }}
                  >
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setReplyOpen(r.id);
                        setReplyText(r.reply?.text ?? "");
                      }}
                    >
                      <Reply size={14} />
                      {r.reply ? "Edit reply" : "Reply"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
