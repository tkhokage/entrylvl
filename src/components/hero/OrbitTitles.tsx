"use client";

import { useEffect, useRef } from "react";

const TITLES = [
  "Junior Frontend Engineer", "SOC Analyst", "Associate PM", "Data Analyst",
  "UX Designer", "DevOps Engineer", "Scrum Master", "GRC Analyst",
  "QA Engineer", "Product Analyst", "Cloud Engineer", "Business Analyst",
  "Security Analyst", "Data Engineer",
];

// Slanted orbit geometry (in px, within the fixed design box).
const RX = 235; // horizontal radius
const RY = 92; // vertical radius (flatter -> reads as a tilted ring)
const TILT = (-16 * Math.PI) / 180; // slant of the whole ring
const SPEED = 0.22; // rad/s (~28s per loop)

/**
 * Job titles orbiting a central glowing orb on a slanted, tilted ring.
 * Titles nearest the front sharpen and lift; those swinging behind dim, shrink,
 * and blur, so the ring reads as a 3D orbit. RAF-driven (no per-frame React
 * renders); frozen for prefers-reduced-motion.
 */
export function OrbitTitles() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cos = Math.cos(TILT);
    const sin = Math.sin(TILT);
    const N = TITLES.length;
    let t = 0;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!reduce) t += dt * SPEED;
      for (let i = 0; i < N; i++) {
        const el = refs.current[i];
        if (!el) continue;
        const a = (i / N) * Math.PI * 2 + t;
        const lx = Math.cos(a) * RX;
        const ly = Math.sin(a) * RY;
        const x = lx * cos - ly * sin;
        const y = lx * sin + ly * cos;
        const k = (Math.sin(a) + 1) / 2; // 0 back, 1 front
        const scale = 0.7 + 0.3 * k;
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
        el.style.opacity = String(0.16 + 0.84 * k);
        el.style.zIndex = String(Math.round(k * 100));
        el.style.filter = k < 0.5 ? `blur(${(0.5 - k) * 2.4}px)` : "none";
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none relative h-[520px] w-[520px] max-w-full">
      {/* Central orb */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="liquid-glass grid h-28 w-28 place-items-center rounded-full">
          <div className="h-10 w-10 rounded-full bg-white/70 blur-[2px]" />
        </div>
      </div>

      {/* Orbiting titles */}
      {TITLES.map((title, i) => (
        <div
          key={title}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute left-1/2 top-1/2 whitespace-nowrap text-[13px] font-medium text-white will-change-transform sm:text-sm"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}
        >
          {title}
        </div>
      ))}
    </div>
  );
}
