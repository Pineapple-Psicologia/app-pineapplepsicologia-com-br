import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Environment, Html, Lightformer, OrbitControls, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import Game3DGuard from "./Game3DGuard";

export type CasaMood = "dia" | "aconchego" | "calmo" | "noite";
export type CasaPlaced = { id: string; charId: string; x: number; y: number; scale: number; flip: boolean; emotion: string };
export type CasaCover = { id: string; x: number; y: number; w: number; h: number; label: string };
export type CasaNote = { id: string; x: number; y: number; w: number; h: number; text: string; color: "amarelo" | "rosa" | "azul" | "verde" };
export type CasaSticker = { id: string; x: number; y: number; scale: number; emoji: string };
export type CasaCharacter = { id: string; label: string; img: string; isPet?: boolean };

type Props = {
  items: CasaPlaced[];
  covers: CasaCover[];
  notes: CasaNote[];
  stickers: CasaSticker[];
  characters: CasaCharacter[];
  mood: CasaMood;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
  onMoveCover: (id: string, x: number, y: number) => void;
  onMoveNote: (id: string, x: number, y: number) => void;
  onMoveSticker: (id: string, x: number, y: number) => void;
  onChangeNote: (id: string, text: string) => void;
};

type DragKind = "item" | "cover" | "note" | "sticker";
type DragState = { id: string; kind: DragKind } | null;

const ROOM_W = 16;
const ROOM_D = 12;
const toWorldX = (x: number) => (x - 0.5) * ROOM_W;
const toWorldZ = (y: number) => (y - 0.5) * ROOM_D;
const toNormalizedX = (x: number) => THREE.MathUtils.clamp(x / ROOM_W + 0.5, 0.03, 0.97);
const toNormalizedY = (z: number) => THREE.MathUtils.clamp(z / ROOM_D + 0.5, 0.04, 0.96);

const NOTE_COLORS: Record<CasaNote["color"], string> = {
  amarelo: "#fff1a8",
  rosa: "#ffc5d3",
  azul: "#b9ddff",
  verde: "#c8efc8",
};

const EMOTION_COLORS: Record<string, string> = {
  neutro: "#f6d365",
  feliz: "#fbbf24",
  calmo: "#60a5fa",
  amoroso: "#f472b6",
  triste: "#64748b",
  bravo: "#ef4444",
  ansioso: "#a855f7",
};

function RoomFloor({ position, size, color, rug }: { position: [number, number, number]; size: [number, number]; color: string; rug?: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[size[0] - 0.12, 0.16, size[1] - 0.12]} radius={0.06} smoothness={3} receiveShadow>
        <meshStandardMaterial color={color} roughness={0.82} />
      </RoundedBox>
      {rug && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[Math.min(size[0], size[1]) * 0.28, 32]} />
          <meshStandardMaterial color={rug} roughness={0.92} />
        </mesh>
      )}
    </group>
  );
}

function Wall({ position, size, color = "#f7f0e5" }: { position: [number, number, number]; size: [number, number, number]; color?: string }) {
  return (
    <RoundedBox args={size} radius={0.035} smoothness={3} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.8} />
    </RoundedBox>
  );
}

function Doorway({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position={[-0.72, 1.15, 0]} castShadow><boxGeometry args={[0.13, 2.3, 0.2]} /><meshStandardMaterial color="#9a6845" /></mesh>
      <mesh position={[0.72, 1.15, 0]} castShadow><boxGeometry args={[0.13, 2.3, 0.2]} /><meshStandardMaterial color="#9a6845" /></mesh>
      <mesh position={[0, 2.24, 0]} castShadow><boxGeometry args={[1.55, 0.14, 0.2]} /><meshStandardMaterial color="#9a6845" /></mesh>
    </group>
  );
}

function Window({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh><boxGeometry args={[1.8, 1.25, 0.08]} /><meshStandardMaterial color="#87cce1" roughness={0.2} metalness={0.05} /></mesh>
      <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.08, 1.3, 0.08]} /><meshStandardMaterial color="#f8f1e8" /></mesh>
      <mesh position={[0, 0, 0.06]}><boxGeometry args={[1.85, 0.08, 0.08]} /><meshStandardMaterial color="#f8f1e8" /></mesh>
      <mesh position={[0, -0.72, 0.08]} castShadow><boxGeometry args={[2, 0.13, 0.3]} /><meshStandardMaterial color="#d4b492" /></mesh>
    </group>
  );
}

function Sofa({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.8, 0.42, 0.72]} radius={0.16} smoothness={4} position={[0, 0.33, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.72} />
      </RoundedBox>
      <RoundedBox args={[1.72, 0.72, 0.22]} radius={0.12} smoothness={4} position={[0, 0.72, 0.26]} castShadow>
        <meshStandardMaterial color={color} roughness={0.72} />
      </RoundedBox>
      {[-0.92, 0.92].map((x) => (
        <RoundedBox key={x} args={[0.2, 0.55, 0.72]} radius={0.09} position={[x, 0.48, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.72} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Bed({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.55, 0.32, 2]} radius={0.12} position={[0, 0.28, 0]} castShadow>
        <meshStandardMaterial color="#f8e8d4" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[1.45, 0.16, 1.45]} radius={0.1} position={[0, 0.49, 0.22]} castShadow>
        <meshStandardMaterial color={color} roughness={0.86} />
      </RoundedBox>
      <RoundedBox args={[1.28, 0.14, 0.42]} radius={0.12} position={[0, 0.54, -0.62]} castShadow>
        <meshStandardMaterial color="#fffaf0" roughness={0.9} />
      </RoundedBox>
    </group>
  );
}

function Table({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.56, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 0.16, 32]} />
        <meshStandardMaterial color="#d69358" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.2, 0.55, 16]} />
        <meshStandardMaterial color="#9a5e39" roughness={0.7} />
      </mesh>
    </group>
  );
}

function DiningSet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[2.35, 0.18, 1.25]} radius={0.1} position={[0, 0.78, 0]} castShadow>
        <meshStandardMaterial color="#aa7148" roughness={0.55} />
      </RoundedBox>
      {[[-0.82, 0, -0.92], [0.82, 0, -0.92], [-0.82, 0, 0.92], [0.82, 0, 0.92]].map((p, index) => (
        <group key={index} position={p as [number, number, number]}>
          <RoundedBox args={[0.58, 0.13, 0.58]} radius={0.08} position={[0, 0.48, 0]} castShadow><meshStandardMaterial color="#6f8e78" /></RoundedBox>
          <RoundedBox args={[0.58, 0.7, 0.12]} radius={0.06} position={[0, 0.77, p[2] < 0 ? -0.23 : 0.23]} castShadow><meshStandardMaterial color="#6f8e78" /></RoundedBox>
        </group>
      ))}
    </group>
  );
}

function Kitchen({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[3.25, 0.95, 0.65]} radius={0.08} position={[0, 0.5, -0.82]} castShadow><meshStandardMaterial color="#d8e1d4" roughness={0.65} /></RoundedBox>
      <RoundedBox args={[1.15, 2.25, 0.7]} radius={0.08} position={[-1.25, 1.13, 0.25]} castShadow><meshStandardMaterial color="#e5e8e4" metalness={0.08} roughness={0.3} /></RoundedBox>
      <mesh position={[0.55, 1.02, -0.84]}><boxGeometry args={[0.8, 0.04, 0.45]} /><meshStandardMaterial color="#303b3a" metalness={0.35} roughness={0.22} /></mesh>
      {[0.3, 0.8].map((x) => <mesh key={x} position={[x, 1.06, -0.84]} rotation-x={-Math.PI / 2}><circleGeometry args={[0.13, 18]} /><meshStandardMaterial color="#111817" /></mesh>)}
      <mesh position={[-0.35, 1.02, -0.84]}><boxGeometry args={[0.72, 0.05, 0.42]} /><meshStandardMaterial color="#79aeb6" metalness={0.25} roughness={0.25} /></mesh>
    </group>
  );
}

function Bookshelf({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const books = ["#d2675d", "#ddb45e", "#648a91", "#7d6a9c", "#72a36f"];
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[1.65, 2.15, 0.42]} radius={0.06} position={[0, 1.08, 0]} castShadow><meshStandardMaterial color="#9b6848" roughness={0.7} /></RoundedBox>
      <mesh position={[0, 1.1, 0.24]}><boxGeometry args={[1.42, 1.86, 0.08]} /><meshStandardMaterial color="#f0dfc5" /></mesh>
      {[0.52, 1.08, 1.64].map((y) => <mesh key={y} position={[0, y, 0.31]}><boxGeometry args={[1.46, 0.09, 0.42]} /><meshStandardMaterial color="#8b583a" /></mesh>)}
      {books.map((color, index) => <mesh key={color} position={[-0.52 + index * 0.25, 0.78, 0.38]}><boxGeometry args={[0.18, 0.42 + (index % 2) * 0.12, 0.18]} /><meshStandardMaterial color={color} /></mesh>)}
    </group>
  );
}

function Bathroom({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.45, 0.52, 0.72]} radius={0.22} position={[-0.65, 0.36, 0]} castShadow><meshStandardMaterial color="#edf4f2" roughness={0.32} /></RoundedBox>
      <mesh position={[-0.65, 0.68, 0]} rotation-x={-Math.PI / 2}><torusGeometry args={[0.47, 0.05, 12, 24, Math.PI]} /><meshStandardMaterial color="#d4e7e5" /></mesh>
      <RoundedBox args={[0.62, 0.68, 0.62]} radius={0.16} position={[0.72, 0.42, 0]} castShadow><meshStandardMaterial color="#f6f8f7" /></RoundedBox>
      <mesh position={[0.72, 0.85, 0]}><cylinderGeometry args={[0.2, 0.28, 0.12, 20]} /><meshStandardMaterial color="#a7d1d3" /></mesh>
    </group>
  );
}

function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.8, 0.14, 0.75]} radius={0.06} position={[0, 0.75, 0]} castShadow><meshStandardMaterial color="#c78e5d" /></RoundedBox>
      <mesh position={[0, 1.18, -0.1]}><boxGeometry args={[0.92, 0.58, 0.08]} /><meshStandardMaterial color="#394f58" metalness={0.2} roughness={0.25} /></mesh>
      <mesh position={[0, 1.18, -0.04]}><planeGeometry args={[0.72, 0.4]} /><meshBasicMaterial color="#8ac7d4" /></mesh>
      <RoundedBox args={[0.75, 0.16, 0.72]} radius={0.08} position={[0, 0.42, 0.85]} castShadow><meshStandardMaterial color="#d4876a" /></RoundedBox>
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.2, 0.5, 18]} />
        <meshStandardMaterial color="#dc7b55" roughness={0.75} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.2, 0.78 + (i % 2) * 0.12, Math.sin(angle) * 0.2]} rotation={[0, angle, 0.4]} castShadow>
            <sphereGeometry args={[0.17, 12, 10]} />
            <meshStandardMaterial color={i % 2 ? "#70a65a" : "#4f8a55"} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function RoomLabel({ children, position }: { children: string; position: [number, number, number] }) {
  return <Text position={position} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.28} color="#7b6a58" anchorX="center" anchorY="middle">{children}</Text>;
}

function Dollhouse() {
  return (
    <group>
      <RoomFloor position={[-5.25, 0, -3.5]} size={[5.5, 5]} color="#d7c09c" rug="#bd705e" />
      <RoomFloor position={[0, 0, -3.5]} size={[5, 5]} color="#d9c6a4" rug="#d4aa51" />
      <RoomFloor position={[5.25, 0, -3.5]} size={[5.5, 5]} color="#c8ad86" />
      <RoomFloor position={[-5.25, 0, 1.25]} size={[5.5, 4.5]} color="#d8c0b0" rug="#b8799b" />
      <RoomFloor position={[0, 0, 1.25]} size={[5, 4.5]} color="#c7b99b" rug="#6f9581" />
      <RoomFloor position={[5.25, 0, 1.25]} size={[5.5, 4.5]} color="#bfc8c4" rug="#6f92a6" />
      <RoomFloor position={[-5.25, 0, 4.85]} size={[5.5, 2.7]} color="#b8a98d" />
      <RoomFloor position={[0, 0, 4.85]} size={[5, 2.7]} color="#c9b893" rug="#b87858" />
      <RoomFloor position={[5.25, 0, 4.85]} size={[5.5, 2.7]} color="#b5c0b1" />

      <Sofa position={[-5.1, 0.08, -4.2]} color="#b85f52" />
      <Table position={[-5.1, 0.08, -2.7]} />
      <DiningSet position={[0, 0.08, -3.45]} />
      <Kitchen position={[5.25, 0.08, -3.45]} />
      <Bed position={[-5.2, 0.08, 1.2]} color="#c37c99" />
      <Bed position={[0, 0.08, 1.2]} color="#688fac" />
      <Bathroom position={[5.15, 0.08, 1.25]} />
      <Bookshelf position={[-6.65, 0.08, 5.3]} rotation={Math.PI / 2} />
      <Desk position={[-4.6, 0.08, 4.95]} />
      <Sofa position={[0, 0.08, 5.1]} color="#718e75" />
      <Table position={[0, 0.08, 4.25]} />
      <Plant position={[-7.15, 0.08, -5.1]} />
      <Plant position={[2.05, 0.08, -5.1]} />
      <Plant position={[7.15, 0.08, 5.2]} />

      <Wall position={[0, 1.45, -6]} size={[16.2, 2.9, 0.18]} />
      <Wall position={[-8, 1.45, 0]} size={[0.18, 2.9, 12]} />
      <Wall position={[8, 1.45, 0]} size={[0.18, 2.9, 12]} />
      <Wall position={[-5.2, 1.45, 6]} size={[5.6, 2.9, 0.18]} />
      <Wall position={[5.2, 1.45, 6]} size={[5.6, 2.9, 0.18]} />
      <Wall position={[0, 2.55, 6]} size={[4.8, 0.7, 0.18]} />
      <Doorway x={0} z={6} />

      <Wall position={[-2.55, 1.45, -3.5]} size={[0.16, 2.9, 2.25]} />
      <Wall position={[-2.55, 1.45, 1.2]} size={[0.16, 2.9, 2]} />
      <Doorway x={-2.55} z={-0.95} rotation={Math.PI / 2} />
      <Wall position={[2.55, 1.45, -3.5]} size={[0.16, 2.9, 2.25]} />
      <Wall position={[2.55, 1.45, 1.2]} size={[0.16, 2.9, 2]} />
      <Doorway x={2.55} z={-0.95} rotation={Math.PI / 2} />
      <Wall position={[0, 1.45, -0.95]} size={[2.4, 2.9, 0.16]} />
      <Wall position={[-5.3, 1.45, -0.95]} size={[2.4, 2.9, 0.16]} />
      <Wall position={[5.3, 1.45, -0.95]} size={[2.4, 2.9, 0.16]} />
      <Doorway x={-3.9} z={-0.95} />
      <Doorway x={1.35} z={-0.95} />
      <Doorway x={6.7} z={-0.95} />
      <Wall position={[-5.3, 1.45, 3.55]} size={[2.4, 2.9, 0.16]} />
      <Wall position={[0, 1.45, 3.55]} size={[2.4, 2.9, 0.16]} />
      <Wall position={[5.3, 1.45, 3.55]} size={[2.4, 2.9, 0.16]} />
      <Doorway x={-3.9} z={3.55} />
      <Doorway x={1.35} z={3.55} />
      <Doorway x={6.7} z={3.55} />

      <Window position={[-5.1, 1.65, -5.88]} />
      <Window position={[0, 1.65, -5.88]} />
      <Window position={[5.15, 1.65, -5.88]} />
      <Window position={[-7.88, 1.65, 1.2]} rotation={Math.PI / 2} />
      <Window position={[7.88, 1.65, 1.2]} rotation={Math.PI / 2} />

      <RoomLabel position={[-5.2, 0.13, -1.3]}>SALA</RoomLabel>
      <RoomLabel position={[0, 0.13, -1.3]}>JANTAR</RoomLabel>
      <RoomLabel position={[5.2, 0.13, -1.3]}>COZINHA</RoomLabel>
      <RoomLabel position={[-5.2, 0.13, 3.2]}>QUARTO</RoomLabel>
      <RoomLabel position={[0, 0.13, 3.2]}>QUARTO</RoomLabel>
      <RoomLabel position={[5.2, 0.13, 3.2]}>BANHEIRO</RoomLabel>
      <RoomLabel position={[-5.2, 0.13, 5.7]}>ESTUDO</RoomLabel>
      <RoomLabel position={[0, 0.13, 5.7]}>CONVIVÊNCIA</RoomLabel>
      <RoomLabel position={[5.2, 0.13, 5.7]}>ENTRADA</RoomLabel>
    </group>
  );
}

function CameraEntrance() {
  const { camera } = useThree();
  const progress = useRef(0);
  const start = useMemo(() => new THREE.Vector3(0, 2.5, 13.5), []);
  const finish = useMemo(() => new THREE.Vector3(13.5, 15.2, 17.5), []);
  const look = useMemo(() => new THREE.Vector3(0, 0.6, 0), []);

  useFrame((_, rawDelta) => {
    if (progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + Math.min(rawDelta, 0.05) * 0.28);
    const eased = 1 - Math.pow(1 - progress.current, 3);
    camera.position.lerpVectors(start, finish, eased);
    camera.lookAt(look);
  });

  return null;
}

function CharacterFigure({ item, definition, selected, onStart, onMove, onEnd }: {
  item: CasaPlaced;
  definition: CasaCharacter;
  selected: boolean;
  onStart: (e: ThreeEvent<PointerEvent>) => void;
  onMove: (e: ThreeEvent<PointerEvent>) => void;
  onEnd: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const texture = useMemo(() => new THREE.TextureLoader().load(definition.img, (loaded) => {
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.needsUpdate = true;
  }), [definition.img]);
  const group = useRef<THREE.Group>(null);
  const height = (definition.isPet ? 1.05 : 1.75) * item.scale;
  const width = height * (definition.isPet ? 1.1 : 0.68);
  const glow = EMOTION_COLORS[item.emotion] ?? EMOTION_COLORS.neutro;

  useFrame(({ clock }, rawDelta) => {
    if (!group.current) return;
    const delta = Math.min(rawDelta, 0.05);
    const target = selected ? 1.04 : 1;
    group.current.scale.lerp(new THREE.Vector3(target, target, target), 1 - Math.exp(-9 * delta));
    group.current.position.y = Math.sin(clock.elapsedTime * 2 + item.x * 8) * 0.025;
  });

  return (
    <group ref={group} position={[toWorldX(item.x), 0, toWorldZ(item.y)]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[width * 0.46, 24]} />
        <meshBasicMaterial color={glow} transparent opacity={selected ? 0.72 : item.emotion === "neutro" ? 0.18 : 0.42} depthWrite={false} />
      </mesh>
      <Billboard position={[0, height / 2 + 0.08, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh
          scale={[item.flip ? -1 : 1, 1, 1]}
          onPointerDown={onStart}
          onPointerMove={onMove}
          onPointerUp={onEnd}
          onPointerCancel={onEnd}
        >
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.08} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {selected && (
          <Html center position={[0, height / 2 + 0.24, 0]} transform distanceFactor={7}>
            <div className="pointer-events-none whitespace-nowrap rounded-full border bg-card/95 px-2 py-1 text-xs font-bold text-card-foreground shadow-md">
              {definition.label}
            </div>
          </Html>
        )}
      </Billboard>
    </group>
  );
}

function Scene({ props }: { props: Props }) {
  const drag = useRef<DragState>(null);
  const [controlsEnabled, setControlsEnabled] = useState(true);
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const point = useMemo(() => new THREE.Vector3(), []);

  const startDrag = (kind: DragKind, id: string, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    drag.current = { kind, id };
    setControlsEnabled(false);
    props.onSelect(id);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const moveDrag = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current || !e.ray.intersectPlane(groundPlane, point)) return;
    e.stopPropagation();
    const x = toNormalizedX(point.x);
    const y = toNormalizedY(point.z);
    const current = drag.current;
    if (current.kind === "item") props.onMoveItem(current.id, x, y);
    if (current.kind === "cover") props.onMoveCover(current.id, x, y);
    if (current.kind === "note") props.onMoveNote(current.id, x, y);
    if (current.kind === "sticker") props.onMoveSticker(current.id, x, y);
  };

  const endDrag = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    drag.current = null;
    setControlsEnabled(true);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const ambience = props.mood === "noite" ? 0.38 : props.mood === "calmo" ? 0.72 : 0.88;
  const background = props.mood === "noite" ? "#26304d" : props.mood === "calmo" ? "#b9dced" : props.mood === "aconchego" ? "#f2c58d" : "#bde3ed";

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 20, 34]} />
      <ambientLight intensity={ambience} />
      <hemisphereLight args={[props.mood === "noite" ? "#7788b8" : "#d8f4ff", "#806d53", ambience]} />
      <directionalLight position={[-7, 12, 8]} intensity={props.mood === "noite" ? 0.65 : 1.45} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 4, 0]} color={props.mood === "aconchego" ? "#ffb45e" : "#fff1ca"} intensity={props.mood === "noite" ? 7 : 3} distance={17} />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 7, 2]} scale={[12, 12, 1]} />
        <Lightformer intensity={1} color="#f5b77d" position={[-7, 2, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
      </Environment>

      <CameraEntrance />
      <Dollhouse />

      <mesh
        position={[0, 0.17, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerDown={() => props.onSelect(null)}
      >
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Suspense fallback={null}>
        {props.items.map((item) => {
          const definition = props.characters.find((character) => character.id === item.charId);
          if (!definition) return null;
          return (
            <CharacterFigure
              key={item.id}
              item={item}
              definition={definition}
              selected={props.selectedId === item.id}
              onStart={(e) => startDrag("item", item.id, e)}
              onMove={moveDrag}
              onEnd={endDrag}
            />
          );
        })}
      </Suspense>

      {props.covers.map((cover) => (
        <group key={cover.id} position={[toWorldX(cover.x + cover.w / 2), 0.2, toWorldZ(cover.y + cover.h / 2)]}>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerDown={(e) => startDrag("cover", cover.id, e)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          >
            <planeGeometry args={[cover.w * ROOM_W, cover.h * ROOM_D]} />
            <meshStandardMaterial color="#eee5d4" transparent opacity={0.88} roughness={0.9} />
          </mesh>
          <Text position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.22} color="#76583b" anchorX="center" anchorY="middle" maxWidth={cover.w * ROOM_W * 0.86}>
            {cover.label}
          </Text>
        </group>
      ))}

      {props.notes.map((note) => (
        <group key={note.id} position={[toWorldX(note.x + note.w / 2), 0.34, toWorldZ(note.y + note.h / 2)]}>
          <mesh
            rotation={[-Math.PI / 2, 0, -0.025]}
            onPointerDown={(e) => startDrag("note", note.id, e)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          >
            <planeGeometry args={[Math.max(0.9, note.w * ROOM_W), Math.max(0.7, note.h * ROOM_D)]} />
            <meshStandardMaterial color={NOTE_COLORS[note.color]} roughness={0.94} />
          </mesh>
          <Html center position={[0, 0.08, 0]} transform rotation-x={-Math.PI / 2} distanceFactor={8}>
            <textarea
              value={note.text}
              maxLength={500}
              onChange={(event) => props.onChangeNote(note.id, event.target.value)}
              onPointerDown={(event) => event.stopPropagation()}
              placeholder="Escreva aqui"
              aria-label="Texto da nota"
              className="h-20 w-32 resize-none rounded-sm border-0 bg-transparent p-2 text-xs font-semibold text-foreground outline-none"
            />
          </Html>
        </group>
      ))}

      {props.stickers.map((sticker) => (
        <Billboard key={sticker.id} position={[toWorldX(sticker.x), 1.1 * sticker.scale, toWorldZ(sticker.y)]}>
          <mesh
            onPointerDown={(event) => startDrag("sticker", sticker.id, event)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          >
            <planeGeometry args={[1.15 * sticker.scale, 1.15 * sticker.scale]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <Html center transform distanceFactor={7}>
            <div className={`pointer-events-none select-none text-5xl ${props.selectedId === sticker.id ? "drop-shadow-lg" : ""}`} aria-label={sticker.emoji}>
              {sticker.emoji}
            </div>
          </Html>
        </Billboard>
      ))}

      <OrbitControls
        enabled={controlsEnabled}
        enablePan={false}
        enableRotate
        enableZoom
        minDistance={11}
        maxDistance={30}
        minPolarAngle={0.5}
        maxPolarAngle={1.15}
        minAzimuthAngle={-1.1}
        maxAzimuthAngle={1.1}
        target={[0, 0.65, 0]}
        touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    </>
  );
}

function Fallback() {
  return (
    <div className="grid h-full min-h-[420px] place-items-center bg-secondary/70 px-6 text-center text-sm font-bold text-muted-foreground">
      Este aparelho não conseguiu abrir a casa em 3D.
    </div>
  );
}

export default function MinhaCasa3D(props: Props) {
  return (
    <Game3DGuard fallback={<Fallback />}>
      <Canvas
        shadows
        dpr={[1, 1.35]}
        camera={{ position: [0, 2.5, 13.5], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onPointerMissed={() => props.onSelect(null)}
      >
        <Scene props={props} />
      </Canvas>
    </Game3DGuard>
  );
}