"use client";
import { useEffect, useRef, useState } from "react";
import { LuChevronDown as ChevronDown } from "react-icons/lu";

const norm = (opt) =>
  typeof opt === "string" ? { label: opt, value: opt } : opt;

export function Daterange({ options, value, onChange, initial }) {
  const opts = options.map(norm);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(
    initial ?? opts[0]?.value,
  );
  const current = controlled ? value : internal;
  const currentOpt = opts.find((o) => o.value === current) ?? opts[0];
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const pick = (v) => {
    if (!controlled) setInternal(v);
    onChange?.(v);
    setOpen(false);
  };
  return (
    <div className="daterange-wrap" ref={ref}>
      <button
        type="button"
        className="daterange"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentOpt?.label} <ChevronDown size={15} />
      </button>
      {open && (
        <ul className="csel-menu daterange-menu" role="listbox">
          {opts.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === current}
              className={`csel-option ${opt.value === current ? "active" : ""}`}
              onClick={() => pick(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
