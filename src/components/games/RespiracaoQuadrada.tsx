import { useEffect, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Wind, Minus, Plus } from "lucide-react";
import sceneBg from "@/assets/scene-respiracao.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type Phase = "inspire" | "segure-cheio" | "expire" | "segure-vazio";

const PHASE_META: Record<
  Phase,
  { label: string; instruction: string; color: string; next: Phase }
> = {
  inspire: {
    label: "Inspire",
    instruction: "Pelo nariz, devagar",
    color: "#3A86FF",
    next: "segure-cheio",
  },
  "segure-cheio": {
    label: "Segure",
    instruction: "Pulmão cheio",
    color: "#7B2CBF",
    next: "expire",
  },
  expire: {
    label: "Expire",
    instruction: "Pela boca, soltando",
    color: "#06D6A0",
    next: "segure-vazio",
  },
  "segure-vazio": {
    label: "Segure",
    instruction: "Pulmão vazio",
    color: "#FFD166",
    next: "inspire",
  },
};

const PHASE_ORDER: Phase[] = ["inspire", "segure-cheio", "expire", "segure-vazio"];

type State = {
  running: boolean;
  seconds: number; // 3..8
  startedAt: number | null; // epoch ms when current cycle started
  cyclesDone: number;
};

const DEFAULT_STATE: State = {
  running: false,
  seconds: 4,
  startedAt: null,
  cyclesDone: 0,
};

export default function RespiracaoQuadrada({ room }: Props) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [now, setNow] = useState<number>(() => Date.now());
  const rafRef = useRef<number | null>(null);
  const lastCycleRef = useRef(0);

  // RAF tick for smooth animation
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Receive remote updates
  useEffect(() => {
    return room.on((m) => {
      if (m.type === "breath:state") {
        setState(m.payload as State);
      }
    });
  }, [room]);

  const broadcast = (next: State) => {
    setState(next);
    room.send("breath:state", next);
  };

  const totalCycleMs = state.seconds * 4 * 1000;
  const elapsed =
    state.running && state.startedAt ? now - state.startedAt : 0;
  const cyclePos = state.running ? (elapsed % totalCycleMs) / totalCycleMs : 0;
  const phaseIndex = Math.min(3, Math.floor(cyclePos * 4));
  const phase: Phase = PHASE_ORDER[phaseIndex];
  const phaseProgress = (cyclePos * 4) % 1; // 0..1 within current phase
  const phaseMeta = PHASE_META[phase];
  const secondsInPhase = Math.max(
    1,
    Math.ceil(state.seconds * (1 - phaseProgress)),
  );

  // Count cycles locally (only psi increments authoritative state to avoid race)
  useEffect(() => {
    if (!state.running || !state.startedAt) {
      lastCycleRef.current = 0;
      return;
    }
    const completed = Math.floor(elapsed / totalCycleMs);
    if (completed > lastCycleRef.current) {
      lastCycleRef.current = completed;
      // Only the host (psi) updates cyclesDone to keep state consistent
      // paciente will receive via broadcast
      // We do it on both to keep counter snappy if alone; broadcast settles
    }
  }, [elapsed, totalCycleMs, state.running, state.startedAt]);

  const cyclesDoneLive =
    state.running && state.startedAt
      ? state.cyclesDone + Math.floor(elapsed / totalCycleMs)
      : state.cyclesDone;

  const start = () => {
    broadcast({ ...state, running: true, startedAt: Date.now() });
  };

  const pause = () => {
    // freeze counter
    broadcast({
      ...state,
      running: false,
      cyclesDone: cyclesDoneLive,
      startedAt: null,
    });
  };

  const reset = () => {
    broadcast({ ...DEFAULT_STATE, seconds: state.seconds });
  };

  const changeSeconds = (delta: number) => {
    const next = Math.max(3, Math.min(8, state.seconds + delta));
    broadcast({ ...state, seconds: next, startedAt: state.running ? Date.now() : null, cyclesDone: cyclesDoneLive });
  };

  // Square geometry — dot travels around perimeter clockwise
  // inspire = left side bottom→top, segure-cheio = top left→right,
  // expire = right side top→bottom, segure-vazio = bottom right→left
  const SIZE = 280;
  const dotPos = (() => {
    const p = phaseProgress;
    switch (phase) {
      case "inspire":
        return { x: 0, y: SIZE * (1 - p) };
      case "segure-cheio":
        return { x: SIZE * p, y: 0 };
      case "expire":
        return { x: SIZE, y: SIZE * p };
      case "segure-vazio":
        return { x: SIZE * (1 - p), y: SIZE };
    }
  })();

  // Expanding circle synced to inspire/expire
  const circleScale = (() => {
    switch (phase) {
      case "inspire":
        return 0.4 + phaseProgress * 0.6;
      case "segure-cheio":
        return 1;
      case "expire":
        return 1 - phaseProgress * 0.6;
      case "segure-vazio":
        return 0.4;
    }
  })();

  return (
    <div
      className="h-full w-full p-4 md:p-6 flex flex-col gap-4 rounded-2xl border-4 border-amber-900/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(254,243,199,0.35), rgba(186,230,253,0.45)), url(${sceneBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <header className="flex items-center justify-between flex-wrap gap-3 bg-white/85 backdrop-blur rounded-2xl border-2 border-white shadow-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Respiração Quadrada</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-full border-2 border-border/60 px-2 py-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => changeSeconds(-1)}
              disabled={state.seconds <= 3}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm font-bold tabular-nums px-1 min-w-[3.5rem] text-center">
              {state.seconds}s · fase
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => changeSeconds(1)}
              disabled={state.seconds >= 8}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          {state.running ? (
            <Button size="sm" variant="outline" onClick={pause}>
              <Pause className="w-4 h-4 mr-1" /> Pausar
            </Button>
          ) : (
            <Button size="sm" onClick={start}>
              <Play className="w-4 h-4 mr-1" /> Iniciar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 items-center min-h-0">
        {/* Square animation */}
        <div className="flex flex-col items-center justify-center gap-6">
          <div
            className="relative"
            style={{ width: SIZE + 80, height: SIZE + 80 }}
          >
            {/* Square track */}
            <svg
              width={SIZE + 80}
              height={SIZE + 80}
              className="absolute inset-0"
            >
              <rect
                x={40}
                y={40}
                width={SIZE}
                height={SIZE}
                rx={24}
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={4}
                strokeDasharray="2 8"
              />
              {/* Active side highlight */}
              <PhaseEdge phase={phase} size={SIZE} progress={phaseProgress} color={phaseMeta.color} />
            </svg>

            {/* Breathing circle */}
            <div
              className="absolute top-1/2 left-1/2 rounded-full transition-transform"
              style={{
                width: SIZE,
                height: SIZE,
                transform: `translate(-50%,-50%) scale(${circleScale})`,
                background: `radial-gradient(circle, ${phaseMeta.color}cc 0%, ${phaseMeta.color}55 60%, transparent 100%)`,
                transition: state.running ? "transform 100ms linear" : "transform 400ms ease",
              }}
            />

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: phaseMeta.color }}
              >
                {phaseMeta.label}
              </div>
              <div className="text-7xl font-black tabular-nums my-1" style={{ color: phaseMeta.color }}>
                {state.running ? secondsInPhase : state.seconds}
              </div>
              <div className="text-xs font-semibold text-foreground/70 max-w-[180px] text-center">
                {phaseMeta.instruction}
              </div>
            </div>

            {/* Traveling dot */}
            <div
              className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg"
              style={{
                left: 40 + dotPos.x - 10,
                top: 40 + dotPos.y - 10,
                backgroundColor: phaseMeta.color,
                opacity: state.running ? 1 : 0.4,
              }}
            />
          </div>

          <div className="text-center">
            <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Ciclos completos
            </div>
            <div className="text-3xl font-black text-foreground tabular-nums">
              {cyclesDoneLive}
            </div>
          </div>
        </div>

        {/* Side info */}
        <aside className="bg-white/85 backdrop-blur rounded-2xl border-2 border-white shadow-lg p-5 flex flex-col gap-3 self-stretch">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Como funciona
          </h3>
          <ol className="text-sm space-y-2 list-decimal list-inside text-foreground/80">
            <li>
              <span className="font-bold" style={{ color: PHASE_META.inspire.color }}>
                Inspire
              </span>{" "}
              contando até {state.seconds}.
            </li>
            <li>
              <span className="font-bold" style={{ color: PHASE_META["segure-cheio"].color }}>
                Segure
              </span>{" "}
              o ar contando até {state.seconds}.
            </li>
            <li>
              <span className="font-bold" style={{ color: PHASE_META.expire.color }}>
                Expire
              </span>{" "}
              soltando contando até {state.seconds}.
            </li>
            <li>
              <span className="font-bold" style={{ color: PHASE_META["segure-vazio"].color }}>
                Segure
              </span>{" "}
              vazio até {state.seconds}.
            </li>
          </ol>

          <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-foreground/80 leading-relaxed">
              <strong>Indicação clínica:</strong> regulação parassimpática em
              ansiedade, raiva, antes de exposição. 4 ciclos baixam o sistema
              de alerta. Comece com 4s; aumente se confortável.
            </p>
          </div>

          <div className="mt-auto text-[11px] text-muted-foreground italic">
            Dica: você e o paciente veem a mesma animação em sincronia. Respirem
            juntos.
          </div>
        </aside>
      </div>
    </div>
  );
}

function PhaseEdge({
  phase,
  size,
  progress,
  color,
}: {
  phase: Phase;
  size: number;
  progress: number;
  color: string;
}) {
  // draw the active side, growing with progress
  const p = Math.max(0, Math.min(1, progress));
  const len = size * p;
  const stroke = { stroke: color, strokeWidth: 6, strokeLinecap: "round" as const };
  switch (phase) {
    case "inspire":
      // left side, bottom→top
      return <line x1={40} y1={40 + size} x2={40} y2={40 + size - len} {...stroke} />;
    case "segure-cheio":
      // top, left→right
      return <line x1={40} y1={40} x2={40 + len} y2={40} {...stroke} />;
    case "expire":
      // right, top→bottom
      return <line x1={40 + size} y1={40} x2={40 + size} y2={40 + len} {...stroke} />;
    case "segure-vazio":
      // bottom, right→left
      return <line x1={40 + size} y1={40 + size} x2={40 + size - len} y2={40 + size} {...stroke} />;
  }
}
