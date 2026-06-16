"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LuX as X } from "react-icons/lu";

export function EditHoursModal({ day, initial, onSave, onClose }) {
  const [open, setOpen] = useState(initial.open);
  const [start, setStart] = useState(initial.start === "24:00" ? "23:59" : initial.start);
  const [end, setEnd] = useState(initial.end === "24:00" ? "23:59" : initial.end);
  const [err, setErr] = useState(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  const submit = (e) => {
    e.preventDefault();
    if (open) {
      const toMin = (t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      if (toMin(end) <= toMin(start)) {
        setErr("Closing time must be after opening time");
        return;
      }
    }
    setErr(null);
    onSave({ open, start, end });
  };
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div className="modal-title">{day} Hours</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="toggle-row" style={{ padding: 0 }}>
            <div>
              <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Open</div>
              <div className="d" style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Customers can place orders during these hours.
              </div>
            </div>
            <div
              className={`mini-switch ${open ? "on" : ""}`}
              onClick={() => setOpen((v) => !v)}
              role="switch"
              aria-checked={open}
            >
              <i />
            </div>
          </div>
          {open && (
            <div className="form-cols">
              <div className="form-row">
                <label>Opens</label>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  step="900"
                />
              </div>
              <div className="form-row">
                <label>Closes</label>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  step="900"
                />
              </div>
            </div>
          )}
          {err && (
            <div role="alert" aria-live="polite" style={{ color: "var(--red)", fontSize: 13, fontWeight: 500 }}>
              {err}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
