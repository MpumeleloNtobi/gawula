"use client";
import { LuStar as Star, LuStar as StarOutline } from "react-icons/lu";

export function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export const StarRow = ({ n, size = 14 }) => (
  <span style={{ display: "inline-flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= n
        ? <Star key={i} size={size} color="#f0441a" fill="#f0441a" />
        : <StarOutline key={i} size={size} color="#d8d8d8" />
    )}
  </span>
);
