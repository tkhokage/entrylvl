"use client";

import type { ResumeProfile } from "@/lib/types";
import { CopyButton } from "./CopyField";

export function ProfileSummary({
  profile,
  onReset,
}: {
  profile: ResumeProfile;
  onReset: () => void;
}) {
  const exp =
    profile.yearsOfExperience === 0
      ? "New grad · 0 yrs"
      : `${profile.yearsOfExperience} yr${profile.yearsOfExperience > 1 ? "s" : ""} experience`;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold tracking-tight text-charcoal">
              {profile.name || "Your profile"}
            </h2>
            <span className="chip-amber">{exp}</span>
            {profile.parsedWith === "heuristic" && (
              <span
                className="chip"
                title="Parsed without the Claude API — add ANTHROPIC_API_KEY for higher-quality parsing."
              >
                basic parse
              </span>
            )}
          </div>
          <p className="mt-1 text-[15px] text-taupe">
            {[profile.email, profile.location].filter(Boolean).join(" · ") ||
              "Your details are ready to paste into applications."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton
            text={JSON.stringify(profile, null, 2)}
            label="Copy profile for extension"
          />
          <button className="btn-ghost text-[13px]" onClick={onReset}>
            New resume
          </button>
        </div>
      </div>

      {profile.targetRoles.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-taupe">
            Target roles
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.targetRoles.map((r) => (
              <span key={r} className="chip">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.topSkills.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-taupe">
            Skills
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.topSkills.slice(0, 14).map((s) => (
              <span key={s} className="chip-amber">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
