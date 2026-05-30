import { useEffect, useMemo, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, X, Sparkles, ChevronRight } from "lucide-react";
import imgSituacao from "@/assets/ciclo-situacao.png";
import imgPensamento from "@/assets/ciclo-pensamento.png";
import imgEmocao from "@/assets/ciclo-emocao.png";
import imgComportamento from "@/assets/ciclo-comportamento.png";
import trianguloBg from "@/assets/scene-triangulo.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type NodeId = "situacao" | "pensamento" | "emocao" | "comportamento";
type Tab = "ciclo" | "classificar" | "sua-vez";

type NodeMeta = {
  id: NodeId;
  label: string;
  emoji: string;
  image: string;
  color: string;
  short: string;
  desc: string;
  examples: string[];
};

const NODES: Record<NodeId, NodeMeta> = {
  situacao: {
    id: "situacao",
    label: "Situação",
    emoji: "🎬",
    image: imgSituacao,
    color: "#f59e0b",
    short: "O que aconteceu",
    desc: "O fato, o gatilho. Algo que aconteceu no mundo de fora — uma fala, uma cena, uma mensagem. É neutro: só descreve o que uma câmera filmaria.",
    examples: [
      "A professora chamou meu nome",
      "Meu amigo não respondeu a mensagem",
      "Cheguei numa festa cheia",
    ],
  },
  pensamento: {
    id: "pensamento",
    label: "Pensamento",
    emoji: "💭",
    image: imgPensamento,
    color: "#6366f1",
    short: "O que penso",
    desc: "Frases automáticas que aparecem na cabeça em palavras ou imagens. Não são fatos — são interpretações da situação.",
    examples: ['"Vou me dar mal"', '"Ninguém gosta de mim"', '"Sou incapaz"'],
  },
  emocao: {
    id: "emocao",
    label: "Emoção",
    emoji: "❤️",
    image: imgEmocao,
    color: "#ef4444",
    short: "O que sinto",
    desc: "Sentimentos no corpo e na mente. Costumam vir com sensações físicas (coração acelerado, calor, peso). Em geral 1 palavra.",
    examples: ["Medo", "Tristeza", "Vergonha"],
  },
  comportamento: {
    id: "comportamento",
    label: "Comportamento",
    emoji: "🏃",
    image: imgComportamento,
    color: "#10b981",
    short: "O que faço",
    desc: "Ações visíveis. O que uma câmera filmaria você fazendo (ou evitando fazer). E esse comportamento vira nova situação — o ciclo se retroalimenta.",
    examples: ["Sair da sala", "Trancar no quarto", "Ficar no celular sem parar"],
  },
};

const ORDER: NodeId[] = ["situacao", "pensamento", "emocao", "comportamento"];

type Card = { text: string; type: NodeId };

const CARDS: Card[] = [
  { text: "A professora pediu pra eu ler em voz alta", type: "situacao" },
  { text: '"Eu nunca consigo nada"', type: "pensamento" },
  { text: "Coração acelerado e mãos suando", type: "emocao" },
  { text: "Sair correndo da sala", type: "comportamento" },
  { text: "Mandei mensagem e ninguém respondeu", type: "situacao" },
  { text: '"Ele tá bravo comigo"', type: "pensamento" },
  { text: "Raiva apertando no peito", type: "emocao" },
  { text: "Bater a porta com força", type: "comportamento" },
  { text: "Recebi nota baixa na prova", type: "situacao" },
  { text: '"Vou ser o pior da turma"', type: "pensamento" },
  { text: "Tristeza profunda", type: "emocao" },
  { text: "Não sair da cama o dia inteiro", type: "comportamento" },
  { text: "Cheguei numa festa cheia de gente que não conheço", type: "situacao" },
  { text: '"Todo mundo vai rir de mim"', type: "pensamento" },
  { text: "Medo apertando o estômago", type: "emocao" },
  { text: "Ficar mexendo no celular sem falar com ninguém", type: "comportamento" },
];

type Scenario = { situation: string };

const SCENARIOS: Scenario[] = [
  { situation: "Você manda uma mensagem importante e seu amigo demora horas pra responder." },
  { situation: "A professora pede pra você ler em voz alta na frente da turma." },
  { situation: "Você foi convidado(a) pra uma festa onde só conhece uma pessoa." },
  { situation: "Sua mãe entrou no quarto séria e disse 'precisamos conversar'." },
];

type SuaVez = {
  situation: string;
  pensamento: string;
  emocao: string;
  comportamento: string;
};

type State = {
  tab: Tab;
  highlight: NodeId | null;
  // Ciclo animation step (auto-advances)
  step: number;
  playing: boolean;
  // Classificar
  quizIdx: number;
  quizQueue: number[];
  quizScore: number;
  quizDone: boolean;
  lastAnswer: { cardIdx: number; pick: NodeId; correct: boolean } | null;
  // Sua vez
  scenarioIdx: number;
  suaVez: SuaVez;
};

const blankSuaVez = (situation: string): SuaVez => ({
  situation,
  pensamento: "",
  emocao: "",
  comportamento: "",
});

const INITIAL: State = {
  tab: "ciclo",
  highlight: null,
  step: 0,
  playing: false,
  quizIdx: 0,
  quizQueue: [],
  quizScore: 0,
  quizDone: false,
  lastAnswer: null,
  scenarioIdx: 0,
  suaVez: blankSuaVez(SCENARIOS[0].situation),
};

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TrianguloCognitivo({ room }: Props) {
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    const off = room.on((m) => {
      if (m.type === "tri:state") setState(m.payload as State);
    });
    return off;
  }, [room]);

  const update = (patch: Partial<State>) => {
    const next = { ...state, ...patch };
    setState(next);
    room.send("tri:state", next);
  };

  const startQuiz = () => {
    const seed = Date.now() % 100000;
    const queue = shuffle(
      CARDS.map((_, i) => i),
      seed,
    ).slice(0, 8);
    update({
      tab: "classificar",
      quizQueue: queue,
      quizIdx: 0,
      quizScore: 0,
      quizDone: false,
      lastAnswer: null,
    });
  };

  const answerQuiz = (pick: NodeId) => {
    if (state.lastAnswer) return;
    const cardIdx = state.quizQueue[state.quizIdx];
    const card = CARDS[cardIdx];
    const correct = card.type === pick;
    update({
      lastAnswer: { cardIdx, pick, correct },
      quizScore: state.quizScore + (correct ? 1 : 0),
    });
  };

  const nextQuizCard = () => {
    const next = state.quizIdx + 1;
    if (next >= state.quizQueue.length) {
      update({ quizDone: true, lastAnswer: null });
    } else {
      update({ quizIdx: next, lastAnswer: null });
    }
  };

  const pickScenario = (i: number) => {
    update({ scenarioIdx: i, suaVez: blankSuaVez(SCENARIOS[i].situation) });
  };

  const updateSuaVez = (patch: Partial<SuaVez>) => {
    update({ suaVez: { ...state.suaVez, ...patch } });
  };

  useEffect(() => {
    if (state.tab === "classificar" && state.quizQueue.length === 0 && !state.quizDone) {
      startQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tab]);

  // Auto-advance the ciclo animation when playing
  useEffect(() => {
    if (state.tab !== "ciclo" || !state.playing) return;
    const t = setTimeout(() => {
      update({ step: (state.step + 1) % ORDER.length });
    }, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.playing, state.tab]);

  return (
    <div
      className="h-full w-full flex flex-col gap-3 p-3 md:p-4 rounded-2xl border-4 border-amber-900/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(255,247,237,0.55), rgba(254,215,170,0.35)), url(${trianguloBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <header className="flex items-center justify-between flex-wrap gap-3 bg-card border-2 rounded-2xl px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold leading-tight">Ciclo Cognitivo</h2>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Situação · Pensamento · Emoção · Comportamento — um alimenta o outro.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-full p-1">
          {(
            [
              { id: "ciclo", label: "🔄 Ciclo" },
              { id: "classificar", label: "🃏 Classificar" },
              { id: "sua-vez", label: "✏️ Sua vez" },
            ] as { id: Tab; label: string }[]
          ).map((t) => {
            const active = state.tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => update({ tab: t.id })}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {state.tab === "ciclo" && (
        <CicloView
          highlight={state.highlight}
          step={state.step}
          playing={state.playing}
          onHover={(id) => update({ highlight: id })}
          onTogglePlay={() => update({ playing: !state.playing })}
          onStep={(s) => update({ step: s, playing: false })}
          onStartQuiz={startQuiz}
        />
      )}

      {state.tab === "classificar" && (
        <ClassificarView
          state={state}
          onAnswer={answerQuiz}
          onNext={nextQuizCard}
          onRestart={startQuiz}
          onGoCiclo={() => update({ tab: "ciclo" })}
        />
      )}

      {state.tab === "sua-vez" && (
        <SuaVezView
          state={state}
          onPickScenario={pickScenario}
          onUpdate={updateSuaVez}
          onReset={() => update({ suaVez: blankSuaVez(SCENARIOS[state.scenarioIdx].situation) })}
        />
      )}
    </div>
  );
}

/* ---------- Ciclo view (4 nodes in a circle, retroalimentando) ---------- */

function CicloView({
  highlight,
  step,
  playing,
  onHover,
  onTogglePlay,
  onStep,
  onStartQuiz,
}: {
  highlight: NodeId | null;
  step: number;
  playing: boolean;
  onHover: (id: NodeId | null) => void;
  onTogglePlay: () => void;
  onStep: (s: number) => void;
  onStartQuiz: () => void;
}) {
  // 4 positions evenly around a circle (top, right, bottom, left)
  const cx = 240;
  const cy = 240;
  const r = 150;
  const positions: Record<NodeId, { x: number; y: number; angle: number }> = {
    situacao: { x: cx, y: cy - r, angle: -90 },
    pensamento: { x: cx + r, y: cy, angle: 0 },
    emocao: { x: cx, y: cy + r, angle: 90 },
    comportamento: { x: cx - r, y: cy, angle: 180 },
  };

  const activeId = highlight ?? ORDER[step];
  const focused = NODES[activeId];

  return (
    <div className="flex-1 grid md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_320px] gap-3 min-h-0">
      <div className="relative bg-gradient-to-br from-amber-50 via-white to-emerald-50 border-2 rounded-2xl shadow-inner p-3 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 480 480" className="w-full h-full max-h-[60vh]">
          <defs>
            {ORDER.map((id, i) => {
              const next = ORDER[(i + 1) % ORDER.length];
              return (
                <marker
                  key={`m-${id}`}
                  id={`arrow-${id}-${next}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill={NODES[id].color} />
                </marker>
              );
            })}
          </defs>

          {/* Curved arrows around the circle */}
          {ORDER.map((id, i) => {
            const next = ORDER[(i + 1) % ORDER.length];
            const a = positions[id];
            const b = positions[next];
            const isActive = activeId === id || (playing && step === i);
            // Sweep arc going outside the circle
            const path = arcBetween(a.x, a.y, b.x, b.y, cx, cy, r + 30);
            return (
              <path
                key={`arc-${id}`}
                d={path}
                fill="none"
                stroke={NODES[id].color}
                strokeWidth={isActive ? 5 : 3}
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.45}
                markerEnd={`url(#arrow-${id}-${next})`}
                className="transition-all duration-500"
              />
            );
          })}

          {/* Center label */}
          <g transform={`translate(${cx}, ${cy})`} className="pointer-events-none select-none">
            <circle r={56} fill="#fff" opacity={0.85} stroke="#e5e7eb" strokeWidth={2} />
            <text textAnchor="middle" y={-6} fontSize="13" fontWeight="700" fill="#475569">
              Ciclo
            </text>
            <text textAnchor="middle" y={12} fontSize="11" fill="#64748b">
              que se
            </text>
            <text textAnchor="middle" y={26} fontSize="11" fill="#64748b">
              retroalimenta
            </text>
          </g>

          {/* Nodes */}
          {ORDER.map((id, i) => {
            const n = NODES[id];
            const p = positions[id];
            const active = activeId === id;
            const size = active ? 96 : 84;
            return (
              <g
                key={id}
                transform={`translate(${p.x}, ${p.y})`}
                onMouseEnter={() => onHover(id)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onStep(i)}
                className="cursor-pointer"
              >
                <circle
                  r={size / 2 + 6}
                  fill={n.color}
                  opacity={active ? 1 : 0.85}
                  className="transition-all duration-300"
                  style={{ filter: `drop-shadow(0 8px 18px ${n.color}66)` }}
                />
                <circle r={size / 2 + 2} fill="#fff" />
                <clipPath id={`clip-${id}`}>
                  <circle r={size / 2} />
                </clipPath>
                <image
                  href={n.image}
                  x={-size / 2}
                  y={-size / 2}
                  width={size}
                  height={size}
                  clipPath={`url(#clip-${id})`}
                  preserveAspectRatio="xMidYMid slice"
                />
                <g transform={`translate(0, ${size / 2 + 22})`}>
                  <rect
                    x={-50}
                    y={-12}
                    width={100}
                    height={22}
                    rx={11}
                    fill={n.color}
                  />
                  <text
                    textAnchor="middle"
                    y={3}
                    fontSize="12"
                    fontWeight="700"
                    fill="#fff"
                    className="pointer-events-none select-none"
                  >
                    {n.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side info */}
      <aside className="bg-card border-2 rounded-2xl p-3 shadow-sm flex flex-col gap-3 overflow-auto">
        <div className="flex gap-2">
          <Button size="sm" variant={playing ? "secondary" : "default"} onClick={onTogglePlay} className="flex-1">
            {playing ? "⏸ Pausar ciclo" : "▶ Animar ciclo"}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div
            className="rounded-xl p-3 text-white"
            style={{ background: `linear-gradient(135deg, ${focused.color}, ${focused.color}cc)` }}
          >
            <div className="flex items-center gap-3">
              <img
                src={focused.image}
                alt={focused.label}
                width={56}
                height={56}
                loading="lazy"
                className="w-14 h-14 rounded-full bg-white/90 object-cover ring-2 ring-white/60"
              />
              <div>
                <div className="text-xl font-bold leading-tight">{focused.label}</div>
                <div className="text-xs opacity-90">{focused.short}</div>
              </div>
            </div>
          </div>
          <p className="text-sm leading-snug">{focused.desc}</p>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
              Exemplos
            </div>
            <ul className="text-sm space-y-1">
              {focused.examples.map((e, i) => (
                <li key={i} className="rounded-md px-2 py-1 bg-muted/60">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button onClick={onStartQuiz} className="mt-auto" variant="outline">
          Vamos praticar 🃏 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </aside>
    </div>
  );
}

// Build a curved arc going around the outside of the circle
function arcBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  r: number,
): string {
  // angle from center to start/end shrunk slightly so arrow doesn't sit on node
  const a1 = Math.atan2(y1 - cy, x1 - cx) + 0.35;
  const a2 = Math.atan2(y2 - cy, x2 - cx) - 0.35;
  const sx = cx + Math.cos(a1) * r;
  const sy = cy + Math.sin(a1) * r;
  const ex = cx + Math.cos(a2) * r;
  const ey = cy + Math.sin(a2) * r;
  return `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
}

/* ---------- Classificar view ---------- */

function ClassificarView({
  state,
  onAnswer,
  onNext,
  onRestart,
  onGoCiclo,
}: {
  state: State;
  onAnswer: (pick: NodeId) => void;
  onNext: () => void;
  onRestart: () => void;
  onGoCiclo: () => void;
}) {
  if (state.quizDone) {
    const total = state.quizQueue.length;
    const score = state.quizScore;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 bg-card border-2 rounded-2xl p-6">
        <div className="text-5xl">🏆</div>
        <h3 className="text-2xl font-bold">Fim da rodada!</h3>
        <p className="text-lg">
          Você acertou <strong>{score}</strong> de <strong>{total}</strong> ({pct}%)
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onGoCiclo}>
            Revisar ciclo
          </Button>
          <Button onClick={onRestart}>
            <RotateCcw className="w-4 h-4 mr-1" /> Nova rodada
          </Button>
        </div>
      </div>
    );
  }

  if (state.quizQueue.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  const cardIdx = state.quizQueue[state.quizIdx];
  const card = CARDS[cardIdx];
  const answered = !!state.lastAnswer;
  const isCorrect = state.lastAnswer?.correct;

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-muted-foreground">
          Carta {state.quizIdx + 1} de {state.quizQueue.length}
        </span>
        <span>✅ {state.quizScore}</span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div
          className={`w-full max-w-md p-6 rounded-2xl border-4 shadow-lg text-center transition-all ${
            answered
              ? isCorrect
                ? "bg-emerald-50 border-emerald-400"
                : "bg-rose-50 border-rose-400"
              : "bg-card border-primary/30"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
            Isso é...
          </div>
          <div className="text-xl md:text-2xl font-bold leading-snug">{card.text}</div>
          {answered && (
            <div className="mt-3 text-sm">
              {isCorrect ? (
                <span className="text-emerald-700 font-semibold">
                  <Check className="w-4 h-4 inline" /> Isso! É uma {NODES[card.type].label.toLowerCase()}.
                </span>
              ) : (
                <span className="text-rose-700">
                  <X className="w-4 h-4 inline" /> Quase! Era uma <strong>{NODES[card.type].label.toLowerCase()}</strong> {NODES[card.type].emoji}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {ORDER.map((id) => {
          const n = NODES[id];
          const picked = state.lastAnswer?.pick === id;
          const showCorrect = answered && card.type === id;
          return (
            <button
              key={id}
              onClick={() => onAnswer(id)}
              disabled={answered}
              className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                showCorrect
                  ? "border-emerald-500 bg-emerald-100 scale-105"
                  : picked
                    ? "border-rose-500 bg-rose-100"
                    : "border-border bg-card hover:scale-[1.02] disabled:opacity-50"
              }`}
              style={!answered ? { borderColor: `${n.color}55` } : undefined}
            >
              <img
                src={n.image}
                alt={n.label}
                width={40}
                height={40}
                loading="lazy"
                className="w-10 h-10 rounded-full object-cover bg-muted"
              />
              <div>{n.label}</div>
            </button>
          );
        })}
      </div>

      {answered && (
        <Button onClick={onNext} className="self-end">
          Próxima carta <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}

/* ---------- Sua vez view ---------- */

function SuaVezView({
  state,
  onPickScenario,
  onUpdate,
  onReset,
}: {
  state: State;
  onPickScenario: (i: number) => void;
  onUpdate: (patch: Partial<SuaVez>) => void;
  onReset: () => void;
}) {
  const filled = useMemo(
    () => !!(state.suaVez.pensamento.trim() && state.suaVez.emocao.trim() && state.suaVez.comportamento.trim()),
    [state.suaVez],
  );

  const fields: { id: Exclude<NodeId, "situacao">; placeholder: string }[] = [
    { id: "pensamento", placeholder: 'Ex: "ele tá bravo comigo"' },
    { id: "emocao", placeholder: "Ex: tristeza, ansiedade" },
    { id: "comportamento", placeholder: "Ex: não responder, ficar trancado(a)" },
  ];

  return (
    <div className="flex-1 grid lg:grid-cols-[260px_1fr] gap-3 min-h-0">
      <aside className="bg-card border-2 rounded-2xl p-3 shadow-sm flex flex-col gap-2 overflow-auto">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          Escolha uma situação
        </div>
        {SCENARIOS.map((s, i) => {
          const active = state.scenarioIdx === i;
          return (
            <button
              key={i}
              onClick={() => onPickScenario(i)}
              className={`text-left p-2 rounded-lg border-2 text-sm transition-all ${
                active
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border/60 hover:border-border bg-background"
              }`}
            >
              {s.situation}
            </button>
          );
        })}
        <Button variant="ghost" size="sm" onClick={onReset} className="mt-auto">
          <RotateCcw className="w-4 h-4 mr-1" /> Limpar
        </Button>
      </aside>

      <div className="bg-card border-2 rounded-2xl p-3 md:p-4 shadow-sm flex flex-col gap-3 overflow-auto">
        <div
          className="rounded-xl p-3 flex gap-3 items-center"
          style={{ background: `${NODES.situacao.color}15`, border: `2px solid ${NODES.situacao.color}55` }}
        >
          <img
            src={NODES.situacao.image}
            alt="Situação"
            width={56}
            height={56}
            loading="lazy"
            className="w-14 h-14 rounded-full object-cover bg-white shrink-0"
          />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: NODES.situacao.color }}>
              Situação
            </div>
            <div className="text-sm font-medium">{state.suaVez.situation}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {fields.map(({ id, placeholder }) => {
            const n = NODES[id];
            const value = state.suaVez[id];
            return (
              <div
                key={id}
                className="rounded-xl border-2 p-3 flex flex-col gap-2"
                style={{ borderColor: `${n.color}66`, background: `${n.color}0d` }}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={n.image}
                    alt={n.label}
                    width={36}
                    height={36}
                    loading="lazy"
                    className="w-9 h-9 rounded-full object-cover bg-white shrink-0"
                    style={{ boxShadow: `0 0 0 2px ${n.color}` }}
                  />
                  <div>
                    <div className="font-bold text-sm leading-tight">{n.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{n.short}</div>
                  </div>
                </div>
                <textarea
                  value={value}
                  onChange={(e) => onUpdate({ [id]: e.target.value } as Partial<SuaVez>)}
                  placeholder={placeholder}
                  className="min-h-[80px] p-2 rounded-lg border-2 bg-background resize-none focus:outline-none text-sm"
                  style={{ borderColor: `${n.color}33` }}
                />
              </div>
            );
          })}
        </div>

        {filled && (
          <div className="rounded-xl p-3 border-2 border-emerald-300 bg-emerald-50 flex gap-3 items-start">
            <div className="text-2xl">🔄</div>
            <div className="text-sm">
              <strong className="block mb-1">Veja o ciclo se retroalimentando:</strong>
              A <strong>situação</strong> "{state.suaVez.situation}" disparou o pensamento{" "}
              <em>"{state.suaVez.pensamento}"</em>, que fez sentir{" "}
              <strong>{state.suaVez.emocao}</strong>, e por causa disso a ação foi{" "}
              <em>{state.suaVez.comportamento}</em> — e essa ação vira uma nova situação que
              começa o ciclo de novo.
              <br />
              <span className="text-muted-foreground">
                E se o pensamento fosse outro? Como a emoção e o comportamento mudariam?
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
