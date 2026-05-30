import { useEffect, useMemo, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Eye, RotateCcw, Search, Sparkles, BookOpen, Trophy, MessageCircle, Check, Brain } from "lucide-react";

import cenaNeutra from "@/assets/lentes-cena-neutra.jpg";
import cenaCuriosa from "@/assets/lentes-cena-curiosa.jpg";
import cenaCatastrofe from "@/assets/lentes-cena-catastrofe.jpg";
import cenaPersonalizacao from "@/assets/lentes-cena-personalizacao.jpg";
import cenaLeitura from "@/assets/lentes-cena-leituraMental.jpg";
import cenaAdivinhacao from "@/assets/lentes-cena-adivinhacao.jpg";
import cenaGeneralizacao from "@/assets/lentes-cena-generalizacao.jpg";
import cenaTudoOuNada from "@/assets/lentes-cena-tudoOuNada.jpg";
import cenaFiltroMental from "@/assets/lentes-cena-filtroMental.jpg";
import cenaRotulacao from "@/assets/lentes-cena-rotulacao.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type LensId =
  | "neutra" | "curiosa" | "catastrofe" | "personalizacao" | "leituraMental"
  | "adivinhacao" | "generalizacao" | "tudoOuNada" | "filtroMental" | "rotulacao";

type Lens = {
  id: LensId; label: string; short: string; color: string; ring: string; emoji: string;
  description: string; distortion?: string; image: string;
};

const LENSES: Lens[] = [
  { id: "neutra", label: "Sem lente", short: "Olhar cru", color: "#e9ead4", ring: "#7a7a55", emoji: "👁️",
    description: "Você vê a cena como ela é: um grupo conversando, alguém de fora observando. Sem interpretação automática.", image: cenaNeutra },
  { id: "curiosa", label: "Lente curiosa", short: "‘Será que posso me aproximar?’", color: "#7a8a3a", ring: "#4a5a2a", emoji: "🔍",
    description: "A cena vira possibilidade. Você nota detalhes acolhedores e procura contexto antes de concluir.", image: cenaCuriosa },
  { id: "catastrofe", label: "Catastrofização", short: "‘Vai dar tudo errado’", color: "#7a3a2a", ring: "#4a1f15", emoji: "🌩️",
    description: "Cada detalhe vira sinal de tragédia. O céu escurece, o chão racha, tudo prenuncia o pior.", distortion: "Catastrofização", image: cenaCatastrofe },
  { id: "personalizacao", label: "Personalização", short: "‘Estão olhando pra mim’", color: "#b85c7a", ring: "#7a3450", emoji: "🫣",
    description: "Tudo o que acontece parece ser sobre você. O grupo se vira, um holofote te encontra.", distortion: "Personalização", image: cenaPersonalizacao },
  { id: "leituraMental", label: "Leitura mental", short: "‘Sei o que pensam de mim’", color: "#5a6cb8", ring: "#2f3d7a", emoji: "🧠",
    description: "Você ‘ouve’ os pensamentos dos outros — e quase sempre são ruins sobre você. Sem evidência.", distortion: "Leitura mental", image: cenaLeitura },
  { id: "adivinhacao", label: "Adivinhação do futuro", short: "‘Já sei como termina’", color: "#7a5ab8", ring: "#4a307a", emoji: "🔮",
    description: "Uma visão fantasma do futuro aparece: você sozinho no banco, eles longe. Como se já estivesse escrito.", distortion: "Adivinhação", image: cenaAdivinhacao },
  { id: "generalizacao", label: "Generalização", short: "‘Sempre acontece comigo’", color: "#8a6a3a", ring: "#5a4220", emoji: "♾️",
    description: "A cena se repete em ecos fantasmas — ‘sempre, em todo lugar, com todo mundo’.", distortion: "Generalização excessiva", image: cenaGeneralizacao },
  { id: "tudoOuNada", label: "Tudo ou nada", short: "‘Ou perfeito, ou péssimo’", color: "#3a3a3a", ring: "#1a1a1a", emoji: "⚖️",
    description: "Tudo vira preto e branco. Sem meio-termo: uma metade da cena explode em luz, a outra desaparece na sombra.", distortion: "Pensamento dicotômico", image: cenaTudoOuNada },
  { id: "filtroMental", label: "Filtro mental", short: "‘Só vejo o que dá errado’", color: "#3a5a6a", ring: "#1f3a4a", emoji: "🕶️",
    description: "O resto da cena some no escuro. Só o detalhe negativo permanece iluminado.", distortion: "Filtro mental", image: cenaFiltroMental },
  { id: "rotulacao", label: "Rotulação", short: "‘Sou um(a) estranho(a)’", color: "#a05a3a", ring: "#6a3820", emoji: "🏷️",
    description: "Em vez de descrever o momento, um rótulo gigante gruda em você: ‘estranho’, ‘sozinho’, ‘fracassado’.", distortion: "Rotulação", image: cenaRotulacao },
];

const lensById = (id: LensId) => LENSES.find((l) => l.id === id) ?? LENSES[0];
const DISTORTING: LensId[] = ["catastrofe", "personalizacao", "leituraMental", "adivinhacao", "generalizacao", "tudoOuNada", "filtroMental", "rotulacao"];

// ---------- Evidências (pistas) — sempre sobre a MESMA situação social ----------
type Clue = { id: string; label: string; reveals: string };
const CLUES: Clue[] = [
  { id: "tom", label: "Tom da conversa", reveals: "Eles estão rindo entre si, descontraídos. Não há ninguém apontando ou olhando feio na sua direção." },
  { id: "linguagem", label: "Linguagem corporal", reveals: "Os corpos estão abertos uns para os outros — não fechados contra você. Quem está bravo costuma fechar o grupo." },
  { id: "historico", label: "Outras vezes", reveals: "Já houve dias em que eles te chamaram para perto. Hoje pode ser só um momento — não a regra da relação." },
  { id: "outras", label: "Outras explicações", reveals: "Talvez eles estejam falando de uma série, ou de um trabalho. O assunto provavelmente nem é sobre você." },
];

// ---------- Mini-desafios ----------
type Quiz = { question: string; options: { text: string; correct?: boolean }[]; explain: string };
const QUIZZES: Record<LensId, Quiz | null> = {
  neutra: null, curiosa: null,
  catastrofe: { question: "O que a Catastrofização está inventando aqui?", options: [{ text: "Que um detalhe pequeno é o começo do pior cenário", correct: true }, { text: "Que tudo está bem e nada vai mudar" }, { text: "Que os outros não importam" }], explain: "Catastrofização infla o pequeno até virar tragédia." },
  personalizacao: { question: "Onde está a Personalização nessa cena?", options: [{ text: "Achar que algo neutro é por sua causa", correct: true }, { text: "Pedir desculpas quando erra de fato" }, { text: "Reconhecer responsabilidade real" }], explain: "Personalização cola um ‘é por minha causa’ onde não há prova." },
  leituraMental: { question: "A Leitura mental aqui está…", options: [{ text: "Adivinhando o que os outros pensam, sem perguntar", correct: true }, { text: "Observando expressões com curiosidade" }, { text: "Confirmando uma hipótese com fato" }], explain: "Sem perguntar, não é leitura — é invenção." },
  adivinhacao: { question: "A Adivinhação está fazendo o quê?", options: [{ text: "Decidindo o final antes de viver o começo", correct: true }, { text: "Planejando o próximo passo com cuidado" }, { text: "Considerando vários cenários" }], explain: "Adivinhação fecha o futuro — sem dar chance pra ele." },
  generalizacao: { question: "Que palavra denuncia a Generalização?", options: [{ text: "‘Sempre’, ‘nunca’, ‘ninguém’", correct: true }, { text: "‘Hoje’, ‘agora’, ‘às vezes’" }, { text: "‘Talvez’, ‘pode ser’" }], explain: "Palavras absolutas esticam um caso para uma regra." },
  tudoOuNada: { question: "O Tudo ou nada acontece quando…", options: [{ text: "Só existe ‘perfeito’ ou ‘fracasso’", correct: true }, { text: "Se aceita o meio-termo" }, { text: "Se reconhece progresso pequeno" }], explain: "A vida real mora no meio. Tudo ou nada elimina esse meio." },
  filtroMental: { question: "O Filtro mental faz o quê?", options: [{ text: "Apaga o que está bem e amplia o que está mal", correct: true }, { text: "Pesa o positivo e o negativo" }, { text: "Foca em soluções" }], explain: "Filtro mental é ver só a sombra de uma cena cheia de luz." },
  rotulacao: { question: "Rotulação é diferente de descrever porque…", options: [{ text: "Cola uma identidade permanente: ‘sou um estranho’", correct: true }, { text: "Diz só o que aconteceu" }, { text: "Foca no comportamento, não na pessoa" }], explain: "‘Errei na conversa’ descreve. ‘Sou estranho’ rotula." },
};

// ---------- Frases flutuantes ao redor da cena (mudam por lente) ----------
type FloatingPhrase = { text: string; top: string; left: string };
const PHRASES: Record<LensId, FloatingPhrase[]> = {
  neutra: [
    { text: "Tem um grupo ali.", top: "12%", left: "8%" },
    { text: "Estou observando.", top: "22%", left: "72%" },
    { text: "Nada de mais acontecendo.", top: "70%", left: "10%" },
    { text: "Posso só ficar aqui.", top: "78%", left: "70%" },
  ],
  curiosa: [
    { text: "Será que posso chegar perto?", top: "10%", left: "10%" },
    { text: "Do que será que falam?", top: "20%", left: "68%" },
    { text: "Pareço bem-vindo?", top: "72%", left: "8%" },
    { text: "Talvez dê pra perguntar.", top: "78%", left: "66%" },
  ],
  catastrofe: [
    { text: "Vai dar tudo errado.", top: "10%", left: "8%" },
    { text: "Vão rir de mim.", top: "18%", left: "68%" },
    { text: "Esse vai ser meu pior dia.", top: "70%", left: "6%" },
    { text: "E se eu travar?", top: "78%", left: "66%" },
  ],
  personalizacao: [
    { text: "Estão olhando pra mim.", top: "10%", left: "10%" },
    { text: "É por minha causa.", top: "20%", left: "68%" },
    { text: "Algo que eu fiz…", top: "72%", left: "8%" },
    { text: "Eu sou o motivo.", top: "78%", left: "68%" },
  ],
  leituraMental: [
    { text: "Estão me achando estranho.", top: "10%", left: "8%" },
    { text: "Sei o que pensam.", top: "20%", left: "68%" },
    { text: "‘Que esquisito(a)’.", top: "70%", left: "8%" },
    { text: "Não precisam falar — eu sinto.", top: "78%", left: "62%" },
  ],
  adivinhacao: [
    { text: "Já sei como termina.", top: "10%", left: "10%" },
    { text: "Vou ficar sozinho(a).", top: "20%", left: "68%" },
    { text: "Ninguém vai me chamar.", top: "72%", left: "8%" },
    { text: "Sempre acaba assim.", top: "78%", left: "66%" },
  ],
  generalizacao: [
    { text: "Sempre acontece comigo.", top: "10%", left: "8%" },
    { text: "Em todo lugar.", top: "20%", left: "70%" },
    { text: "Com todo mundo.", top: "72%", left: "8%" },
    { text: "Nunca muda.", top: "78%", left: "70%" },
  ],
  tudoOuNada: [
    { text: "Ou me chamam, ou me odeiam.", top: "10%", left: "6%" },
    { text: "Sem meio-termo.", top: "20%", left: "68%" },
    { text: "Perfeito ou péssimo.", top: "72%", left: "8%" },
    { text: "Tudo ou nada.", top: "78%", left: "70%" },
  ],
  filtroMental: [
    { text: "Aquele de costas me ignorou.", top: "10%", left: "6%" },
    { text: "Só vejo o que dá errado.", top: "20%", left: "66%" },
    { text: "O resto não importa.", top: "72%", left: "8%" },
    { text: "Foi um dia ruim.", top: "78%", left: "70%" },
  ],
  rotulacao: [
    { text: "Sou um(a) estranho(a).", top: "10%", left: "10%" },
    { text: "Não sirvo pra isso.", top: "20%", left: "68%" },
    { text: "Sou o esquisito do grupo.", top: "72%", left: "8%" },
    { text: "É quem eu sou.", top: "78%", left: "70%" },
  ],
};

// ---------- Conquistas ----------
type BadgeDef = { id: string; label: string; emoji: string; hint: string; check: (s: State) => boolean };
const BADGES: BadgeDef[] = [
  { id: "primeira-lente", label: "Primeira troca", emoji: "👓", hint: "Equipou sua primeira lente distorcida.", check: (s) => DISTORTING.some((d) => (s.intensity[d] ?? 0) > 0) },
  { id: "curiosa", label: "Olhar curioso", emoji: "🔍", hint: "Usou a Lente curiosa.", check: (s) => (s.intensity.curiosa ?? 0) > 0 },
  { id: "detetive", label: "Detetive de distorções", emoji: "🕵️", hint: "Acertou 3 mini-desafios.", check: (s) => s.awareness >= 3 },
  { id: "clareza", label: "Clareza total", emoji: "✨", hint: "Investigou todas as pistas.", check: (s) => s.revealedClues.length >= CLUES.length },
  { id: "todas", label: "Provador de lentes", emoji: "🎭", hint: "Experimentou todas as lentes.", check: (s) => LENSES.every((l) => (s.intensity[l.id] ?? 0) > 0) },
  { id: "espelho", label: "Espelho da vida real", emoji: "🪞", hint: "Escreveu uma situação real no Espelho.", check: (s) => (s.mirror?.situation?.trim().length ?? 0) > 10 },
];

// ---------- Estado ----------
type State = {
  started: boolean;
  lens: LensId;
  intensity: Record<LensId, number>;
  revealedClues: string[];
  awareness: number;
  mirror: { situation: string; guessedLens?: LensId };
};

const emptyIntensity = (): Record<LensId, number> =>
  LENSES.reduce((acc, l) => { acc[l.id] = 0; return acc; }, {} as Record<LensId, number>);

const initialState: State = {
  started: false, lens: "neutra", intensity: emptyIntensity(),
  revealedClues: [], awareness: 0, mirror: { situation: "" },
};

const normalizeState = (s: Partial<State> | State): State => ({
  started: s.started ?? false,
  lens: LENSES.some((l) => l.id === s.lens) ? (s.lens as LensId) : "neutra",
  intensity: { ...emptyIntensity(), ...((s as State).intensity || {}) },
  revealedClues: Array.isArray((s as State).revealedClues) ? (s as State).revealedClues : [],
  awareness: (s as State).awareness ?? 0,
  mirror: (s as State).mirror ?? { situation: "" },
});

type Particle = { id: number; x: number; y: number; color: string; emoji?: string };

export default function EntreLentes({ room }: Props) {
  const [state, setState] = useState<State>(initialState);
  const [tab, setTab] = useState<"lentes" | "espelho" | "conquistas">("lentes");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [quizOpen, setQuizOpen] = useState<LensId | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<null | { correct: boolean; lens: LensId }>(null);
  const particleId = useRef(0);

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "lentes:state") setState(normalizeState(m.payload));
      if (m.type === "lentes:particles") spawnParticles(m.payload.color, m.payload.emoji, m.payload.count);
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
      next.push({ id: ++particleId.current, x: 40 + Math.random() * 20, y: 45 + Math.random() * 20, color, emoji });
    }
    setParticles((p) => [...p, ...next]);
    setTimeout(() => setParticles((p) => p.filter((x) => !next.find((n) => n.id === x.id))), 1400);
  };
  const broadcastParticles = (color: string, emoji?: string, count = 14) => {
    spawnParticles(color, emoji, count);
    room.send("lentes:particles", { color, emoji, count });
  };

  const equipLens = (id: LensId) => {
    update((s) => {
      const current = s.intensity[id] ?? 0;
      const bumped = id === "neutra" ? current : Math.min(3, current + 1);
      return { ...s, lens: id, intensity: { ...s.intensity, [id]: bumped } };
    });
    const l = lensById(id);
    broadcastParticles(l.color, l.emoji, 14);
  };

  const investigate = (clueId: string) => {
    update((s) => {
      if (s.revealedClues.includes(clueId)) return s;
      const intensity = { ...s.intensity };
      for (const k of DISTORTING) intensity[k] = Math.max(0, (intensity[k] ?? 0) - 1);
      return { ...s, revealedClues: [...s.revealedClues, clueId], intensity };
    });
    broadcastParticles("#fff8b8", "✨", 12);
  };

  const answerQuiz = (lens: LensId, optionIdx: number) => {
    const quiz = QUIZZES[lens]; if (!quiz) return;
    const correct = !!quiz.options[optionIdx]?.correct;
    setQuizFeedback({ correct, lens });
    if (correct) { update((s) => ({ ...s, awareness: s.awareness + 1 })); broadcastParticles("#7a8a3a", "🏆", 10); }
    setTimeout(() => { setQuizOpen(null); setQuizFeedback(null); }, 2200);
  };

  const updateMirror = (situation: string) => update((s) => ({ ...s, mirror: { ...s.mirror, situation } }));
  const guessMirror = (l: LensId) => {
    update((s) => ({ ...s, mirror: { ...s.mirror, guessedLens: l } }));
    broadcastParticles(lensById(l).color, "💡", 10);
  };

  const reset = () => { setState(initialState); room.send("lentes:state", initialState); };
  const startGame = () => update({ started: true });

  const lens = lensById(state.lens);
  const intensity = state.intensity[state.lens] ?? 0;
  const isDistorting = DISTORTING.includes(state.lens);
  const clarity = state.revealedClues.length;
  const earnedBadges = BADGES.filter((b) => b.check(state));

  // Atenua o efeito visual conforme clareza aumenta
  const clarityT = clarity / CLUES.length;
  const sceneStyle = useMemo<React.CSSProperties>(() => {
    if (!isDistorting) return { filter: "none" };
    // Quanto mais clareza, mais a cena distorcida "desbota" para revelar a base neutra por baixo
    const opacity = 1 - clarityT * 0.55;
    return { opacity };
  }, [isDistorting, clarityT]);

  // ===== INTRO =====
  if (!state.started) {
    return (
      <div className="h-full w-full flex flex-col gap-4 text-stone-800 overflow-y-auto">
        <div className="relative rounded-2xl overflow-hidden border-4 border-[#4a5a2a]/30 shadow-[0_20px_50px_-15px_rgba(40,50,20,0.45)] bg-gradient-to-br from-[#4a5a2a] to-[#2a3a1a] p-8 text-[#f4f4d8] text-center">
          <div className="text-6xl mb-4">👓</div>
          <h1 className="text-3xl font-bold mb-3">Entre Lentes</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
            A mesma cena, vista por <b>9 óculos diferentes</b>.<br />
            Veja como o jeito de pensar muda <i>literalmente</i> o que enxergamos.
          </p>
          <Button onClick={startGame}
            className="mt-6 bg-[#f4f4d8] text-[#4a5a2a] hover:bg-white font-bold text-lg px-8 py-3 h-auto rounded-full shadow-lg">
            <Sparkles className="w-5 h-5 mr-2" /> Começar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-4">
            <div className="text-2xl mb-1">1️⃣</div>
            <h3 className="font-bold text-[#4a5a2a]">Escolha uma lente</h3>
            <p className="text-sm text-stone-600">Cada lente é um jeito de pensar — uma distorção cognitiva.</p>
          </div>

          {/* Frases flutuantes ao redor da criança — mudam por lente */}
          <div className="absolute inset-0 pointer-events-none">
            {PHRASES[state.lens].map((p, i) => {
              const isNeutralVibe = state.lens === "neutra" || state.lens === "curiosa";
              // Frases distorcidas desbotam conforme as pistas são reveladas
              const opacity = isNeutralVibe ? 0.95 : Math.max(0.25, 0.95 - clarityT * 0.6);
              const bg = isNeutralVibe ? "rgba(255,255,255,0.92)" : `${lens.ring}EE`;
              const color = isNeutralVibe ? "#3a3a2a" : "#fff";
              return (
                <div
                  key={`${state.lens}-${i}`}
                  className="absolute max-w-[42%] animate-fade-in"
                  style={{
                    top: p.top,
                    left: p.left,
                    animationDelay: `${i * 120}ms`,
                    opacity,
                  }}
                >
                  <div
                    className="rounded-2xl px-2.5 py-1 text-[11px] md:text-xs italic font-medium shadow-md backdrop-blur leading-snug"
                    style={{ background: bg, color, border: `1px solid ${lens.ring}55` }}
                  >
                    “{p.text}”
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-4">
            <div className="text-2xl mb-1">2️⃣</div>
            <h3 className="font-bold text-[#4a5a2a]">Veja a cena mudar</h3>
            <p className="text-sm text-stone-600">A imagem inteira se transforma para mostrar como aquela lente faz o mundo parecer.</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-4">
            <div className="text-2xl mb-1">3️⃣</div>
            <h3 className="font-bold text-[#4a5a2a]">Investigue as pistas</h3>
            <p className="text-sm text-stone-600">Cada evidência real enfraquece as lentes distorcidas e devolve clareza.</p>
          </div>
        </div>

        <div className="text-center py-2">
          <Button onClick={startGame}
            className="bg-[#4a5a2a] text-[#f4f4d8] hover:bg-[#3a4a1a] font-bold text-lg px-10 py-3 h-auto rounded-full shadow-lg">
            <Sparkles className="w-5 h-5 mr-2" /> Vamos lá!
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_360px] gap-4 text-stone-800">
      {/* ---------------- SCENE ---------------- */}
      <div className="flex flex-col gap-3 min-h-0">
        {/* Onboarding strip */}
        <div className="rounded-xl bg-[#f4f4d8] border border-[#4a5a2a]/20 px-3 py-2 text-[12px] text-[#4a5a2a] flex flex-wrap items-center gap-x-3 gap-y-1">
          <span><b>1.</b> Escolha uma lente →</span>
          <span><b>2.</b> Veja a cena mudar →</span>
          <span><b>3.</b> Investigue as pistas abaixo</span>
        </div>

        <div className="relative rounded-2xl overflow-hidden border-4 border-[#4a5a2a]/30 shadow-[0_20px_50px_-15px_rgba(40,50,20,0.45)] bg-[#e9ead4] aspect-[3/2] min-h-[300px]">
          {/* Camada base sempre presente (neutra) — aparece sob a cena distorcida conforme clareza aumenta */}
          <img
            src={cenaNeutra}
            alt="Cena base"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />
          {/* Cena da lente atual */}
          <img
            key={lens.id}
            src={lens.image}
            alt={`Cena vista pela ${lens.label}`}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-700 animate-fade-in"
            style={sceneStyle}
            draggable={false}
          />

          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <span key={p.id} className="absolute text-xl"
                style={{
                  left: `${p.x}%`, top: `${p.y}%`, color: p.color,
                  animation: "lentes-particle 1.3s ease-out forwards",
                  ['--lx' as any]: `${(Math.random() - 0.5) * 200}px`,
                  ['--ly' as any]: `${-80 - Math.random() * 140}px`,
                }}>
                {p.emoji ?? "●"}
              </span>
            ))}
          </div>

          {/* Lens chip */}
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-white text-xs font-bold backdrop-blur shadow"
            style={{ background: lens.ring }}>
            <span className="text-base">{lens.emoji}</span>
            {lens.label}
            {isDistorting && <span className="opacity-80">· int. {intensity}/3</span>}
          </div>

          {/* Mini-quiz button (only for distorting lenses) */}
          {isDistorting && QUIZZES[state.lens] && (
            <button
              onClick={() => setQuizOpen(state.lens)}
              className="absolute top-3 right-3 rounded-full bg-white/95 hover:bg-white text-[#4a5a2a] text-xs font-bold px-3 py-1.5 shadow flex items-center gap-1.5 transition hover:-translate-y-0.5">
              <Brain className="w-3.5 h-3.5" /> Mini-desafio
            </button>
          )}

          {/* Thought balloon */}
          <div className="absolute left-1/2 bottom-3 -translate-x-1/2 max-w-[85%] text-center">
            <div key={`${state.lens}-${intensity}-${clarity}`}
              className="inline-block rounded-2xl px-4 py-2 bg-black/72 text-white text-sm italic backdrop-blur animate-fade-in">
              {protagonistThought(state.lens, intensity, clarity)}
            </div>
          </div>

          {/* Quiz overlay */}
          {quizOpen && QUIZZES[quizOpen] && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in">
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
                    <button onClick={() => setQuizOpen(null)} className="w-full text-center text-[11px] text-stone-500 mt-1 hover:text-stone-700">
                      pular
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Evidências (pistas) — botões claros logo abaixo da cena */}
        <div className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[#4a5a2a]">
              <Search className="w-4 h-4" />
              <h3 className="font-bold text-sm">Pistas · o que realmente está acontecendo?</h3>
            </div>
            <span className="text-xs font-bold text-[#4a5a2a]">{clarity}/{CLUES.length}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CLUES.map((c) => {
              const found = state.revealedClues.includes(c.id);
              return (
                <button key={c.id} onClick={() => investigate(c.id)}
                  className={`text-left rounded-xl border-2 p-2 transition text-xs ${
                    found ? "border-[#7a8a3a] bg-[#f4f4d8]" : "border-stone-200 hover:border-[#4a5a2a] hover:-translate-y-0.5 bg-white"
                  }`}>
                  <div className="flex items-center gap-1 font-bold text-[#3a3a2a] mb-0.5">
                    {found ? <Check className="w-3 h-3 text-[#7a8a3a]" /> : <Search className="w-3 h-3 text-stone-400" />}
                    {c.label}
                  </div>
                  <div className="text-[10px] text-stone-600 leading-snug line-clamp-3">
                    {found ? c.reveals : "Clique para investigar"}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[#e3e4cf] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7a8a3a] to-[#b9c66a] transition-all duration-700"
              style={{ width: `${(clarity / CLUES.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="flex flex-col gap-3 min-h-0">
        <header className="rounded-2xl bg-[#4a5a2a] text-[#f4f4d8] p-4 shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-widest opacity-80">Painel de lentes</div>
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
                <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                  <p>A cena mostra uma <b>criança observando um grupo de colegas</b>. A situação social é ambígua — não há nada de objetivamente ruim acontecendo.</p>
                  <p><b>1.</b> Equipe diferentes lentes no painel ao lado. Cada lente é uma distorção cognitiva — e a <b>cena inteira muda</b> para mostrar como ela faz o mundo parecer.</p>
                  <p><b>2.</b> Quando uma lente distorcida está ativa, abra o <b>Mini-desafio</b> no canto da cena. Acertar dá pontos de Consciência.</p>
                  <p><b>3.</b> Clique nas <b>Pistas</b> abaixo da cena para descobrir o que realmente está acontecendo. Cada evidência enfraquece as distorções.</p>
                  <p><b>4.</b> No <b>Espelho</b>, traga uma situação real e identifique qual lente costuma aparecer.</p>
                  <p><b>5.</b> Colecione <b>Conquistas</b> ao longo do caminho.</p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="text-xs opacity-95 leading-snug">
            <span className="text-base mr-1">{lens.emoji}</span>
            <b>{lens.label}</b> — {lens.description}
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-[#e9ead4] p-1">
          {([
            { id: "lentes", label: "Lentes", Icon: Eye },
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
          {tab === "lentes" && (
            <section className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm">
              <div className="space-y-1.5">
                {LENSES.map((l) => {
                  const active = l.id === state.lens;
                  const inten = state.intensity[l.id] ?? 0;
                  return (
                    <button key={l.id} onClick={() => equipLens(l.id)}
                      className={`w-full text-left rounded-xl p-2 border-2 transition-all flex items-center gap-2 ${active ? "shadow-md" : "hover:-translate-y-0.5 opacity-95"}`}
                      style={{ borderColor: active ? l.ring : "#e3e4cf", background: active ? l.color : "#fafaef", color: active ? "#fff" : "#3a3a2a" }}>
                      <span className="text-xl shrink-0">{l.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-[12px] font-bold">
                          <span className="truncate">{l.label}</span>
                          {l.id !== "neutra" && <span className="opacity-80 text-[10px]">{inten}/3</span>}
                        </div>
                        <div className={`text-[10px] truncate ${active ? "text-white/85" : "text-stone-500"}`}>{l.short}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <div className="rounded-lg bg-[#f4f4d8] px-2 py-1.5 text-[11px] text-[#4a5a2a]">🏆 Consciência: <b>{state.awareness}</b></div>
                <div className="rounded-lg bg-[#f4f4d8] px-2 py-1.5 text-[11px] text-[#4a5a2a]">🎖️ Conquistas: <b>{earnedBadges.length}/{BADGES.length}</b></div>
              </div>
            </section>
          )}

          {tab === "espelho" && (
            <section className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-[#4a5a2a]">
                <MessageCircle className="w-4 h-4" />
                <h3 className="font-bold text-sm">Modo Espelho</h3>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Escreva uma situação real que te incomodou. Depois, identifique qual lente pode estar em uso.
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
                        className={`text-left rounded-lg p-1.5 border-2 text-[11px] font-semibold flex items-center gap-1.5 transition ${sel ? "shadow" : "opacity-90 hover:-translate-y-0.5"}`}
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
                  {lensById(state.mirror.guessedLens).description} Tente trocar pela <b>Lente curiosa</b> e pergunte:{" "}
                  <i>“o que mais poderia explicar isso?”</i>
                </div>
              )}
            </section>
          )}

          {tab === "conquistas" && (
            <section className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2 text-[#4a5a2a]">
                <div className="flex items-center gap-2"><Trophy className="w-4 h-4" /><h3 className="font-bold text-sm">Conquistas</h3></div>
                <span className="text-xs font-bold">{earnedBadges.length}/{BADGES.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {BADGES.map((b) => {
                  const got = b.check(state);
                  return (
                    <div key={b.id} className={`rounded-xl p-2.5 border-2 flex items-center gap-2.5 transition ${got ? "border-[#7a8a3a] bg-[#f4f4d8]" : "border-stone-200 bg-stone-50 opacity-70"}`}>
                      <div className={`text-2xl ${got ? "" : "grayscale"}`}>{b.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5 text-[#3a3a2a]">
                          {b.label}{got && <Check className="w-3 h-3 text-[#7a8a3a]" />}
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

function protagonistThought(lens: LensId, intensity: number, clarity: number): string {
  if (lens === "neutra") return "Um grupo conversando. Eu, observando de fora.";
  if (lens === "curiosa") return clarity >= 2 ? "Talvez eu possa chegar perto e perguntar do que estão falando." : "Será que dá pra entrar nessa conversa?";
  if (lens === "catastrofe") return clarity >= 3 ? "Talvez não vire o fim do mundo." : intensity >= 3 ? "Isso é o começo do meu pior dia. Vai dar tudo errado." : "E se eles me ignorarem na frente de todos?";
  if (lens === "personalizacao") return clarity >= 3 ? "O que eles falam provavelmente nem é sobre mim." : "Eles estão olhando pra mim. Devo ter feito algo errado.";
  if (lens === "leituraMental") return clarity >= 3 ? "Não tenho como saber o que pensam. Só perguntando." : "Eu sei: eles estão me achando estranho.";
  if (lens === "adivinhacao") return clarity >= 3 ? "Não sei como esse dia termina." : "Já sei: vou acabar sozinho no banco de novo.";
  if (lens === "generalizacao") return clarity >= 3 ? "Hoje é só hoje. Não é toda hora." : "Sempre acontece assim. Em todo lugar.";
  if (lens === "tudoOuNada") return clarity >= 3 ? "Não precisa ser super amizade pra valer." : "Ou eles me chamam, ou me odeiam. Não tem meio-termo.";
  if (lens === "filtroMental") return clarity >= 3 ? "Tem coisa boa rolando que eu não estava vendo." : "Só consigo ver aquele que está de costas pra mim.";
  return clarity >= 3 ? "Um momento desconfortável não me define." : "Sou um estranho mesmo. Tá grudado em mim.";
}
