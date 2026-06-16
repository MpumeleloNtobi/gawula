"use client";
import { useEffect, useRef, useState } from "react";
import { LuChevronDown as ChevronDown } from "react-icons/lu";

export function CustomSelect({ value, options, onChange, placeholder }) {
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
  return (
    <div className={`csel ${open ? "open" : ""}`} ref={ref}>
      <button
        type="button"
        className="csel-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? "" : "csel-placeholder"}>
          {value || placeholder || "Select"}
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <ul className="csel-menu" role="listbox">
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`csel-option ${opt === value ? "active" : ""}`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
