import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";
import { sparkle, whoosh } from "@/lib/audio";

type Phase =
  | "idle"
  | "awaken"
  | "bloom"
  | "pulse"
  | "garden"
  | "wizard"
  | "butterflies"
  | "portal"
  | "reveal"
  | "done";

/* ---------- Hero Flower ---------- */

function Petal({ index, total, openness, glow, lit }: {
  index: number; total: number; openness: number; glow: number; lit: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const angle = (index / total) * Math.PI * 2;
  const litThis = Math.max(0, Math.min(1, lit * total - index * 0.6));
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const breath = Math.sin(t * 0.7 + index) * 0.05;
    ref.current.rotation.z = angle;
    ref.current.rotation.x = -Math.PI / 2 + (0.95 - openness * 1.05) + breath;
    const r = 0.38 + openness * 0.6;
    ref.current.position.set(Math.cos(angle) * r, 0.05 + openness * 0.1, Math.sin(angle) * r);
    const s = 0.45 + openness * 0.95;
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.5, 28, 28, 0, Math.PI, 0, Math.PI / 2]} />
      <meshPhysicalMaterial
        color={new THREE.Color("#ffb8d8")}
        emissive={new THREE.Color("#ff7aa8")}
        emissiveIntensity={0.35 + glow * 1.4 + litThis * 1.4}
        roughness={0.22}
        transmission={0.55}
        thickness={0.7}
        clearcoat={1}
        clearcoatRoughness={0.18}
        side={THREE.DoubleSide}
        sheen={1}
        sheenColor={new THREE.Color("#ffd6e8")}
        iridescence={0.5}
      />
    </mesh>
  );
}

function FlowerCore({ glow }: { glow: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.elapsedTime * 0.35;
    const p = 1 + Math.sin(s.clock.elapsedTime * 2.2) * 0.06;
    ref.current.scale.setScalar(0.23 * p);
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 2]} />
      <meshBasicMaterial color={new THREE.Color(1.6 + glow, 1.0 + glow * 0.5, 0.45)} toneMapped={false} />
    </mesh>
  );
}

function HeartSpark({ seed }: { seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = (s.clock.elapsedTime + seed * 2.3) % 6;
    ref.current.position.y = -0.2 + t * 0.5;
    const fade = t < 1 ? t : t > 5 ? 6 - t : 1;
    ref.current.scale.setScalar(0.04 * fade);
    const a = seed * 1.7;
    ref.current.position.x = Math.cos(a) * 0.8 + Math.sin(t) * 0.1;
    ref.current.position.z = Math.sin(a) * 0.8;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={new THREE.Color(2.5, 0.9, 1.2)} toneMapped={false} />
    </mesh>
  );
}

function Flower({ openness, glow, lit, phase, onClick }: {
  openness: number; glow: number; lit: number; phase: Phase; onClick: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!group.current) return;
    const t = s.clock.elapsedTime;
    group.current.rotation.y = t * 0.14;
    group.current.position.y = Math.sin(t * 0.55) * 0.04;
  });
  const interactive = phase === "idle";
  return (
    <group ref={group} onClick={interactive ? onClick : undefined}>
      <Float speed={1.1} rotationIntensity={0.1} floatIntensity={phase === "idle" ? 0.3 : 0.1}>
        <FlowerCore glow={glow} />
        {Array.from({ length: 10 }).map((_, i) => (
          <Petal key={i} index={i} total={10} openness={openness} glow={glow} lit={lit} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <Petal key={`b${i}`} index={i + 0.5} total={8} openness={openness * 0.7} glow={glow * 0.8} lit={lit * 0.7} />
        ))}
        <pointLight position={[0, 0.3, 0]} intensity={2 + glow * 6} distance={6} color="#ffb070" />
      </Float>
      {phase === "idle" && Array.from({ length: 4 }).map((_, i) => <HeartSpark key={i} seed={i} />)}
    </group>
  );
}

/* ---------- Idle Butterflies (DOM, cheap & smooth) ---------- */

function ButterflyOverlay({ count = 6 }: { count?: number }) {
  const butterflies = useMemo(
    () => Array.from({ length: count }, () => ({
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      d: 8 + Math.random() * 8,
      delay: Math.random() * 4,
      hue: 300 + Math.random() * 60,
      size: 18 + Math.random() * 22,
    })),
    [count]
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {butterflies.map((b, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ x: `${b.x}vw`, y: `${b.y}vh`, opacity: 0 }}
          animate={{
            x: [`${b.x}vw`, `${b.x + 14}vw`, `${b.x - 8}vw`, `${b.x}vw`],
            y: [`${b.y}vh`, `${b.y - 10}vh`, `${b.y + 6}vh`, `${b.y}vh`],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{ duration: b.d, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width={b.size} height={b.size * 0.8} viewBox="0 0 40 32">
            <defs>
              <radialGradient id={`bf${i}`}>
                <stop offset="0" stopColor={`hsl(${b.hue},90%,80%)`} />
                <stop offset="1" stopColor={`hsl(${b.hue - 40},80%,55%)`} />
              </radialGradient>
            </defs>
            <motion.g
              animate={{ scaleY: [1, 0.4, 1] }}
              transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "20px 16px" }}
            >
              <ellipse cx="12" cy="14" rx="10" ry="8" fill={`url(#bf${i})`} opacity="0.9" />
              <ellipse cx="28" cy="14" rx="10" ry="8" fill={`url(#bf${i})`} opacity="0.9" />
              <ellipse cx="12" cy="22" rx="6" ry="5" fill={`url(#bf${i})`} opacity="0.7" />
              <ellipse cx="28" cy="22" rx="6" ry="5" fill={`url(#bf${i})`} opacity="0.7" />
              <rect x="19" y="8" width="2" height="18" rx="1" fill="#2a1a3a" />
            </motion.g>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- Phase Camera ---------- */

function CinematicCamera({ phase }: { phase: Phase }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  useEffect(() => {
    if (phase === "awaken") {
      gsap.to(camera.position, { x: 0, y: 0.3, z: 1.8, duration: 2.4, ease: "power2.inOut" });
    } else if (phase === "bloom") {
      gsap.to(camera.position, { x: 0, y: 0.5, z: 1.3, duration: 3.0, ease: "power3.inOut" });
    } else if (phase === "pulse") {
      gsap.to(camera.position, { x: 0, y: 0.7, z: 2.6, duration: 1.4, ease: "power2.out" });
    } else if (phase === "garden") {
      gsap.to(camera.position, { x: 1.2, y: 1.0, z: 3.4, duration: 3.0, ease: "sine.inOut" });
    } else if (phase === "wizard") {
      gsap.to(camera.position, { x: -0.8, y: 1.4, z: 3.0, duration: 3.2, ease: "sine.inOut" });
    } else if (phase === "butterflies") {
      gsap.to(camera.position, { x: 0, y: 0.6, z: 2.4, duration: 2.6, ease: "sine.inOut" });
    } else if (phase === "portal") {
      gsap.to(camera.position, { x: 0, y: 0.4, z: 0.6, duration: 3.0, ease: "power3.in" });
    }
  }, [phase, camera]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (phase === "idle") {
      camera.position.x = Math.sin(t * 0.18) * 0.22;
      camera.position.y = 0.3 + Math.sin(t * 0.12) * 0.08;
      camera.position.z = 2.6;
    }
    camera.lookAt(target.current);
  });
  return null;
}

/* ---------- Lavender sky / mist gradient (DOM) ---------- */

function SkyOverlay({ phase }: { phase: Phase }) {
  const heavy = phase !== "idle";
  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-[2200ms]"
      style={{
        opacity: heavy ? 1 : 0.85,
        background:
          "radial-gradient(ellipse at 50% 20%, oklch(0.42 0.10 310 / 0.55) 0%, oklch(0.18 0.08 320 / 0.6) 35%, oklch(0.08 0.04 290 / 0.95) 100%)",
        zIndex: 1,
      }}
    />
  );
}

/* ---------- Garden growth ring (simple flowers, instanced look) ---------- */

function GardenRing({ progress }: { progress: number }) {
  const items = useMemo(() => Array.from({ length: 90 }, (_, i) => {
    const a = (i / 90) * Math.PI * 2 + Math.random() * 0.3;
    const r = 1.4 + Math.random() * 3.0;
    return {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      h: 0.4 + Math.random() * 0.5,
      hue: ["#ff8fb5", "#c098ff", "#ffd190", "#ffb0c8", "#9ee0ff"][i % 5],
      delay: (r - 1.4) / 3 + Math.random() * 0.2,
    };
  }), []);
  return (
    <group position={[0, -0.7, 0]}>
      {items.map((it, i) => {
        const grow = Math.max(0, Math.min(1, (progress - it.delay) * 1.8));
        if (grow <= 0) return null;
        return (
          <group key={i} position={[it.x, 0, it.z]}>
            <mesh position={[0, (it.h * grow) / 2, 0]}>
              <cylinderGeometry args={[0.015, 0.02, it.h * grow, 5]} />
              <meshStandardMaterial color="#2f5a32" roughness={0.9} />
            </mesh>
            <mesh position={[0, it.h * grow, 0]} scale={grow}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color={it.hue} emissive={it.hue} emissiveIntensity={0.6} roughness={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ---------- Wizard layer (letters, candles, owls) ---------- */

function WizardObjects({ visible }: { visible: number }) {
  const grp = useRef<THREE.Group>(null);
  const letters = useMemo(() => Array.from({ length: 8 }, () => ({
    x: (Math.random() - 0.5) * 8,
    y: 1 + Math.random() * 2.5,
    z: -1 - Math.random() * 3,
    r: Math.random() * Math.PI,
  })), []);
  useFrame((s) => {
    if (!grp.current) return;
    const t = s.clock.elapsedTime;
    grp.current.children.forEach((c, i) => {
      c.position.y += Math.sin(t + i) * 0.0015;
      c.rotation.z = Math.sin(t * 0.6 + i) * 0.2;
    });
    (grp.current as THREE.Group).visible = visible > 0.02;
  });
  return (
    <group ref={grp}>
      {letters.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, l.z]} rotation={[0, 0, l.r]} scale={visible}>
          <planeGeometry args={[0.34, 0.22]} />
          <meshStandardMaterial color="#f4e4c0" emissive="#a07040" emissiveIntensity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={`c${i}`} position={[Math.cos(a) * 2.4, 1.6 + Math.sin(i) * 0.4, Math.sin(a) * 2.4]} scale={visible}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.05, 0.25, 8]} />
              <meshStandardMaterial color="#f4e4c8" />
            </mesh>
            <mesh position={[0, 0.18, 0]}>
              <coneGeometry args={[0.04, 0.1, 6]} />
              <meshBasicMaterial color={new THREE.Color(3, 1.8, 0.6)} toneMapped={false} />
            </mesh>
            <pointLight color="#ffb070" intensity={1.5 * visible} distance={2} />
          </group>
        );
      })}
    </group>
  );
}

/* ---------- Portal ---------- */

function Portal({ visible }: { visible: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.z = t * 0.4;
      ref.current.scale.setScalar(0.001 + visible * 2.4);
    }
    if (inner.current) {
      inner.current.rotation.z = -t * 0.6;
      inner.current.scale.setScalar(0.001 + visible * 1.6);
      (inner.current.material as THREE.MeshBasicMaterial).opacity = visible * 0.95;
    }
  });
  return (
    <group position={[0, 0.4, -0.4]}>
      <mesh ref={ref}>
        <torusGeometry args={[0.55, 0.04, 16, 80]} />
        <meshBasicMaterial color={new THREE.Color(2.4, 1.6, 3.6)} toneMapped={false} />
      </mesh>
      <mesh ref={inner}>
        <circleGeometry args={[0.55, 64]} />
        <meshBasicMaterial color={new THREE.Color(2, 1.4, 3)} toneMapped={false} transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight intensity={visible * 6} color="#c8a8ff" distance={5} />
    </group>
  );
}

/* ---------- Scene root ---------- */

export function FlowerScene({ onEnter }: { onEnter: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [openness, setOpenness] = useState(0.18);
  const [glow, setGlow] = useState(0.1);
  const [lit, setLit] = useState(0);
  const [garden, setGarden] = useState(0);
  const [wizard, setWizard] = useState(0);
  const [portal, setPortal] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [revealText, setRevealText] = useState<string>("");
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Hard-kill any leftover timeline on unmount so it can't keep ticking
  // and mutating state after we leave the scene.
  useEffect(() => {
    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, []);

  const handleClick = () => {
    if (phase !== "idle") return;
    sparkle(1.2);
    whoosh();
    setPhase("awaken");

    const o = { openness, glow, lit, garden, wizard, portal, pulse };
    const tl = gsap.timeline();
    tlRef.current = tl;

    // Phase 1 — Awakening (3.5s) energy flows, petals light one by one
    tl.to(o, {
      glow: 0.4, lit: 1, duration: 3.5, ease: "power2.inOut",
      onUpdate: () => { setGlow(o.glow); setLit(o.lit); },
    });

    // Phase 2 — Bloom (3s) dramatic opening
    tl.call(() => { setPhase("bloom"); sparkle(0.8); });
    tl.to(o, {
      openness: 1.15, glow: 1, duration: 3.0, ease: "power3.out",
      onUpdate: () => { setOpenness(o.openness); setGlow(o.glow); },
    });

    // Phase 3 — Pulse (1.4s)
    tl.call(() => { setPhase("pulse"); whoosh(); sparkle(1.5); });
    tl.to(o, {
      pulse: 1, duration: 1.4, ease: "power2.out",
      onUpdate: () => setPulse(o.pulse),
    });

    // Phase 4 — Garden growth (3s)
    tl.call(() => setPhase("garden"));
    tl.to(o, {
      garden: 1, duration: 3.0, ease: "power2.inOut",
      onUpdate: () => setGarden(o.garden),
    });

    // Phase 5 — Wizarding world (2.6s)
    tl.call(() => { setPhase("wizard"); sparkle(1.1); });
    tl.to(o, {
      wizard: 1, duration: 2.6, ease: "power2.inOut",
      onUpdate: () => setWizard(o.wizard),
    });

    // Phase 6 — Butterflies (1.6s)
    tl.call(() => { setPhase("butterflies"); sparkle(1.3); });
    tl.to({}, { duration: 1.6 });

    // Phase 7 — Portal (2.4s)
    tl.call(() => { setPhase("portal"); whoosh(); });
    tl.to(o, {
      portal: 1, duration: 2.4, ease: "power2.in",
      onUpdate: () => setPortal(o.portal),
    });

    // Phase 8 — Reveal (user-controlled). Pause until click.
    tl.call(() => { setPhase("reveal"); setRevealText("For My Precious Rubyduby ❤️"); });
    tl.addPause();
    tl.call(() => setRevealText("The journey starts from here…"));
    tl.addPause();
    tl.call(() => { setPhase("done"); onEnter(); });
  };

  const advanceReveal = () => {
    if (phase !== "reveal") return;
    sparkle(1.1);
    tlRef.current?.play();
  };

  return (
    <div className="absolute inset-0" style={{ width: "100%", height: "100vh", overflow: "hidden", background: "#1a0f24" }}>
      <SkyOverlay phase={phase} />
      <Canvas
        camera={{ position: [0, 0.3, 2.6], fov: 38 }}
        gl={{ antialias: false, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15, powerPreference: "high-performance" }}
        dpr={[1, 1.6]}
        style={{ width: "100%", height: "100%", display: "block", background: "#1a0f24" }}
      >
        <color attach="background" args={["#1a0f24"]} />
        <fog attach="fog" args={["#1a0f24", 5, 14]} />
        <ambientLight intensity={0.25} />
        <spotLight position={[3, 5, 2]} angle={0.4} penumbra={1} intensity={1.4} color="#d6b8ff" castShadow />
        <spotLight position={[-3, 2, 4]} angle={0.5} penumbra={1} intensity={0.9} color="#ff9fc8" />
        <hemisphereLight args={["#e0b8ff", "#1a0820", 0.35]} />

        <CinematicCamera phase={phase} />
        <Flower openness={openness} glow={glow} lit={lit} phase={phase} onClick={handleClick} />

        {/* Pulse ring expanding outward */}
        {pulse > 0.01 && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <ringGeometry args={[pulse * 1.5, pulse * 1.65, 96]} />
            <meshBasicMaterial color={new THREE.Color(2.8, 1.6, 2.6)} transparent opacity={1 - pulse} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        )}

        <GardenRing progress={garden} />
        <WizardObjects visible={wizard} />
        <Portal visible={portal} />

        <Sparkles count={90} scale={[8, 5, 8]} size={2.4} speed={0.25} color="#ffd0a8" opacity={0.65} />
        <Sparkles count={60} scale={[12, 6, 12]} size={1.2} speed={0.12} color="#ffaee0" opacity={0.45} />
      </Canvas>

      {/* Reliable full-screen click target during idle — guarantees the first click fires */}
      {phase === "idle" && (
        <button
          aria-label="Begin the journey"
          onClick={handleClick}
          className="absolute inset-0 z-30 cursor-pointer bg-transparent border-0 outline-none"
        />
      )}

      {/* Click-to-continue during reveal */}
      {phase === "reveal" && (
        <button
          aria-label="Continue"
          onClick={advanceReveal}
          className="absolute inset-0 z-30 cursor-pointer bg-transparent border-0 outline-none"
        />
      )}

      {/* Idle butterflies + hearts overlay */}
      {phase === "idle" && <ButterflyOverlay count={5} />}
      {(phase === "garden" || phase === "wizard" || phase === "butterflies") && <ButterflyOverlay count={7} />}

      {/* Captions */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1.8, delay: 0.6 }}
            className="absolute inset-x-0 bottom-[12%] flex flex-col items-center text-center pointer-events-none z-20"
          >
            <div className="cinematic-letter-spaced text-[10px] text-primary/70 mb-3">For My Precious Rubyduby · Forever Mine</div>
            <div className="script text-5xl md:text-6xl text-foreground shimmer">Click the flower, my love.</div>
            <div className="mt-4 text-sm text-muted-foreground tracking-wide">A little magical journey awaits you…</div>
          </motion.div>
        )}
        {phase === "awaken" && (
          <motion.div
            key="awaken"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2.4 }}
            className="absolute inset-x-0 top-[14%] text-center pointer-events-none z-20"
          >
            <div className="script text-2xl md:text-3xl text-primary/85 shimmer">Something old is waking…</div>
          </motion.div>
        )}
        {phase === "bloom" && (
          <motion.div
            key="bloom"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2.0 }}
            className="absolute inset-x-0 top-[14%] text-center pointer-events-none z-20"
          >
            <div className="script text-3xl md:text-4xl text-foreground shimmer">It blooms for you, Precious.</div>
          </motion.div>
        )}
        {phase === "garden" && (
          <motion.div
            key="garden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.8 }}
            className="absolute inset-x-0 top-[12%] text-center pointer-events-none z-20"
          >
            <div className="script text-3xl md:text-4xl text-foreground/90 shimmer">A garden grew from a single moment.</div>
          </motion.div>
        )}
        {phase === "wizard" && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.8 }}
            className="absolute inset-x-0 top-[12%] text-center pointer-events-none z-20"
          >
            <div className="script text-3xl md:text-4xl text-primary/90 shimmer">And the magic remembered your name.</div>
          </motion.div>
        )}
        {phase === "portal" && (
          <motion.div
            key="portal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            className="absolute inset-x-0 top-[12%] text-center pointer-events-none z-20"
          >
            <div className="script text-3xl md:text-4xl text-foreground shimmer">Step through with me…</div>
          </motion.div>
        )}
        {phase === "reveal" && (
          <motion.div
            key={revealText}
            initial={{ opacity: 0, y: 24, letterSpacing: "0.5em", filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.05em", filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(10px)" }}
            transition={{ duration: 1.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none z-20"
          >
            <div className="script text-4xl md:text-6xl text-foreground shimmer max-w-3xl">{revealText}</div>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1.2 }}
              className="mt-12 cinematic-letter-spaced text-xs text-primary/80"
            >
              ✨ Click anywhere to Continue ✨
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
