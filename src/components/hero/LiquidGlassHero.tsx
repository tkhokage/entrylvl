"use client";

import { useState } from "react";
import { ChevronDown, Compass, Menu, X } from "lucide-react";
import { OrbitTitles } from "./OrbitTitles";

const BG_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4";

// Reskinned to Beacon's job hub.
const navLinks: { label: string; active?: boolean; dropdown?: boolean }[] = [
  { label: "Home", active: true },
  { label: "Roles", dropdown: true },
  { label: "How it works" },
  { label: "For startups" },
];

export function LiquidGlassHero({ onStart }: { onStart: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="font-geist relative h-screen w-full overflow-hidden bg-black">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={BG_VIDEO}
        autoPlay
        muted
        loop
        playsInline
      />
      {/* Legibility scrim toward the bottom-left content */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      {/* Orbiting job titles around the orb */}
      <div className="absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-1/2 scale-[0.62] sm:scale-90 lg:scale-100">
        <OrbitTitles />
      </div>

      {/* Navbar */}
      <nav className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8">
        <button onClick={onStart} className="flex items-center gap-2 text-base font-medium text-white">
          <Compass size={22} strokeWidth={1.5} />
          <span>Beacon</span>
        </button>

        {/* Center nav pill */}
        <div className="liquid-glass hidden items-center gap-1 rounded-xl px-2 py-2 md:flex">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={onStart}
              className={`flex items-center gap-0.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                l.active ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
              }`}
            >
              {l.label}
              {l.dropdown && <ChevronDown size={13} className="mt-px" />}
            </button>
          ))}
        </div>

        {/* Right CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <button onClick={onStart} className="liquid-glass rounded-full px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5">
            Log in
          </button>
          <button onClick={onStart} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90">
            Import résumé
          </button>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMenuOpen((o) => !o)} className="liquid-glass rounded-lg p-2 text-white md:hidden" aria-label="Menu">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="liquid-glass absolute left-4 right-4 top-[72px] z-30 flex flex-col gap-1 rounded-2xl p-4 md:hidden">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => { setMenuOpen(false); onStart(); }}
              className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm text-white"
            >
              {l.label}
              {l.dropdown && <ChevronDown size={14} />}
            </button>
          ))}
          <div className="mt-2 flex gap-2 border-t border-white/10 pt-3">
            <button onClick={() => { setMenuOpen(false); onStart(); }} className="liquid-glass flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-white">
              Log in
            </button>
            <button onClick={() => { setMenuOpen(false); onStart(); }} className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black">
              Import résumé
            </button>
          </div>
        </div>
      )}

      {/* Hero content (bottom-left) */}
      <div className="absolute bottom-0 left-0 z-20 max-w-2xl px-6 pb-10 sm:px-12 sm:pb-16">
        <h1 className="mb-4 text-4xl font-medium leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Find the startup role that fits you.
        </h1>
        <p className="mb-7 max-w-md text-sm leading-relaxed text-white/60">
          Import your résumé and Beacon points you to entry-level startup roles
          that actually match — ranked by fit, with the reason each one lines up
          and everything you need to apply.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onStart} className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90 sm:px-7 sm:text-base">
            Import your résumé
          </button>
          <button onClick={onStart} className="liquid-glass rounded-full px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5 sm:px-7 sm:text-base">
            See how it works
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiquidGlassHero;
