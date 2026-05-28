import { useEffect, useMemo, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Eye, RotateCcw, Search, Sparkles, BookOpen, Trophy, MessageCircle, Image as ImageIcon, Check } from "lucide-react";
import paisagemImg from "@/assets/lentes-paisagem.jpg";
import salaImg from "@/assets/lentes-sala.jpg";
import conversaImg from "@/assets/lentes-conversa.jpg";

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
  distortion?: string;
};

const LENSES: Lens[] = [
  { id: "neutra", label: "Sem lente", short: "Olhar cru", color: "#e9ead4", ring: "#c9caa7", emoji: "👁️",
    description: "Você vê a cena sem nenhuma interpretação automática. É raro ficarmos assim por muito tempo." },
  { id: "curiosa", label: "Lente curiosa", short: "‘O que será que aconteceu?’", color: "#7a8a3a", ring: "#4a5a2a", emoji: "🔍",
    description: "A cena vira um quebra-cabeça aberto. Você procura contexto antes de concluir." },
  { id: "catastrofe", label: "Catastrofização", short: "‘Vai dar tudo errado’", color: "#7a3a2a", ring: "#4a1f15", emoji: "🌩️",
    description: "Qualquer detalhe vira o começo de algo terrível.", distortion: "Catastrofização" },
  { id: "personalizacao", label: "Personalização", short: "‘É por minha causa’", color: "#b85c7a", ring: "#7a3450", emoji: "🫣",
    description: "Você se sente responsável ou alvo de coisas que não têm a ver com você.", distortion: "Personalização" },
  { id: "leituraMental", label: "Leitura mental", short: "‘Sei o que pensam de mim’", color: "#5a6cb8", ring: "#2f3d7a", emoji: "🧠",
    description: "Você assume saber o que os outros estão pensando — sem evidência.", distortion: "Leitura mental" },
  { id: "adivinhacao", label: "Adivinhação do futuro", short: "‘Já sei como vai terminar’", color: "#7a5ab8", ring: "#4a307a", emoji: "🔮",
    description: "Você prevê o pior antes mesmo de tentar.", distortion: "Adivinhação" },
  { id: "generalizacao", label: "Generalização", short: "‘Sempre acontece comigo’", color: "#8a6a3a", ring: "#5a4220", emoji: "♾️",
    description: "Um acontecimento vira regra: ‘sempre’, ‘nunca’.", distortion: "Generalização excessiva" },
  { id: "tudoOuNada", label: "Tudo ou nada", short: "‘Ou perfeito, ou péssimo’", color: "#3a3a3a", ring: "#1a1a1a", emoji: "⚖️",
    description: "Preto e branco: sucesso total ou fracasso completo.", distortion: "Pensamento dicotômico" },
  { id: "filtroMental", label: "Filtro mental", short: "‘Só vejo o que deu errado’", color: "#3a5a6a", ring: "#1f3a4a", emoji: "🕶️",
    description: "Você foca só nos detalhes negativos.", distortion: "Filtro mental" },
  { id: "rotulacao", label: "Rotulação", short: "‘Sou um(a) fracassado(a)’", color: "#a05a3a", ring: "#6a3820", emoji: "🏷️",
    description: "Cola um rótulo permanente em si ou nos outros.", distortion: "Rotulação" },
];

const lensById = (id: LensId) => LENSES.find((l) => l.id === id) ?? LENSES[0];

const DISTORTING_LENSES: LensId[] = [
  "catastrofe", "personalizacao", "leituraMental", "adivinhacao",
  "generalizacao", "tudoOuNada", "filtroMental", "rotulacao",
];

// ---------- Cenários ----------
type SceneId = "paisagem" | "sala" | "conversa";

type Clue = { id: string; label: string; x: number; y: number; reveals: string };

type Scene = {
  id: SceneId;
  title: string;
  subtitle: string;
  emoji: string;
  img: string;
  glassesPos: { left: string; top: string; width: string };
  clues: Clue[];
};

const SCENES: Scene[] = [
  {
    id: "paisagem",
    title: "Diante da paisagem",
    subtitle: "Sozinho, olhando o horizonte.",
    emoji: "🏞️",
    img: paisagemImg,
    glassesPos: { left: "50%", top: "58%", width: "16%" },
    clues: [
      { id: "sol", label: "O pôr do sol", x: 50, y: 30, reveals: "A luz dourada acontece todo dia — há beleza no momento, mesmo quando a cabeça insiste em escurecê-la." },
      { id: "rio", label: "O rio", x: 42, y: 78, reveals: "O rio segue seu curso sem pressa. Pensamentos também passam — eles não são você." },
      { id: "arvore", label: "As árvores", x: 15, y: 72, reveals: "Cada árvore tem seu tamanho. Comparar-se com elas não muda o que você é." },
      { id: "nuvem", label: "As nuvens", x: 82, y: 22, reveals: "As nuvens mudam de forma. Nem toda nuvem vira tempestade." },
    ],
  },
  {
    id: "sala",
    title: "Na sala de aula",
    subtitle: "Sentado, observando os colegas e o quadro.",
    emoji: "🏫",
    img: salaImg,
    glassesPos: { left: "50%", top: "54%", width: "11%" },
    clues: [
      { id: "quadro", label: "O quadro", x: 55, y: 38, reveals: "O quadro tem o conteúdo, não um julgamento. Errar uma resposta não diz quem você é." },
      { id: "colega1", label: "Colega à esquerda", x: 28, y: 65, reveals: "Ele também está concentrado nas próprias coisas — provavelmente nem reparou em você." },
      { id: "colega2", label: "Colegas à direita", x: 80, y: 62, reveals: "Cada um traz seu próprio dia. As risadas raramente são sobre você." },
      { id: "luz", label: "A luz da janela", x: 30, y: 18, reveals: "A luz entra do mesmo jeito pra todo mundo. Você faz parte da cena." },
    ],
  },
  {
    id: "conversa",
    title: "Uma conversa",
    subtitle: "Frente a frente com alguém — a expressão é ambígua.",
    emoji: "💬",
    img: conversaImg,
    glassesPos: { left: "37%", top: "40%", width: "9%" },
    clues: [
      { id: "rosto", label: "O rosto da outra pessoa", x: 70, y: 35, reveals: "A expressão é neutra — não há prova de raiva ou rejeição. Caras serenas costumam ser só… serenas." },
      { id: "maos", label: "As mãos relaxadas", x: 75, y: 70, reveals: "As mãos estão soltas, sem tensão. Quem está bravo costuma fechar o corpo." },
      { id: "cafe", label: "O café entre vocês", x: 50, y: 78, reveals: "Tem um café compartilhado. Se a pessoa não quisesse estar aqui, não estaria." },
      { id: "janela", label: "A luz da janela", x: 60, y: 25, reveals: "A luz quente sugere um momento calmo — não uma cena de conflito." },
    ],
  },
];

const sceneById = (id: SceneId) => SCENES.find((s) => s.id === id) ?? SCENES[0];

// ---------- Mini-desafios por lente distorcida ----------
type Quiz = {
  question: string;
  options: { text: string; correct?: boolean }[];
  explain: string;
};

const QUIZZES: Record<LensId, Quiz | null> = {
  neutra: null,
  curiosa: null,
  catastrofe: {
    question: "O que a Catastrofização está inventando aqui?",
    options: [
      { text: "Que um detalhe pequeno é o começo do pior cenário", correct: true },
      { text: "Que tudo está bem e nada vai mudar" },
      { text: "Que os outros não importam" },
    ],
    explain: "Catastrofização infla o pequeno até virar tragédia. Reconhecer isso já enfraquece a lente.",
  },
  personalizacao: {
    question: "Onde está a Personalização nessa cena?",
    options: [
      { text: "Achar que algo neutro é por sua causa", correct: true },
      { text: "Pedir desculpas quando erra de fato" },
      { text: "Reconhecer responsabilidade real" },
    ],
    explain: "Personalização cola um 'foi por minha causa' onde não há prova.",
  },
  leituraMental: {
    question: "A Leitura mental aqui está…",
    options: [
      { text: "Adivinhando o que os outros pensam, sem perguntar", correct: true },
      { text: "Observando expressões com curiosidade" },
      { text: "Confirmando uma hipótese com fato" },
    ],
    explain: "Sem perguntar, não é leitura — é invenção.",
  },
  adivinhacao: {
    question: "A Adivinhação está fazendo o quê?",
    options: [
      { text: "Decidindo o final antes de viver o começo", correct: true },
      { text: "Planejando o próximo passo com cuidado" },
      { text: "Considerando vários cenários" },
    ],
    explain: "Adivinhação fecha o futuro — sem dar chance pra ele.",
  },
  generalizacao: {
    question: "Que palavra denuncia a Generalização?",
    options: [
      { text: "‘Sempre’, ‘nunca’, ‘ninguém’", correct: true },
      { text: "‘Hoje’, ‘agora’, ‘às vezes’" },
      { text: "‘Talvez’, ‘pode ser’" },
    ],
    explain: "Palavras absolutas são pistas: o cérebro está esticando um caso para uma regra.",
  },
  tudoOuNada: {
    question: "O Tudo ou nada acontece quando…",
    options: [
      { text: "Só existe ‘perfeito’ ou ‘fracasso’", correct: true },
      { text: "Se aceita o meio-termo" },
      { text: "Se reconhece progresso pequeno" },
    ],
    explain: "A vida real mora no meio. Tudo ou nada elimina esse meio.",
  },
  filtroMental: {
    question: "O Filtro mental faz o quê?",
    options: [
      { text: "Apaga o que está bem e amplia o que está mal", correct: true },
      { text: "Pesa o positivo e o negativo" },
      { text: "Foca em soluções" },
    ],
    explain: "Filtro mental é ver só a sombra de uma cena cheia de luz também.",
  },
  rotulacao: {
    question: "Rotulação é diferente de descrever porque…",
    options: [
      { text: "Cola uma identidade permanente: ‘sou um fracassado’", correct: true },
      { text: "Diz só o que aconteceu" },
      { text: "Foca no comportamento, não na pessoa" },
    ],
    explain: "‘Errei nessa prova’ descreve. ‘Sou burro’ rotula — e dói muito mais.",
  },
};

// ---------- Conquistas ----------
type BadgeDef = { id: string; label: string; emoji: string; hint: string; check: (s: State) => boolean };

const BADGES: BadgeDef[] = [
  { id: "primeira-lente", label: "Primeira troca", emoji: "👓", hint: "Equipou sua primeira lente distorcida.", check: (s) => DISTORTING_LENSES.some((d) => (s.intensity[d] ?? 0) > 0) },
  { id: "detetive", label: "Detetive de distorções", emoji: "🕵️", hint: "Acertou 3 mini-desafios.", check: (s) => s.awareness >= 3 },
  { id: "olhar-curioso", label: "Olhar curioso", emoji: "🔍", hint: "Usou a Lente curiosa.", check: (s) => (s.intensity.curiosa ?? 0) > 0 },
  { id: "clareza-paisagem", label: "Clareza na paisagem", emoji: "🏞️", hint: "Investigou tudo na paisagem.", check: (s) => (s.revealedClues.paisagem?.length ?? 0) >= 4 },
  { id: "clareza-sala", label: "Clareza na sala", emoji: "🏫", hint: "Investigou tudo na sala.", check: (s) => (s.revealedClues.sala?.length ?? 0) >= 4 },
  { id: "clareza-conversa", label: "Clareza na conversa", emoji: "💬", hint: "Investigou tudo na conversa.", check: (s) => (s.revealedClues.conversa?.length ?? 0) >= 4 },
  { id: "espelho", label: "Espelho da vida real", emoji: "🪞", hint: "Escreveu uma situação real no modo Espelho.", check: (s) => (s.mirror?.situation?.trim().length ?? 0) > 10 },
  { id: "todas-lentes", label: "Provador de lentes", emoji: "🎭", hint: "Experimentou todas as lentes.", check: (s) => LENSES.every((l) => (s.intensity[l.id] ?? 0) > 0) },
];

// ---------- Estado sincronizado ----------
type State = {
  started: boolean;
  scene: SceneId;
  lens: LensId;
  intensity: Record<LensId, number>;
  clarity: Record<SceneId, number>;
  revealedClues: Record<SceneId, string[]>;
  awareness: number;
  mirror: { situation: string; guessedLens?: LensId };
  log: { lens: LensId; at: number }[];
};

const emptyIntensity = (): Record<LensId, number> =>
  LENSES.reduce((acc, l) => { acc[l.id] = 0; return acc; }, {} as Record<LensId, number>);

const emptyClarity = (): Record<SceneId, number> => ({ paisagem: 0, sala: 0, conversa: 0 });
const emptyRevealed = (): Record<SceneId, string[]> => ({ paisagem: [], sala: [], conversa: [] });

const initialState: State = {
  started: false,
  scene: "paisagem",
  lens: "neutra",
  intensity: emptyIntensity(),
  clarity: emptyClarity(),
  revealedClues: emptyRevealed(),
  awareness: 0,
  mirror: { situation: "" },
  log: [],
};

const normalizeState = (s: Partial<State> | State): State => ({
  started: s.started ?? false,
  scene: (["paisagem", "sala", "conversa"] as SceneId[]).includes(s.scene as SceneId) ? (s.scene as SceneId) : "paisagem",
  lens: LENSES.some((l) => l.id === s.lens) ? (s.lens as LensId) : "neutra",
  intensity: { ...emptyIntensity(), ...((s as State).intensity || {}) },
  clarity: { ...emptyClarity(), ...((s as State).clarity || {}) },
  revealedClues: { ...emptyRevealed(), ...((s as State).revealedClues || {}) },
  awareness: (s as State).awareness ?? 0,
  mirror: (s as State).mirror ?? { situation: "" },
  log: (s as State).log ?? [],
});

// ---------- Partículas ----------
type Particle = { id: number; x: number; y: number; color: string; emoji?: string };

export default function EntreLentes({ room }: Props) {
  const [state, setState] = useState<State>(initialState);
  const [tab, setTab] = useState<"cena" | "espelho" | "conquistas">("cena");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [quizOpen, setQuizOpen] = useState<LensId | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<null | { correct: boolean; lens: LensId }>(null);
  const particleId = useRef(0);

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "lentes:state") setState(normalizeState(m.payload));
      if (m.type === "lentes:particles") {
        // peer trigger
        spawnParticles(m.payload.color, m.payload.emoji, m.payload.count);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  const update = (patch: Partial<State> | ((s: State) => State)) => {
    setState((prev) => {
      const merged = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      const next = normalizeState(merged);
      room.send("lentes:state", next);
      return next;
    });
  };

  const spawnParticles = (color: string, emoji?: string, count = 14) => {
    const next: Particle[] = [];
    for (let i = 0; i < count; i++) {
      next.push({
        id: ++particleId.current,
        x: 40 + Math.random() * 20,
        y: 45 + Math.random() * 20,
        color,
        emoji,
      });
    }
    setParticles((p) => [...p, ...next]);
    setTimeout(() => setParticles((p) => p.filter((x) => !next.find((n) => n.id === x.id))), 1400);
  };

  const broadcastParticles = (color: string, emoji?: string, count = 14) => {
    spawnParticles(color, emoji, count);
    room.send("lentes:particles", { color, emoji, count });
  };

  const equipLens = (id: LensId) => {
    const wasDistorting = DISTORTING_LENSES.includes(id);
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
    const l = lensById(id);
    broadcastParticles(l.color, l.emoji, wasDistorting ? 18 : 10);
    if (wasDistorting && QUIZZES[id]) {
      setTimeout(() => setQuizOpen(id), 350);
    }
  };

  const investigate = (clueId: string) => {
    update((s) => {
      const sceneClues = s.revealedClues[s.scene] ?? [];
      if (sceneClues.includes(clueId)) return s;
      const revealed = { ...s.revealedClues, [s.scene]: [...sceneClues, clueId] };
      const intensity = { ...s.intensity };
      for (const k of DISTORTING_LENSES) intensity[k] = Math.max(0, (intensity[k] ?? 0) - 1);
      const sceneClarity = (s.clarity[s.scene] ?? 0) + 1;
      return {
        ...s,
        revealedClues: revealed,
        clarity: { ...s.clarity, [s.scene]: Math.min(sceneById(s.scene).clues.length, sceneClarity) },
        intensity,
      };
    });
    broadcastParticles("#fff8b8", "✨", 12);
  };

  const switchScene = (id: SceneId) => {
    update((s) => ({ ...s, scene: id }));
  };

  const answerQuiz = (lens: LensId, optionIdx: number) => {
    const quiz = QUIZZES[lens];
    if (!quiz) return;
    const correct = !!quiz.options[optionIdx]?.correct;
    setQuizFeedback({ correct, lens });
    if (correct) {
      update((s) => ({ ...s, awareness: s.awareness + 1 }));
      broadcastParticles("#7a8a3a", "🏆", 10);
    }
    setTimeout(() => {
      setQuizOpen(null);
      setQuizFeedback(null);
    }, 2000);
  };

  const updateMirror = (situation: string) => update((s) => ({ ...s, mirror: { ...s.mirror, situation } }));
  const guessMirror = (l: LensId) => {
    update((s) => ({ ...s, mirror: { ...s.mirror, guessedLens: l } }));
    broadcastParticles(lensById(l).color, "💡", 10);
  };

  const reset = () => {
    setState(initialState);
    room.send("lentes:state", initialState);
  };
  const startGame = () => update({ started: true });

  const lens = lensById(state.lens);
  const intensity = state.intensity[state.lens] ?? 0;
  const isDistorting = DISTORTING_LENSES.includes(state.lens);
  const scene = sceneById(state.scene);
  const sceneClarity = state.clarity[state.scene] ?? 0;
  const sceneRevealed = state.revealedClues[state.scene] ?? [];

  const earnedBadges = BADGES.filter((b) => b.check(state));

  // ---- filtro CSS da cena ----
  const sceneStyle = useMemo<React.CSSProperties>(() => {
    const t = intensity / 3;
    const clarityT = sceneClarity / scene.clues.length;
    const dampen = 1 - clarityT * 0.55;
    if (state.lens === "neutra") return { filter: "saturate(1) contrast(1)" };
    if (state.lens === "curiosa") return { filter: `saturate(${1 + t * 0.15}) brightness(${1 + t * 0.05})` };
    switch (state.lens) {
      case "personalizacao":
        return { filter: `saturate(${1 - t * 0.5 * dampen}) blur(${t * 1.2 * dampen}px) brightness(${1 - t * 0.15 * dampen})` };
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
  }, [state.lens, intensity, sceneClarity, scene.clues.length]);

  // ===== INTRO =====
  if (!state.started) {
    const introLenses = LENSES.filter((l) => l.id !== "neutra" && l.id !== "curiosa");
    const goodLenses = LENSES.filter((l) => l.id === "neutra" || l.id === "curiosa");
    return (
      <div className="h-full w-full flex flex-col gap-4 text-stone-800 overflow-y-auto">
        <div className="relative rounded-2xl overflow-hidden border-4 border-[#4a5a2a]/30 shadow-[0_20px_50px_-15px_rgba(40,50,20,0.45)] bg-gradient-to-br from-[#4a5a2a] to-[#2a3a1a] p-8 text-[#f4f4d8] text-center">
          <div className="text-6xl mb-4">👓</div>
          <h1 className="text-3xl font-bold mb-3">Entre Lentes</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
            Cada pessoa usa um tipo diferente de "óculos" para ver o mundo.<br />
            Alguns deixam tudo mais claro. Outros... distorcem tudo.
          </p>
          <p className="text-base opacity-80 mt-2 max-w-xl mx-auto">
            Agora com <b>3 cenários</b>, mini-desafios, um <b>modo Espelho</b> para suas situações reais e conquistas.
          </p>
          <Button onClick={startGame}
            className="mt-6 bg-[#f4f4d8] text-[#4a5a2a] hover:bg-white font-bold text-lg px-8 py-3 h-auto rounded-full shadow-lg">
            <Sparkles className="w-5 h-5 mr-2" /> Começar a explorar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#7a8a3a]/30 bg-[#f4f4d8] p-5">
            <h3 className="text-lg font-bold text-[#4a5a2a] mb-3">✨ Lentes que ajudam</h3>
            <div className="space-y-3">
              {goodLenses.map((l) => (
                <div key={l.id} className="rounded-xl p-3 border-2 flex items-start gap-3"
                  style={{ borderColor: l.ring, background: l.color }}>
                  <span className="text-2xl">{l.emoji}</span>
                  <div>
                    <div className="font-bold text-[#3a3a2a]">{l.label}</div>
                    <div className="text-sm text-stone-700">{l.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#7a3a2a]/30 bg-[#faf5f0] p-5">
            <h3 className="text-lg font-bold text-[#7a3a2a] mb-3">🌫️ Lentes que distorcem</h3>
            <div className="grid grid-cols-2 gap-2">
              {introLenses.map((l) => (
                <div key={l.id} className="rounded-xl p-2.5 border-2 text-left"
                  style={{ borderColor: l.ring, background: l.color + "22" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span>{l.emoji}</span>
                    <span className="font-bold text-[#3a3a2a] text-xs">{l.label}</span>
                  </div>
                  <div className="text-[10px] text-stone-600 leading-tight">{l.short}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center py-4">
          <Button onClick={startGame}
            className="bg-[#4a5a2a] text-[#f4f4d8] hover:bg-[#3a4a1a] font-bold text-lg px-10 py-3 h-auto rounded-full shadow-lg">
            <Sparkles className="w-5 h-5 mr-2" /> Vamos lá!
          </Button>
        </div>
      </div>
    );
  }

  // ===== MAIN =====
  const vignetteAlpha = !isDistorting
    ? 0
    : Math.min(0.78, (intensity / 3) * 0.8 * (1 - (sceneClarity / scene.clues.length) * 0.6));
  const tintColor = !isDistorting ? "rgba(0,0,0,VAR)" : `rgba(${hexToRgb(lens.ring)},VAR)`;

  // postura/reação do personagem (tilt nos óculos + emoji de humor)
  const moodEmoji =
    state.lens === "neutra" ? "🙂" :
    state.lens === "curiosa" ? "🤔" :
    state.lens === "catastrofe" ? "😰" :
    state.lens === "personalizacao" ? "😔" :
    state.lens === "leituraMental" ? "😟" :
    state.lens === "adivinhacao" ? "😞" :
    state.lens === "generalizacao" ? "😩" :
    state.lens === "tudoOuNada" ? "😣" :
    state.lens === "filtroMental" ? "😕" :
    "😖";

  const glassesTilt = state.lens === "curiosa"
    ? "translate(-50%, -50%) rotate(-6deg)"
    : isDistorting
      ? `translate(-50%, ${-50 + intensity * 2}%) rotate(${intensity * 1.5}deg)`
      : "translate(-50%, -50%) rotate(0deg)";

  return (
    <div className="h-full w-full grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 text-stone-800">
      {/* ---------------- SCENE ---------------- */}
      <div className="relative rounded-2xl overflow-hidden border-4 border-[#4a5a2a]/30 shadow-[0_20px_50px_-15px_rgba(40,50,20,0.45)] bg-[#e9ead4] min-h-[420px]">
        <div className="absolute inset-0 transition-[filter] duration-700" style={sceneStyle}>
          <img
            key={scene.id}
            src={scene.img}
            alt={scene.title}
            className="w-full h-full object-cover select-none pointer-events-none animate-fade-in"
            draggable={false}
          />
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            background: `radial-gradient(ellipse at 50% 55%, transparent 30%, ${tintColor.replace("VAR", String(vignetteAlpha * 0.55))} 70%, ${tintColor.replace("VAR", String(vignetteAlpha))} 100%)`,
          }}
        />

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute text-xl"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                color: p.color,
                animation: "lentes-particle 1.3s ease-out forwards",
                ['--lx' as any]: `${(Math.random() - 0.5) * 200}px`,
                ['--ly' as any]: `${-80 - Math.random() * 140}px`,
              }}
            >
              {p.emoji ?? "●"}
            </span>
          ))}
        </div>

        {/* Hotspots */}
        {scene.clues.map((c) => {
          const found = sceneRevealed.includes(c.id);
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

        {/* Óculos sobre o personagem */}
        <svg
          viewBox="0 0 200 80"
          className="absolute pointer-events-none transition-all duration-500"
          style={{
            left: scene.glassesPos.left,
            top: scene.glassesPos.top,
            width: scene.glassesPos.width,
            transform: glassesTilt,
            filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.35))`,
          }}
          aria-hidden
        >
          <g fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round">
            <circle cx="55" cy="40" r="28" />
            <circle cx="145" cy="40" r="28" />
            <path d="M83 40 Q100 30 117 40" />
            <path d="M27 36 L8 28" />
            <path d="M173 36 L192 28" />
          </g>
          <circle cx="55" cy="40" r="25" fill={lens.color}
            fillOpacity={state.lens === "neutra" ? 0.15 : 0.55 + (intensity / 3) * 0.3}
            style={{ transition: "fill 0.5s, fill-opacity 0.5s" }} />
          <circle cx="145" cy="40" r="25" fill={lens.color}
            fillOpacity={state.lens === "neutra" ? 0.15 : 0.55 + (intensity / 3) * 0.3}
            style={{ transition: "fill 0.5s, fill-opacity 0.5s" }} />
          <ellipse cx="48" cy="32" rx="6" ry="3" fill="white" opacity="0.6" />
          <ellipse cx="138" cy="32" rx="6" ry="3" fill="white" opacity="0.6" />
        </svg>

        {/* Mood pill */}
        <div className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-lg shadow transition-transform duration-500"
             style={{ transform: isDistorting ? `scale(${1 + intensity * 0.05})` : "scale(1)" }}>
          {moodEmoji}
        </div>

        {/* Thought balloon */}
        <div className="absolute left-1/2 bottom-4 -translate-x-1/2 max-w-[80%] text-center">
          <div className="inline-block rounded-2xl px-4 py-2 bg-black/70 text-white text-sm italic backdrop-blur animate-fade-in" key={`${state.scene}-${state.lens}-${intensity}-${sceneClarity}`}>
            {protagonistThought(state.scene, state.lens, intensity, sceneClarity)}
          </div>
        </div>

        {/* Lens chip */}
        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-white text-xs font-bold backdrop-blur"
          style={{ background: lens.ring }}>
          <span className="text-base">{lens.emoji}</span>
          {lens.label} · intensidade {intensity}/3
        </div>

        {/* Quiz overlay */}
        {quizOpen && QUIZZES[quizOpen] && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border-4 shadow-2xl max-w-sm w-full p-5"
                 style={{ borderColor: lensById(quizOpen).ring }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{lensById(quizOpen).emoji}</span>
                <div className="text-xs uppercase tracking-widest font-bold" style={{ color: lensById(quizOpen).ring }}>
                  Mini-desafio · {lensById(quizOpen).label}
                </div>
              </div>
              <h4 className="font-bold text-base text-stone-800 mb-3">{QUIZZES[quizOpen]!.question}</h4>
              {quizFeedback ? (
                <div className={`rounded-xl p-3 text-sm ${quizFeedback.correct ? "bg-[#e8f0d0] text-[#3a4a1a]" : "bg-orange-50 text-orange-900"}`}>
                  <div className="font-bold mb-1">{quizFeedback.correct ? "🏆 Boa! +1 ponto de consciência" : "Quase! Veja:"}</div>
                  <div>{QUIZZES[quizOpen]!.explain}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {QUIZZES[quizOpen]!.options.map((o, i) => (
                    <button key={i} onClick={() => answerQuiz(quizOpen, i)}
                      className="w-full text-left rounded-xl border-2 border-stone-200 hover:border-[#4a5a2a] hover:bg-[#f4f4d8] px-3 py-2 text-sm transition">
                      {o.text}
                    </button>
                  ))}
                  <button onClick={() => setQuizOpen(null)}
                    className="w-full text-center text-[11px] text-stone-500 mt-1 hover:text-stone-700">
                    pular
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="flex flex-col gap-3 min-h-0">
        {/* Header + scene switcher */}
        <header className="rounded-2xl bg-[#4a5a2a] text-[#f4f4d8] p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-widest opacity-80">Cenário {scene.emoji}</div>
            <Sheet>
              <SheetTrigger asChild>
                <button className="text-[10px] uppercase tracking-widest opacity-80 hover:opacity-100 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Como jogar
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[380px] sm:w-[420px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-[#4a5a2a]" /> Como jogar
                  </SheetTitle>
                  <SheetDescription>Entre Lentes — guia rápido.</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                  <p><b>1.</b> Escolha um cenário (paisagem, sala, conversa).</p>
                  <p><b>2.</b> Equipe lentes diferentes e observe como a cena, o pensamento e até a postura mudam.</p>
                  <p><b>3.</b> Ao equipar uma lente distorcida, um <b>mini-desafio</b> aparece — acertar dá pontos de consciência.</p>
                  <p><b>4.</b> Investigue as pistas para reduzir a força das distorções e aumentar a Clareza.</p>
                  <p><b>5.</b> Use o <b>Modo Espelho</b> para trazer uma situação real e identificar qual lente está em uso.</p>
                  <p><b>6.</b> Colecione conquistas no caminho.</p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <h2 className="font-bold text-base leading-tight">{scene.title}</h2>
          <p className="text-xs opacity-90 mt-0.5">{scene.subtitle}</p>
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {SCENES.map((s) => (
              <button key={s.id} onClick={() => switchScene(s.id)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 transition
                  ${state.scene === s.id ? "bg-[#f4f4d8] text-[#4a5a2a]" : "bg-white/15 text-[#f4f4d8] hover:bg-white/25"}`}>
                <span>{s.emoji}</span>
                <span className="truncate">{s.title.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-[#e9ead4] p-1">
          {([
            { id: "cena", label: "Lentes", Icon: Eye },
            { id: "espelho", label: "Espelho", Icon: MessageCircle },
            { id: "conquistas", label: "Conquistas", Icon: Trophy },
          ] as const).map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition
                ${tab === id ? "bg-white text-[#4a5a2a] shadow-sm" : "text-[#4a5a2a]/70 hover:text-[#4a5a2a]"}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
          {tab === "cena" && (
            <>
              <section className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-[#4a5a2a]">
                  <ImageIcon className="w-4 h-4" />
                  <h3 className="font-bold text-sm">Suas lentes</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {LENSES.map((l) => {
                    const active = l.id === state.lens;
                    const inten = state.intensity[l.id] ?? 0;
                    return (
                      <button key={l.id} onClick={() => equipLens(l.id)}
                        className={`text-left rounded-xl p-2 border-2 transition-all hover:-translate-y-0.5 ${active ? "shadow-md" : "opacity-90"}`}
                        style={{ borderColor: active ? l.ring : "#e3e4cf", background: active ? l.color : "#fafaef", color: active ? "#fff" : "#3a3a2a" }}>
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>{l.emoji} {l.label}</span>
                          <span className="opacity-90">{inten}/3</span>
                        </div>
                        <div className={`text-[10px] mt-0.5 ${active ? "text-white/90" : "text-stone-500"}`}>{l.short}</div>
                        <div className="mt-1.5 h-1 rounded-full bg-black/15 overflow-hidden">
                          <div className="h-full transition-all" style={{ width: `${(inten / 3) * 100}%`, background: active ? "#fff" : l.ring }} />
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
                    <h3 className="font-bold text-sm">Clareza · {scene.title}</h3>
                  </div>
                  <span className="text-xs font-bold">{sceneClarity}/{scene.clues.length}</span>
                </div>
                <div className="h-2 rounded-full bg-[#e3e4cf] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#7a8a3a] to-[#b9c66a] transition-all duration-700"
                    style={{ width: `${(sceneClarity / scene.clues.length) * 100}%` }} />
                </div>
                <p className="text-[11px] text-stone-600 mt-2 leading-snug">
                  Investigue as pistas na cena. Cada nova informação reduz a força das distorções.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg bg-[#f4f4d8] px-2 py-1.5 text-[11px] text-[#4a5a2a]">
                    🏆 Consciência: <b>{state.awareness}</b>
                  </div>
                  <div className="rounded-lg bg-[#f4f4d8] px-2 py-1.5 text-[11px] text-[#4a5a2a]">
                    🎖️ Conquistas: <b>{earnedBadges.length}/{BADGES.length}</b>
                  </div>
                </div>
              </section>
            </>
          )}

          {tab === "espelho" && (
            <section className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-[#4a5a2a]">
                <MessageCircle className="w-4 h-4" />
                <h3 className="font-bold text-sm">Modo Espelho</h3>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Escreva uma situação real que te incomodou. Depois, identifique qual lente
                pode estar em uso. Não há resposta certa — é um convite a reconhecer o padrão.
              </p>
              <textarea
                value={state.mirror.situation}
                onChange={(e) => updateMirror(e.target.value)}
                placeholder="Ex.: ‘Mandei mensagem e ela demorou pra responder…’"
                className="w-full h-24 rounded-xl border-2 border-[#e3e4cf] bg-[#fafaef] p-2 text-sm focus:border-[#4a5a2a] outline-none resize-none"
              />
              <div>
                <div className="text-[11px] font-bold text-[#4a5a2a] mb-1.5">Qual lente parece estar em uso?</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {LENSES.filter((l) => l.id !== "neutra").map((l) => {
                    const sel = state.mirror.guessedLens === l.id;
                    return (
                      <button key={l.id} onClick={() => guessMirror(l.id)}
                        className={`text-left rounded-lg p-1.5 border-2 text-[11px] font-semibold flex items-center gap-1.5 transition
                          ${sel ? "shadow" : "opacity-90 hover:-translate-y-0.5"}`}
                        style={{ borderColor: sel ? l.ring : "#e3e4cf", background: sel ? l.color : "#fafaef", color: sel ? "#fff" : "#3a3a2a" }}>
                        <span>{l.emoji}</span> <span className="truncate">{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {state.mirror.guessedLens && (
                <div className="rounded-xl bg-[#f4f4d8] border border-[#4a5a2a]/20 p-2.5 text-[11px] text-[#3a4a1a] leading-snug">
                  <b>{lensById(state.mirror.guessedLens).label}.</b>{" "}
                  {lensById(state.mirror.guessedLens).description} Tente trocar pela <b>Lente curiosa</b> e
                  pergunte: <i>“o que mais poderia explicar isso?”</i>
                </div>
              )}
            </section>
          )}

          {tab === "conquistas" && (
            <section className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2 text-[#4a5a2a]">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <h3 className="font-bold text-sm">Conquistas</h3>
                </div>
                <span className="text-xs font-bold">{earnedBadges.length}/{BADGES.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {BADGES.map((b) => {
                  const got = b.check(state);
                  return (
                    <div key={b.id}
                      className={`rounded-xl p-2.5 border-2 flex items-center gap-2.5 transition
                        ${got ? "border-[#7a8a3a] bg-[#f4f4d8]" : "border-stone-200 bg-stone-50 opacity-70"}`}>
                      <div className={`text-2xl ${got ? "" : "grayscale"}`}>{b.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5 text-[#3a3a2a]">
                          {b.label}
                          {got && <Check className="w-3 h-3 text-[#7a8a3a]" />}
                        </div>
                        <div className="text-[10px] text-stone-500 leading-tight">{b.hint}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="flex-1 border-[#4a5a2a]/30 text-[#4a5a2a]">
            <RotateCcw className="w-4 h-4 mr-1" /> Reiniciar
          </Button>
        </div>
      </aside>

      <style>{`
        @keyframes lentes-particle {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(var(--lx), var(--ly)) scale(1.1); opacity: 0; }
        }
      `}</style>
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

function protagonistThought(scene: SceneId, lens: LensId, intensity: number, clarity: number): string {
  // ---- PAISAGEM ----
  if (scene === "paisagem") {
    if (lens === "neutra") return "Olho a paisagem. Colinas, um rio, nuvens. Só isso.";
    if (lens === "curiosa") return clarity >= 2 ? "Quanta coisa pra notar… cada detalhe tem seu lugar aqui." : "Que cores são essas no céu?";
    if (lens === "catastrofe") return clarity >= 3 ? "Aquela nuvem talvez só seja uma nuvem." : intensity >= 3 ? "Aquela nuvem vai virar tempestade." : "E se o tempo virar agora?";
    if (lens === "personalizacao") return clarity >= 3 ? "A paisagem não está aqui contra mim. Só está." : "Esse vento frio parece de propósito.";
    if (lens === "leituraMental") return clarity >= 3 ? "Não dá pra saber o que a paisagem ‘pensa’. Nem se pensa." : "Sinto que até as montanhas estão me julgando.";
    if (lens === "adivinhacao") return clarity >= 3 ? "Talvez o dia ainda surpreenda." : "Já sei: vai escurecer e eu vou voltar triste.";
    if (lens === "generalizacao") return clarity >= 3 ? "Hoje é um dia. Nem todos foram assim." : "Toda paisagem bonita acaba me deixando mais sozinho. Sempre.";
    if (lens === "tudoOuNada") return clarity >= 3 ? "Não precisa ser perfeito pra valer a pena." : "Ou esse pôr do sol é perfeito, ou não vale nada.";
    if (lens === "filtroMental") return clarity >= 3 ? "Tem verde, tem rio, tem luz. Eu só estava vendo a sombra." : "Só vejo a parte escura entre as montanhas.";
    return clarity >= 3 ? "Um momento triste não me define." : "Sou alguém que nem consegue curtir uma paisagem dessas. Patético.";
  }
  // ---- SALA ----
  if (scene === "sala") {
    if (lens === "neutra") return "Estou na sala. Tem o quadro, os colegas, a luz da janela.";
    if (lens === "curiosa") return clarity >= 2 ? "Cada um aqui está no próprio mundo. Talvez eu também esteja." : "Será que o professor já passou a matéria?";
    if (lens === "catastrofe") return clarity >= 3 ? "Errar uma resposta não é o fim do ano." : "Se eu errar agora, todo mundo vai lembrar pra sempre.";
    if (lens === "personalizacao") return clarity >= 3 ? "Aquele cochicho provavelmente nem é sobre mim." : "Estão rindo. Com certeza é de mim.";
    if (lens === "leituraMental") return clarity >= 3 ? "Não tenho como saber o que pensam — só perguntando." : "Sei que estão achando que sou estranho.";
    if (lens === "adivinhacao") return clarity >= 3 ? "Não sei como vai ser essa prova." : "Já sei: vou tirar nota baixa de novo.";
    if (lens === "generalizacao") return clarity >= 3 ? "Hoje é só hoje. Não é toda aula." : "Toda vez que tento participar, sai errado.";
    if (lens === "tudoOuNada") return clarity >= 3 ? "Dá pra ir bem sem ser o melhor da turma." : "Ou tiro 10, ou não adianta nada.";
    if (lens === "filtroMental") return clarity >= 3 ? "Várias coisas estão indo bem aqui também." : "Só consigo lembrar do que esqueci de fazer.";
    return clarity >= 3 ? "Eu errei — mas não sou ‘um erro’." : "Sou o pior aluno daqui. Sempre fui.";
  }
  // ---- CONVERSA ----
  if (lens === "neutra") return "A gente está conversando. Ela está calada agora.";
  if (lens === "curiosa") return clarity >= 2 ? "Talvez ela só esteja cansada hoje. Posso perguntar." : "Por que ela ficou em silêncio?";
  if (lens === "catastrofe") return clarity >= 3 ? "Um silêncio não é o fim de uma amizade." : "Esse silêncio é o começo do fim.";
  if (lens === "personalizacao") return clarity >= 3 ? "O humor dela tem a ver com o dia dela, não comigo." : "Ela está assim por algo que eu fiz.";
  if (lens === "leituraMental") return clarity >= 3 ? "Não dá pra ler a mente dela. Só perguntar." : "Sei que ela está pensando que eu sou chato.";
  if (lens === "adivinhacao") return clarity >= 3 ? "Não dá pra saber como essa conversa termina." : "Já sei: ela vai se afastar depois disso.";
  if (lens === "generalizacao") return clarity >= 3 ? "Esse silêncio é desse momento, não da relação inteira." : "Toda pessoa próxima sempre acaba se afastando.";
  if (lens === "tudoOuNada") return clarity >= 3 ? "Uma conversa morna não apaga uma amizade boa." : "Ou ela está super engajada, ou não me suporta.";
  if (lens === "filtroMental") return clarity >= 3 ? "Tivemos vários momentos bons hoje também." : "Só consigo notar o jeito que ela olhou pro lado.";
  return clarity >= 3 ? "Não fui ‘chato’ — só estou inseguro nesse momento." : "Sou chato. Não dá pra estar do meu lado por muito tempo.";
}
