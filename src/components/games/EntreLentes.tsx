import { useEffect, useMemo, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Eye, RotateCcw, Search, Sparkles, BookOpen } from "lucide-react";
import salaImg from "@/assets/lentes-paisagem.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type LensId =
  | "neutra"
  | "curiosa"
  | "catastrofe"
  | "personalizacao"
  | "leituraMental"
  | "adivinhacao"
  | "generalizacao"
  | "tudoOuNada"
  | "filtroMental"
  | "rotulacao";

type Lens = {
  id: LensId;
  label: string;
  short: string;
  color: string;
  ring: string;
  emoji: string;
  description: string;
  distortion?: string; // nome técnico da distorção cognitiva
};

const LENSES: Lens[] = [
  {
    id: "neutra",
    label: "Sem lente",
    short: "Olhar cru",
    color: "#e9ead4",
    ring: "#c9caa7",
    emoji: "👁️",
    description: "Você vê a cena sem nenhuma interpretação automática. É raro ficarmos assim por muito tempo.",
  },
  {
    id: "curiosa",
    label: "Lente curiosa",
    short: "‘O que será que aconteceu?’",
    color: "#7a8a3a",
    ring: "#4a5a2a",
    emoji: "🔍",
    description: "A cena vira um quebra-cabeça aberto. Você procura contexto antes de concluir. Não é uma distorção — é o caminho saudável.",
  },
  {
    id: "catastrofe",
    label: "Catastrofização",
    short: "‘Vai dar tudo errado’",
    color: "#7a3a2a",
    ring: "#4a1f15",
    emoji: "🌩️",
    description: "Qualquer detalhe vira o começo de algo terrível. O futuro escurece e o pior cenário parece o único possível.",
    distortion: "Catastrofização",
  },
  {
    id: "personalizacao",
    label: "Personalização",
    short: "‘É por minha causa’",
    color: "#b85c7a",
    ring: "#7a3450",
    emoji: "🫣",
    description: "Você se sente responsável ou alvo de coisas que, na verdade, não têm a ver com você.",
    distortion: "Personalização",
  },
  {
    id: "leituraMental",
    label: "Leitura mental",
    short: "‘Sei o que pensam de mim’",
    color: "#5a6cb8",
    ring: "#2f3d7a",
    emoji: "🧠",
    description: "Você assume saber o que os outros estão pensando — geralmente algo ruim sobre você — sem nenhuma evidência.",
    distortion: "Leitura mental",
  },
  {
    id: "adivinhacao",
    label: "Adivinhação do futuro",
    short: "‘Já sei como vai terminar’",
    color: "#7a5ab8",
    ring: "#4a307a",
    emoji: "🔮",
    description: "Você prevê o pior antes mesmo de tentar, como se já soubesse o final da história.",
    distortion: "Adivinhação",
  },
  {
    id: "generalizacao",
    label: "Generalização",
    short: "‘Sempre acontece comigo’",
    color: "#8a6a3a",
    ring: "#5a4220",
    emoji: "♾️",
    description: "Um acontecimento vira regra: ‘sempre’, ‘nunca’, ‘ninguém’, ‘todo mundo’.",
    distortion: "Generalização excessiva",
  },
  {
    id: "tudoOuNada",
    label: "Tudo ou nada",
    short: "‘Ou perfeito, ou péssimo’",
    color: "#3a3a3a",
    ring: "#1a1a1a",
    emoji: "⚖️",
    description: "Pensamento em preto e branco: ou foi um sucesso total, ou foi um fracasso completo. Sem meio-termo.",
    distortion: "Pensamento dicotômico",
  },
  {
    id: "filtroMental",
    label: "Filtro mental",
    short: "‘Só vejo o que deu errado’",
    color: "#3a5a6a",
    ring: "#1f3a4a",
    emoji: "🕶️",
    description: "Você foca só nos detalhes negativos e ignora tudo o que está dando certo na cena.",
    distortion: "Filtro mental",
  },
  {
    id: "rotulacao",
    label: "Rotulação",
    short: "‘Sou um(a) fracassado(a)’",
    color: "#a05a3a",
    ring: "#6a3820",
    emoji: "🏷️",
    description: "Em vez de descrever um comportamento, você cola um rótulo permanente em si ou nos outros.",
    distortion: "Rotulação",
  },
];

const lensById = (id: LensId) => LENSES.find((l) => l.id === id)!;

const DISTORTING_LENSES: LensId[] = [
  "catastrofe",
  "personalizacao",
  "leituraMental",
  "adivinhacao",
  "generalizacao",
  "tudoOuNada",
  "filtroMental",
  "rotulacao",
];

// ---------- Cena: pessoa de costas olhando uma paisagem ----------
// As "pistas" são elementos da paisagem que o jogador investiga para ganhar clareza.

const CLUE_POSITIONS = {
  sol: { x: 50, y: 30 },
  rio: { x: 42, y: 78 },
  arvore: { x: 15, y: 72 },
  nuvem: { x: 82, y: 22 },
} as const;

type Clue = { id: string; label: string; x: number; y: number; reveals: string };

const CLUES: Clue[] = [
  { id: "sol", label: "O pôr do sol", x: CLUE_POSITIONS.sol.x, y: CLUE_POSITIONS.sol.y, reveals: "A luz dourada acontece todo dia, independente do que você esteja sentindo. Há beleza no momento — mesmo quando a cabeça insiste em escurecê-la." },
  { id: "rio", label: "O rio", x: CLUE_POSITIONS.rio.x, y: CLUE_POSITIONS.rio.y, reveals: "O rio segue seu curso sem pressa. Pensamentos também passam — eles não são você, são só água correndo." },
  { id: "arvore", label: "As árvores", x: CLUE_POSITIONS.arvore.x, y: CLUE_POSITIONS.arvore.y, reveals: "Cada árvore tem seu tamanho, sua forma. Comparar-se com elas não muda o que você é. A paisagem comporta todas." },
  { id: "nuvem", label: "As nuvens", x: CLUE_POSITIONS.nuvem.x, y: CLUE_POSITIONS.nuvem.y, reveals: "As nuvens mudam de forma o tempo todo. O que parece ameaçador agora pode dissolver em minutos. Nem toda nuvem vira tempestade." },
];

// ---------- Estado sincronizado ----------
type State = {
  started: boolean;
  lens: LensId;
  intensity: Record<LensId, number>;
  clarity: number;
  revealedClues: string[];
  log: { lens: LensId; at: number }[];
};

const emptyIntensity = (): Record<LensId, number> =>
  LENSES.reduce((acc, l) => {
    acc[l.id] = 0;
    return acc;
  }, {} as Record<LensId, number>);

const initialState: State = {
  started: false,
  lens: "neutra",
  intensity: emptyIntensity(),
  clarity: 0,
  revealedClues: [],
  log: [],
};

export default function EntreLentes({ room }: Props) {
  const [state, setState] = useState<State>(initialState);

  // Garante que intensity sempre tenha todas as lentes (mesmo vindo de uma sessão antiga via realtime)
  const normalizeState = (s: State): State => ({
    ...s,
    intensity: { ...emptyIntensity(), ...(s.intensity || {}) },
    lens: LENSES.some((l) => l.id === s.lens) ? s.lens : "neutra",
    revealedClues: s.revealedClues ?? [],
    log: s.log ?? [],
    clarity: s.clarity ?? 0,
  });

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "lentes:state") setState(normalizeState(m.payload));
    });
  }, [room]);

  const update = (patch: Partial<State> | ((s: State) => State)) => {
    setState((prev) => {
      const merged = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      const next = normalizeState(merged);
      room.send("lentes:state", next);
      return next;
    });
  };

  const equipLens = (id: LensId) => {
    update((s) => {
      const current = s.intensity[id] ?? 0;
      const bumped = id === "neutra" ? current : Math.min(3, current + 1);
      return {
        ...s,
        lens: id,
        intensity: { ...s.intensity, [id]: bumped },
        log: [...s.log.slice(-5), { lens: id, at: Date.now() }],
      };
    });
  };

  const investigate = (clueId: string) => {
    update((s) => {
      if (s.revealedClues.includes(clueId)) return s;
      const revealed = [...s.revealedClues, clueId];
      const intensity = { ...s.intensity };
      for (const k of DISTORTING_LENSES) intensity[k] = Math.max(0, (intensity[k] ?? 0) - 1);
      return {
        ...s,
        revealedClues: revealed,
        clarity: Math.min(CLUES.length, s.clarity + 1),
        intensity,
      };
    });
  };

  const reset = () => update(() => initialState);
  const startGame = () => update({ started: true });

  const lens = lensById(state.lens) ?? LENSES[0];
  const intensity = state.intensity[state.lens] ?? 0;
  const isDistorting = DISTORTING_LENSES.includes(state.lens);

  // Hook precisa rodar em todo render — fica antes do early return da intro
  const sceneStyle = useMemo<React.CSSProperties>(() => {
    const t = intensity / 3;
    const clarityT = state.clarity / CLUES.length;
    const dampen = 1 - clarityT * 0.55;
    if (state.lens === "neutra") return { filter: "saturate(1) contrast(1)" };
    if (state.lens === "curiosa") return { filter: `saturate(${1 + t * 0.15}) brightness(${1 + t * 0.05})` };
    switch (state.lens) {
      case "personalizacao": {
        const desat = 1 - t * 0.5 * dampen;
        return { filter: `saturate(${desat}) blur(${t * 1.2 * dampen}px) brightness(${1 - t * 0.15 * dampen})` };
      }
      case "catastrofe":
        return { filter: `contrast(${1 + t * 0.45 * dampen}) saturate(${1 - t * 0.25 * dampen}) hue-rotate(${-t * 12 * dampen}deg) brightness(${1 - t * 0.22 * dampen})` };
      case "leituraMental":
        return { filter: `saturate(${1 - t * 0.2 * dampen}) hue-rotate(${t * 15 * dampen}deg) blur(${t * 0.6 * dampen}px)` };
      case "adivinhacao":
        return { filter: `sepia(${t * 0.4 * dampen}) hue-rotate(${-t * 25 * dampen}deg) brightness(${1 - t * 0.12 * dampen})` };
      case "generalizacao":
        return { filter: `saturate(${1 - t * 0.45 * dampen}) brightness(${1 - t * 0.1 * dampen}) blur(${t * 0.4 * dampen}px)` };
      case "tudoOuNada":
        return { filter: `grayscale(${t * 0.85 * dampen}) contrast(${1 + t * 0.6 * dampen})` };
      case "filtroMental":
        return { filter: `brightness(${1 - t * 0.35 * dampen}) saturate(${1 - t * 0.4 * dampen})` };
      case "rotulacao":
        return { filter: `sepia(${t * 0.55 * dampen}) saturate(${1 - t * 0.2 * dampen}) contrast(${1 + t * 0.2 * dampen})` };
    }
    return {};
  }, [state.lens, intensity, state.clarity]);


  // ===== INTRO SCREEN =====
  if (!state.started) {
    const introLenses = LENSES.filter((l) => l.id !== "neutra" && l.id !== "curiosa");
    const goodLenses = LENSES.filter((l) => l.id === "neutra" || l.id === "curiosa");
    return (
      <div className="h-full w-full flex flex-col gap-4 text-stone-800 overflow-y-auto">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden border-4 border-[#4a5a2a]/30 shadow-[0_20px_50px_-15px_rgba(40,50,20,0.45)] bg-gradient-to-br from-[#4a5a2a] to-[#2a3a1a] p-8 text-[#f4f4d8] text-center">
          <div className="text-6xl mb-4">👓</div>
          <h1 className="text-3xl font-bold mb-3">Entre Lentes</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
            Cada pessoa usa um tipo diferente de "óculos" para ver o mundo.
            <br />
            Alguns deixam tudo mais claro. Outros... distorcem tudo.
          </p>
          <p className="text-base opacity-80 mt-2 max-w-xl mx-auto">
            Neste jogo, você vai descobrir que a mesma cena pode parecer completamente diferente
            dependendo da lente que você escolhe usar.
          </p>
          <Button
            onClick={startGame}
            className="mt-6 bg-[#f4f4d8] text-[#4a5a2a] hover:bg-white font-bold text-lg px-8 py-3 h-auto rounded-full shadow-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" /> Começar a explorar
          </Button>
        </div>

        {/* Why it matters */}
        <div className="rounded-2xl border border-[#4a5a2a]/20 bg-[#fafaef] p-6">
          <h2 className="text-xl font-bold text-[#4a5a2a] mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" /> Por que isso importa?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white border border-[#4a5a2a]/10 p-4">
              <div className="text-3xl mb-2">🧠</div>
              <h3 className="font-bold text-[#4a5a2a] mb-1">Nosso cérebro cria histórias</h3>
              <p className="text-sm text-stone-600">
                Quando algo acontece, nossa cabeça não apenas "registra" — ela <b>interpreta</b>.
                E às vezes essa interpretação distorce a realidade sem que a gente perceba.
              </p>
            </div>
            <div className="rounded-xl bg-white border border-[#4a5a2a]/10 p-4">
              <div className="text-3xl mb-2">😰</div>
              <h3 className="font-bold text-[#4a5a2a] mb-1">Distorções causam sofrimento</h3>
              <p className="text-sm text-stone-600">
                Quando usamos uma "lente" que tudo escurece, tudo parece pior do que é.
                Isso gera ansiedade, tristeza e a sensação de que nunca vamos dar conta.
              </p>
            </div>
            <div className="rounded-xl bg-white border border-[#4a5a2a]/10 p-4">
              <div className="text-3xl mb-2">🔍</div>
              <h3 className="font-bold text-[#4a5a2a] mb-1">Conhecer é o primeiro passo</h3>
              <p className="text-sm text-stone-600">
                Quando aprendemos a reconhecer nossas lentes, ganhamos o poder de
                <b> trocá-las</b> por um olhar mais justo e gentil com a gente mesmo.
              </p>
            </div>
          </div>
        </div>

        {/* The lenses preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Healthy lenses */}
          <div className="rounded-2xl border border-[#7a8a3a]/30 bg-[#f4f4d8] p-5">
            <h3 className="text-lg font-bold text-[#4a5a2a] mb-3 flex items-center gap-2">
              <span className="text-xl">✨</span> Lentes que ajudam
            </h3>
            <div className="space-y-3">
              {goodLenses.map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl p-3 border-2 flex items-start gap-3"
                  style={{ borderColor: l.ring, background: l.color }}
                >
                  <span className="text-2xl">{l.emoji}</span>
                  <div>
                    <div className="font-bold text-[#3a3a2a]">{l.label}</div>
                    <div className="text-sm text-stone-700">{l.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distorting lenses */}
          <div className="rounded-2xl border border-[#7a3a2a]/30 bg-[#faf5f0] p-5">
            <h3 className="text-lg font-bold text-[#7a3a2a] mb-3 flex items-center gap-2">
              <span className="text-xl">🌫️</span> Lentes que distorcem
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {introLenses.map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl p-2.5 border-2 text-left"
                  style={{ borderColor: l.ring, background: l.color + "22" }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span>{l.emoji}</span>
                    <span className="font-bold text-[#3a3a2a] text-xs">{l.label}</span>
                  </div>
                  <div className="text-[10px] text-stone-600 leading-tight">{l.short}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-3">
              Cada uma dessas lentes é uma distorção cognitiva real.
              No jogo, você vai experimentar como elas mudam a mesma cena.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-4">
          <Button
            onClick={startGame}
            className="bg-[#4a5a2a] text-[#f4f4d8] hover:bg-[#3a4a1a] font-bold text-lg px-10 py-3 h-auto rounded-full shadow-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" /> Vamos lá!
          </Button>
        </div>
      </div>
    );
  }

  // ===== MAIN GAME =====


  const vignetteAlpha = !isDistorting
    ? 0
    : Math.min(0.78, (intensity / 3) * 0.8 * (1 - (state.clarity / CLUES.length) * 0.6));

  const tintColor = !isDistorting
    ? "rgba(0,0,0,VAR)"
    : `rgba(${hexToRgb(lens.ring)},VAR)`;

  return (
    <div className="h-full w-full grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 text-stone-800">
      {/* ---------------- SCENE ---------------- */}
      <div className="relative rounded-2xl overflow-hidden border-4 border-[#4a5a2a]/30 shadow-[0_20px_50px_-15px_rgba(40,50,20,0.45)] bg-[#e9ead4]">
        <div className="absolute inset-0 transition-[filter] duration-700" style={sceneStyle}>
          <img
            src={salaImg}
            alt="Pessoa de costas em estilo Pixar olhando uma paisagem com colinas, rio e pôr do sol"
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            background: `radial-gradient(ellipse at 50% 55%, transparent 30%, ${tintColor.replace("VAR", String(vignetteAlpha * 0.55))} 70%, ${tintColor.replace("VAR", String(vignetteAlpha))} 100%)`,
          }}
        />

        {/* Clue hotspots */}
        {CLUES.map((c) => {
          const found = state.revealedClues.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => investigate(c.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all
                ${found ? "bg-[#7a8a3a]/80 text-white" : "bg-white/90 text-[#4a5a2a] hover:scale-110 animate-pulse"}
                shadow-md text-xs font-semibold px-2 py-1 backdrop-blur`}
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
              title={found ? c.reveals : `Investigar: ${c.label}`}
            >
              {found ? "✓" : <Search className="w-3.5 h-3.5 inline" />} {c.label}
            </button>
          );
        })}

        {/* Óculos sobre o rosto do personagem — mudam de cor conforme a lente */}
        <svg
          viewBox="0 0 200 80"
          className="absolute pointer-events-none transition-all duration-500"
          style={{
            left: "50%",
            top: "58%",
            transform: "translate(-50%, -50%)",
            width: "16%",
            filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.35))`,
          }}
          aria-hidden
        >
          {/* armação */}
          <g fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round">
            <circle cx="55" cy="40" r="28" />
            <circle cx="145" cy="40" r="28" />
            <path d="M83 40 Q100 30 117 40" />
            <path d="M27 36 L8 28" />
            <path d="M173 36 L192 28" />
          </g>
          {/* lentes coloridas */}
          <circle
            cx="55"
            cy="40"
            r="25"
            fill={lens.color}
            fillOpacity={state.lens === "neutra" ? 0.15 : 0.55 + (intensity / 3) * 0.3}
            style={{ transition: "fill 0.5s, fill-opacity 0.5s" }}
          />
          <circle
            cx="145"
            cy="40"
            r="25"
            fill={lens.color}
            fillOpacity={state.lens === "neutra" ? 0.15 : 0.55 + (intensity / 3) * 0.3}
            style={{ transition: "fill 0.5s, fill-opacity 0.5s" }}
          />
          {/* reflexo */}
          <ellipse cx="48" cy="32" rx="6" ry="3" fill="white" opacity="0.6" />
          <ellipse cx="138" cy="32" rx="6" ry="3" fill="white" opacity="0.6" />
        </svg>

        {/* Internal protagonist thought */}
        <div className="absolute left-1/2 bottom-4 -translate-x-1/2 max-w-[80%] text-center">
          <div className="inline-block rounded-full px-4 py-2 bg-black/70 text-white text-sm italic backdrop-blur">
            {protagonistThought(state.lens, intensity, state.clarity)}
          </div>
        </div>

        {/* Lens chip */}
        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-white text-xs font-bold backdrop-blur"
             style={{ background: lens.ring }}>
          <span className="text-base">{lens.emoji}</span>
          {lens.label} · intensidade {intensity}/3
        </div>
      </div>

      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="flex flex-col gap-3 min-h-0">
        <header className="rounded-2xl bg-[#4a5a2a] text-[#f4f4d8] p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-widest opacity-80">Cena</div>
            <Sheet>
              <SheetTrigger asChild>
                <button className="text-[10px] uppercase tracking-widest opacity-80 hover:opacity-100 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Como jogar
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[380px] sm:w-[420px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-[#4a5a2a]" /> Como jogar — Entre Lentes
                  </SheetTitle>
                  <SheetDescription>
                    Entenda como usar as lentes para explorar distorções cognitivas.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5 text-sm">
                  <section>
                    <h3 className="font-bold text-base mb-1">🎯 Objetivo</h3>
                    <p className="text-muted-foreground">
                      Experimentar como a mesma situação muda dependendo do "óculos" que usamos —
                      ou seja, da distorção cognitiva que equipamos. O jogo ajuda a reconhecer
                      pensamentos automáticos distorcidos e a reduzir sua intensidade com evidências.
                    </p>
                  </section>

                  <section>
                    <h3 className="font-bold text-base mb-1">👥 Quem joga</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>O jogo é compartilhado em tempo real entre você e o paciente.</li>
                      <li>Qualquer um dos dois pode trocar lentes, investigar pistas e reiniciar.</li>
                      <li>Recomendado para crianças e adolescentes — linguagem visual e acessível.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-bold text-base mb-1">🔍 Como funciona</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                      <li>
                        <b>Explore as lentes.</b> Clique nas lentes à direita para equipar uma.
                        As lentes coloridas representam distorções cognitivas reais (catastrofização,
                        personalização, leitura mental, etc.).
                      </li>
                      <li>
                        <b>Observe a cena.</b> A imagem muda visualmente (cor, contraste, desfoque)
                        conforme a intensidade da lente. Os balões de pensamento dos personagens
                        mostram o que cada lente "inventa" sobre a mesma situação.
                      </li>
                      <li>
                        <b>Investigue as pistas.</b> Clique nos botões pulsantes na cena (celular,
                        caderno, porta, relógio) para descobrir fatos reais. Cada pista reduz a
                        intensidade das lentes distorcidas e aumenta a <b>Clareza</b>.
                      </li>
                      <li>
                        <b>Compare.</b> Alterne entre a <b>Lente Curiosa</b> (saudável) e as
                        distorções. Veja como a mesma cena pode ser interpretada de formas completamente
                        diferentes — e como as evidências ajudam a "limpar" o olhar.
                      </li>
                    </ol>
                  </section>

                  <section>
                    <h3 className="font-bold text-base mb-1">💡 Dica de condução</h3>
                    <p className="text-muted-foreground">
                      Peça para o paciente narrar em voz alta o que cada lente mostra.
                      Depois, investiguem juntos as pistas. O contraste entre o pensamento
                      distorcido e o fato real é o núcleo terapêutico do jogo.
                    </p>
                  </section>

                  <section className="rounded-lg border-2 border-[#4a5a2a]/30 bg-[#4a5a2a]/5 p-3">
                    <h3 className="font-bold text-base mb-1">🧠 Sobre as distorções</h3>
                    <p className="text-muted-foreground">
                      Cada lente distorcida é baseada em distorções cognitivas clássicas da
                      TCC (Terapia Cognitivo-Comportamental). O nome técnico aparece ao selecionar
                      a lente — útil para fazer o link com o trabalho terapêutico.
                    </p>
                  </section>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <h2 className="font-bold text-lg leading-tight">Sala de aula · você acabou de entrar</h2>
          <p className="text-xs opacity-90 mt-1">Algumas pessoas riem. O mesmo momento muda dependendo da lente — da distorção cognitiva — que você equipa.</p>
        </header>

        <section className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm overflow-y-auto">
          <div className="flex items-center gap-2 mb-2 text-[#4a5a2a]">
            <Eye className="w-4 h-4" />
            <h3 className="font-bold text-sm">Suas lentes</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LENSES.map((l) => {
              const active = l.id === state.lens;
              const inten = state.intensity[l.id];
              return (
                <button
                  key={l.id}
                  onClick={() => equipLens(l.id)}
                  className={`text-left rounded-xl p-2 border-2 transition-all hover:-translate-y-0.5 ${
                    active ? "shadow-md" : "opacity-90"
                  }`}
                  style={{
                    borderColor: active ? l.ring : "#e3e4cf",
                    background: active ? l.color : "#fafaef",
                    color: active ? "#fff" : "#3a3a2a",
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>{l.emoji} {l.label}</span>
                    <span className="opacity-90">{inten}/3</span>
                  </div>
                  <div className={`text-[10px] mt-0.5 ${active ? "text-white/90" : "text-stone-500"}`}>{l.short}</div>
                  <div className="mt-1.5 h-1 rounded-full bg-black/15 overflow-hidden">
                    <div className="h-full" style={{ width: `${(inten / 3) * 100}%`, background: active ? "#fff" : l.ring }} />
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-stone-600 mt-2 leading-snug">
            {lens.distortion && <span className="font-semibold text-[#4a5a2a]">Distorção: {lens.distortion}. </span>}
            {lens.description}
          </p>
        </section>

        <section className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2 text-[#4a5a2a]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-bold text-sm">Clareza</h3>
            </div>
            <span className="text-xs font-bold">{state.clarity}/{CLUES.length}</span>
          </div>
          <div className="h-2 rounded-full bg-[#e3e4cf] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7a8a3a] to-[#b9c66a] transition-all duration-700"
                 style={{ width: `${(state.clarity / CLUES.length) * 100}%` }} />
          </div>
          <p className="text-[11px] text-stone-600 mt-2 leading-snug">
            Investigue as pistas na cena (botões pulsantes). Cada nova informação reduz a força das lentes que distorcem.
          </p>
        </section>

        <div className="mt-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="flex-1 border-[#4a5a2a]/30 text-[#4a5a2a]">
            <RotateCcw className="w-4 h-4 mr-1" /> Reiniciar cena
          </Button>
        </div>
      </aside>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

function protagonistThought(lens: LensId, intensity: number, clarity: number): string {
  if (lens === "neutra") return "Entrei na sala. Algumas pessoas riram em algum momento.";
  if (lens === "curiosa") {
    if (clarity >= 2) return "Faz sentido. Cada um tava no seu mundo. A risada não era sobre mim.";
    return "Hum, será que riram de algo no celular? Vou olhar antes de concluir.";
  }
  if (lens === "personalizacao") {
    if (clarity >= 3) return "Ainda incomoda… mas dá pra ver que não era de mim.";
    if (intensity >= 3) return "Tudo o que acontece aqui é por minha causa.";
    return "Será que riram de mim?";
  }
  if (lens === "catastrofe") {
    if (clarity >= 3) return "Ok, talvez não fosse o fim do mundo. Respira.";
    if (intensity >= 3) return "Amanhã a escola toda vai saber. Acabou.";
    return "E se isso ficar pra sempre?";
  }
  if (lens === "leituraMental") {
    if (clarity >= 3) return "Espera — eu não sei mesmo o que eles pensam.";
    return "Eu sei exatamente o que cada um tá pensando de mim.";
  }
  if (lens === "adivinhacao") {
    if (clarity >= 3) return "Talvez eu esteja prevendo um futuro que não existe ainda.";
    return "Já sei como esse dia vai terminar: mal.";
  }
  if (lens === "generalizacao") {
    if (clarity >= 3) return "Não é ‘sempre’. É hoje, é agora, e tem contexto.";
    return "Sempre acontece comigo. Toda. Santa. Vez.";
  }
  if (lens === "tudoOuNada") {
    if (clarity >= 3) return "Existe um meio-termo. Nem tudo é fracasso.";
    return "Ou eu entro bem, ou eu fracassei totalmente.";
  }
  if (lens === "filtroMental") {
    if (clarity >= 3) return "Tinha coisas neutras e boas também — eu só não vi.";
    return "Só vejo o que deu errado nessa entrada.";
  }
  // rotulacao
  if (clarity >= 3) return "Um momento desconfortável não me define.";
  return "Sou um desastre. Sempre fui.";
}
