import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Text, Float, Sparkles, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export type Board3DLocation = {
  id: string;
  name: string;
  emoji: string;
  color: string; // hex
  x: number; // 0..100 board coord
  y: number; // 0..100 board coord
};

type Props = {
  locations: Board3DLocation[];
  currentIdx: number;
  completed: string[];
  onSelect: (id: string) => void;
};

// Map board coord (0..100) to 3D world coord on the board plane (~ -7..7)
const toWorld = (v: number) => (v / 100) * 14 - 7;

function Tile({
  loc,
  idx,
  state,
  onClick,
}: {
  loc: Board3DLocation;
  idx: number;
  state: "locked" | "current" | "done" | "available";
  onClick: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const x = toWorld(loc.x);
  const z = toWorld(loc.y);

  useFrame((s) => {
    if (!ref.current) return;
    if (state === "current") {
      ref.current.position.y = 0.45 + Math.sin(s.clock.elapsedTime * 3) * 0.08;
    } else {
      ref.current.position.y = 0.4;
    }
  });

  const baseColor = state === "done" ? "#22c55e" : state === "locked" ? "#9ca3af" : loc.color;

  return (
    <group position={[x, 0, z]}>
      {/* base shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[0.95, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} />
      </mesh>

      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          if (state !== "locked") onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = state === "locked" ? "not-allowed" : "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        {/* chunky tile body */}
        <RoundedBox args={[1.5, 0.7, 1.5]} radius={0.18} smoothness={6} castShadow receiveShadow>
          <meshStandardMaterial
            color={baseColor}
            roughness={0.35}
            metalness={0.15}
            emissive={state === "current" ? new THREE.Color(baseColor) : "#000"}
            emissiveIntensity={state === "current" ? 0.35 : 0}
          />
        </RoundedBox>

        {/* number badge */}
        <group position={[-0.55, 0.45, -0.55]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0.05, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.28}
            color="#78350f"
            anchorX="center"
            anchorY="middle"
          >
            {String(idx + 1)}
          </Text>
        </group>

        {/* emoji on top (using Text — emojis render via system fonts) */}
        <Text
          position={[0, 0.42, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.7}
          anchorX="center"
          anchorY="middle"
        >
          {state === "done" ? "✓" : state === "locked" ? "🔒" : loc.emoji}
        </Text>

        {/* name label floating above */}
        <Float speed={2} floatIntensity={0.3} rotationIntensity={0}>
          <group position={[0, 1.1, 0]}>
            <mesh>
              <planeGeometry args={[Math.max(1.6, loc.name.length * 0.16), 0.36]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <Text position={[0, 0, 0.01]} fontSize={0.2} color="#78350f" anchorX="center" anchorY="middle">
              {loc.name}
            </Text>
          </group>
        </Float>
      </group>
    </group>
  );
}

function Pawn({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Group>(null);
  const target = useRef(new THREE.Vector3(x, 0, z));
  target.current.set(x, 0, z);

  useFrame((s, dt) => {
    if (!ref.current) return;
    // smooth move
    ref.current.position.x += (target.current.x - ref.current.position.x) * Math.min(1, dt * 4);
    ref.current.position.z += (target.current.z - ref.current.position.z) * Math.min(1, dt * 4);
    // hover bob
    ref.current.position.y = 1.4 + Math.sin(s.clock.elapsedTime * 4) * 0.15;
    ref.current.rotation.y += dt * 0.6;
  });

  return (
    <group ref={ref}>
      {/* legs */}
      <mesh castShadow position={[-0.12, -0.55, 0]}>
        <capsuleGeometry args={[0.08, 0.25, 8, 16]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0.12, -0.55, 0]}>
        <capsuleGeometry args={[0.08, 0.25, 8, 16]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.6} />
      </mesh>
      {/* shoes */}
      <mesh castShadow position={[-0.12, -0.78, 0.05]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#78350f" roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0.12, -0.78, 0.05]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#78350f" roughness={0.4} />
      </mesh>
      {/* trench coat body (rounded) */}
      <mesh castShadow position={[0, -0.18, 0]}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial color="#d97706" roughness={0.55} />
      </mesh>
      {/* coat collar */}
      <mesh castShadow position={[0, 0.05, 0.0]}>
        <coneGeometry args={[0.32, 0.25, 16, 1, true]} />
        <meshStandardMaterial color="#b45309" roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* head */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color="#fcd9b8" roughness={0.5} />
      </mesh>
      {/* nose */}
      <mesh position={[0, 0.28, 0.3]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#f4a886" roughness={0.5} />
      </mesh>
      {/* eyes whites */}
      <mesh position={[-0.11, 0.36, 0.27]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0.11, 0.36, 0.27]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* pupils */}
      <mesh position={[-0.11, 0.36, 0.33]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.11, 0.36, 0.33]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* fedora brim */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.5} />
      </mesh>
      {/* fedora crown */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.28, 32]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.5} />
      </mesh>
      {/* hat band */}
      <mesh position={[0, 0.59, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.06, 32]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* magnifier in hand */}
      <group position={[0.5, 0.0, 0.2]} rotation={[0, 0, -0.4]}>
        <mesh castShadow>
          <torusGeometry args={[0.18, 0.04, 12, 24]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[0.15, 24]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.2, -0.2, 0]} rotation={[0, 0, -0.8]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.32, 12]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>
    </group>
  );
}

function Trail({ locations, completedCount }: { locations: Board3DLocation[]; completedCount: number }) {
  const points = locations.map((l) => new THREE.Vector3(toWorld(l.x), 0.42, toWorld(l.y)));
  const fullCurve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.3);
  const fullGeom = new THREE.TubeGeometry(fullCurve, 120, 0.07, 8, false);

  const donePoints = points.slice(0, Math.max(2, completedCount + 1));
  const doneCurve = completedCount > 0 ? new THREE.CatmullRomCurve3(donePoints, false, "catmullrom", 0.3) : null;
  const doneGeom = doneCurve ? new THREE.TubeGeometry(doneCurve, 80, 0.09, 8, false) : null;

  return (
    <group>
      <mesh geometry={fullGeom}>
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      {doneGeom && (
        <mesh geometry={doneGeom}>
          <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.4} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

function MovingLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime * 0.5;
    ref.current.position.x = Math.cos(t) * 7;
    ref.current.position.z = Math.sin(t) * 7;
    ref.current.position.y = 6 + Math.sin(t * 2) * 1.5;
  });
  return <pointLight ref={ref} intensity={40} color="#fde68a" distance={20} decay={1.5} castShadow />;
}

export default function DetetiveBoard3D({ locations, currentIdx, completed, onSelect }: Props) {
  const pawnLoc = locations[Math.min(currentIdx, locations.length - 1)];
  const px = toWorld(pawnLoc.x);
  const pz = toWorld(pawnLoc.y);

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 9, 11], fov: 42 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      {/* transparent background to let the Pixar diorama scene show through */}
      <fog attach="fog" args={["#fde6c2", 22, 42]} />

      <Suspense fallback={null}>
        {/* lights — sem sombras nem HDR para evitar context loss em mobile/tablet */}
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 10, 6]} intensity={1.2} />
        <pointLight position={[-6, 5, -5]} intensity={10} color="#a78bfa" distance={18} decay={1.5} />
        <pointLight position={[6, 5, 5]} intensity={10} color="#f472b6" distance={18} decay={1.5} />
        <MovingLight />


        {/* colorful Pixar-style floating board */}
        <group>
          {/* outer pink ring */}
          <mesh receiveShadow position={[0, 0.18, 0]}>
            <cylinderGeometry args={[8.0, 8.2, 0.3, 64]} />
            <meshStandardMaterial color="#f472b6" roughness={0.55} transparent opacity={0.95} />
          </mesh>
          {/* mid teal ring */}
          <mesh receiveShadow position={[0, 0.27, 0]}>
            <cylinderGeometry args={[7.4, 7.5, 0.32, 64]} />
            <meshStandardMaterial color="#5eead4" roughness={0.5} transparent opacity={0.95} />
          </mesh>
          {/* inner cream platform */}
          <mesh receiveShadow position={[0, 0.34, 0]}>
            <cylinderGeometry args={[6.9, 7.0, 0.34, 64]} />
            <meshStandardMaterial color="#fff7ed" roughness={0.55} transparent opacity={0.96} />
          </mesh>
          {/* decorative dashed border */}
          <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[6.55, 6.8, 64]} />
            <meshStandardMaterial color="#a855f7" side={THREE.DoubleSide} />
          </mesh>
          {/* colorful confetti dots scattered on the board */}
          {Array.from({ length: 28 }).map((_, i) => {
            const a = (i / 28) * Math.PI * 2;
            const r = 3 + ((i * 1.7) % 3);
            const colors = ["#fbbf24", "#f87171", "#60a5fa", "#34d399", "#a78bfa", "#fb7185"];
            return (
              <mesh key={i} position={[Math.cos(a) * r, 0.53, Math.sin(a) * r]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.18, 16]} />
                <meshStandardMaterial color={colors[i % colors.length]} />
              </mesh>
            );
          })}
        </group>

        <Trail locations={locations} completedCount={completed.length} />

        {locations.map((loc, i) => {
          const done = completed.includes(loc.id);
          const unlocked = i <= currentIdx;
          const isCurrent = i === currentIdx && !done;
          const state: "locked" | "current" | "done" | "available" = done
            ? "done"
            : isCurrent
              ? "current"
              : unlocked
                ? "available"
                : "locked";
          return (
            <Tile
              key={loc.id}
              loc={loc}
              idx={i}
              state={state}
              onClick={() => onSelect(loc.id)}
            />
          );
        })}

        <Pawn x={px} z={pz} />

        <Sparkles count={60} scale={[14, 4, 14]} size={3} speed={0.4} color="#fde68a" />

        <ContactShadows position={[0, 0.36, 0]} opacity={0.45} scale={20} blur={2.4} far={6} />

        <OrbitControls
          enablePan={false}
          minDistance={9}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Suspense>
    </Canvas>
  );
}
