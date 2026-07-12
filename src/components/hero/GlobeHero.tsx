"use client";

import dynamic from "next/dynamic";

// WebGL globe is client-only and code-split so it never blocks paint.
const GlobeScene = dynamic(() => import("./GlobeScene"), {
  ssr: false,
  loading: () => <GlobeFallback />,
});

function GlobeFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-56 w-56 rounded-full border border-amber/30 bg-sand/50 blur-[1px]" />
    </div>
  );
}

export function GlobeHero() {
  return (
    <div className="relative h-[360px] w-full sm:h-[460px]" aria-hidden="true">
      <GlobeScene />
    </div>
  );
}

export default GlobeHero;
