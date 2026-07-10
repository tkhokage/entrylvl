"use client";

import type { ResumeProfile } from "@/lib/types";
import { CopyButton } from "./CopyField";

export function ProfileBar({
  profile,
  onReset,
}: {
  profile: ResumeProfile;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {profile.name || "Your profile"}
            </h2>
            <span className="chip">
              {profile.yearsOfExperience === 0
                ? "New grad / 0 yrs"
                : `${profile.yearsOfExperience} yr${profile.yearsOfExperience > 1 ? "s" : ""} exp`}
            </span>
            {profile.parsedWith === "heuristic" && (
              <span
                className="chip bg-amber-50 text-amber-700"
                title="Parsed without the Claude API — add ANTHROPIC_API_KEY for higher-quality parsing."
              >
                basic parse
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {[profile.email, profile.location].filter(Boolean).join(" · ") ||
              "Contact details will paste into applications for you."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton
            text={JSON.stringify(profile, null, 2)}
            label="Copy profile for extension"
          />
          <button className="btn-ghost" onClick={onReset}>
            Upload a different resume
          </button>
        </div>
      </div>

      {profile.targetRoles.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Target roles
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {profile.targetRoles.map((r) => (
              <span
                key={r}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.topSkills.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Skills
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {profile.topSkills.slice(0, 14).map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
