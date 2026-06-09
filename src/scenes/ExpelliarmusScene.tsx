import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { Sparkles, Environment, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";
import { ContinueButton } from "./LeviosaScene";
import { whoosh } from "@/lib/audio";
import { WandPrompt } from "@/components/WandPrompt";

function SpellBeam({ from, to, color, t }: { from: [number, number, number]; to: [number, number, number]; color: string; t: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.scale.x = t;
  });
  const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const len = dir.length();
  const mid = new THREE.Vector3((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize());
  return (
    <mesh ref={ref} position={mid} quaternion={q}>
      <cylinderGeometry args={[0.03, 0.08, len, 16]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.9} />
    </mesh>
  );
}

function Shockwave({ trigger, pos }: { trigger: number; pos: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (!ref.current || trigger === 0) return;
    const m = ref.current.material as THREE.MeshBasicMaterial;
    ref.current.scale.setScalar(0.1);
    m.opacity = 0.9;
    gsap.to(ref.current.scale, { x: 6, y: 6, z: 6, duration: 1.4, ease: "power2.out" });
    gsap.to(m, { opacity: 0, duration: 1.4, ease: "power2.out" });
  }, [trigger]);
  return (
    <mesh ref={ref} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.5, 0.55, 64]} />
      <meshBasicMaterial color="#ffb070" transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function Wand({ pos, rot, color }: { pos: [number, number, number]; rot: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.z = rot[2] + Math.sin(s.clock.elapsedTime * 1.4) * 0.05;
  });
  return (
    <group ref={ref} position={pos} rotation={rot}>
      <mesh>
        <cylinderGeometry args={[0.015, 0.04, 0.8, 12]} />
        <meshStandardMaterial color="#3a2614" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.42, 0]} color={color} intensity={2} distance={1.5} />
    </group>
  );
}

function Cam({ shake }: { shake: number }) {
  const { camera } = useThree();
  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.15;
    camera.position.x = Math.sin(t) * 0.4 + (Math.random() - 0.5) * shake * 0.1;
    camera.position.y = 1.4 + (Math.random() - 0.5) * shake * 0.08;
    camera.position.z = 4 + Math.cos(t) * 0.3;
    camera.lookAt(0, 1.4, 0);
  });
  return null;
}

function GiftBox({ visible }: { visible: number }) {
  const grp = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!grp.current) return;
    grp.current.rotation.y = s.clock.elapsedTime * 0.5;
    grp.current.scale.setScalar(visible * 0.9);
    grp.current.position.y = 1.4 + Math.sin(s.clock.elapsedTime * 1.4) * 0.06;
  });
  return (
    <group ref={grp} position={[0, 1.4, 0]} scale={0}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshPhysicalMaterial color="#e6356a" metalness={0.4} roughness={0.25} clearcoat={1} emissive="#ff90a8" emissiveIntensity={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.72, 0.16, 0.72]} />
        <meshStandardMaterial color="#ffd86a" metalness={0.6} roughness={0.2} emissive="#ffd86a" emissiveIntensity={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.16, 0.72, 0.72]} />
        <meshStandardMaterial color="#ffd86a" metalness={0.6} roughness={0.2} emissive="#ffd86a" emissiveIntensity={0.5} />
      </mesh>
      <pointLight color="#ffd0a0" intensity={2.5} distance={4} />
    </group>
  );
}

const EXPEL_LINES = [
  "My Precious Rubyduby,",
  "today the only thing stolen from me is my heart…",
  "and you've had it for a very long time already.",
  "Thank you for filling my life with joy, warmth, and beautiful memories.",
  "Happy Birthday, My Precious Rubyduby ❤️",
];

export function ExpelliarmusScene({ onDone }: { onDone: () => void }) {
  const [cast, setCast] = useState(false);
  const [beamT, setBeamT] = useState(0);
  const [collision, setCollision] = useState(0);
  const [shake, setShake] = useState(0);
  const [gift, setGift] = useState(0);
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!cast) return;
    const tl = gsap.timeline();
    const obj = { t: 0, s: 0, g: 0 };
    tl.to(obj, { t: 1, duration: 1.2, ease: "power2.in", onUpdate: () => setBeamT(obj.t) });
    tl.call(() => { whoosh(); setCollision((c) => c + 1); setShake(1); });
    tl.to(obj, { s: 0, duration: 0.8, onUpdate: () => setShake(1 - obj.s) });
    tl.to(obj, { t: 0, duration: 0.6, onUpdate: () => setBeamT(obj.t) });
    tl.to(obj, { g: 1, duration: 1.4, ease: "back.out(1.6)", onUpdate: () => setGift(obj.g) });
    const id = setInterval(() => setLine((n) => Math.min(n + 1, EXPEL_LINES.length - 1)), 2600);
    return () => { tl.kill(); clearInterval(id); };
  }, [cast]);

  if (!cast) return <WandPrompt onCast={() => setCast(true)} spellLabel="Expelliarmus" />;

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [0, 1.4, 4], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0, powerPreference: "high-performance" }}
        dpr={[1, 1.6]}
      >
        <color attach="background" args={["#0a0612"]} />
        <fog attach="fog" args={["#0a0612", 6, 16]} />
        <Environment preset="night" />
        <ambientLight intensity={0.15} />
        <spotLight position={[0, 8, 3]} angle={0.5} penumbra={1} intensity={1.4} color="#ffc890" castShadow />
        <Cam shake={shake} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[8, 64]} />
          <meshStandardMaterial color="#0e0a18" metalness={0.8} roughness={0.3} />
        </mesh>
        <Wand pos={[-2.4, 1.4, 0]} rot={[0, 0, -0.4]} color="#ff8060" />
        <Wand pos={[2.4, 1.4, 0]} rot={[0, 0, 0.4]} color="#80a0ff" />
        {beamT > 0.01 && <SpellBeam from={[-2.0, 1.6, 0]} to={[0, 1.5, 0]} color="#ff8060" t={beamT} />}
        {beamT > 0.01 && <SpellBeam from={[2.0, 1.6, 0]} to={[0, 1.5, 0]} color="#80a0ff" t={beamT} />}
        <Shockwave trigger={collision} pos={[0, 0.1, 0]} />
        <GiftBox visible={gift} />
        <Sparkles count={220} scale={[10, 6, 10]} size={2} speed={0.4} color="#ffb070" opacity={0.6} />
        <EffectComposer multisampling={4}>
          <Bloom intensity={1.6} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
          <ChromaticAberration offset={[shake * 0.005, shake * 0.005]} />
          <Vignette eskil={false} offset={0.2} darkness={1.1} />
        </EffectComposer>
      </Canvas>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4 }}
        className="absolute inset-x-0 top-[8%] text-center pointer-events-none"
      >
        <div className="cinematic-letter-spaced text-[10px] text-primary/70 mb-2">Expelliarmus</div>
      </motion.div>

      <div className="absolute inset-x-0 bottom-[16%] flex flex-col items-center text-center pointer-events-none px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={line}
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            transition={{ duration: 1.4 }}
            className="script text-2xl md:text-4xl text-foreground shimmer max-w-3xl"
          >
            {EXPEL_LINES[line]}
          </motion.div>
        </AnimatePresence>
      </div>

      {line >= EXPEL_LINES.length - 1 && <ContinueButton onClick={onDone} />}
    </div>
  );
}
