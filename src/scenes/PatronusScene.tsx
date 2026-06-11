import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";
import { whoosh, sparkle } from "@/lib/audio";
import { WandPrompt } from "@/components/WandPrompt";

function Forest() {
  const trees = useMemo(() => {
    const arr: { x: number; z: number; h: number; r: number; rot: number }[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 7 + Math.random() * 18;
      arr.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        h: 5 + Math.random() * 8,
        r: 0.15 + Math.random() * 0.25,
        rot: Math.random() * Math.PI,
      });
    }
    return arr;
  }, []);
  return (
    <group>
      {trees.map((t, i) => (
        <mesh key={i} position={[t.x, t.h / 2 - 1, t.z]} rotation={[0, t.rot, 0]} castShadow>
          <cylinderGeometry args={[t.r * 0.6, t.r, t.h, 6]} />
          <meshStandardMaterial color="#0a0d18" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[80, 80, 1, 1]} />
      <meshStandardMaterial color="#0c1020" roughness={1} />
    </mesh>
  );
}

function MoonShafts() {
  const shafts = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    x: -6 + i * 2.4 + (Math.random() - 0.5) * 0.5,
    rot: 0.1 + Math.random() * 0.1,
    op: 0.05 + Math.random() * 0.05,
  })), []);
  return (
    <group position={[0, 6, -3]}>
      {shafts.map((s, i) => (
        <mesh key={i} position={[s.x, 0, 0]} rotation={[0, 0, s.rot]}>
          <coneGeometry args={[1.2, 14, 8, 1, true]} />
          <meshBasicMaterial color="#cfd8ff" transparent opacity={s.op} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

function Fireflies() {
  const ref = useRef<THREE.Points>(null);
  const { positions, base } = useMemo(() => {
    const n = 160;
    const positions = new Float32Array(n * 3);
    const base = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = Math.random() * 4 + 0.2;
      const z = (Math.random() - 0.5) * 30;
      positions[i * 3] = base[i * 3] = x;
      positions[i * 3 + 1] = base[i * 3 + 1] = y;
      positions[i * 3 + 2] = base[i * 3 + 2] = z;
    }
    return { positions, base };
  }, []);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3] = base[i * 3] + Math.sin(t * 0.6 + i) * 0.4;
      arr[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.8 + i * 1.3) * 0.3;
      arr[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.5 + i * 0.7) * 0.4;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={new THREE.Color(2, 1.6, 0.8)} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

/* Silver Doe — uses shared material instance (cheaper) */
const silverMat = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#f0f6ff"),
  emissive: new THREE.Color(2.4, 2.6, 3.2),
  emissiveIntensity: 2.4,
  metalness: 0.15,
  roughness: 0.2,
  transmission: 0.45,
  thickness: 0.6,
  transparent: true,
  opacity: 0,
  ior: 1.45,
  clearcoat: 1,
});

function Doe({ stateRef, refForCam }: {
  stateRef: React.MutableRefObject<{ vis: number; walk: number; burst: number; doeX: number; doeY: number; doeZ: number }>;
  refForCam: React.MutableRefObject<THREE.Group | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const fl = useRef<THREE.Mesh>(null);
  const fr = useRef<THREE.Mesh>(null);
  const bl = useRef<THREE.Mesh>(null);
  const br = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Mesh>(null);

  useEffect(() => { if (group.current) refForCam.current = group.current; }, [refForCam]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const st = stateRef.current;
    const p = st.walk * 6;
    if (fl.current) fl.current.rotation.x = Math.sin(t * p) * 0.6 * st.walk;
    if (fr.current) fr.current.rotation.x = -Math.sin(t * p) * 0.6 * st.walk;
    if (bl.current) bl.current.rotation.x = -Math.sin(t * p) * 0.6 * st.walk;
    if (br.current) br.current.rotation.x = Math.sin(t * p) * 0.6 * st.walk;
    if (head.current) head.current.rotation.x = Math.sin(t * 1.5) * 0.05;
    if (tail.current) tail.current.rotation.z = Math.sin(t * 3) * 0.3;
    if (body.current) body.current.position.y = 0.5 + Math.sin(t * 1.2) * 0.02 * st.walk;
    if (group.current) {
      group.current.position.set(st.doeX, st.doeY, st.doeZ);
      group.current.scale.setScalar(0.001 + st.vis * 1.0);
      // turn toward heading
      const heading = Math.atan2(st.doeX, st.doeZ);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, heading, 0.08);
    }
    silverMat.opacity = Math.min(1, stateRef.current.vis * 1.4);
  });

  return (
    <group ref={group} scale={0}>
      <mesh ref={body} position={[0, 0.5, 0]} castShadow material={silverMat}>
        <capsuleGeometry args={[0.28, 0.7, 8, 16]} />
      </mesh>
      <group ref={head} position={[0, 0.85, 0.55]}>
        <mesh rotation={[0.6, 0, 0]} position={[0, -0.1, -0.1]} material={silverMat}>
          <capsuleGeometry args={[0.12, 0.35, 8, 16]} />
        </mesh>
        <mesh position={[0, 0.15, 0.05]} material={silverMat}>
          <sphereGeometry args={[0.18, 24, 24]} />
        </mesh>
        <mesh position={[0.12, 0.32, 0.0]} rotation={[0, 0, -0.4]} material={silverMat}>
          <coneGeometry args={[0.05, 0.18, 8]} />
        </mesh>
        <mesh position={[-0.12, 0.32, 0.0]} rotation={[0, 0, 0.4]} material={silverMat}>
          <coneGeometry args={[0.05, 0.18, 8]} />
        </mesh>
      </group>
      <mesh ref={fl} position={[0.16, 0.15, 0.32]} material={silverMat}><cylinderGeometry args={[0.04, 0.04, 0.6, 8]} /></mesh>
      <mesh ref={fr} position={[-0.16, 0.15, 0.32]} material={silverMat}><cylinderGeometry args={[0.04, 0.04, 0.6, 8]} /></mesh>
      <mesh ref={bl} position={[0.16, 0.15, -0.32]} material={silverMat}><cylinderGeometry args={[0.04, 0.04, 0.6, 8]} /></mesh>
      <mesh ref={br} position={[-0.16, 0.15, -0.32]} material={silverMat}><cylinderGeometry args={[0.04, 0.04, 0.6, 8]} /></mesh>
      <mesh ref={tail} position={[0, 0.55, -0.55]} rotation={[0.6, 0, 0]} material={silverMat}>
        <capsuleGeometry args={[0.05, 0.18, 6, 12]} />
      </mesh>
      <pointLight color="#c0d8ff" intensity={6} distance={8} />
    </group>
  );
}

function Footprints({ doeRef, stateRef }: {
  doeRef: React.MutableRefObject<THREE.Group | null>;
  stateRef: React.MutableRefObject<{ walk: number }>;
}) {
  const grp = useRef<THREE.Group>(null);
  const next = useRef(0);
  const idx = useRef(0);
  const MAX = 24;
  const meshes = useMemo(() => Array.from({ length: MAX }, () => ({ pos: new THREE.Vector3(0, -1, 0), born: -100 })), []);
  useFrame((s) => {
    if (!grp.current || !doeRef.current) return;
    const now = s.clock.elapsedTime;
    if (stateRef.current.walk > 0.2 && now > next.current) {
      next.current = now + 0.35 / Math.max(0.5, stateRef.current.walk);
      const wp = new THREE.Vector3();
      doeRef.current.getWorldPosition(wp);
      const m = meshes[idx.current % MAX];
      m.pos.copy(wp);
      m.pos.y = -0.95;
      m.born = now;
      idx.current++;
    }
    grp.current.children.forEach((c, i) => {
      const m = meshes[i];
      const age = now - m.born;
      const a = Math.max(0, 1 - age / 4);
      c.position.copy(m.pos);
      c.scale.setScalar(0.15 + (1 - a) * 0.15);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = a * 0.7;
    });
  });
  return (
    <group ref={grp}>
      {meshes.map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
          <circleGeometry args={[1, 16]} />
          <meshBasicMaterial color={new THREE.Color(2.4, 2.8, 3.5)} transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function ParticleTrail({ doeRef, stateRef }: {
  doeRef: React.MutableRefObject<THREE.Group | null>;
  stateRef: React.MutableRefObject<{ vis: number }>;
}) {
  const ref = useRef<THREE.Points>(null);
  const N = 480;
  const data = useMemo(() => {
    const positions = new Float32Array(N * 3);
    const lives = new Float32Array(N);
    for (let i = 0; i < N; i++) lives[i] = Math.random() * 2;
    return { positions, lives };
  }, []);
  useFrame((_, dt) => {
    if (!ref.current || !doeRef.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const wp = new THREE.Vector3();
    doeRef.current.getWorldPosition(wp);
    for (let i = 0; i < N; i++) {
      data.lives[i] -= dt;
      if (data.lives[i] <= 0) {
        pos[i * 3] = wp.x + (Math.random() - 0.5) * 0.4;
        pos[i * 3 + 1] = wp.y + 0.4 + (Math.random() - 0.5) * 0.6;
        pos[i * 3 + 2] = wp.z + (Math.random() - 0.5) * 0.4;
        data.lives[i] = 1.2 + Math.random() * 0.8;
      } else {
        pos[i * 3 + 1] += dt * 0.3;
        pos[i * 3] += (Math.random() - 0.5) * dt * 0.2;
        pos[i * 3 + 2] += (Math.random() - 0.5) * dt * 0.2;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = 0.5 * stateRef.current.vis;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} count={N} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={new THREE.Color(2, 2.4, 3)} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

function Sequence({ onDone, setCaption, doeRef, stateRef }: {
  onDone: () => void;
  setCaption: (s: string) => void;
  doeRef: React.MutableRefObject<THREE.Group | null>;
  stateRef: React.MutableRefObject<{ vis: number; walk: number; burst: number; doeX: number; doeY: number; doeZ: number }>;
}) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 0.6, 0));
  const camPos = useRef({ x: 0, y: 1.5, z: 6 });
  const burstRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const obj = stateRef.current;
    camera.position.set(camPos.current.x, camPos.current.y, camPos.current.z);

    const tl = gsap.timeline({ onComplete: () => setTimeout(onDone, 2200) });
    tl.call(() => { whoosh(); setCaption("Expecto…"); });
    tl.to({}, { duration: 1.6 });
    tl.call(() => setCaption("…Patronum."));
    tl.to(obj, { vis: 1, duration: 1.8, ease: "power3.out" });
    tl.call(() => { sparkle(1.2); setCaption("A Patronus is born from a happy memory…"); });
    tl.to(obj, { walk: 0.7, doeZ: 1.0, duration: 3.2, ease: "sine.inOut" }, ">+0.6");
    tl.call(() => setCaption("Pause."));
    tl.to({}, { duration: 1.4 });
    tl.call(() => setCaption("When I searched my heart for the happiest one…"));
    tl.to(obj, { walk: 1.4, doeX: 2.6, doeZ: 0, duration: 1.6, ease: "power2.in" }, ">");
    tl.to(obj, { doeX: 1.8, doeZ: 2.8, duration: 1.6, ease: "none" }, ">");
    tl.to(obj, { doeX: -1.8, doeZ: 2.8, duration: 1.6, ease: "none" }, ">");
    tl.to(obj, { doeX: -2.6, doeZ: 0, duration: 1.6, ease: "none" }, ">");
    tl.call(() => { whoosh(); });
    tl.to(obj, { doeX: 0, doeY: 1.0, doeZ: 2.2, walk: 1.8, duration: 1.0, ease: "power3.out" }, ">");
    tl.to(obj, { doeY: 0, duration: 0.45, ease: "power2.in" }, ">");
    tl.to(obj, { walk: 0, duration: 0.6 }, ">");
    tl.call(() => setCaption("I found you, My Precious Rubyduby."));
    tl.to({}, { duration: 2.4 });
    tl.call(() => { whoosh(); sparkle(0.5); sparkle(2); setCaption("✨ You are my mostest happiest memory ✨"); });
    tl.to(obj, { burst: 1, duration: 1.2, ease: "power2.out" });
    tl.to({}, { duration: 1.6 });
    tl.call(() => setCaption("Happy Birthday, My Precious Rubyduby ❤️"));
    tl.to(obj, { vis: 0, burst: 0, duration: 2.0, ease: "power2.in" });
    tl.to({}, { duration: 1.5 });

    const camTl = gsap.timeline();
    camTl.to(camPos.current, { x: 0, y: 1.1, z: 4.2, duration: 3.4, ease: "power2.inOut" });
    camTl.to(camPos.current, { x: 3.2, y: 1.5, z: 2.6, duration: 4.4, ease: "sine.inOut" });
    camTl.to(camPos.current, { x: -3.6, y: 1.7, z: 1.6, duration: 4.4, ease: "sine.inOut" });
    camTl.to(camPos.current, { x: 0, y: 1.0, z: 3.2, duration: 3.0, ease: "power2.out" });
    camTl.to(camPos.current, { y: 1.4, z: 4.0, duration: 3.0, ease: "power2.inOut" });

    return () => { tl.kill(); camTl.kill(); };
  }, [camera, onDone, setCaption, stateRef]);

  useFrame(() => {
    const s = stateRef.current;
    camera.position.set(camPos.current.x, camPos.current.y, camPos.current.z);
    const target = s.vis > 0.4 && doeRef.current
      ? doeRef.current.position.clone().add(new THREE.Vector3(0, 0.6, 0))
      : new THREE.Vector3(0, 0.6, 0);
    lookTarget.current.lerp(target, 0.06);
    camera.lookAt(lookTarget.current);
    if (burstRef.current) {
      burstRef.current.position.set(s.doeX, 1, s.doeZ);
      burstRef.current.scale.setScalar(3 * s.burst);
      (burstRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - s.burst) * 0.8;
      burstRef.current.visible = s.burst > 0.01;
    }
  });

  return (
    <mesh ref={burstRef} visible={false}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color={new THREE.Color(3, 3.4, 4)} toneMapped={false} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

export function PatronusScene({ onDone }: { onDone: () => void }) {
  const doeRef = useRef<THREE.Group | null>(null);
  const stateRef = useRef({ vis: 0, walk: 0, burst: 0, doeX: 0, doeY: 0, doeZ: -2 });
  const [cast, setCast] = useState(false);
  const [caption, setCaption] = useState("");

  if (!cast) return <WandPrompt onCast={() => setCast(true)} spellLabel="Expecto Patronum" />;

  return (
    <div className="absolute inset-0" style={{ width: "100%", height: "100dvh", overflow: "hidden", background: "#040614" }}>
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 42 }}
        gl={{ antialias: false, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15, powerPreference: "high-performance" }}
        dpr={[1, 1.6]}
        style={{ width: "100%", height: "100%", display: "block", background: "#040614" }}
      >
        <color attach="background" args={["#040614"]} />
        <fog attach="fog" args={["#060820", 7, 26]} />
        <ambientLight intensity={0.22} color="#7088c0" />
        <directionalLight position={[-6, 12, -4]} intensity={2} color="#cfd8ff" castShadow shadow-mapSize={[1024, 1024]} />
        <hemisphereLight args={["#9fb6ff", "#0a0d18", 0.6]} />
        <pointLight position={[0, 6, 0]} intensity={1.2} color="#a8c0ff" distance={20} />

        <MoonShafts />
        <Ground />
        <Forest />
        <Fireflies />
        <Sparkles count={320} scale={[22, 7, 22]} size={1.8} speed={0.18} color="#a8c0ff" opacity={0.8} />
        <Sparkles count={160} scale={[28, 6, 28]} size={1} speed={0.1} color="#dfeaff" opacity={0.5} />

        <Doe stateRef={stateRef} refForCam={doeRef} />
        <Footprints doeRef={doeRef} stateRef={stateRef} />
        <ParticleTrail doeRef={doeRef} stateRef={stateRef} />
        <Sequence onDone={onDone} setCaption={setCaption} doeRef={doeRef} stateRef={stateRef} />
      </Canvas>

      <AnimatePresence mode="wait">
        {caption && (
          <motion.div
            key={caption}
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            transition={{ duration: 1.4 }}
            className="absolute inset-x-0 bottom-[14%] text-center pointer-events-none px-6"
          >
            <div className="script text-3xl md:text-5xl text-[oklch(0.92_0.04_220)] shimmer">{caption}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
