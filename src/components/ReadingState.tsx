"use client";

import { useEffect, useState } from "react";
import type { ResumeProfile } from "@/lib/types";

/**
 * Calm "the beacon is reading your resume" moment. Shows a breathing beacon
 * while parsing; once the profile arrives, fades in the detected skills/roles
 * as chips (building trust), then calls onDone.
 */
export function ReadingState({
  profile,
  onDone,
}: {
  profile: ResumeProfile | null;
  onDone: () => void;
}) {
  const [chips, setChips] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    const detected = [
      ...profile.topSkills.slice(0, 6),
      ...profile.targetRoles.slice(0, 2),
    ];
    // Reveal chips one by one, then hand off.
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const reveal = () => {
      i += 1;
      setChips(detected.slice(0, i));
      if (i < detected.length) timers.push(setTimeout(reveal, 180));
      else timers.push(setTimeout(onDone, 1100));
    };
    timers.push(setTimeout(reveal, 350));
    return () => timers.forEach(clearTimeout);
  }, [profile, onDone]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      {/* Breathing beacon */}
      <div className="relative mb-10 h-40 w-40">
        <div className="absolute inset-0 animate-breathe rounded-full bg-amber/35 blur-2xl motion-reduce:animate-none" />
        <div className="absolute inset-6 animate-breathe rounded-full bg-amber/40 blur-xl [animation-delay:200ms] motion-reduce:animate-none" />
        <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-soft shadow-glow" />
      </div>

      <p className="font-display text-xl font-semibold tracking-tight text-charcoal">
        {profile ? "Here's what we found" : "Reading your resume…"}
      </p>
      <p className="mt-1.5 text-[15px] text-taupe">
        {profile
          ? "Lighting up the roles that fit."
          : "The beacon is taking in your skills and experience."}
      </p>

      {chips.length > 0 && (
        <div className="mt-6 flex max-w-lg flex-wrap justify-center gap-2">
          {chips.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="chip-amber animate-chip-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
