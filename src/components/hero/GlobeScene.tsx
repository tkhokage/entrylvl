"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/** Job titles wrapped around the globe (roles only — no clutter). */
const TITLES = [
  "Junior Frontend Engineer", "SOC Analyst", "Associate PM", "UX Designer",
  "Data Analyst", "DevOps Engineer", "Scrum Master", "GRC Analyst",
  "Junior Backend Engineer", "QA Engineer", "Product Analyst", "ML Engineer",
  "Security Analyst", "Business Analyst", "Solutions Engineer", "Growth Analyst",
  "Support Engineer", "Junior Designer", "Data Engineer", "Sales Engineer",
  "IT Analyst", "Cloud Engineer", "Research Analyst", "Associate Recruiter",
  "Marketing Analyst", "Finance Analyst", "Operations Associate", "Site Reliability",
];

function makeLabelTexture(text: string): { tex: THREE.CanvasTexture; aspect: number } {
  const pad = 24;
  const fs = 44;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  const font = `600 ${fs}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = fs + pad;
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.font = font;
  g.textBaseline = "middle";
  g.fillStyle = "#2C2822";
  g.fillText(text, pad, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return { tex, aspect: w / h };
}

function fibonacciSphere(n: number, radius: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    );
  }
  return pts;
}

function Label({ text, pos }: { text: string; pos: THREE.Vector3 }) {
  const { tex, aspect } = useMemo(() => makeLabelTexture(text), [text]);
  const ref = useRef<THREE.Sprite>(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  const height = 0.34;

  useFrame(() => {
    const s = ref.current;
    if (!s) return;
    s.getWorldPosition(world);
    // Front (z>0) sharp + dark; back (z<0) fades toward the horizon.
    const depth = (world.z / 2.2 + 1) / 2; // ~0 back, ~1 front
    const mat = s.material as THREE.SpriteMaterial;
    mat.opacity = Math.max(0.05, Math.pow(depth, 1.6));
  });

  return (
    <sprite ref={ref} position={pos} scale={[height * aspect, height, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} opacity={0.8} />
    </sprite>
  );
}

function Globe({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const radius = 2.2;
  const points = useMemo(() => fibonacciSphere(TITLES.length, radius), []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (!reduced) g.rotation.y += delta * ((Math.PI * 2) / 50); // ~50s/loop
    // Parallax tilt toward cursor.
    const tx = reduced ? 0.18 : 0.18 + pointer.y * 0.12;
    const tz = reduced ? 0 : pointer.x * 0.12;
    g.rotation.x += (tx - g.rotation.x) * 0.05;
    g.rotation.z += (tz - g.rotation.z) * 0.05;
  });

  const wire = useMemo(() => new THREE.IcosahedronGeometry(radius * 0.99, 2), [radius]);

  return (
    <group ref={groupRef} rotation={[0.18, 0, 0]}>
      {/* Soft globe body + faint wireframe for roundness */}
      <mesh>
        <sphereGeometry args={[radius * 0.98, 48, 48]} />
        <meshBasicMaterial color={"#F1E9DB"} transparent opacity={0.35} />
      </mesh>
      <lineSegments>
        <wireframeGeometry args={[wire]} />
        <lineBasicMaterial color={"#C99450"} transparent opacity={0.18} />
      </lineSegments>
      {TITLES.map((t, i) => (
        <Label key={t} text={t} pos={points[i]} />
      ))}
    </group>
  );
}

export function GlobeScene() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.9} />
      <Globe reduced={reduced} />
    </Canvas>
  );
}

export default GlobeScene;
