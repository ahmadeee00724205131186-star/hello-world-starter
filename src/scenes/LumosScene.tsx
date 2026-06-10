import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { ContinueButton } from "./LeviosaScene";
import { sparkle } from "@/lib/audio";
import { WandPrompt } from "@/components/WandPrompt";

function Candle({ pos, lit, onLight, index }: { pos: [number, number, number]; lit: boolean; onLight: () => void; index: number }) {
  const flame = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    if (!flame.current || !light.current) return;
    const t = s.clock.elapsedTime + index;
    flame.current.scale.y = 1 + Math.sin(t * 8) * 0.18;
    flame.current.scale.x = 1 + Math.sin(t * 6) * 0.08;
    flame.current.rotation.y = Math.sin(t * 2) * 0.2;
    light.current.intensity = lit ? 2 + Math.sin(t * 9) * 0.4 : 0;
  });
  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); if (!lit) { onLight(); sparkle(1 + index * 0.05); } }}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 16]} />
        <meshStandardMaterial color="#f8eed0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
        <meshStandardMaterial color="#2a1a08" />
      </mesh>
      {lit && (
        <mesh ref={flame} position={[0, 0.35, 0]}>
          <coneGeometry args={[0.05, 0.18, 8]} />
          <meshBasicMaterial color={new THREE.Color(3.5, 2, 0.6)} toneMapped={false} transparent opacity={0.95} />
        </mesh>
      )}
      <pointLight ref={light} position={[0, 0.4, 0]} color="#ffb060" intensity={0} distance={3.5} />
    </group>
  );
}

function Cake() {
  return (
    <group position={[0, -0.3, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.4, 32]} />
        <meshStandardMaterial color="#f4d8c0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.0, 0.35, 32]} />
        <meshStandardMaterial color="#f8c8b8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.08, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.7, 0.3, 32]} />
        <meshStandardMaterial color="#f4b8c8" roughness={0.6} />
      </mesh>
      {/* Drips */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.38, 0.55 + Math.random() * 0.05, Math.sin(a) * 1.38]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#ffd8a0" roughness={0.3} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

function Fireflies() {
  const ref = useRef<THREE.Points>(null);
  const { positions, base } = useMemo(() => {
    const n = 150;
    const p = new Float32Array(n * 3);
    const b = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 4;
      p[i * 3] = b[i * 3] = Math.cos(a) * r;
      p[i * 3 + 1] = b[i * 3 + 1] = Math.random() * 3;
      p[i * 3 + 2] = b[i * 3 + 2] = Math.sin(a) * r;
    }
    return { positions: p, base: b };
  }, []);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3] = base[i * 3] + Math.sin(t * 0.5 + i) * 0.3;
      arr[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t + i * 0.7) * 0.25;
      arr[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.6 + i) * 0.3;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={new THREE.Color(3, 2.2, 0.8)} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

function Cam({ allLit }: { allLit: boolean }) {
  const { camera } = useThree();
  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.1;
    const zoom = allLit ? 1 : 0;
    camera.position.x = Math.sin(t) * 2.5;
    camera.position.y = 1.4 + Math.sin(t * 1.4) * 0.15 - zoom * 0.3;
    camera.position.z = 4 - zoom * 0.5 + Math.cos(t) * 0.4;
    camera.lookAt(0, 0.8, 0);
  });
  return null;
}

const LUMOS_LINES = [
  "My Precious Rubyduby,",
  "may your smile stay bright.",
  "May your heart stay happy.",
  "May your dreams come true.",
  "May this birthday be as beautiful as you are.",
  "May the year ahead bring you endless happiness and magical moments.",
  "Happy Birthday, My Precious Rubyduby ❤️",
];

export function LumosScene({ onDone }: { onDone: () => void }) {
  const candles = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { pos: [Math.cos(a) * 0.45, 1.32, Math.sin(a) * 0.45] as [number, number, number] };
  }), []);
  const [cast, setCast] = useState(false);
  const [lit, setLit] = useState<boolean[]>(Array(8).fill(false));
  const allLit = lit.every(Boolean);
  const [line, setLine] = useState(0);

  if (!cast) return <WandPrompt onCast={() => setCast(true)} spellLabel="Lumos" hint="Then tap each candle to light it" />;

  const isLast = line >= LUMOS_LINES.length - 1;
  const advance = () => {
    if (isLast) onDone();
    else setLine((n) => n + 1);
  };

  return (
    <div className="absolute inset-0" style={{ width: "100%", height: "100vh", overflow: "hidden", background: "#0a0612" }}>
      <Canvas
        camera={{ position: [0, 1.4, 4], fov: 45 }}
        gl={{ antialias: false, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1, powerPreference: "high-performance" }}
        dpr={[1, 1.6]}
        style={{ width: "100%", height: "100%", display: "block", background: "#0a0612" }}
      >
        <color attach="background" args={["#0a0612"]} />
        <fog attach="fog" args={["#0a0612", 5, 14]} />
        <ambientLight intensity={0.08} color="#ffb070" />
        <Cam allLit={allLit} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} receiveShadow>
          <circleGeometry args={[10, 64]} />
          <meshStandardMaterial color="#1a0e08" roughness={1} />
        </mesh>
        <Cake />
        {candles.map((c, i) => (
          <Candle key={i} index={i} pos={c.pos} lit={lit[i]} onLight={() => setLit((arr) => arr.map((v, j) => j === i ? true : v))} />
        ))}
        <Fireflies />
        <Sparkles count={120} scale={[8, 4, 8]} size={1.4} speed={0.2} color="#ffd890" opacity={0.6} />
      </Canvas>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4 }}
        className="absolute inset-x-0 top-[8%] text-center pointer-events-none"
      >
        <div className="cinematic-letter-spaced text-[10px] text-primary/70 mb-2">Lumos</div>
        {!allLit && (
          <div className="script text-3xl md:text-4xl text-foreground shimmer">Light each candle, Precious.</div>
        )}
      </motion.div>

      {allLit && (
        <div className="absolute inset-x-0 bottom-[20%] flex flex-col items-center text-center pointer-events-none px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={line}
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.8 }}
              className="script text-2xl md:text-4xl text-foreground shimmer max-w-3xl"
            >
              {LUMOS_LINES[line]}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {allLit && <ContinueButton onClick={advance} label={isLast ? "Continue the Journey" : "Click to Continue"} />}
    </div>
  );
}
