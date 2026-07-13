"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4";
const SENSITIVITY = 0.8;
const EMAIL = "hello@beacon.jobs";

/** Reveals `text` one character at a time after `startDelay`. */
function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Respect reduced motion: show it all at once.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed("");
    setDone(false);
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function MainframeHero({ onStart }: { onStart: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTime = useRef(0);
  const seeking = useRef(false);
  const prevX = useRef<number | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const { displayed, done } = useTypewriter(
    "Glad you stopped in. Good taste tends to find us. Now — what are we building for your career?"
  );

  // Pills fade in 400ms after mount, independent of the typewriter.
  useEffect(() => {
    const t = setTimeout(() => setPillsVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Mouse-scrub the background video (no autoplay).
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const v = videoRef.current;
      if (!v || !v.duration || Number.isNaN(v.duration)) return;
      if (prevX.current === null) {
        prevX.current = e.clientX;
        return;
      }
      const delta = e.clientX - prevX.current;
      prevX.current = e.clientX;
      let t = targetTime.current + (delta / window.innerWidth) * SENSITIVITY * v.duration;
      t = Math.max(0, Math.min(v.duration, t));
      targetTime.current = t;
      if (!seeking.current) {
        seeking.current = true;
        v.currentTime = t;
      }
    };
    const v = videoRef.current;
    const onSeeked = () => {
      if (!v) return;
      if (Math.abs(v.currentTime - targetTime.current) > 0.01) {
        v.currentTime = targetTime.current; // queue the next seek
      } else {
        seeking.current = false;
      }
    };
    window.addEventListener("mousemove", onMove);
    v?.addEventListener("seeked", onSeeked);
    return () => {
      window.removeEventListener("mousemove", onMove);
      v?.removeEventListener("seeked", onSeeked);
    };
  }, []);

  const navLinks = ["Roles", "How it works", "For startups", "New grads"];

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      {/* Background video (mouse-scrubbed) */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 z-0 h-full w-full object-cover"
        style={{ objectPosition: "70% center" }}
      />

      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <button
          onClick={onStart}
          className="flex items-center gap-3"
          aria-label="Beacon home"
        >
          <span
            className="text-[21px] tracking-tight text-black sm:text-[26px]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Beacon(R)
          </span>
          <span
            className="select-none text-[25px] text-black sm:text-[30px]"
            style={{ letterSpacing: "-0.02em" }}
          >
            ✳︎
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden items-center text-[23px] text-black md:flex">
          {navLinks.map((l, i) => (
            <span key={l}>
              <button onClick={onStart} className="transition-opacity hover:opacity-60">
                {l}
              </button>
              {i < navLinks.length - 1 && <span>,&nbsp;</span>}
            </span>
          ))}
        </div>

        {/* Desktop CTA */}
        <button
          onClick={onStart}
          className="hidden text-[23px] text-black underline underline-offset-2 transition-opacity hover:opacity-60 md:block"
        >
          Import your résumé
        </button>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex flex-col gap-[5px] md:hidden"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span className={`h-[2px] w-6 bg-black transition-all duration-300 ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-[2px] w-6 bg-black transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`h-[2px] w-6 bg-black transition-all duration-300 ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[9] flex flex-col justify-center gap-8 bg-white/95 px-8 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {navLinks.map((l) => (
          <button
            key={l}
            onClick={() => {
              setMenuOpen(false);
              onStart();
            }}
            className="text-left text-[32px] font-medium text-black"
          >
            {l}
          </button>
        ))}
        <button
          onClick={() => {
            setMenuOpen(false);
            onStart();
          }}
          className="text-left text-[32px] font-medium text-black underline underline-offset-2"
        >
          Import your résumé
        </button>
      </div>

      {/* Hero content */}
      <section className="relative z-[1] flex h-screen flex-col justify-end overflow-hidden px-5 pb-12 sm:px-8 md:justify-center md:px-10 md:pb-0">
        <div className="relative z-10 max-w-xl">
          {/* Blurred intro label */}
          <div
            className="mb-5 select-none sm:mb-6"
            style={{
              pointerEvents: "none",
              fontSize: "clamp(18px, 4vw, 26px)",
              lineHeight: 1.3,
              fontWeight: 400,
              color: "#000",
              filter: "blur(4px)",
            }}
          >
            Hey there, I&apos;m Beacon,
            <br />
            your early-career job-matching guide
          </div>

          {/* Typewriter */}
          <p
            className="mb-5 text-black sm:mb-6"
            style={{
              fontSize: "clamp(18px, 4vw, 26px)",
              lineHeight: 1.35,
              fontWeight: 400,
              minHeight: 54,
            }}
          >
            {displayed}
            {!done && (
              <span
                className="ml-[2px] inline-block h-[1.1em] w-[2px] bg-black align-middle"
                style={{ animation: "blink 1s step-end infinite" }}
              />
            )}
          </p>

          {/* Action pills */}
          <div
            className="flex flex-wrap gap-y-1"
            style={{
              opacity: pillsVisible ? 1 : 0,
              transform: pillsVisible ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            {["Import your résumé", "Browse open roles", "See how it works", "For new grads"].map(
              (label) => (
                <button
                  key={label}
                  onClick={onStart}
                  className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 py-[0.3em] text-[13px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:px-5 sm:text-[15px]"
                >
                  {label}
                </button>
              )
            )}
            {/* Outline pill: copy email */}
            <button
              onClick={copyEmail}
              className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white bg-transparent px-4 py-[0.3em] text-[13px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:gap-3 sm:px-5 sm:text-[15px]"
            >
              <span>
                Reach us: <span className="underline underline-offset-1">{EMAIL}</span>
              </span>
              {copied ? <span className="text-[11px]">copied</span> : <CopyIcon />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MainframeHero;
