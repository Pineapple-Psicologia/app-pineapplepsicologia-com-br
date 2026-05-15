import { useEffect, useMemo, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Brain, Heart, Footprints, RotateCcw, Check, X, Sparkles, ChevronRight } from "lucide-react";

type Props = { room: ReturnType<typeof useRoom> };

type NodeId = "pensamento" | "emocao" | "comportamento";
type Tab = "triangulo" | "classificar" | "sua-vez";

type NodeMeta = {
  id: NodeId;
  label: string;
  emoji: string;
  color: string;
  short: string;
  desc: string;
  examples: string[];
};

const NODES: Record<NodeId, NodeMeta> = {
  pensamento: {
    id: "pensamento",
    label: "Pensamento",
    emoji: "💭",
    color: "#6366f1",
    short: "O que penso",
    desc: "Frases que aparecem na cabeça, automáticas, em forma de palavras ou imagens. Não são fatos — são interpretações.",
    examples: ['"Ninguém gosta de mim"', '"Vou me dar mal na prova"', '"Sou incapaz"'],
  },
  emocao: {
    id: "emocao",
    label: "Emoção",
    emoji: "❤️",
    color: "#ef4444",
    short: "O que sinto",
    desc: "Sentimentos no corpo e na mente. Costumam vir com sensações físicas (coração acelerado, calor, peso). Em geral 1 palavra: medo, raiva, tristeza, alegria.",
    examples: ["Tristeza", "Ansiedade", "Vergonha"],
  },
  comportamento: {
    id: "comportamento",
    label: "Comportamento",
    emoji: "🏃",
    color: "#10b981",
    short: "O que faço",
    desc: "Ações visíveis. O que uma câmera filmaria você fazendo (ou evitando fazer). Inclui falar, sair, evitar, chorar, gritar.",
    examples: ["Não responder a mensagem", "Trancar no quarto", "Estudar até de madrugada"],
  },
};

type Card = { text: string; type: NodeId };

const CARDS: Card[] = [
  { text: '"Eu nunca consigo nada"', type: "pensamento" },
  { text: "Coração acelerado e mãos suando", type: "emocao" },
  { text: "Sair correndo da sala", type: "comportamento" },
  { text: '"Ele tá bravo comigo"', type: "pensamento" },
  { text: "Raiva", type: "emocao" },
  { text: "Bater a porta com força", type: "comportamento" },
  { text: '"Vou ser o pior da turma"', type: "pensamento" },
  { text: "Medo apertando no peito", type: "emocao" },
  { text: "Não sair da cama", type: "comportamento" },
  { text: "Tristeza profunda", type: "emocao" },
  { text: '"Todo mundo vai rir de mim"', type: "pensamento" },
  { text: "Ficar mexendo no celular sem parar", type: "comportamento" },
];

type Scenario = { situation: string; hint?: string };

const SCENARIOS: Scenario[] = [
  { situation: "Você manda uma mensagem importante e seu amigo demora horas pra responder." },
  { situation: "A professora pede pra você ler em voz alta na frente da turma." },
  { situation: "Você foi convidado(a) pra uma festa onde só conhece uma pessoa." },
  { situation: "Sua mãe entrou no quarto séria e disse 'precisamos conversar'." },
];

type Quiz = {
  card: Card;
  answer?: NodeId;
  correct?: boolean;
};

type SuaVez = {
  situation: string;
  pensamento: string;
  emocao: string;
  comportamento: string;
};

type State = {
  tab: Tab;
  highlight: NodeId | null;
  // Classificar
  quizIdx: number;
  quizQueue: number[]; // shuffled card indices
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
  tab: "triangulo",
  highlight: null,
  quizIdx: 0,
  quizQueue: [],
  quizScore: 0,
  quizDone: false,
  lastAnswer: null,
  scenarioIdx: 0,
  suaVez: blankSuaVez(SCENARIOS[0].situation),
};

// Stable shuffle using a numeric seed (no Math.random in render — safe for SSR consistency)
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
    if (state.lastAnswer) return; // already answered, waiting for next
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

  // Initialize quiz queue if user opens tab without starting (defensive)
  useEffect(() => {
    if (state.tab === "classificar" && state.quizQueue.length === 0 && !state.quizDone) {
      startQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tab]);

  return (
    <div className="h-full w-full flex flex-col gap-3">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3 bg-card border-2 rounded-2xl px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold leading-tight">Triângulo Cognitivo</h2>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Pensamento · Emoção · Comportamento — três que andam sempre juntos.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-full p-1">
          {(
            [
              { id: "triangulo", label: "🔺 Triângulo" },
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

      {state.tab === "triangulo" && (
        <TrianguloView
          highlight={state.highlight}
          onHover={(id) => update({ highlight: id })}
          onStartQuiz={startQuiz}
        />
      )}

      {state.tab === "classificar" && (
        <ClassificarView
          state={state}
          onAnswer={answerQuiz}
          onNext={nextQuizCard}
          onRestart={startQuiz}
          onGoTriangulo={() => update({ tab: "triangulo" })}
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

/* ---------- Triângulo view ---------- */

function TrianguloView({
  highlight,
  onHover,
  onStartQuiz,
}: {
  highlight: NodeId | null;
  onHover: (id: NodeId | null) => void;
  onStartQuiz: () => void;
}) {
  const positions: Record<NodeId, { x: number; y: number }> = {
    pensamento: { x: 200, y: 60 },
    emocao: { x: 60, y: 280 },
    comportamento: { x: 340, y: 280 },
  };

  const focused = highlight ? NODES[highlight] : null;

  return (
    <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-3 min-h-0">
      <div className="relative bg-gradient-to-br from-indigo-50 via-white to-emerald-50 border-2 rounded-2xl shadow-inner p-3 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 400 360" className="w-full h-full max-h-[60vh]">
          {/* Connecting arrows */}
          {(
            [
              ["pensamento", "emocao"],
              ["emocao", "comportamento"],
              ["comportamento", "pensamento"],
            ] as [NodeId, NodeId][]
          ).map(([a, b]) => {
            const pa = positions[a];
            const pb = positions[b];
            const isActive = highlight === a || highlight === b;
            return (
              <g key={`${a}-${b}`}>
                <defs>
                  <marker
                    id={`arrow-${a}-${b}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill={isActive ? NODES[a].color : "#94a3b8"} />
                  </marker>
                </defs>
                <line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={isActive ? NODES[a].color : "#94a3b8"}
                  strokeWidth={isActive ? 3 : 2}
                  strokeLinecap="round"
                  markerEnd={`url(#arrow-${a}-${b})`}
                  opacity={isActive ? 1 : 0.55}
                  className="transition-all"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {(Object.keys(NODES) as NodeId[]).map((id) => {
            const n = NODES[id];
            const p = positions[id];
            const active = highlight === id;
            return (
              <g
                key={id}
                transform={`translate(${p.x}, ${p.y})`}
                onMouseEnter={() => onHover(id)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onHover(id)}
                className="cursor-pointer"
              >
                <circle
                  r={active ? 56 : 50}
                  fill={n.color}
                  opacity={active ? 1 : 0.92}
                  className="transition-all"
                  style={{ filter: `drop-shadow(0 6px 14px ${n.color}66)` }}
                />
                <text
                  y={-2}
                  textAnchor="middle"
                  fontSize="32"
                  className="pointer-events-none select-none"
                >
                  {n.emoji}
                </text>
                <text
                  y={20}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="#fff"
                  className="pointer-events-none select-none"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side info */}
      <aside className="bg-card border-2 rounded-2xl p-3 shadow-sm flex flex-col gap-3 overflow-auto">
        {focused ? (
          <div className="flex flex-col gap-2">
            <div
              className="rounded-xl p-3 text-white"
              style={{ background: `linear-gradient(135deg, ${focused.color}, ${focused.color}cc)` }}
            >
              <div className="text-3xl">{focused.emoji}</div>
              <div className="text-xl font-bold">{focused.label}</div>
              <div className="text-xs opacity-90">{focused.short}</div>
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
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Os três cantos do triângulo se influenciam o tempo todo. Mudar um, mexe nos outros.
              <br />
              <span className="text-muted-foreground text-xs">
                Toque em cada canto para entender melhor.
              </span>
            </p>
            <div className="grid gap-2">
              {(Object.keys(NODES) as NodeId[]).map((id) => {
                const n = NODES[id];
                return (
                  <button
                    key={id}
                    onClick={() => onHover(id)}
                    className="flex items-center gap-3 p-2 rounded-xl border-2 hover:scale-[1.02] transition-transform text-left"
                    style={{ borderColor: `${n.color}55`, background: `${n.color}12` }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                      style={{ background: n.color, color: "#fff" }}
                    >
                      {n.emoji}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{n.label}</div>
                      <div className="text-[11px] text-muted-foreground">{n.short}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button onClick={onStartQuiz} className="mt-auto">
              Vamos praticar 🃏 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ---------- Classificar view ---------- */

function ClassificarView({
  state,
  onAnswer,
  onNext,
  onRestart,
  onGoTriangulo,
}: {
  state: State;
  onAnswer: (pick: NodeId) => void;
  onNext: () => void;
  onRestart: () => void;
  onGoTriangulo: () => void;
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
          <Button variant="outline" onClick={onGoTriangulo}>
            Revisar triângulo
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
        <span>
          ✅ {state.quizScore}
        </span>
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
                  <Check className="w-4 h-4 inline" /> Isso! É um {NODES[card.type].label.toLowerCase()}.
                </span>
              ) : (
                <span className="text-rose-700">
                  <X className="w-4 h-4 inline" /> Quase! Era um <strong>{NODES[card.type].label.toLowerCase()}</strong> {NODES[card.type].emoji}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(NODES) as NodeId[]).map((id) => {
          const n = NODES[id];
          const picked = state.lastAnswer?.pick === id;
          const showCorrect = answered && card.type === id;
          return (
            <button
              key={id}
              onClick={() => onAnswer(id)}
              disabled={answered}
              className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                showCorrect
                  ? "border-emerald-500 bg-emerald-100 scale-105"
                  : picked
                    ? "border-rose-500 bg-rose-100"
                    : "border-border bg-card hover:scale-[1.02] disabled:opacity-50"
              }`}
              style={!answered ? { borderColor: `${n.color}55` } : undefined}
            >
              <div className="text-2xl">{n.emoji}</div>
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
        <div className="rounded-lg p-3 bg-muted/60 border-l-4 border-primary">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Situação
          </div>
          <div className="text-sm font-medium">{state.suaVez.situation}</div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {(Object.keys(NODES) as NodeId[]).map((id) => {
            const n = NODES[id];
            const value =
              id === "pensamento"
                ? state.suaVez.pensamento
                : id === "emocao"
                  ? state.suaVez.emocao
                  : state.suaVez.comportamento;
            const placeholder =
              id === "pensamento"
                ? 'Ex: "ele tá bravo comigo"'
                : id === "emocao"
                  ? "Ex: tristeza, ansiedade"
                  : "Ex: não responder, ficar trancado(a)";
            return (
              <div
                key={id}
                className="rounded-xl border-2 p-3 flex flex-col gap-2"
                style={{ borderColor: `${n.color}66`, background: `${n.color}0d` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ background: n.color, color: "#fff" }}
                  >
                    {n.emoji}
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight">{n.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{n.short}</div>
                  </div>
                </div>
                <textarea
                  value={value}
                  onChange={(e) =>
                    onUpdate(
                      id === "pensamento"
                        ? { pensamento: e.target.value }
                        : id === "emocao"
                          ? { emocao: e.target.value }
                          : { comportamento: e.target.value },
                    )
                  }
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
            <div className="text-2xl">💡</div>
            <div className="text-sm">
              <strong className="block mb-1">Olhe como tudo se conecta:</strong>
              Pensar <em>"{state.suaVez.pensamento}"</em> faz sentir <strong>{state.suaVez.emocao}</strong> e
              acaba levando a <em>{state.suaVez.comportamento}</em>.
              <br />
              <span className="text-muted-foreground">
                E se o pensamento fosse outro? Como você acha que a emoção e o que faria mudariam?
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
