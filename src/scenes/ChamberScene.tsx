import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import { Float, Sparkles, Environment, Text } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";
import { sparkle, whoosh } from "@/lib/audio";

export type Spell = "patronus" | "leviosa" | "expelliarmus" | "lumos";

const SPELLS: { id: Spell; name: string; subtitle: string; color: string; glyph: string }[] = [
  { id: "patronus", name: "Expecto Patronum", subtitle: "Guardian of light", color: "#dfeaff", glyph: "✦" },
  { id: "leviosa", name: "Wingardium Leviosa", subtitle: "Lift what is heavy", color: "#ffd8a8", glyph: "❀" },
  { id: "expelliarmus", name: "Expelliarmus", subtitle: "Disarm the storm", color: "#ffb487", glyph: "✺" },
  { id: "lumos", name: "Lumos", subtitle: "Kindle the dark", color: "#ffdf8a", glyph: "☀" },
];

function Artifact({ index, total, hovered, setHovered, onSelect, spell }: {
  index: number; total: number;
  hovered: number | null; setHovered: (n: number | null) => void;
  onSelect: (s: Spell) => void; spell: typeof SPELLS[number];
}) {
  const ref = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const baseAngle = (index / total) * Math.PI * 2;
  const isHovered = hovered === index;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const angle = baseAngle + t * 0.15;
    const r = 1.8 + (isHovered ? 0.15 : 0);
    ref.current.position.x = Math.cos(angle) * r;
    ref.current.position.z = Math.sin(angle) * r;
    ref.current.position.y = Math.sin(t * 0.5 + index) * 0.15;
    ref.current.rotation.y = -angle + Math.PI / 2;
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.4 + index;
      meshRef.current.rotation.z = t * 0.3;
    }
  });

  const c = new THREE.Color(spell.color);
  return (
    <group ref={ref}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        {/* Large invisible hit target — guarantees first-click registration */}
        <mesh
          onPointerEnter={() => { setHovered(index); sparkle(0.9 + index * 0.1); }}
          onPointerLeave={() => setHovered(null)}
          onClick={(e) => { e.stopPropagation(); whoosh(); onSelect(spell.id); }}
        >
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh ref={meshRef} castShadow raycast={() => null}>
          {spell.id === "patronus" && <sphereGeometry args={[0.3, 24, 24]} />}
          {spell.id === "leviosa" && <coneGeometry args={[0.18, 0.55, 5]} />}
          {spell.id === "expelliarmus" && <cylinderGeometry args={[0.03, 0.06, 0.55, 12]} />}
          {spell.id === "lumos" && <icosahedronGeometry args={[0.28, 1]} />}
          <meshPhysicalMaterial
            color={c}
            emissive={c}
            emissiveIntensity={isHovered ? 2.2 : 0.9}
            metalness={0.6}
            roughness={0.15}
            transmission={0.4}
            thickness={0.8}
            clearcoat={1}
            ior={1.6}
          />
        </mesh>
        <pointLight color={spell.color} intensity={isHovered ? 4 : 1.6} distance={3} />
        <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.5, 0.55, 64]} />
          <meshBasicMaterial color={c} transparent opacity={isHovered ? 0.7 : 0.25} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <Text
          position={[0, -0.55, 0]}
          fontSize={0.09}
          color={spell.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.002}
          outlineColor="#000"
        >
          {spell.name}
        </Text>
      </Float>
    </group>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = t * 0.3;
      ref.current.rotation.x = t * 0.2;
      ref.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05);
    }
    if (ringRef.current) ringRef.current.rotation.z = -t * 0.5;
  });
  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshPhysicalMaterial
          color="#ffc890"
          emissive="#ff8a5c"
          emissiveIntensity={1.4}
          metalness={0.4}
          roughness={0.1}
          transmission={0.6}
          thickness={1}
          ior={1.7}
          clearcoat={1}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[0.9, 0.012, 16, 100]} />
        <meshBasicMaterial color="#ffc890" toneMapped={false} />
      </mesh>
      <pointLight intensity={3} distance={6} color="#ffb070" />
    </group>
  );
}

function Camera() {
  const { camera } = useThree();
  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.12;
    camera.position.x = Math.sin(t) * 3.5;
    camera.position.z = Math.cos(t) * 3.5;
    camera.position.y = 1.4 + Math.sin(t * 1.3) * 0.2;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function ChamberScene({ onSelect }: { onSelect: (s: Spell) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [0, 1.4, 3.5], fov: 42 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#08050f"]} />
        <fog attach="fog" args={["#08050f", 4, 14]} />
        <Environment preset="night" />
        <ambientLight intensity={0.1} />
        <spotLight position={[0, 6, 0]} angle={0.5} penumbra={1} intensity={2} color="#c0a8ff" castShadow />
        <Camera />
        <Core />
        {SPELLS.map((s, i) => (
          <Artifact key={s.id} index={i} total={SPELLS.length} hovered={hovered} setHovered={setHovered} onSelect={onSelect} spell={s} />
        ))}
        {/* Floor reflection */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <circleGeometry args={[6, 64]} />
          <meshStandardMaterial color="#0c0818" metalness={0.9} roughness={0.4} />
        </mesh>
        <Sparkles count={200} scale={[10, 5, 10]} size={2} speed={0.2} color="#ffc890" opacity={0.6} />
        <EffectComposer>
          <Bloom intensity={1.3} luminanceThreshold={0.25} luminanceSmoothing={0.9} mipmapBlur />
          <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2.5} />
          <Vignette eskil={false} offset={0.2} darkness={1.0} />
        </EffectComposer>
      </Canvas>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.6, delay: 0.6 }}
        className="absolute inset-x-0 top-[10%] text-center pointer-events-none"
      >
        <div className="cinematic-letter-spaced text-[10px] text-primary/70 mb-2">Chamber of Spells</div>
        <div className="script text-4xl md:text-5xl text-foreground shimmer">Choose a magic for me, My Precious Rubyduby.</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6, delay: 1.4 }}
        className="absolute inset-x-0 bottom-[6%] text-center text-xs cinematic-letter-spaced text-muted-foreground/80 pointer-events-none"
      >
        Hover the artifacts · Click to cast
      </motion.div>
    </div>
  );
}
