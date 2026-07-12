"use client";

import dynamic from "next/dynamic";
import type { HeroRole } from "./BeaconScene";

// WebGL scene is client-only (no SSR) and code-split so it never blocks paint.
const BeaconScene = dynamic(() => import("./BeaconScene"), {
  ssr: false,
  loading: () => <StaticBeacon />,
});

/** Still fallback: a soft glowing beacon (also the reduced-motion baseline). */
function StaticBeacon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-40 w-40 animate-breathe rounded-full bg-amber/40 blur-2xl motion-reduce:animate-none" />
      <div className="absolute h-16 w-16 rounded-full bg-amber-soft shadow-glow" />
    </div>
  );
}

export function BeaconHero({ roles }: { roles?: HeroRole[] }) {
  return (
    <div
      id="beacon-canvas-wrap"
      className="relative h-[440px] w-full sm:h-[520px]"
      aria-hidden="true"
    >
      <BeaconScene roles={roles} />
    </div>
  );
}

export default BeaconHero;
