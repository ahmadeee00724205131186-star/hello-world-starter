import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";
import { WandPrompt } from "@/components/WandPrompt";

function Book({ pos, rot, color, delay }: { pos: [number, number, number]; rot: [number, number, number]; color: string; delay: number }) {
  const ref = useRef<THREE.Group>(null);
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current.position, { y: -3, duration: 2.5, delay, ease: "power2.out" });
    gsap.from(ref.current.rotation, { x: Math.PI, duration: 2.5, delay, ease: "power2.out" });
  }, [delay]);
  useFrame((s) => {
    const t = s.clock.elapsedTime + delay * 3;
    if (ref.current) {
      ref.current.position.y = pos[1] + Math.sin(t * 0.8) * 0.2;
      ref.current.rotation.y = rot[1] + Math.sin(t * 0.4) * 0.3;
      ref.current.rotation.z = rot[2] + Math.sin(t * 0.5) * 0.1;
    }
    if (left.current && right.current) {
      const a = Math.sin(t * 1.5) * 0.4 + 0.5;
      left.current.rotation.y = -a;
      right.current.rotation.y = a;
    }
  });
  return (
    <group ref={ref} position={pos} rotation={rot}>
      {/* Spine */}
      <mesh>
        <boxGeometry args={[0.04, 0.5, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Pages */}
      <mesh ref={left} position={[-0.02, 0, 0]}>
        <boxGeometry args={[0.3, 0.46, 0.66]} />
        <meshStandardMaterial color="#f4ecd0" roughness={0.9} />
      </mesh>
      <mesh ref={right} position={[0.02, 0, 0]}>
        <boxGeometry args={[0.3, 0.46, 0.66]} />
        <meshStandardMaterial color="#f4ecd0" roughness={0.9} />
      </mesh>
      <pointLight color="#ffd28a" intensity={0.5} distance={1.5} />
    </group>
  );
}

function Feather({ seed }: { seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const start = useMemo(() => [(Math.random() - 0.5) * 8, -2 + Math.random() * 4, (Math.random() - 0.5) * 8] as [number, number, number], []);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime + seed;
    ref.current.position.x = start[0] + Math.sin(t * 0.5) * 0.6;
    ref.current.position.y = start[1] + Math.sin(t * 0.3) * 0.4;
    ref.current.position.z = start[2] + Math.cos(t * 0.4) * 0.6;
    ref.current.rotation.x = Math.sin(t * 0.6) * 0.4;
    ref.current.rotation.z = Math.cos(t * 0.5) * 0.6;
  });
  return (
    <mesh ref={ref}>
      <coneGeometry args={[0.05, 0.4, 4]} />
      <meshStandardMaterial color="#fff8e8" emissive="#fff0c0" emissiveIntensity={0.3} roughness={0.6} />
    </mesh>
  );
}

function Candle({ pos }: { pos: [number, number, number] }) {
  const flame = useRef<THREE.Mesh>(null);
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime + pos[0];
    if (ref.current) ref.current.position.y = pos[1] + Math.sin(t * 0.6) * 0.15;
    if (flame.current) {
      flame.current.scale.y = 1 + Math.sin(t * 6) * 0.15;
      flame.current.rotation.y = t;
    }
  });
  return (
    <group ref={ref} position={pos}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 12]} />
        <meshStandardMaterial color="#f7e8c8" roughness={0.6} />
      </mesh>
      <mesh ref={flame} position={[0, 0.22, 0]}>
        <coneGeometry args={[0.05, 0.18, 8]} />
        <meshBasicMaterial color={new THREE.Color(4, 2.2, 0.7)} toneMapped={false} transparent opacity={1} />
      </mesh>
      <pointLight color="#ffb060" intensity={2.6} distance={4.5} position={[0, 0.3, 0]} />
    </group>
  );
}

function Cam() {
  const { camera } = useThree();
  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.1;
    camera.position.x = Math.sin(t) * 2.5;
    camera.position.y = 1.2 + Math.sin(t * 1.4) * 0.15;
    camera.position.z = 3 + Math.cos(t) * 0.6;
    camera.lookAt(0, 0.5, 0);
  });
  return null;
}

const LEVIOSA_LINES = [
  "My Precious Rubyduby,",
  "like this feather, may your dreams rise higher than the clouds.",
  "May every wish find its wings.",
  "May every day ahead be filled with happiness, wonder, and magic.",
  "Happy Birthday, My Precious Rubyduby ❤️",
];

export function LeviosaScene({ onDone }: { onDone: () => void }) {
  const [cast, setCast] = useState(false);
  const [line, setLine] = useState(0);

  if (!cast) return <WandPrompt onCast={() => setCast(true)} spellLabel="Wingardium Leviosa" hint="Then click anywhere to continue the story" />;

  const isLast = line >= LEVIOSA_LINES.length - 1;
  const advance = () => {
    if (isLast) onDone();
    else setLine((n) => n + 1);
  };

  return (
    <div className="absolute inset-0" style={{ width: "100%", height: "100dvh", overflow: "hidden", background: "#1a0e0a" }}>
      <Canvas
        camera={{ position: [0, 1.2, 3.5], fov: 45 }}
        gl={{ antialias: false, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.35, powerPreference: "high-performance" }}
        dpr={[1, 1.6]}
        style={{ width: "100%", height: "100%", display: "block", background: "#1a0e0a" }}
      >
        <color attach="background" args={["#1a0e0a"]} />
        <fog attach="fog" args={["#1a0e0a", 5, 14]} />
        <ambientLight intensity={0.55} color="#f5c890" />
        <directionalLight position={[2, 4, 3]} intensity={1.4} color="#ffb070" castShadow />
        <hemisphereLight args={["#ffd0a0", "#1a0a04", 0.5]} />
        <pointLight position={[0, 3, 2]} intensity={1.2} color="#ffc890" distance={10} />
        <Cam />
        <mesh position={[0, 0, -4]}>
          <planeGeometry args={[14, 7]} />
          <meshStandardMaterial color="#2a1a12" roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
          <planeGeometry args={[16, 10]} />
          <meshStandardMaterial color="#1a0e08" roughness={1} />
        </mesh>
        {Array.from({ length: 9 }).map((_, i) => {
          const x = (Math.random() - 0.5) * 4;
          const y = 0.5 + Math.random() * 1.5;
          const z = -1 + Math.random() * 2;
          const colors = ["#7a3b2a", "#5a4d2f", "#2f4a3b", "#3a2a5a", "#5a2f4a"];
          return <Book key={i} pos={[x, y, z]} rot={[0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4]} color={colors[i % colors.length]} delay={i * 0.12} />;
        })}
        {Array.from({ length: 10 }).map((_, i) => <Feather key={i} seed={i} />)}
        {[[-2, -0.5, 1], [2, -0.3, 0.5], [0, -0.7, -1], [1.5, -0.4, -1.5]].map((p, i) => (
          <Candle key={i} pos={p as [number, number, number]} />
        ))}
        <Sparkles count={180} scale={[10, 6, 8]} size={2.2} speed={0.25} color="#ffd890" opacity={0.85} />
        <Sparkles count={90} scale={[14, 5, 10]} size={1} speed={0.1} color="#ffb070" opacity={0.6} />
      </Canvas>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0 }}
        className="absolute inset-x-0 top-[8%] text-center pointer-events-none"
      >
        <div className="cinematic-letter-spaced text-[10px] text-primary/70 mb-2">Wingardium Leviosa</div>
      </motion.div>

      <div className="absolute inset-x-0 bottom-[18%] flex flex-col items-center text-center pointer-events-none px-6 gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={line}
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ duration: 0.8 }}
            className="script text-2xl md:text-4xl text-foreground shimmer max-w-3xl"
          >
            {LEVIOSA_LINES[line]}
          </motion.div>
        </AnimatePresence>
      </div>

      <ContinueButton onClick={advance} label={isLast ? "Continue the Journey" : "Click to Continue"} />
    </div>
  );
}

export function ContinueButton({ onClick, label = "Click to Continue" }: { onClick: () => void; label?: string }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
      onClick={onClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 border border-primary/50 bg-background/40 backdrop-blur-md rounded-full text-primary cinematic-letter-spaced text-xs hover:bg-background/70 hover:border-primary transition-all z-30 pointer-events-auto shadow-[0_0_24px_oklch(0.82_0.14_65/0.25)]"
    >
      ✨ {label} ✨
    </motion.button>
  );
}
