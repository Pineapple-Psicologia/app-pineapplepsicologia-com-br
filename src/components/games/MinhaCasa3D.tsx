import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
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

const ROOM_W = 12;
const ROOM_D = 8;
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

function RoomFloor({ position, color, rug }: { position: [number, number, number]; color: string; rug: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[3.82, 0.16, 3.82]} radius={0.08} smoothness={3} receiveShadow>
        <meshStandardMaterial color={color} roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.08, 32]} />
        <meshStandardMaterial color={rug} roughness={0.9} />
      </mesh>
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

function Dollhouse() {
  return (
    <group>
      <RoomFloor position={[-4, 0, -2]} color="#f4d9b1" rug="#dc8f83"} />
      <RoomFloor position={[0, 0, -2]} color="#d9e9c6" rug="#e6b956"} />
      <RoomFloor position={[4, 0, -2]} color="#d7e8f3" rug="#729ebc"} />
      <RoomFloor position={[-4, 0, 2]} color="#f2dce7" rug="#ca82a8"} />
      <RoomFloor position={[0, 0, 2]} color="#efe5bb" rug="#82aa7b"} />
      <RoomFloor position={[4, 0, 2]} color="#ddd8ee" rug="#9d82bd"} />

      <Sofa position={[-4.1, 0.08, -2.5]} color="#cb6e5d" />
      <Table position={[0, 0.08, -2]} />
      <Bed position={[4, 0.08, -2]} color="#69a7c7" />
      <Bed position={[-4, 0.08, 2]} color="#d184a9" />
      <Sofa position={[0, 0.08, 2.45]} color="#819b68" />
      <Table position={[4, 0.08, 2]} />
      <Plant position={[-1.45, 0.08, -3.25]} />
      <Plant position={[5.35, 0.08, 3.25]} />

      {[-6, -2, 2, 6].map((x) => (
        <RoundedBox key={`back-${x}`} args={[0.1, 1.45, 4]} radius={0.03} position={[x, 0.76, -2]} castShadow receiveShadow>
          <meshStandardMaterial color="#fff8e9" roughness={0.82} />
        </RoundedBox>
      ))}
      {[-6, -2, 2, 6].map((x) => (
        <RoundedBox key={`front-${x}`} args={[0.1, 0.52, 4]} radius={0.03} position={[x, 0.3, 2]} castShadow receiveShadow>
          <meshStandardMaterial color="#fff8e9" roughness={0.82} />
        </RoundedBox>
      ))}
      <RoundedBox args={[12.1, 1.45, 0.1]} radius={0.03} position={[0, 0.76, -4]} castShadow receiveShadow>
        <meshStandardMaterial color="#fff8e9" roughness={0.82} />
      </RoundedBox>
      <RoundedBox args={[12.1, 0.48, 0.1]} radius={0.03} position={[0, 0.28, 4]} castShadow receiveShadow>
        <meshStandardMaterial color="#fff8e9" roughness={0.82} />
      </RoundedBox>
      <RoundedBox args={[12, 0.75, 0.08]} radius={0.03} position={[0, 0.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#fff8e9" roughness={0.82} />
      </RoundedBox>
    </group>
  );
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
          <Html center transform distanceFactor={7}>
            <button
              type="button"
              onPointerDown={(event) => {
                event.stopPropagation();
                props.onSelect(sticker.id);
              }}
              className={`cursor-grab select-none border-0 bg-transparent text-5xl ${props.selectedId === sticker.id ? "drop-shadow-lg" : ""}`}
              aria-label={`Mover ${sticker.emoji}`}
            >
              {sticker.emoji}
            </button>
          </Html>
        </Billboard>
      ))}

      <OrbitControls
        enabled={controlsEnabled}
        enablePan={false}
        enableRotate={false}
        enableZoom
        minDistance={10}
        maxDistance={22}
        target={[0, 0.5, 0]}
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
        camera={{ position: [9.8, 10.8, 12.5], fov: 38 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onPointerMissed={() => props.onSelect(null)}
      >
        <Scene props={props} />
      </Canvas>
    </Game3DGuard>
  );
}