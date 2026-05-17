import { useEffect, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Anchor, RotateCcw, ArrowLeft, ArrowRight, Check } from "lucide-react";
import ancoragemBg from "@/assets/scene-ancoragem.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type SenseId = "ver" | "tocar" | "ouvir" | "cheirar" | "saborear";

const SENSES: {
  id: SenseId;
  count: number;
  emoji: string;
  title: string;
  prompt: string;
  examples: string;
  color: string;
}[] = [
  {
    id: "ver",
    count: 5,
    emoji: "👀",
    title: "5 coisas que você vê",
    prompt: "Olhe ao redor. Nomeie 5 coisas que está vendo agora.",
    examples: "uma cortina, a luz da janela, suas mãos, um objeto na mesa, uma cor…",
    color: "#3A86FF",
  },
  {
    id: "tocar",
    count: 4,
    emoji: "✋",
    title: "4 coisas que você toca",
    prompt: "Sinta. Toque em 4 coisas e descreva a textura.",
    examples: "tecido da roupa, mesa lisa, cabelo, chão sob os pés…",
    color: "#7B2CBF",
  },
  {
    id: "ouvir",
    count: 3,
    emoji: "👂",
    title: "3 sons que você ouve",
    prompt: "Pare e escute. Quais 3 sons aparecem?",
    examples: "minha voz, ventilador, um carro lá fora…",
    color: "#06D6A0",
  },
  {
    id: "cheirar",
    count: 2,
    emoji: "👃",
    title: "2 cheiros que você sente",
    prompt: "Respire fundo. Que 2 cheiros aparecem?",
    examples: "perfume, comida, ar do ambiente, sua roupa…",
    color: "#FB5607",
  },
  {
    id: "saborear",
    count: 1,
    emoji: "👅",
    title: "1 sabor na boca",
    prompt: "O que você sente na boca agora?",
    examples: "água, gosto neutro, resto da última refeição…",
    color: "#E63946",
  },
];

type State = {
  stepIndex: number; // 0..4 (or 5 = finished)
  entries: Record<SenseId, string[]>;
  intensityBefore: number | null; // 0..10
  intensityAfter: number | null;
};

const EMPTY_ENTRIES: Record<SenseId, string[]> = {
  ver: ["", "", "", "", ""],
  tocar: ["", "", "", ""],
  ouvir: ["", "", ""],
  cheirar: ["", ""],
  saborear: [""],
};

const DEFAULT_STATE: State = {
  stepIndex: -1, // -1 = pre-screen (intensidade antes)
  entries: EMPTY_ENTRIES,
  intensityBefore: null,
  intensityAfter: null,
};

export default function Ancoragem54321({ room }: Props) {
  const [state, setState] = useState<State>(DEFAULT_STATE);

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "anchor:state") setState(m.payload as State);
    });
  }, [room]);

  const broadcast = (next: State) => {
    setState(next);
    room.send("anchor:state", next);
  };

  const isPre = state.stepIndex === -1;
  const isDone = state.stepIndex >= SENSES.length;
  const sense = !isPre && !isDone ? SENSES[state.stepIndex] : null;

  const filledCount = sense
    ? state.entries[sense.id].filter((s) => s.trim().length > 0).length
    : 0;

  const canAdvance = sense ? filledCount >= sense.count : true;

  const updateEntry = (idx: number, v: string) => {
    if (!sense) return;
    const arr = [...state.entries[sense.id]];
    arr[idx] = v;
    broadcast({ ...state, entries: { ...state.entries, [sense.id]: arr } });
  };

  const go = (dir: 1 | -1) => {
    broadcast({ ...state, stepIndex: state.stepIndex + dir });
  };

  const restart = () => broadcast(DEFAULT_STATE);

  const setIntensity = (which: "before" | "after", v: number) => {
    broadcast({
      ...state,
      ...(which === "before" ? { intensityBefore: v } : { intensityAfter: v }),
    });
  };

  return (
    <div
      className="h-full w-full p-4 md:p-6 flex flex-col gap-4 rounded-2xl border-4 border-amber-900/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(255,247,237,0.55), rgba(253,230,138,0.35)), url(${ancoragemBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <header className="flex items-center justify-between flex-wrap gap-3 bg-white/90 backdrop-blur rounded-2xl border-2 border-white shadow-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <Anchor className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">5-4-3-2-1 Ancoragem</h2>
        </div>
        <div className="flex items-center gap-2">
          <StepDots
            current={state.stepIndex}
            total={SENSES.length}
          />
          <Button size="sm" variant="ghost" onClick={restart}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto">
        {isPre && (
          <IntensityCard
            title="Antes de começar"
            subtitle="Como está sua ansiedade agora? Arraste o número."
            value={state.intensityBefore}
            onChange={(v) => setIntensity("before", v)}
            onContinue={() => go(1)}
            continueLabel="Começar"
            continueDisabled={state.intensityBefore === null}
          />
        )}

        {sense && (
          <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur rounded-2xl border-2 border-white shadow-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-1">
              <div
                className="text-5xl"
                aria-hidden
              >
                {sense.emoji}
              </div>
              <div className="flex-1">
                <div
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: sense.color }}
                >
                  Passo {state.stepIndex + 1} de {SENSES.length}
                </div>
                <h3 className="text-2xl font-black leading-tight">
                  {sense.title}
                </h3>
              </div>
            </div>

            <p className="text-foreground/80 mt-2">{sense.prompt}</p>
            <p className="text-xs text-muted-foreground italic mt-1">
              Ex.: {sense.examples}
            </p>

            <div className="mt-5 space-y-2">
              {state.entries[sense.id].map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: sense.color }}
                  >
                    {i + 1}
                  </div>
                  <input
                    value={v}
                    onChange={(e) => updateEntry(i, e.target.value)}
                    placeholder={`${i + 1}ª coisa…`}
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-border/60 bg-white focus:outline-none focus:border-primary text-sm"
                  />
                  {v.trim().length > 0 && (
                    <Check className="w-4 h-4" style={{ color: sense.color }} />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" size="sm" onClick={() => go(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <div className="text-xs text-muted-foreground">
                {filledCount}/{sense.count} preenchidos
              </div>
              <Button
                size="sm"
                onClick={() => go(1)}
                disabled={!canAdvance}
                style={canAdvance ? { backgroundColor: sense.color } : undefined}
              >
                {state.stepIndex === SENSES.length - 1 ? "Finalizar" : "Próximo"}{" "}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {isDone && state.intensityAfter === null && (
          <IntensityCard
            title="Como você está agora?"
            subtitle="Repare como o corpo está depois do exercício."
            value={state.intensityAfter}
            onChange={(v) => setIntensity("after", v)}
            onContinue={() => setIntensity("after", state.intensityAfter ?? 0)}
            continueLabel="Ver resumo"
            continueDisabled={state.intensityAfter === null}
          />
        )}

        {isDone && state.intensityAfter !== null && (
          <SummaryCard state={state} onRestart={restart} />
        )}
      </div>
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === current
              ? "w-6 bg-primary"
              : i < current
              ? "w-2 bg-primary/60"
              : "w-2 bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function IntensityCard({
  title,
  subtitle,
  value,
  onChange,
  onContinue,
  continueLabel,
  continueDisabled,
}: {
  title: string;
  subtitle: string;
  value: number | null;
  onChange: (v: number) => void;
  onContinue: () => void;
  continueLabel: string;
  continueDisabled: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur rounded-2xl border-2 border-white shadow-xl p-6 md:p-8">
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="text-foreground/70 mt-1">{subtitle}</p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
          <span>0 · calma</span>
          <span>10 · pico</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-center mt-3">
          <div className="text-6xl font-black tabular-nums text-primary">
            {value ?? "—"}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onContinue} disabled={continueDisabled}>
          {continueLabel} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ state, onRestart }: { state: State; onRestart: () => void }) {
  const before = state.intensityBefore ?? 0;
  const after = state.intensityAfter ?? 0;
  const delta = before - after;
  return (
    <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur rounded-2xl border-2 border-white shadow-xl p-6 md:p-8">
      <h3 className="text-2xl font-black">Resumo da ancoragem</h3>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat label="Antes" value={before} color="#FB5607" />
        <Stat label="Depois" value={after} color="#06D6A0" />
        <Stat
          label="Variação"
          value={delta > 0 ? `−${delta}` : delta < 0 ? `+${-delta}` : "0"}
          color={delta > 0 ? "#06D6A0" : delta < 0 ? "#E63946" : "#6b7280"}
        />
      </div>

      <div className="mt-6 space-y-3">
        {SENSES.map((s) => {
          const items = state.entries[s.id].filter((v) => v.trim().length > 0);
          if (items.length === 0) return null;
          return (
            <div
              key={s.id}
              className="rounded-xl p-3 border-2"
              style={{ borderColor: s.color + "55", backgroundColor: s.color + "12" }}
            >
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: s.color }}
              >
                {s.emoji} {s.title}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((it, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-full bg-white border border-border/60"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw className="w-4 h-4 mr-1" /> Refazer
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-3 text-center border-2"
      style={{ borderColor: color + "55", backgroundColor: color + "12" }}
    >
      <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
        {label}
      </div>
      <div className="text-3xl font-black tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
