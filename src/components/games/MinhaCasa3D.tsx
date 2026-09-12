import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Environment, Html, Lightformer, OrbitControls, RoundedBox, Text, useTexture } from "@react-three/drei";
import { DoorOpen, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import casaAvoLoading from "@/assets/casa-avo-loading.jpg";
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
type SceneProps = Props & { lowPower: boolean };
type ViewMode = "overview" | "walk";
type NavigationInput = { targetX: number; targetZ: number; moving: boolean; lookX: number; lookY: number };

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
        <meshPhysicalMaterial color={color} roughness={0.72} clearcoat={0.12} clearcoatRoughness={0.82} />
      </RoundedBox>
      {rug && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[Math.min(size[0], size[1]) * 0.28, 32]} />
          <meshStandardMaterial color={rug} roughness={0.96} />
        </mesh>
      )}
    </group>
  );
}

function Wall({ position, size, color = "#f7f0e5" }: { position: [number, number, number]; size: [number, number, number]; color?: string }) {
  return (
    <RoundedBox args={size} radius={0.035} smoothness={3} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.76} />
    </RoundedBox>
  );
}

function Doorway({ x, z, rotation = 0, front = false }: { x: number; z: number; rotation?: number; front?: boolean }) {
  const leftDoor = useRef<THREE.Group>(null);
  const rightDoor = useRef<THREE.Group>(null);
  const { camera, invalidate } = useThree();

  useFrame((_, rawDelta) => {
    if (!front || !leftDoor.current || !rightDoor.current) return;
    const distance = Math.hypot(camera.position.x - x, camera.position.z - z);
    const target = distance < 18 ? Math.PI * 0.4 : 0;
    const easing = 1 - Math.exp(-6 * Math.min(rawDelta, 0.05));
    const nextLeft = THREE.MathUtils.lerp(leftDoor.current.rotation.y, target, easing);
    const nextRight = THREE.MathUtils.lerp(rightDoor.current.rotation.y, -target, easing);
    if (Math.abs(nextLeft - leftDoor.current.rotation.y) > 0.001 || Math.abs(nextRight - rightDoor.current.rotation.y) > 0.001) {
      leftDoor.current.rotation.y = nextLeft;
      rightDoor.current.rotation.y = nextRight;
      invalidate();
    }
  });

  const halfWidth = front ? 1.08 : 0.72;
  const frameWidth = front ? 2.5 : 1.55;
  const panelWidth = front ? 1.02 : 0.65;
  const frameColor = front ? "#8c5a3c" : "#9a6845";

  const doorLeaf = (side: -1 | 1) => (
    <>
      <RoundedBox args={[panelWidth, 2.14, 0.12]} radius={0.05} smoothness={4} position={[(side * panelWidth) / 2, 1.08, 0]} castShadow>
        <meshPhysicalMaterial color="#37958c" roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.22} sheen={0.4} sheenColor="#7fe0d3" />
      </RoundedBox>
      {[0.52, 1.26].map((y) => (
        <RoundedBox key={y} args={[panelWidth * 0.62, y > 1 ? 0.72 : 0.62, 0.04]} radius={0.03} smoothness={3} position={[(side * panelWidth) / 2, y, 0.07]}>
          <meshPhysicalMaterial color="#2f857d" roughness={0.34} clearcoat={0.5} />
        </RoundedBox>
      ))}
      <mesh position={[(side * panelWidth) / 2, 1.86, 0.07]}>
        <cylinderGeometry args={[0.19, 0.19, 0.04, 18]} />
        <meshPhysicalMaterial color="#cfeef0" roughness={0.1} clearcoat={1} transmission={0.35} thickness={0.1} />
      </mesh>
      <mesh position={[side * (panelWidth - 0.16), 1.05, 0.11]}>
        <sphereGeometry args={[0.058, 14, 10]} />
        <meshStandardMaterial color="#f3c55e" metalness={0.75} roughness={0.2} />
      </mesh>
    </>
  );

  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position={[-halfWidth, 1.15, 0]} castShadow><boxGeometry args={[front ? 0.2 : 0.13, 2.3, 0.24]} /><meshStandardMaterial color={frameColor} roughness={0.68} /></mesh>
      <mesh position={[halfWidth, 1.15, 0]} castShadow><boxGeometry args={[front ? 0.2 : 0.13, 2.3, 0.24]} /><meshStandardMaterial color={frameColor} roughness={0.68} /></mesh>
      <mesh position={[0, 2.28, 0]} castShadow><boxGeometry args={[frameWidth, front ? 0.22 : 0.14, 0.24]} /><meshStandardMaterial color={frameColor} roughness={0.68} /></mesh>
      {front && (
        <>
          <group ref={leftDoor} position={[-1.01, 0, -0.08]}>{doorLeaf(1)}</group>
          <group ref={rightDoor} position={[1.01, 0, -0.08]}>{doorLeaf(-1)}</group>
          <mesh position={[0, 0.06, 0.16]} receiveShadow><boxGeometry args={[2.5, 0.12, 0.7]} /><meshStandardMaterial color="#c9a882" roughness={0.9} /></mesh>
        </>
      )}
    </group>
  );
}


function Window({ position, rotation = 0, front = false }: { position: [number, number, number]; rotation?: number; front?: boolean }) {
  const frame = "#8c5a3c";
  return (
    <group position={position} rotation-y={rotation}>
      <mesh><boxGeometry args={[1.8, 1.25, 0.08]} /><meshPhysicalMaterial color="#a9e0ec" roughness={0.08} metalness={0.02} transmission={0.12} clearcoat={0.8} emissive="#7cc0d2" emissiveIntensity={0.12} /></mesh>
      {front && (
        <>
          <RoundedBox args={[2.12, 0.18, 0.16]} radius={0.05} smoothness={3} position={[0, 0.7, 0.06]} castShadow><meshStandardMaterial color={frame} roughness={0.6} /></RoundedBox>
          <RoundedBox args={[2.12, 0.18, 0.16]} radius={0.05} smoothness={3} position={[0, -0.7, 0.06]} castShadow><meshStandardMaterial color={frame} roughness={0.6} /></RoundedBox>
          {[-0.97, 0.97].map((x) => (
            <RoundedBox key={x} args={[0.18, 1.58, 0.16]} radius={0.05} smoothness={3} position={[x, 0, 0.06]} castShadow><meshStandardMaterial color={frame} roughness={0.6} /></RoundedBox>
          ))}
        </>
      )}
      <mesh position={[0, 0, 0.07]}><boxGeometry args={[0.09, 1.3, 0.09]} /><meshStandardMaterial color={frame} roughness={0.6} /></mesh>
      <mesh position={[0, 0, 0.07]}><boxGeometry args={[1.85, 0.09, 0.09]} /><meshStandardMaterial color={frame} roughness={0.6} /></mesh>
      <mesh position={[0, -0.82, 0.1]} castShadow><boxGeometry args={[2.3, 0.14, 0.34]} /><meshStandardMaterial color="#e6d3b3" roughness={0.85} /></mesh>
      {front && (
        <group position={[0, -1.02, 0.2]}>
          <RoundedBox args={[1.72, 0.32, 0.36]} radius={0.07} smoothness={3} castShadow><meshStandardMaterial color="#b6764f" roughness={0.85} /></RoundedBox>
          {[-0.58, -0.2, 0.2, 0.58].map((x, i) => (
            <group key={x} position={[x, 0.22, 0.04]}>
              <mesh castShadow><sphereGeometry args={[0.13, 10, 8]} /><meshStandardMaterial color="#4f9257" roughness={0.95} /></mesh>
              <mesh position={[0, 0.13, 0.03]} castShadow><sphereGeometry args={[0.085, 10, 8]} /><meshStandardMaterial color={["#ef7f9a", "#f2c85f", "#e8697a", "#f0a15c"][i]} roughness={0.8} /></mesh>
            </group>
          ))}
        </group>
      )}
      <RoundedBox args={[0.42, 1.6, 0.09]} radius={0.08} smoothness={3} position={[-1.22, -0.05, 0.14]} castShadow>
        <meshPhysicalMaterial color="#e9b7a2" roughness={0.9} sheen={0.42} sheenColor="#fff0da" />
      </RoundedBox>
      <RoundedBox args={[0.42, 1.6, 0.09]} radius={0.08} smoothness={3} position={[1.22, -0.05, 0.14]} castShadow>
        <meshPhysicalMaterial color="#e9b7a2" roughness={0.9} sheen={0.42} sheenColor="#fff0da" />
      </RoundedBox>
    </group>
  );
}


function Sofa({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.8, 0.42, 0.72]} radius={0.16} smoothness={4} position={[0, 0.33, 0]} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.76} sheen={0.45} sheenColor={color} />
      </RoundedBox>
      <RoundedBox args={[1.72, 0.72, 0.22]} radius={0.12} smoothness={4} position={[0, 0.72, 0.26]} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.76} sheen={0.45} sheenColor={color} />
      </RoundedBox>
      {[-0.92, 0.92].map((x) => (
        <RoundedBox key={x} args={[0.2, 0.55, 0.72]} radius={0.09} position={[x, 0.48, 0]} castShadow>
          <meshPhysicalMaterial color={color} roughness={0.76} sheen={0.45} sheenColor={color} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.62, 0.3, 0.16]} radius={0.1} smoothness={3} position={[-0.43, 0.72, 0.4]} rotation-z={0.08} castShadow>
        <meshPhysicalMaterial color="#f4c86d" roughness={0.82} sheen={0.35} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.3, 0.16]} radius={0.1} smoothness={3} position={[0.43, 0.72, 0.4]} rotation-z={-0.08} castShadow>
        <meshPhysicalMaterial color="#78a8a0" roughness={0.82} sheen={0.35} />
      </RoundedBox>
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
        <meshPhysicalMaterial color={color} roughness={0.82} sheen={0.5} sheenColor={color} />
      </RoundedBox>
      {[-0.42, 0, 0.42].map((x, index) => (
        <RoundedBox key={x} args={[0.36, 0.05, 1.2]} radius={0.025} position={[x, 0.59, 0.25]} castShadow>
          <meshStandardMaterial color={["#e9b95f", "#73a58b", "#d77867"][index]} roughness={0.92} />
        </RoundedBox>
      ))}
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

function CrochetRug({ position, color = "#c66058", scale = 1 }: { position: [number, number, number]; color?: string; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[0.92, 0.7, 0.47, 0.24].map((radius, index) => (
        <mesh key={radius} position={[0, index * 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[radius - 0.09, radius, 32]} />
          <meshStandardMaterial color={index % 2 ? "#f1d68c" : color} roughness={0.98} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return (
          <mesh key={angle} position={[Math.cos(angle) * 1.02, 0, Math.sin(angle) * 1.02]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 10]} />
            <meshStandardMaterial color={color} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function RockingChair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      {[-0.34, 0.34].map((x) => (
        <group key={x} position-x={x}>
          <mesh position={[0, 0.12, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.58, 0.055, 8, 22, Math.PI]} /><meshStandardMaterial color="#875535" roughness={0.7} /></mesh>
          <mesh position={[0, 0.58, -0.28]} rotation-x={-0.1}><cylinderGeometry args={[0.045, 0.055, 1.15, 10]} /><meshStandardMaterial color="#9b6640" /></mesh>
          <mesh position={[0, 0.58, 0.28]} rotation-x={0.1}><cylinderGeometry args={[0.045, 0.055, 1.15, 10]} /><meshStandardMaterial color="#9b6640" /></mesh>
        </group>
      ))}
      <RoundedBox args={[0.82, 0.16, 0.72]} radius={0.08} position={[0, 0.66, 0]} rotation-x={-0.08} castShadow><meshStandardMaterial color="#b87955" roughness={0.75} /></RoundedBox>
      <RoundedBox args={[0.8, 0.95, 0.14]} radius={0.07} position={[0, 1.08, 0.3]} rotation-x={-0.16} castShadow><meshStandardMaterial color="#a96d48" roughness={0.78} /></RoundedBox>
      <RoundedBox args={[0.7, 0.5, 0.09]} radius={0.07} position={[0, 1.1, 0.39]} rotation-x={-0.16} castShadow><meshPhysicalMaterial color="#d8a7a3" roughness={0.9} sheen={0.55} sheenColor="#fff0df" /></RoundedBox>
    </group>
  );
}

function GrandmotherClock({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.72, 1.75, 0.28]} radius={0.12} smoothness={4} position={[0, 0.88, 0]} castShadow><meshStandardMaterial color="#8b593b" roughness={0.68} /></RoundedBox>
      <mesh position={[0, 1.28, 0.17]}><circleGeometry args={[0.27, 24]} /><meshStandardMaterial color="#f5e4b9" roughness={0.75} /></mesh>
      <mesh position={[0, 1.28, 0.19]} rotation-z={-0.65}><boxGeometry args={[0.035, 0.22, 0.025]} /><meshStandardMaterial color="#594231" /></mesh>
      <mesh position={[0, 1.28, 0.2]} rotation-z={0.9}><boxGeometry args={[0.025, 0.15, 0.025]} /><meshStandardMaterial color="#594231" /></mesh>
      <mesh position={[0, 0.62, 0.18]}><sphereGeometry args={[0.12, 14, 10]} /><meshStandardMaterial color="#d4ad55" metalness={0.55} roughness={0.3} /></mesh>
      <mesh position={[0, 0.88, 0.17]}><cylinderGeometry args={[0.018, 0.018, 0.45, 8]} /><meshStandardMaterial color="#d4ad55" metalness={0.5} roughness={0.3} /></mesh>
    </group>
  );
}

function MemoryFrames({ position }: { position: [number, number, number] }) {
  const frames = [
    { x: -0.62, y: 0.06, color: "#d27668" },
    { x: 0, y: 0.16, color: "#6f9d8a" },
    { x: 0.62, y: 0, color: "#d9ab58" },
  ];
  return (
    <group position={position}>
      {frames.map((frame) => (
        <group key={frame.x} position={[frame.x, frame.y, 0]}>
          <RoundedBox args={[0.52, 0.64, 0.09]} radius={0.05} castShadow><meshStandardMaterial color="#9a6845" roughness={0.72} /></RoundedBox>
          <mesh position={[0, 0, 0.06]}><planeGeometry args={[0.4, 0.5]} /><meshStandardMaterial color="#f4e5c6" roughness={0.88} /></mesh>
          <mesh position={[0, 0.08, 0.07]}><circleGeometry args={[0.1, 16]} /><meshStandardMaterial color={frame.color} /></mesh>
          <mesh position={[0, -0.14, 0.07]}><capsuleGeometry args={[0.1, 0.13, 3, 8]} /><meshStandardMaterial color={frame.color} /></mesh>
        </group>
      ))}
    </group>
  );
}

function KitchenMemories({ lowPower }: { lowPower: boolean }) {
  return (
    <group>
      <group position={[0, 0.74, -3.45]}>
        <mesh position={[0, 0.13, 0]} castShadow><cylinderGeometry args={[0.52, 0.58, 0.16, 28]} /><meshStandardMaterial color="#f1ce78" roughness={0.82} /></mesh>
        <mesh position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.36, 0.43, 0.12, 28]} /><meshStandardMaterial color="#bd704e" roughness={0.88} /></mesh>
        <mesh position={[0, 0.34, 0]} castShadow><sphereGeometry args={[0.05, 12, 8]} /><meshStandardMaterial color="#d8efe0" /></mesh>
      </group>
      <group position={[5.8, 1.2, -4.28]}>
        <mesh castShadow><sphereGeometry args={[0.25, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.75]} /><meshPhysicalMaterial color="#79a99e" roughness={0.5} clearcoat={0.28} /></mesh>
        <mesh position={[0.31, 0.02, 0]} rotation-z={Math.PI / 2}><torusGeometry args={[0.16, 0.035, 8, 16, Math.PI * 1.3]} /><meshStandardMaterial color="#79a99e" /></mesh>
        <mesh position={[-0.25, 0.16, 0]} rotation-z={-0.55}><coneGeometry args={[0.08, 0.36, 12]} /><meshStandardMaterial color="#79a99e" /></mesh>
      </group>
      {!lowPower && (
        <group position={[4.55, 1.16, -4.28]}>
          {[-0.24, 0, 0.24].map((x, index) => <mesh key={x} position-x={x}><cylinderGeometry args={[0.1, 0.09, 0.3, 14]} /><meshPhysicalMaterial color={["#df8068", "#f1cf78", "#72a18c"][index]} roughness={0.58} clearcoat={0.18} /></mesh>)}
        </group>
      )}
    </group>
  );
}

function GrandmaDecor({ lowPower }: { lowPower: boolean }) {
  return (
    <group>
      <CrochetRug position={[-5.1, 0.19, -3.05]} color="#c76158" scale={0.9} />
      <CrochetRug position={[0, 0.19, 4.8]} color="#6f9b82" scale={0.72} />
      <RockingChair position={[-6.65, 0.08, -2.55]} rotation={0.48} />
      <GrandmotherClock position={[-7.72, 0.08, -1.75]} />
      <MemoryFrames position={[-5.1, 1.78, -5.76]} />
      <KitchenMemories lowPower={lowPower} />
      {!lowPower && (
        <>
          <group position={[0.78, 1.08, -3.15]}>
            <mesh castShadow><cylinderGeometry args={[0.09, 0.12, 0.25, 14]} /><meshStandardMaterial color="#f4e6c8" roughness={0.8} /></mesh>
            <mesh position={[0, 0.24, 0]} castShadow><sphereGeometry args={[0.18, 14, 10]} /><meshStandardMaterial color="#db7868" roughness={0.85} /></mesh>
          </group>
          <group position={[0.05, 0.82, 4.2]}>
            <mesh castShadow><boxGeometry args={[0.7, 0.42, 0.3]} /><meshStandardMaterial color="#7f533d" roughness={0.66} /></mesh>
            <mesh position={[0, 0.06, 0.17]}><planeGeometry args={[0.47, 0.2]} /><meshStandardMaterial color="#e8c377" emissive="#d59f4e" emissiveIntensity={0.08} /></mesh>
            <mesh position={[-0.23, -0.13, 0.18]}><circleGeometry args={[0.045, 12]} /><meshStandardMaterial color="#ddc491" /></mesh>
            <mesh position={[0.23, -0.13, 0.18]}><circleGeometry args={[0.045, 12]} /><meshStandardMaterial color="#ddc491" /></mesh>
          </group>
        </>
      )}
    </group>
  );
}

function WallPicture({ position, rotation = 0, color = "#e98a67" }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[1.05, 0.78, 0.1]} radius={0.06} smoothness={3} castShadow>
        <meshStandardMaterial color="#a86f46" roughness={0.62} />
      </RoundedBox>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[0.83, 0.57]} />
        <meshStandardMaterial color={color} roughness={0.8} emissive={color} emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[-0.16, 0.02, 0.075]}>
        <circleGeometry args={[0.15, 18]} />
        <meshStandardMaterial color="#f8d681" roughness={0.75} />
      </mesh>
    </group>
  );
}

function FloorLamp({ position, lowPower }: { position: [number, number, number]; lowPower: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} castShadow><cylinderGeometry args={[0.28, 0.34, 0.16, 16]} /><meshStandardMaterial color="#815c49" roughness={0.6} /></mesh>
      <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.045, 0.055, 1.65, 10]} /><meshStandardMaterial color="#b88555" metalness={0.25} roughness={0.45} /></mesh>
      <mesh position={[0, 1.72, 0]} castShadow><coneGeometry args={[0.42, 0.58, 18, 1, true]} /><meshStandardMaterial color="#f2b85b" roughness={0.68} emissive="#ffb65d" emissiveIntensity={0.35} side={THREE.DoubleSide} /></mesh>
      {!lowPower && <pointLight position={[0, 1.55, 0]} color="#ffbd70" intensity={1.2} distance={4.8} decay={2} />}
    </group>
  );
}

function Pendant({ position, lowPower }: { position: [number, number, number]; lowPower: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.025, 0.025, 0.75, 8]} /><meshStandardMaterial color="#76594a" roughness={0.5} /></mesh>
      <mesh position={[0, -0.05, 0]} castShadow><sphereGeometry args={[0.2, 16, 10]} /><meshStandardMaterial color="#ffd58a" roughness={0.3} emissive="#ffb45e" emissiveIntensity={0.75} /></mesh>
      <mesh position={[0, 0.03, 0]} castShadow><coneGeometry args={[0.5, 0.42, 18, 1, true]} /><meshStandardMaterial color="#e7a75f" roughness={0.65} side={THREE.DoubleSide} /></mesh>
      {!lowPower && <pointLight position={[0, -0.18, 0]} color="#ffc27c" intensity={0.9} distance={4.5} decay={2} />}
    </group>
  );
}

function DecorativeDetails({ lowPower }: { lowPower: boolean }) {
  return (
    <group>
      <WallPicture position={[-5.15, 1.72, -5.78]} color="#e57f68" />
      <WallPicture position={[0, 1.72, -5.78]} color="#6aa6a2" />
      <WallPicture position={[5.1, 1.72, -5.78]} color="#e8b85d" />
      <FloorLamp position={[-7.05, 0.08, -5.05]} lowPower={lowPower} />
      <FloorLamp position={[1.85, 0.08, 5.15]} lowPower={lowPower} />
      <Pendant position={[0, 2.45, -3.45]} lowPower={lowPower} />
      {!lowPower && <Pendant position={[5.25, 2.42, -3.45]} lowPower={false} />}
      <group position={[0, 0.68, -3.45]}>
        <mesh castShadow><sphereGeometry args={[0.25, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e4b96b" roughness={0.65} /></mesh>
        {[-0.13, 0.02, 0.16].map((x, index) => <mesh key={x} position={[x, 0.16 + index * 0.03, 0]} castShadow><sphereGeometry args={[0.1, 12, 8]} /><meshStandardMaterial color={index === 1 ? "#7aa561" : "#dc7656"} roughness={0.75} /></mesh>)}
      </group>
      {!lowPower && (
        <>
          <Plant position={[-2.05, 0.08, 2.95]} />
          <Plant position={[2.05, 0.08, 2.95]} />
          <RoundedBox args={[1.2, 0.08, 0.7]} radius={0.04} position={[5.1, 0.24, 4.7]} receiveShadow><meshStandardMaterial color="#79a79e" roughness={0.9} /></RoundedBox>
        </>
      )}
    </group>
  );
}

function RoomLabel({ children, position }: { children: string; position: [number, number, number] }) {
  return <Text position={position} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.28} color="#7b6a58" anchorX="center" anchorY="middle">{children}</Text>;
}

function RoofSlope({ z, depth, angle, lowPower }: { z: number; depth: number; angle: number; lowPower: boolean }) {
  const tiles = lowPower ? [] : Array.from({ length: 21 }, (_, index) => -8.2 + index * 0.82);
  return (
    <group position={[0, 4.08, z]} rotation-x={angle}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[17.6, 0.2, depth]} />
        <meshStandardMaterial color="#c9694f" roughness={0.82} />
      </mesh>
      {tiles.map((x) => (
        <mesh key={x} position={[x, 0.14, 0]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.11, 0.11, depth, 8, 1, true]} />
          <meshStandardMaterial color="#d97a58" roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function CeilingAndRoof({ visible, lowPower }: { visible: boolean; lowPower: boolean }) {
  if (!visible) return null;
  return (
    <group>
      <mesh position={[0, 2.96, 0]} receiveShadow>
        <boxGeometry args={[16.35, 0.16, 12.35]} />
        <meshStandardMaterial color="#fff7e9" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <RoofSlope z={3.35} depth={7.6} angle={0.255} lowPower={lowPower} />
      <RoofSlope z={-3.35} depth={7.6} angle={-0.255} lowPower={lowPower} />
      <mesh position={[0, 5.02, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 17.6, 10]} />
        <meshStandardMaterial color="#b95a43" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.12, 6.82]} castShadow>
        <boxGeometry args={[17.9, 0.26, 0.34]} />
        <meshStandardMaterial color="#98503d" roughness={0.78} />
      </mesh>
    </group>
  );
}


export type GardenStyle = "florido" | "sereno" | "outono";

const gardenPalettes: Record<GardenStyle, { grass: string; path: string; bushes: [string, string]; flowers: string[]; pot: string }> = {
  florido: { grass: "#7fa96b", path: "#d9c6a6", bushes: ["#63a567", "#4f8f62"], flowers: ["#ef7f9a", "#f2c85f", "#8fb9e3", "#f09a8d"], pot: "#dc8660" },
  sereno: { grass: "#8fb59a", path: "#dfe2df", bushes: ["#7bab92", "#5f9a84"], flowers: ["#cfe3f2", "#e8eef2", "#b9d4e8", "#dfeaf0"], pot: "#b8b3a6" },
  outono: { grass: "#a89358", path: "#e0c79c", bushes: ["#b9873f", "#96693a"], flowers: ["#e0793f", "#f0b23c", "#c4522f", "#e8934a"], pot: "#a9613c" },
};

function FrontGarden({ lowPower, style = "florido" }: { lowPower: boolean; style?: GardenStyle }) {
  const palette = gardenPalettes[style];
  return (
    <group>
      <mesh position={[0, -0.11, 13.4]} receiveShadow>
        <boxGeometry args={[19, 0.18, 14.7]} />
        <meshStandardMaterial color={palette.grass} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.01, 13.2]} receiveShadow>
        <boxGeometry args={[1.55, 0.08, 14.5]} />
        <meshStandardMaterial color={palette.path} roughness={0.9} />
      </mesh>
      {[-5.8, -4.5, 4.5, 5.8].map((x, index) => (
        <group key={x} position={[x, 0, 7.6 + (index % 2) * 0.65]}>
          <mesh position={[0, 0.24, 0]} castShadow><cylinderGeometry args={[0.26, 0.34, 0.48, 12]} /><meshStandardMaterial color={palette.pot} /></mesh>
          <mesh position={[0, 0.72, 0]} castShadow><sphereGeometry args={[0.48, 14, 10]} /><meshStandardMaterial color={palette.bushes[index % 2]} roughness={0.9} /></mesh>
        </group>
      ))}
      {[-7, -6.45, -3.8, 3.8, 6.45, 7].map((x, index) => (
        <group key={x} position={[x, 0, 7 + (index % 2) * 0.38]}>
          <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.025, 0.035, 0.62, 7]} /><meshStandardMaterial color="#4d8454" roughness={0.95} /></mesh>
          <mesh position={[0, 0.66, 0]} castShadow><sphereGeometry args={[0.18, 12, 8]} /><meshStandardMaterial color={palette.flowers[index % palette.flowers.length]} roughness={0.9} /></mesh>
        </group>
      ))}
      {[-2.9, 2.9].map((x, index) => (
        <group key={x} position={[x, 0, 7.1]}>
          <mesh position={[0, 0.52, 0]} castShadow><sphereGeometry args={[0.72, 16, 12]} /><meshStandardMaterial color={palette.bushes[index % 2]} roughness={0.92} /></mesh>
          {!lowPower && [-0.42, 0, 0.42].map((dx, i) => (
            <mesh key={dx} position={[dx, 0.95 - i * 0.12, 0.5]} castShadow>
              <sphereGeometry args={[0.14, 10, 8]} />
              <meshStandardMaterial color={palette.flowers[i % palette.flowers.length]} roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
      {[-6.9, -6.3, -5.7, -5.1, -4.5, -3.9, 3.9, 4.5, 5.1, 5.7, 6.3, 6.9].map((x, index) => (
        <group key={`flower-bed-${x}`} position={[x, 0, 8.25 + (index % 3) * 0.22]}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <sphereGeometry args={[0.28, 10, 8]} />
            <meshStandardMaterial color={palette.bushes[index % 2]} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.58, 0.12]} castShadow>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color={palette.flowers[index % palette.flowers.length]} roughness={0.82} />
          </mesh>
        </group>
      ))}


      <RoundedBox args={[5.7, 0.18, 1.45]} radius={0.08} position={[0, 0.02, 6.55]} receiveShadow>
        <meshStandardMaterial color="#d7b68e" roughness={0.9} />
      </RoundedBox>
      {[0.18, 0.04, -0.1].map((y, index) => (
        <RoundedBox key={y} args={[4.1 + index * 0.55, 0.14, 0.58]} radius={0.04} position={[0, y, 7.05 + index * 0.34]} receiveShadow>
          <meshStandardMaterial color={index === 0 ? "#d8b48d" : "#c99f78"} roughness={0.9} />
        </RoundedBox>
      ))}
      {[-2.15, 2.15].map((x) => (
        <group key={x} position={[x, 0, 6.68]}>
          <mesh position={[0, 0.18, 0]} castShadow><cylinderGeometry args={[0.28, 0.32, 0.3, 20]} /><meshStandardMaterial color="#efe0c8" roughness={0.78} /></mesh>
          <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.17, 0.21, 2.15, 20]} /><meshPhysicalMaterial color="#f8eeda" roughness={0.6} clearcoat={0.25} /></mesh>
          <mesh position={[0, 2.56, 0]} castShadow><cylinderGeometry args={[0.3, 0.24, 0.24, 20]} /><meshStandardMaterial color="#efe0c8" roughness={0.78} /></mesh>
        </group>
      ))}
      <mesh position={[0, 2.76, 6.6]} castShadow><boxGeometry args={[6.1, 0.22, 2.1]} /><meshStandardMaterial color="#f8eeda" roughness={0.8} /></mesh>
      <group position={[0, 3.06, 6.9]} rotation-x={-0.3}>
        <mesh castShadow receiveShadow><boxGeometry args={[6.5, 0.16, 2.3]} /><meshStandardMaterial color="#cf6f52" roughness={0.8} /></mesh>
        {!lowPower && Array.from({ length: 9 }, (_, i) => -2.8 + i * 0.7).map((x) => (
          <mesh key={x} position={[x, 0.12, 0]} rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 2.3, 8, 1, true]} />
            <meshStandardMaterial color="#e0805c" roughness={0.75} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 2.16, 6.78]} castShadow><sphereGeometry args={[0.2, 16, 10]} /><meshStandardMaterial color="#ffd58a" emissive="#ffb45e" emissiveIntensity={0.65} roughness={0.3} /></mesh>
      {!lowPower && <pointLight position={[0, 2.1, 7]} color="#ffc477" intensity={1.1} distance={4.5} decay={2} />}
    </group>
  );
}

function FrontFacade() {
  const cream = "#f7e3c3";
  return (
    <group>
      <Wall position={[-7, 1.5, 6]} size={[2, 3, 0.24]} color={cream} />
      <Wall position={[7, 1.5, 6]} size={[2, 3, 0.24]} color={cream} />
      <Wall position={[-2.43, 1.5, 6]} size={[2.75, 3, 0.24]} color={cream} />
      <Wall position={[2.43, 1.5, 6]} size={[2.75, 3, 0.24]} color={cream} />
      <Wall position={[-4.8, 0.34, 6]} size={[2.4, 0.68, 0.24]} color={cream} />
      <Wall position={[4.8, 0.34, 6]} size={[2.4, 0.68, 0.24]} color={cream} />
      <Wall position={[-4.8, 2.62, 6]} size={[2.4, 0.76, 0.24]} color={cream} />
      <Wall position={[4.8, 2.62, 6]} size={[2.4, 0.76, 0.24]} color={cream} />
      <Wall position={[0, 2.68, 6]} size={[2.1, 0.64, 0.24]} color={cream} />
      {/* rodapé e cornija da fachada */}
      <mesh position={[0, 0.16, 6.16]} castShadow receiveShadow><boxGeometry args={[16.1, 0.32, 0.14]} /><meshStandardMaterial color="#e2c8a2" roughness={0.85} /></mesh>
      <mesh position={[0, 3.02, 6.24]} castShadow><boxGeometry args={[16.6, 0.24, 0.3]} /><meshStandardMaterial color="#fdf3e2" roughness={0.72} /></mesh>
      <Window position={[-4.8, 1.5, 6.15]} front />
      <Window position={[4.8, 1.5, 6.15]} front />
      <Doorway x={0} z={6.15} front />
    </group>
  );
}


function InteriorTrim() {
  const trim = "#b78963";
  return (
    <group>
      <mesh position={[0, 0.18, -5.82]}><boxGeometry args={[15.7, 0.22, 0.09]} /><meshStandardMaterial color={trim} roughness={0.72} /></mesh>
      {[-7.82, 7.82].map((x) => <mesh key={x} position={[x, 0.18, 0]}><boxGeometry args={[0.09, 0.22, 11.6]} /><meshStandardMaterial color={trim} roughness={0.72} /></mesh>)}
      {[-2.55, 2.55].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.18, -3.55]}><boxGeometry args={[0.09, 0.22, 2.2]} /><meshStandardMaterial color={trim} /></mesh>
          <mesh position={[x, 0.18, 1.25]}><boxGeometry args={[0.09, 0.22, 2]} /><meshStandardMaterial color={trim} /></mesh>
        </group>
      ))}
      {[-0.95, 3.55].map((z) => [-5.3, 0, 5.3].map((x) => <mesh key={`${z}-${x}`} position={[x, 0.18, z]}><boxGeometry args={[2.35, 0.22, 0.09]} /><meshStandardMaterial color={trim} /></mesh>))}
    </group>
  );
}

const Dollhouse = memo(function Dollhouse({ mode, lowPower }: { mode: ViewMode; lowPower: boolean }) {
  return (
    <group>
      <FrontGarden lowPower={lowPower} />
      <RoomFloor position={[-5.25, 0, -3.5]} size={[5.5, 5]} color="#cfa678" />
      <RoomFloor position={[0, 0, -3.5]} size={[5, 5]} color="#d6b789" />
      <RoomFloor position={[5.25, 0, -3.5]} size={[5.5, 5]} color="#c59c70" />
      <RoomFloor position={[-5.25, 0, 1.25]} size={[5.5, 4.5]} color="#d7b69f" rug="#b8799b" />
      <RoomFloor position={[0, 0, 1.25]} size={[5, 4.5]} color="#c7af8c" rug="#6f9581" />
      <RoomFloor position={[5.25, 0, 1.25]} size={[5.5, 4.5]} color="#bfc8c4" rug="#6f92a6" />
      <RoomFloor position={[-5.25, 0, 4.85]} size={[5.5, 2.7]} color="#b8a98d" />
      <RoomFloor position={[0, 0, 4.85]} size={[5, 2.7]} color="#c9b893" rug="#b87858" />
      <RoomFloor position={[5.25, 0, 4.85]} size={[5.5, 2.7]} color="#b5c0b1" />

      <Sofa position={[-5.1, 0.08, -4.2]} color="#b95f52" />
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
      <DecorativeDetails lowPower={lowPower} />
      <GrandmaDecor lowPower={lowPower} />

      <Wall position={[0, 1.45, -6]} size={[16.2, 2.9, 0.18]} color="#f5dfc4" />
      <Wall position={[-8, 1.45, 0]} size={[0.18, 2.9, 12]} color="#f0d8bd" />
      <Wall position={[8, 1.45, 0]} size={[0.18, 2.9, 12]} color="#f0d8bd" />
      <FrontFacade />

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
      <InteriorTrim />


      <RoomLabel position={[-5.2, 0.13, -1.3]}>SALA</RoomLabel>
      <RoomLabel position={[0, 0.13, -1.3]}>JANTAR</RoomLabel>
      <RoomLabel position={[5.2, 0.13, -1.3]}>COZINHA</RoomLabel>
      <RoomLabel position={[-5.2, 0.13, 3.2]}>QUARTO</RoomLabel>
      <RoomLabel position={[0, 0.13, 3.2]}>QUARTO</RoomLabel>
      <RoomLabel position={[5.2, 0.13, 3.2]}>BANHEIRO</RoomLabel>
      <RoomLabel position={[-5.2, 0.13, 5.7]}>ESTUDO</RoomLabel>
      <RoomLabel position={[0, 0.13, 5.7]}>CONVIVÊNCIA</RoomLabel>
      <RoomLabel position={[5.2, 0.13, 5.7]}>ENTRADA</RoomLabel>
      <CeilingAndRoof visible={mode === "walk"} lowPower={lowPower} />
    </group>
  );
});

const isPassage = (x: number, z: number) => {
  const radius = 0.32;
  if (x < -8 + radius || x > 8 - radius || z < -6 + radius || z > 20.8) return false;
  if (z > 6 - radius && z < 6.4 && Math.abs(x) > 1.08) return false;
  const blockedVertical = (wallX: number) => Math.abs(x - wallX) < radius && z < 3.5 && Math.abs(z + 0.95) > 0.78;
  if (blockedVertical(-2.55) || blockedVertical(2.55)) return false;
  const horizontalBlocked = (wallZ: number, doors: number[]) => {
    if (Math.abs(z - wallZ) >= radius) return false;
    return !doors.some((doorX) => Math.abs(x - doorX) < 0.78);
  };
  if (horizontalBlocked(-0.95, [-3.9, 1.35, 6.7])) return false;
  if (horizontalBlocked(3.55, [-3.9, 1.35, 6.7])) return false;
  return true;
};

function WalkCamera({ navigation, resetSignal, enabled }: {
  navigation: MutableRefObject<NavigationInput>;
  resetSignal: number;
  enabled: boolean;
}) {
  const { camera, invalidate } = useThree();
  const keys = useRef(new Set<string>());
  const position = useRef(new THREE.Vector3(0, 2.15, 19.2));
  const yaw = useRef(0);
  const pitch = useRef(-0.04);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      keys.current.add(event.code);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    position.current.set(0, 2.15, 19.2);
    yaw.current = 0;
    pitch.current = -0.04;
    navigation.current.moving = false;
    invalidate();
  }, [invalidate, resetSignal]);

  useFrame((_, rawDelta) => {
    if (!enabled) return;
    const dt = Math.min(rawDelta, 0.05);
    yaw.current -= navigation.current.lookX * 0.0045;
    pitch.current = THREE.MathUtils.clamp(pitch.current - navigation.current.lookY * 0.0035, -0.62, 0.55);
    navigation.current.lookX = 0;
    navigation.current.lookY = 0;
    const forward = (keys.current.has("KeyW") || keys.current.has("ArrowUp") ? 1 : 0)
      - (keys.current.has("KeyS") || keys.current.has("ArrowDown") ? 1 : 0);
    const strafe = (keys.current.has("KeyD") || keys.current.has("ArrowRight") ? 1 : 0)
      - (keys.current.has("KeyA") || keys.current.has("ArrowLeft") ? 1 : 0);
    if (Math.abs(forward) > 0.02 || Math.abs(strafe) > 0.02) {
      const length = Math.hypot(forward, strafe) || 1;
      const speed = 3.25 * dt;
      const dx = ((-Math.sin(yaw.current) * forward) + (Math.cos(yaw.current) * strafe)) / length * speed;
      const dz = ((-Math.cos(yaw.current) * forward) + (-Math.sin(yaw.current) * strafe)) / length * speed;
      const current = position.current;
      if (isPassage(current.x + dx, current.z)) current.x += dx;
      if (isPassage(current.x, current.z + dz)) current.z += dz;
    }
    if (navigation.current.moving) {
      const current = position.current;
      const dx = navigation.current.targetX - current.x;
      const dz = navigation.current.targetZ - current.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.14) {
        navigation.current.moving = false;
      } else {
        const step = Math.min(distance, 3.4 * dt);
        const nextX = current.x + (dx / distance) * step;
        const nextZ = current.z + (dz / distance) * step;
        const movedX = isPassage(nextX, current.z);
        const movedZ = isPassage(current.x, nextZ);
        if (movedX) current.x = nextX;
        if (movedZ) current.z = nextZ;
        if (!movedX && !movedZ) navigation.current.moving = false;
      }
    }
    camera.position.copy(position.current);
    camera.rotation.order = "YXZ";
    camera.rotation.set(pitch.current, yaw.current, 0);
    invalidate();
  });
  return null;
}

function OverviewCamera() {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(13.5, 15.2, 17.5);
    camera.lookAt(0, 0.65, 0);
    invalidate();
  }, [camera, invalidate]);
  return null;
}

const CharacterFigure = memo(function CharacterFigure({ item, definition, selected, onStart, onMove, onEnd }: {
  item: CasaPlaced;
  definition: CasaCharacter;
  selected: boolean;
  onStart: (e: ThreeEvent<PointerEvent>) => void;
  onMove: (e: ThreeEvent<PointerEvent>) => void;
  onEnd: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const texture = useTexture(definition.img);
  const group = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const height = (definition.isPet ? 1.05 : 1.75) * item.scale;
  const width = height * (definition.isPet ? 1.1 : 0.68);
  const glow = EMOTION_COLORS[item.emotion] ?? EMOTION_COLORS.neutro;

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.needsUpdate = true;
    invalidate();
  }, [invalidate, texture]);

  useFrame((_, rawDelta) => {
    if (!group.current) return;
    const target = selected ? 1.04 : 1;
    if (Math.abs(group.current.scale.x - target) < 0.002) {
      group.current.scale.setScalar(target);
      return;
    }
    const delta = Math.min(rawDelta, 0.05);
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, target, 1 - Math.exp(-9 * delta)));
    invalidate();
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
});

function Scene({ props, mode, navigation, resetSignal }: {
  props: SceneProps;
  mode: ViewMode;
  navigation: MutableRefObject<NavigationInput>;
  resetSignal: number;
}) {
  const drag = useRef<DragState>(null);
  const [controlsEnabled, setControlsEnabled] = useState(true);
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const characterMap = useMemo(() => new Map(props.characters.map((character) => [character.id, character])), [props.characters]);
  const lastMoveAt = useRef(0);
  const pendingMove = useRef<{ drag: Exclude<DragState, null>; x: number; y: number } | null>(null);
  const { invalidate } = useThree();
  const scenePointer = useRef<{ id: number; startX: number; startY: number; lastX: number; lastY: number; moved: boolean } | null>(null);

  const commitMove = useCallback((current: Exclude<DragState, null>, x: number, y: number) => {
    if (current.kind === "item") props.onMoveItem(current.id, x, y);
    if (current.kind === "cover") props.onMoveCover(current.id, x, y);
    if (current.kind === "note") props.onMoveNote(current.id, x, y);
    if (current.kind === "sticker") props.onMoveSticker(current.id, x, y);
    invalidate();
  }, [invalidate, props]);

  const startDrag = (kind: DragKind, id: string, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    drag.current = { kind, id };
    setControlsEnabled(false);
    props.onSelect(id);
    invalidate();
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const moveDrag = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current || !e.ray.intersectPlane(groundPlane, point)) return;
    e.stopPropagation();
    const x = toNormalizedX(point.x);
    const y = toNormalizedY(point.z);
    const current = drag.current;
    pendingMove.current = { drag: current, x, y };
    const now = performance.now();
    if (now - lastMoveAt.current >= 40) {
      lastMoveAt.current = now;
      commitMove(current, x, y);
      pendingMove.current = null;
    }
  };

  const endDrag = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const pending = pendingMove.current;
    if (pending) commitMove(pending.drag, pending.x, pending.y);
    pendingMove.current = null;
    drag.current = null;
    setControlsEnabled(true);
    invalidate();
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const ambience = props.mood === "noite" ? 0.48 : props.mood === "calmo" ? 0.74 : 0.82;
  const background = props.mood === "noite" ? "#2d3554" : props.mood === "calmo" ? "#b9dced" : props.mood === "aconchego" ? "#edbd82" : "#bde3ed";

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 20, 34]} />
      <ambientLight intensity={ambience * 0.72} color={props.mood === "noite" ? "#aab6df" : "#fff3df"} />
      <hemisphereLight args={[props.mood === "noite" ? "#7f91c7" : "#dff6ff", "#8b7356", ambience]} />
      <directionalLight
        position={[-7, 12, 8]}
        intensity={props.mood === "noite" ? 0.72 : 1.55}
        castShadow={!props.lowPower}
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0003}
      />
      <pointLight position={[0, 4.2, 1]} color={props.mood === "calmo" ? "#d7ecff" : "#ffc47a"} intensity={props.mood === "noite" ? 5.5 : 3.4} distance={18} decay={2} />
      <Environment resolution={props.lowPower ? 32 : 64}>
        <Lightformer intensity={2} position={[0, 7, 2]} scale={[12, 12, 1]} />
        {!props.lowPower && <Lightformer intensity={1} color="#f5b77d" position={[-7, 2, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />}
      </Environment>

      {mode === "walk" ? (
        <WalkCamera navigation={navigation} resetSignal={resetSignal} enabled={controlsEnabled} />
      ) : (
        <OverviewCamera />
      )}
      <Dollhouse mode={mode} lowPower={props.lowPower} />

      <mesh
        position={[0, 0.17, 7.35]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerDown={() => props.onSelect(null)}
      >
        <planeGeometry args={[20, 27.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {mode === "walk" && (
        <mesh
          position={[0, 0.19, 7.35]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={(event) => {
            props.onSelect(null);
            navigation.current.moving = false;
            scenePointer.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
            (event.target as Element).setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            const pointer = scenePointer.current;
            if (!pointer || pointer.id !== event.pointerId) return;
            const dx = event.clientX - pointer.lastX;
            const dy = event.clientY - pointer.lastY;
            pointer.lastX = event.clientX;
            pointer.lastY = event.clientY;
            if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 7) pointer.moved = true;
            if (pointer.moved) {
              navigation.current.lookX += dx;
              navigation.current.lookY += dy;
              invalidate();
            }
          }}
          onPointerUp={(event) => {
            const pointer = scenePointer.current;
            if (!pointer || pointer.id !== event.pointerId) return;
            if (!pointer.moved) {
              navigation.current.targetX = THREE.MathUtils.clamp(event.point.x, -7.6, 7.6);
              navigation.current.targetZ = THREE.MathUtils.clamp(event.point.z, -5.6, 20.4);
              navigation.current.moving = true;
            }
            scenePointer.current = null;
            (event.target as Element).releasePointerCapture?.(event.pointerId);
            invalidate();
          }}
          onPointerCancel={() => { scenePointer.current = null; }}
        >
          <planeGeometry args={[20, 27.5]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      <Suspense fallback={null}>
        {props.items.map((item) => {
          const definition = characterMap.get(item.charId);
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

      {mode === "overview" && (
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
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
          onChange={() => invalidate()}
        />
      )}
    </>
  );
}

function Fallback() {
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden bg-secondary">
      <img
        src={casaAvoLoading}
        alt="Casa de vó acolhedora com a porta aberta"
        width={1536}
        height={864}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-foreground/70 px-4 py-3 text-center text-sm font-bold text-background backdrop-blur-sm">
        A casa está visível, mas a caminhada em 3D não pôde ser iniciada neste aparelho.
      </div>
    </div>
  );
}

export default function MinhaCasa3D(props: Props) {
  const [lowPower, setLowPower] = useState(false);
  const [mode, setMode] = useState<ViewMode>("walk");
  const [resetSignal, setResetSignal] = useState(0);
  const navigation = useRef<NavigationInput>({ targetX: 0, targetZ: 19.2, moving: false, lookX: 0, lookY: 0 });

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 1024px)");
    const update = () => setLowPower(coarse.matches || narrow.matches);
    update();
    coarse.addEventListener("change", update);
    narrow.addEventListener("change", update);
    return () => {
      coarse.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
    };
  }, []);

  return (
    <Game3DGuard fallback={<Fallback />}>
      <div className="relative h-full w-full bg-secondary">
        <Canvas
          key={mode}
          fallback={<Fallback />}
          shadows={!lowPower}
          dpr={lowPower ? 1 : [1, 1.25]}
          frameloop={mode === "walk" ? "always" : "demand"}
          camera={{ position: mode === "walk" ? [0, 2.15, 19.2] : [13.5, 15.2, 17.5], fov: mode === "walk" ? 52 : 42, near: 0.08, far: 60 }}
           gl={{ antialias: !lowPower, alpha: false, powerPreference: lowPower ? "default" : "high-performance", failIfMajorPerformanceCaveat: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: lowPower ? 1.02 : 1.08 }}
          onPointerMissed={() => props.onSelect(null)}
        >
          <Scene props={{ ...props, lowPower }} mode={mode} navigation={navigation} resetSignal={resetSignal} />
        </Canvas>

        <div className="absolute left-3 top-3 z-20 flex gap-2">
          <Button
            size="sm"
            variant={mode === "walk" ? "default" : "secondary"}
            onClick={() => setMode((current) => current === "walk" ? "overview" : "walk")}
            className="shadow-lg"
          >
            {mode === "walk" ? <Eye className="h-4 w-4" /> : <DoorOpen className="h-4 w-4" />}
            {mode === "walk" ? "Visão geral" : "Entrar na casa"}
          </Button>
          {mode === "walk" && (
            <Button size="icon" variant="secondary" onClick={() => setResetSignal((value) => value + 1)} title="Voltar à porta" className="shadow-lg">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

      </div>
    </Game3DGuard>
  );
}