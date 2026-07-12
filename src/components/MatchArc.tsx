"use client";

import { useEffect, useState } from "react";

/** Thin amber ring that animates from 0 to `value` (0–100) on mount. */
export function MatchArc({
  value,
  size = 56,
  stroke = 5,
  showLabel = true,
}: {
  value: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
}) {
  const [shown, setShown] = useState(0);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      title={`Match strength: ${pct}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E3D7C3"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#C99450"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (shown / 100) * circ}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-semibold text-charcoal">{pct}</span>
        </div>
      )}
    </div>
  );
}
