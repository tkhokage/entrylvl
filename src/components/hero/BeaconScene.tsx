"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/** Roles shown orbiting the beacon before a resume is imported. */
const DEFAULT_ROLES: { role: string; company: string }[] = [
  { role: "Junior Frontend Engineer", company: "seed-stage startup" },
  { role: "Associate Product Manager", company: "Series A fintech" },
  { role: "Junior SOC Analyst", company: "security startup" },
  { role: "Data Analyst", company: "growth-stage SaaS" },
  { role: "UX Designer", company: "consumer app" },
  { role: "Junior Backend Engineer", company: "dev-tools startup" },
  { role: "GRC Analyst", company: "compliance scale-up" },
];

export interface HeroRole {
  role: string;
  company: string;
}

// --- Texture helpers ---------------------------------------------------------

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw a frosted job card onto a canvas texture. */
function makeCardTexture(role: string, company: string): THREE.CanvasTexture {
  const w = 560;
  const h = 260;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // Frosted panel
  roundRect(ctx, 10, 10, w - 20, h - 20, 34);
  ctx.fillStyle = "rgba(250,246,239,0.9)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(227,215,195,0.95)";
  ctx.stroke();

  // Logo placeholder
  ctx.beginPath();
  ctx.arc(66, 74, 26, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(201,148,80,0.22)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(66, 74, 9, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(201,148,80,0.9)";
  ctx.fill();

  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  // Role title (wrap to two lines if needed)
  ctx.fillStyle = "#2C2822";
  ctx.font = `600 36px ${font}`;
  const words = role.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > w - 130 && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  lines.push(line);
  const startY = lines.length > 1 ? 128 : 150;
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 116, startY + i * 44));

  // Company
  ctx.fillStyle = "#7A7060";
  ctx.font = `400 27px ${font}`;
  ctx.fillText(company, 116, startY + Math.min(lines.length, 2) * 44 + 20);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Soft radial-gradient sprite texture for the beacon glow. */
function makeGlowTexture(): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(232,200,146,0.95)");
  g.addColorStop(0.25, "rgba(201,148,80,0.55)");
  g.addColorStop(0.55, "rgba(201,148,80,0.16)");
  g.addColorStop(1, "rgba(201,148,80,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

// --- Scene components --------------------------------------------------------

function Beacon({ reduced }: { reduced: boolean }) {
  const glow = useMemo(makeGlowTexture, []);
  const glowRef = useRef<THREE.Sprite>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin((t / 4) * Math.PI * 2); // 4s cycle
    if (glowRef.current) {
      const sc = 3.1 + pulse * 0.35;
      glowRef.current.scale.set(sc, sc, 1);
      (glowRef.current.material as THREE.SpriteMaterial).opacity = 0.55 + pulse * 0.3;
    }
    if (haloRef.current) {
      const sc = 5.6 + pulse * 0.6;
      haloRef.current.scale.set(sc, sc, 1);
    }
    if (coreRef.current) {
      const sc = 0.96 + pulse * 0.09;
      coreRef.current.scale.set(sc, sc, sc);
    }
  });

  return (
    <group>
      <sprite ref={haloRef} scale={[5.6, 5.6, 1]}>
        <spriteMaterial
          map={glow}
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <sprite ref={glowRef} scale={[3.1, 3.1, 1]}>
        <spriteMaterial
          map={glow}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshStandardMaterial
          color={"#E8C892"}
          emissive={"#C99450"}
          emissiveIntensity={1.5}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={6} distance={12} color={"#E8C892"} />
    </group>
  );
}

function OrbitCard({
  role,
  company,
  phase,
  ringRef,
}: {
  role: string;
  company: string;
  phase: number;
  ringRef: React.MutableRefObject<{ speed: number; angle: number }>;
}) {
  const tex = useMemo(() => makeCardTexture(role, company), [role, company]);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const a = 4.1; // ellipse x radius
  const b = 1.55; // ellipse z radius (depth)

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const angle = ringRef.current.angle + phase;
    const x = a * Math.cos(angle);
    const z = b * Math.sin(angle);
    const y = 0.18 * Math.sin(angle * 1.5); // gentle vertical drift
    g.position.set(x, y, z);
    // Depth-of-field fake: cards toward the camera (z>0) sharpen + lift;
    // cards behind the beacon (z<0) dim + shrink.
    const depth = (z + b) / (2 * b); // 0 = far, 1 = near
    const scale = 0.62 + depth * 0.5;
    g.scale.setScalar(scale);
    if (matRef.current) matRef.current.opacity = 0.28 + depth * 0.72;
  });

  return (
    <group ref={groupRef}>
      <Billboard>
        <mesh>
          <planeGeometry args={[2.15, 1.0]} />
          <meshBasicMaterial
            ref={matRef}
            map={tex}
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

function Ring({ roles, reduced }: { roles: HeroRole[]; reduced: boolean }) {
  const ringRef = useRef({ speed: 1, angle: 0 });
  const { pointer } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // Slow constant rotation (~36s per loop); slows toward 25% while hovered
    // (hover handled by parent via ringRef.speed).
    if (!reduced) {
      ringRef.current.angle += delta * 0.17 * ringRef.current.speed;
    }
    // Pointer parallax: tilt the ring a few degrees toward the cursor.
    const g = groupRef.current;
    if (g) {
      const tx = reduced ? 0 : pointer.y * 0.18;
      const ty = reduced ? 0 : pointer.x * 0.22;
      g.rotation.x += (tx - g.rotation.x) * 0.05;
      g.rotation.y += (ty - g.rotation.y) * 0.05;
    }
  });

  // Expose ring for hover slow-down via a DOM event on the canvas parent.
  useEffect(() => {
    const el = document.getElementById("beacon-canvas-wrap");
    if (!el) return;
    const enter = () => (ringRef.current.speed = 0.25);
    const leave = () => (ringRef.current.speed = 1);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <group ref={groupRef} rotation={[0.32, 0, 0]}>
      {roles.map((r, i) => (
        <OrbitCard
          key={`${r.role}-${i}`}
          role={r.role}
          company={r.company}
          phase={(i / roles.length) * Math.PI * 2}
          ringRef={ringRef}
        />
      ))}
    </group>
  );
}

export function BeaconScene({ roles }: { roles?: HeroRole[] }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  const data = roles && roles.length ? roles : DEFAULT_ROLES;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 7], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <Beacon reduced={reduced} />
      <Ring roles={data} reduced={reduced} />
    </Canvas>
  );
}

export default BeaconScene;
