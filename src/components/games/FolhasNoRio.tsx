import { useEffect, useMemo, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Play, Pause, RotateCcw, Leaf, Hand, Sparkles, Volume2, VolumeX,
} from "lucide-react";
import rioBg from "@/assets/scene-folhas-rio.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type LeafCategory = "medo" | "raiva" | "tristeza" | "autocritica" | "preocupacao" | "outro";

const CATEGORIES: { id: LeafCategory; label: string; color: string; tip: string }[] = [
  { id: "medo",         label: "Medo",          color: "#a78bfa", tip: "Aquilo que me assusta" },
  { id: "raiva",        label: "Raiva",         color: "#ef4444", tip: "Aquilo que me incomoda" },
  { id: "tristeza",     label: "Tristeza",      color: "#60a5fa", tip: "Aquilo que pesa" },
  { id: "autocritica",  label: "Autocrítica",   color: "#f59e0b", tip: "A voz que me julga" },
  { id: "preocupacao",  label: "Preocupação",   color: "#10b981", tip: "O 'e se' que volta" },
  { id: "outro",        label: "Outro",         color: "#fbbf24", tip: "Qualquer pensamento" },
];

type LeafItem = {
  id: string;
  text: string;
  category: LeafCategory;
  /** birth epoch ms */
  bornAt: number;
  /** seconds to traverse the river */
  duration: number;
  /** horizontal lane 0..1 */
  lane: number;
  /** rotation seed */
  spin: number;
  /** stuck = will pause at ~55% until nudged */
  stuck: boolean;
  freed: boolean;
};

type Pace = "lento" | "normal" | "rapido";
const PACE_SECONDS: Record<Pace, number> = { lento: 28, normal: 18, rapido: 11 };

type State = {
  running: boolean;
  pace: Pace;
  released: number;
  leaves: LeafItem[];
  ambientMode: boolean;
  // serial counter for unique ids across both clients
  serial: number;
};

const DEFAULT_STATE: State = {
  running: true,
  pace: "normal",
  released: 0,
  leaves: [],
  ambientMode: false,
  serial: 0,
};

const MAX_LEAVES = 14;

export default function FolhasNoRio({ room }: Props) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [text, setText] = useState("");
  const [cat, setCat] = useState<LeafCategory>("preocupacao");
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(false);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // animation loop
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // remote sync
  useEffect(() => {
    return room.on((m) => {
      if (m.type === "rio:state") setState(m.payload as State);
    });
  }, [room]);

  const broadcast = (next: State | ((s: State) => State)) => {
    setState((prev) => {
      const n = typeof next === "function" ? (next as (s: State) => State)(prev) : next;
      room.send("rio:state", n);
      return n;
    });
  };

  // prune leaves that have finished travelling
  useEffect(() => {
    const expired = state.leaves.filter((l) => {
      const elapsed = (now - l.bornAt) / 1000;
      return elapsed > l.duration + 2;
    });
    if (expired.length > 0) {
      broadcast((s) => ({ ...s, leaves: s.leaves.filter((l) => !expired.find((e) => e.id === l.id)) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(now / 600)]);

  // ambient mode: drop blank "let go" leaves automatically
  const lastAmbientRef = useRef(0);
  useEffect(() => {
    if (!state.ambientMode || !state.running) return;
    if (now - lastAmbientRef.current > 4500 && state.leaves.length < MAX_LEAVES - 2) {
      lastAmbientRef.current = now;
      releaseLeaf("…", "outro", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(now / 500), state.ambientMode, state.running]);

  const playChime = () => {
    if (!sound) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 440 + Math.random() * 220;
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 1.5);
    } catch { /* ignore */ }
  };

  const releaseLeaf = (txt: string, category: LeafCategory, allowStuck = true) => {
    const duration = PACE_SECONDS[state.pace];
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const stuck = allowStuck && Math.random() < 0.18 && txt.trim().length > 0;
    const leaf: LeafItem = {
      id,
      text: txt.trim() || "…",
      category,
      bornAt: Date.now(),
      duration,
      lane: 0.15 + Math.random() * 0.7,
      spin: (Math.random() - 0.5) * 720,
      stuck,
      freed: false,
    };
    broadcast((s) => ({
      ...s,
      released: s.released + 1,
      leaves: [...s.leaves, leaf].slice(-MAX_LEAVES),
      serial: s.serial + 1,
    }));
    playChime();
  };

  const onSubmit = () => {
    if (!text.trim()) return;
    releaseLeaf(text, cat);
    setText("");
  };

  const nudgeLeaf = (id: string) => {
    broadcast((s) => ({
      ...s,
      leaves: s.leaves.map((l) => (l.id === id ? { ...l, stuck: false, freed: true } : l)),
    }));
  };

  const reset = () => {
    broadcast({ ...DEFAULT_STATE, pace: state.pace });
  };

  const togglePlay = () => broadcast((s) => ({ ...s, running: !s.running }));
  const cyclePace = () => {
    const order: Pace[] = ["lento", "normal", "rapido"];
    const next = order[(order.indexOf(state.pace) + 1) % order.length];
    broadcast((s) => ({ ...s, pace: next }));
  };

  const catMeta = CATEGORIES.find((c) => c.id === cat)!;

  return (
    <div
      className="h-full w-full p-3 md:p-5 flex flex-col gap-3 rounded-2xl border-4 border-amber-900/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.45)] relative overflow-hidden bg-gradient-to-b from-amber-900/40 via-emerald-950/30 to-amber-950/40"
    >
      {/* header */}
      <header className="flex items-center justify-between flex-wrap gap-3 bg-white/90 backdrop-blur rounded-2xl border-2 border-white shadow-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-700" />
          <div>
            <h2 className="text-xl font-bold leading-tight">Folhas no Rio</h2>
            <p className="text-[11px] text-muted-foreground leading-tight">
              ACT · desfusão cognitiva — observe seus pensamentos passarem
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={cyclePace} title="Velocidade do rio">
            <Sparkles className="w-4 h-4 mr-1" /> {state.pace}
          </Button>
          <Button
            size="sm"
            variant={state.ambientMode ? "default" : "outline"}
            onClick={() => broadcast((s) => ({ ...s, ambientMode: !s.ambientMode }))}
            title="Modo automático: folhas em branco a cada poucos segundos"
          >
            Auto
          </Button>
          {state.running ? (
            <Button size="sm" variant="outline" onClick={togglePlay}>
              <Pause className="w-4 h-4 mr-1" /> Pausar
            </Button>
          ) : (
            <Button size="sm" onClick={togglePlay}>
              <Play className="w-4 h-4 mr-1" /> Retomar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setSound((v) => !v)} title="Som">
            {sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* river */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 min-h-0">
        <River
          state={state}
          now={now}
          onNudge={nudgeLeaf}
        />

        {/* side panel */}
        <aside className="bg-white/90 backdrop-blur rounded-2xl border-2 border-white shadow-lg p-4 flex flex-col gap-3 min-h-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Escreva um pensamento
            </h3>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Coloque-o sobre uma folha e solte no rio. Não é pra resolver. É pra ver passar.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border-2 transition-all ${
                  cat === c.id ? "scale-105 shadow-sm" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  borderColor: c.color,
                  background: cat === c.id ? c.color : "transparent",
                  color: cat === c.id ? "white" : c.color,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] italic text-muted-foreground -mt-1">{catMeta.tip}</p>

          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder="ex: ninguém vai me entender"
            maxLength={90}
            className="border-2"
          />
          <Button onClick={onSubmit} disabled={!text.trim()} className="w-full">
            <Hand className="w-4 h-4 mr-1" /> Soltar no rio
          </Button>

          <div className="mt-1 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 py-1.5">
              <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Soltas</div>
              <div className="text-2xl font-black tabular-nums text-emerald-800">{state.released}</div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 py-1.5">
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">No rio</div>
              <div className="text-2xl font-black tabular-nums text-amber-800">{state.leaves.length}</div>
            </div>
          </div>

          <div className="mt-auto p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-foreground/80 leading-relaxed">
              <strong>Dica clínica:</strong> se uma folha ficar presa numa pedra, toque nela
              pra liberar. Praticamos juntos: pensamentos são eventos, não ordens.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============================ RIVER ============================ */

function River({
  state, now, onNudge,
}: {
  state: State;
  now: number;
  onNudge: (id: string) => void;
}) {
  // ambient sparkles — deterministic per session
  const sparkles = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({
      x: (i * 53) % 100,
      y: 20 + ((i * 37) % 70),
      delay: (i * 0.31) % 3,
      size: 2 + ((i * 7) % 5),
    })),
    [],
  );

  // generous polygon covering the whole painted river bed (top waterfall → foreground)
  const riverPoly =
    "polygon(34% 4%, 70% 4%, 82% 28%, 74% 50%, 64% 72%, 56% 95%, 50% 115%, 10% 115%, 16% 95%, 24% 72%, 30% 50%, 32% 28%)";


  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-white/70 shadow-inner">
      {/* SVG filter that animates the water surface */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <defs>
          <filter id="water-warp" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.028"
              numOctaves="2"
              seed="2"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="14s"
                values="0.012 0.028;0.018 0.04;0.012 0.028"
                repeatCount="indefinite"
              />
            </feTurbulence>
            {/* scroll the noise downstream so the distortion 'flows' */}
            <feOffset in="noise" dx="0" dy="0" result="noise2">
              <animate attributeName="dy" from="0" to="-60" dur="2.6s" repeatCount="indefinite" />
            </feOffset>
            <feDisplacementMap in="SourceGraphic" in2="noise2" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* static base scene */}
      <img
        src={rioBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
      />
      {/* warped water — same image, clipped to the river area, filtered */}
      <img
        src={rioBg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        draggable={false}
        style={{
          filter: "url(#water-warp) saturate(1.05) brightness(1.02)",
          clipPath: riverPoly,
          WebkitClipPath: riverPoly,
        }}
      />
      {/* subtle highlight glaze inside the river clip */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: riverPoly,
          WebkitClipPath: riverPoly,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 40%, rgba(0,0,0,0.08))",
          mixBlendMode: "soft-light",
        }}
      />

      {/* gentle water shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: `repeating-linear-gradient(115deg, transparent 0 14px, rgba(255,255,255,0.06) 14px 16px)`,
          animation: "rio-shimmer 8s linear infinite",
          clipPath: riverPoly,
          WebkitClipPath: riverPoly,
        }}
      />
      <style>{`
        @keyframes rio-shimmer { from { background-position: 0 0; } to { background-position: 80px 0; } }
        @keyframes rio-sparkle { 0%,100% { opacity: 0; transform: scale(0.6);} 50% { opacity: 0.9; transform: scale(1);} }
        @keyframes rio-wobble { 0%,100% { transform: translateX(-6px); } 50% { transform: translateX(6px); } }
        @keyframes rio-streak {
          0%   { opacity: 0; transform: translate(0,0) scaleX(0.4); }
          25%  { opacity: 0.75; }
          100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scaleX(1); }
        }
      `}</style>


      {/* sparkles */}
      {sparkles.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animation: `rio-sparkle 3s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
            filter: "blur(0.3px)",
          }}
        />
      ))}

      {/* leaves */}
      {state.leaves.map((l) => (
        <LeafSprite key={l.id} leaf={l} now={now} running={state.running} onNudge={() => onNudge(l.id)} />
      ))}

      {/* empty-state hint */}
      {state.leaves.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-white/90 text-sm font-semibold drop-shadow-md bg-black/30 backdrop-blur px-4 py-2 rounded-full">
            Escreva um pensamento → solte no rio →
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ RIVER PATH ============================ */
// Cubic bezier in % coordinates matching the painted river bed:
// starts near the waterfall (top-center) and curves down toward the foreground.
const RIVER = {
  p0: { x: 50, y: 14 },
  p1: { x: 60, y: 38 },
  p2: { x: 38, y: 62 },
  p3: { x: 34, y: 104 },
};


function bezier(t: number) {
  const { p0, p1, p2, p3 } = RIVER;
  const u = 1 - t;
  const x =
    u * u * u * p0.x +
    3 * u * u * t * p1.x +
    3 * u * t * t * p2.x +
    t * t * t * p3.x;
  const y =
    u * u * u * p0.y +
    3 * u * u * t * p1.y +
    3 * u * t * t * p2.y +
    t * t * t * p3.y;
  return { x, y };
}

function bezierTangent(t: number) {
  const { p0, p1, p2, p3 } = RIVER;
  const u = 1 - t;
  const x =
    3 * u * u * (p1.x - p0.x) +
    6 * u * t * (p2.x - p1.x) +
    3 * t * t * (p3.x - p2.x);
  const y =
    3 * u * u * (p1.y - p0.y) +
    6 * u * t * (p2.y - p1.y) +
    3 * t * t * (p3.y - p2.y);
  // tangent angle in degrees, where 0deg = pointing down the river
  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  return angle;
}

/* ============================ LEAF ============================ */

function LeafSprite({
  leaf, now, running, onNudge,
}: {
  leaf: LeafItem;
  now: number;
  running: boolean;
  onNudge: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.id === leaf.category)!;
  const elapsed = (now - leaf.bornAt) / 1000;
  let rawProgress = Math.min(1.05, elapsed / leaf.duration);

  // stuck on a rock at ~55% until freed
  const isStuck = leaf.stuck && !leaf.freed && rawProgress >= 0.55;
  if (isStuck) rawProgress = 0.55;

  // position along the river bed
  const t = Math.max(0, Math.min(1, rawProgress));
  const center = bezier(t);
  const tangentDeg = bezierTangent(t);
  // perpendicular offset (lane: 0..1 maps to -1..+1 across river width)
  const perpRad = ((tangentDeg + 90) * Math.PI) / 180;
  const laneOffset = (leaf.lane - 0.5) * 14; // ±7% of width
  const drift = Math.sin((elapsed + leaf.spin * 0.01) * 1.2) * 1.6; // gentle current sway
  const offsetTotal = laneOffset + drift;
  const x = center.x + Math.cos(perpRad) * offsetTotal;
  const y = center.y + Math.sin(perpRad) * offsetTotal;

  // gentle spin overlaid on river direction
  const rotation = tangentDeg + Math.sin(elapsed * 0.8 + leaf.spin) * 12;
  const fading = rawProgress > 0.94;

  // show current streaks while flowing (not stuck, not entering/exiting)
  const showStreaks = !isStuck && running && rawProgress > 0.02 && rawProgress < 0.95;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transition: "opacity 700ms ease",
        opacity: fading ? 0 : 1,
        pointerEvents: isStuck ? "auto" : "none",
        zIndex: isStuck ? 5 : 2,
      }}
    >
      {/* current streaks — small dashes trailing behind the leaf, flowing downstream */}
      {showStreaks && (
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{ transform: `translate(-50%,-50%) rotate(${tangentDeg}deg)` }}
          aria-hidden
        >
          {[
            { i: 0, dx: -34, dy: -10, len: 18, delay: 0,   dur: 1.4 },
            { i: 1, dx: -42, dy:   6, len: 22, delay: 0.35, dur: 1.6 },
            { i: 2, dx: -28, dy:  12, len: 14, delay: 0.7,  dur: 1.3 },
            { i: 3, dx: -50, dy:  -2, len: 26, delay: 1.0,  dur: 1.8 },
          ].map((s) => (
            <span
              key={s.i}
              className="absolute block rounded-full bg-white/70"
              style={{
                left: `${s.dx}px`,
                top: `${s.dy}px`,
                width: `${s.len}px`,
                height: "1.5px",
                filter: "blur(0.3px)",
                // travel further downstream as it fades
                ["--sx" as any]: `${s.len * 1.4}px`,
                ["--sy" as any]: `0px`,
                animation: `rio-streak ${s.dur}s ease-out ${s.delay}s infinite`,
                transformOrigin: "left center",
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          transform: `rotate(${rotation}deg)`,
          animation: isStuck ? "rio-wobble 0.9s ease-in-out infinite" : undefined,
          transition: "transform 120ms linear",
        }}
      >
        <LeafSvg color={cat.color} stuck={isStuck} />
      </div>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-stone-900 max-w-[140px] text-center leading-tight px-1.5 py-0.5 rounded bg-white/75 backdrop-blur-sm shadow-sm pointer-events-none"
        style={{ whiteSpace: "normal" }}
      >
        {leaf.text}
      </div>
      {isStuck && (
        <button
          onClick={onNudge}
          className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-md animate-bounce whitespace-nowrap"
        >
          Toque para soltar
        </button>
      )}
    </div>
  );
}

function LeafSvg({ color, stuck }: { color: string; stuck: boolean }) {
  return (
    <svg width="92" height="64" viewBox="0 0 92 64" className={stuck ? "drop-shadow-lg" : "drop-shadow"}>
      <defs>
        <radialGradient id={`lg-${color}`} cx="35%" cy="40%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="55%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </radialGradient>
      </defs>
      <path
        d="M4 32 C 4 8, 46 0, 88 12 C 88 44, 46 64, 4 56 C 14 50, 18 42, 4 32 Z"
        fill={`url(#lg-${color})`}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1.4"
      />
      <path d="M10 38 C 30 32, 60 28, 84 22" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" fill="none" />
      <path d="M30 40 L 36 30 M48 41 L 56 30 M64 38 L 70 28" stroke="rgba(0,0,0,0.18)" strokeWidth="1" fill="none" />
    </svg>
  );
}
