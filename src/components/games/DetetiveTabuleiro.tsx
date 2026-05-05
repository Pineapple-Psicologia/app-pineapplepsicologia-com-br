import { useEffect, useMemo, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, ChevronRight, Dices, Sparkles, Trophy, History, Award } from "lucide-react";
import DetetiveBoard3D from "./DetetiveBoard3D";
import sceneBg from "@/assets/scene-detetive-tabuleiro.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type LocationId =
  | "cena"
  | "emocao"
  | "corpo"
  | "interrogatorio"
  | "cartas"
  | "evidencias"
  | "valores"
  | "reframe"
  | "plano"
  | "arquivo";

const LOCATIONS: {
  id: LocationId;
  name: string;
  emoji: string;
  hint: string;
  color: string;
  tw: string;
  x: number;
  y: number;
  points: number;
}[] = [
  { id: "cena",           name: "Cena do Crime",      emoji: "🔍", hint: "Descreva o que aconteceu",         color: "#fb7185", tw: "bg-rose-400",    x: 10, y: 85, points: 20 },
  { id: "emocao",         name: "Termômetro Emocional", emoji: "🌡️", hint: "Que emoção apareceu? Intensidade?", color: "#f97316", tw: "bg-orange-400",  x: 22, y: 55, points: 20 },
  { id: "corpo",          name: "Mapa do Corpo",      emoji: "🫀", hint: "Onde sentiu no corpo?",            color: "#ef4444", tw: "bg-red-400",     x: 36, y: 80, points: 15 },
  { id: "interrogatorio", name: "Sala de Interrogatório", emoji: "💭", hint: "Pensamento automático",          color: "#38bdf8", tw: "bg-sky-400",     x: 48, y: 40, points: 25 },
  { id: "cartas",         name: "Mesa de Cartas",     emoji: "🃏", hint: "Identifique distorções",          color: "#a78bfa", tw: "bg-violet-400",  x: 60, y: 75, points: 25 },
  { id: "evidencias",     name: "Sala de Evidências", emoji: "⚖️", hint: "Pese provas a favor e contra",     color: "#34d399", tw: "bg-emerald-400", x: 72, y: 38, points: 30 },
  { id: "valores",        name: "Bússola de Valores", emoji: "🧭", hint: "O que importa pra você aqui?",     color: "#22d3ee", tw: "bg-cyan-400",    x: 82, y: 70, points: 20 },
  { id: "reframe",        name: "Reescrita",          emoji: "🔄", hint: "Versão mais justa do pensamento",  color: "#84cc16", tw: "bg-lime-400",    x: 88, y: 35, points: 30 },
  { id: "plano",          name: "Plano de Ação",      emoji: "📋", hint: "Próximo passo concreto",           color: "#f59e0b", tw: "bg-amber-400",   x: 92, y: 65, points: 25 },
  { id: "arquivo",        name: "Arquivo Final",      emoji: "🏆", hint: "Encerre o caso",                   color: "#fbbf24", tw: "bg-yellow-400",  x: 94, y: 90, points: 40 },
];

const DISTORTIONS = [
  { id: "tudo-nada", emoji: "⚫⚪", label: "Tudo ou nada" },
  { id: "catastrofe", emoji: "💥", label: "Catastrofização" },
  { id: "leitura", emoji: "🔮", label: "Leitura mental" },
  { id: "adivinhacao", emoji: "🎱", label: "Adivinhação" },
  { id: "rotulo", emoji: "🏷️", label: "Rotulação" },
  { id: "filtro", emoji: "🕶️", label: "Filtro mental" },
  { id: "personalizar", emoji: "🎯", label: "Personalização" },
  { id: "deveria", emoji: "📜", label: "Deveria" },
  { id: "generalizar", emoji: "♾️", label: "Generalização" },
  { id: "emocional", emoji: "💭", label: "Raciocínio emocional" },
];

type EventCardKind = "ajuda" | "desafio" | "revelacao" | "atalho";
type EventCard = { kind: EventCardKind; title: string; text: string; bonus: number };

const EVENT_DECK: Record<EventCardKind, EventCard[]> = {
  ajuda: [
    { kind: "ajuda", title: "🤝 Aliado inesperado", text: "Lembre-se de uma vez em que você lidou bem com algo parecido. O que ajudou?", bonus: 10 },
    { kind: "ajuda", title: "🌬️ Pausa do detetive", text: "Respire fundo 3 vezes antes de responder. Reduza 1 ponto na intensidade emocional.", bonus: 10 },
    { kind: "ajuda", title: "💡 Pista extra", text: "Se um amigo querido vivesse isso, o que você diria pra ele?", bonus: 10 },
  ],
  desafio: [
    { kind: "desafio", title: "🌀 Pegadinha cognitiva", text: "Encontre PELO MENOS uma evidência contrária ao pensamento — mesmo que pequena.", bonus: 15 },
    { kind: "desafio", title: "🎭 Troca de papéis", text: "Reescreva o pensamento como se fosse uma manchete de jornal sensacionalista. Depois reescreva sóbria.", bonus: 15 },
    { kind: "desafio", title: "⏳ Viagem no tempo", text: "Como você verá esse pensamento daqui a 1 ano?", bonus: 15 },
  ],
  revelacao: [
    { kind: "revelacao", title: "✨ Revelação do caso", text: "Identifique uma distorção a mais que você não tinha visto.", bonus: 25 },
    { kind: "revelacao", title: "🔓 Cofre aberto", text: "Que crença mais antiga está por trás desse pensamento?", bonus: 25 },
  ],
  atalho: [
    { kind: "atalho", title: "🛤️ Atalho secreto", text: "Avance +1 casa extra! Mas você precisa explicar em uma frase o que aprendeu até aqui.", bonus: 20 },
  ],
};

const BADGES: { id: string; emoji: string; label: string; check: (s: State) => boolean }[] = [
  { id: "primeira-cena",   emoji: "🔍", label: "Primeira cena registrada", check: (s) => !!s.cena.trim() },
  { id: "termometro",      emoji: "🌡️", label: "Termômetro calibrado",      check: (s) => s.emocaoIntensidade > 0 },
  { id: "corpo-mapeado",   emoji: "🫀", label: "Corpo mapeado",              check: (s) => !!s.corpo.trim() },
  { id: "captura",         emoji: "💭", label: "Pensamento capturado",       check: (s) => !!s.thought.trim() },
  { id: "tres-distorcoes", emoji: "🃏", label: "Detetive 3+ distorções",     check: (s) => s.selectedDistortions.length >= 3 },
  { id: "balanca",         emoji: "⚖️", label: "Balança equilibrada",        check: (s) => !!s.evidenceFor.trim() && !!s.evidenceAgainst.trim() },
  { id: "valores",         emoji: "🧭", label: "Bússola alinhada",           check: (s) => !!s.valores.trim() },
  { id: "reframer",        emoji: "🔄", label: "Mestre do reframe",          check: (s) => !!s.reframe.trim() },
  { id: "executor",        emoji: "📋", label: "Plano traçado",              check: (s) => !!s.plano.trim() },
  { id: "caso-fechado",    emoji: "🏆", label: "Caso encerrado",             check: (s) => s.caseClosed },
];

type State = {
  currentIdx: number;
  completed: LocationId[];
  cena: string;
  emocao: string;
  emocaoIntensidade: number;
  corpo: string;
  thought: string;
  selectedDistortions: string[];
  evidenceFor: string;
  evidenceAgainst: string;
  valores: string;
  reframe: string;
  plano: string;
  caseClosed: boolean;
  // game master mechanics
  diceValue: number | null;
  diceRolling: boolean;
  pendingAdvance: number; // tiles still to advance from last roll
  activeEvent: EventCard | null;
  points: number;
  earnedBadges: string[];
};

const INITIAL: State = {
  currentIdx: 0,
  completed: [],
  cena: "",
  emocao: "",
  emocaoIntensidade: 0,
  corpo: "",
  thought: "",
  selectedDistortions: [],
  evidenceFor: "",
  evidenceAgainst: "",
  valores: "",
  reframe: "",
  plano: "",
  caseClosed: false,
  diceValue: null,
  diceRolling: false,
  pendingAdvance: 0,
  activeEvent: null,
  points: 0,
  earnedBadges: [],
};

type CaseHistoryItem = {
  date: number;
  thought: string;
  reframe: string;
  plano: string;
  points: number;
  badges: number;
};

const HISTORY_KEY = "detetive-tabuleiro-history";

function loadHistory(): CaseHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(item: CaseHistoryItem) {
  const list = loadHistory();
  list.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20)));
}

function pickEventCard(diceVal: number): EventCard | null {
  if (diceVal <= 2) return null;
  if (diceVal === 3 || diceVal === 4) {
    const deck = EVENT_DECK.ajuda;
    return deck[Math.floor(Math.random() * deck.length)];
  }
  if (diceVal === 5) {
    const deck = Math.random() < 0.7 ? EVENT_DECK.desafio : EVENT_DECK.atalho;
    return deck[Math.floor(Math.random() * deck.length)];
  }
  // 6
  const deck = EVENT_DECK.revelacao;
  return deck[Math.floor(Math.random() * deck.length)];
}

export default function DetetiveTabuleiro({ room }: Props) {
  const [state, setState] = useState<State>(INITIAL);
  const [openLoc, setOpenLoc] = useState<LocationId | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<CaseHistoryItem[]>(() => loadHistory());
  const [showCelebration, setShowCelebration] = useState(false);
  const celebratedRef = useRef(false);

  // Determine if this user is the game master (psi)
  // We infer role from URL search params since useRoom doesn't expose it directly here.
  const isPsi = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("role") === "psi";
  }, []);

  useEffect(() => {
    const off = room.on((m) => {
      if (m.type === "detective-board:state") setState(m.payload as State);
      if (m.type === "detective-board:open") setOpenLoc(m.payload as LocationId);
    });
    return off;
  }, [room]);

  useEffect(() => {
    if (state.caseClosed && !celebratedRef.current) {
      celebratedRef.current = true;
      setShowCelebration(true);
    }
    if (!state.caseClosed) {
      celebratedRef.current = false;
    }
  }, [state.caseClosed]);

  const update = (patch: Partial<State>) => {
    const next = { ...state, ...patch };
    // recompute badges
    const earned = BADGES.filter((b) => b.check(next)).map((b) => b.id);
    next.earnedBadges = earned;
    setState(next);
    room.send("detective-board:state", next);
  };

  const openLocation = (id: LocationId) => {
    setOpenLoc(id);
    room.send("detective-board:open", id);
  };

  const closeLocation = () => {
    setOpenLoc(null);
    room.send("detective-board:open", null);
  };

  const completeLocation = (id: LocationId) => {
    const idx = LOCATIONS.findIndex((l) => l.id === id);
    const wasCompleted = state.completed.includes(id);
    const completed = wasCompleted ? state.completed : [...state.completed, id];
    const isLast = id === "arquivo";
    const earnedPoints = wasCompleted ? 0 : LOCATIONS[idx].points;
    const next: State = {
      ...state,
      completed,
      currentIdx: Math.min(Math.max(state.currentIdx, idx + 1), LOCATIONS.length - 1),
      caseClosed: isLast || state.caseClosed,
      points: state.points + earnedPoints,
      pendingAdvance: Math.max(0, state.pendingAdvance - 1),
    };
    next.earnedBadges = BADGES.filter((b) => b.check(next)).map((b) => b.id);
    setState(next);
    room.send("detective-board:state", next);
    setOpenLoc(null);
    room.send("detective-board:open", null);

    if (isLast && !state.caseClosed) {
      const item: CaseHistoryItem = {
        date: Date.now(),
        thought: state.thought,
        reframe: state.reframe,
        plano: state.plano,
        points: next.points,
        badges: next.earnedBadges.length,
      };
      saveHistory(item);
      setHistory(loadHistory());
    }
  };

  const rollDice = () => {
    if (state.diceRolling || state.caseClosed) return;
    update({ diceRolling: true, diceValue: null });
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      const v = 1 + Math.floor(Math.random() * 6);
      if (ticks >= 12) {
        clearInterval(interval);
        const finalVal = 1 + Math.floor(Math.random() * 6);
        const card = pickEventCard(finalVal);
        const advanceBy = finalVal === 5 && card?.kind === "atalho" ? 2 : 1;
        const bonus = card?.bonus ?? 0;
        update({
          diceRolling: false,
          diceValue: finalVal,
          pendingAdvance: advanceBy,
          activeEvent: card,
          points: state.points + bonus,
        });
      } else {
        // visual flicker
        setState((s) => ({ ...s, diceValue: v }));
      }
    }, 80);
  };

  const dismissEvent = () => update({ activeEvent: null });

  const reset = () => {
    setState(INITIAL);
    setOpenLoc(null);
    room.send("detective-board:state", INITIAL);
    room.send("detective-board:open", null);
  };

  const currentLoc = LOCATIONS[state.currentIdx];
  const level = Math.floor(state.points / 100) + 1;
  const levelProgress = state.points % 100;

  return (
    <div
      className="h-full w-full rounded-xl border-4 border-amber-900/30 p-3 md:p-5 flex flex-col gap-3 overflow-auto"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 15%, #fde68a 0%, transparent 40%), radial-gradient(circle at 85% 85%, #fbcfe8 0%, transparent 40%), radial-gradient(circle at 70% 20%, #bae6fd 0%, transparent 35%), linear-gradient(135deg, #fff7ed 0%, #ecfeff 100%)",
      }}
    >
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-amber-900">
            🎲 Detetive dos Pensamentos
          </h2>
          <p className="text-xs text-amber-900/70 font-semibold">
            {isPsi ? "🎩 Você é o Mestre do Jogo" : "🎯 Aguarde o mestre rolar o dado"} · Casa atual: <b>{currentLoc.name}</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 border-2 border-amber-700 text-amber-900 font-bold hover:bg-white"
          >
            <History className="w-3.5 h-3.5" /> Histórico
          </button>
          {isPsi && (
            <Button size="sm" variant="outline" onClick={reset} className="bg-white/80 border-amber-700 text-amber-900 hover:bg-white">
              <RotateCcw className="w-4 h-4 mr-1" /> Novo caso
            </Button>
          )}
        </div>
      </header>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/85 backdrop-blur border-2 border-amber-700/50 p-2 shadow">
          <div className="text-[9px] uppercase font-black text-amber-700 tracking-wider">Pontos</div>
          <div className="text-lg font-black text-amber-900 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-500" /> {state.points}
          </div>
        </div>
        <div className="rounded-xl bg-white/85 backdrop-blur border-2 border-violet-700/50 p-2 shadow">
          <div className="text-[9px] uppercase font-black text-violet-700 tracking-wider">Nível Detetive</div>
          <div className="text-lg font-black text-violet-900 flex items-center gap-1">
            <Trophy className="w-4 h-4 text-violet-500" /> {level}
          </div>
          <div className="h-1 mt-0.5 bg-violet-100 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
        <div className="rounded-xl bg-white/85 backdrop-blur border-2 border-emerald-700/50 p-2 shadow">
          <div className="text-[9px] uppercase font-black text-emerald-700 tracking-wider">Medalhas</div>
          <div className="text-lg font-black text-emerald-900 flex items-center gap-1">
            <Award className="w-4 h-4 text-emerald-500" /> {state.earnedBadges.length}/{BADGES.length}
          </div>
        </div>
      </div>

      {/* Badges row */}
      {state.earnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {BADGES.filter((b) => state.earnedBadges.includes(b.id)).map((b) => (
            <span
              key={b.id}
              title={b.label}
              className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-100 border border-amber-500 text-amber-900 font-bold shadow-sm"
            >
              {b.emoji} {b.label}
            </span>
          ))}
        </div>
      )}

      {/* 3D Board */}
      <div className="relative flex-1 min-h-[420px] rounded-3xl border-[6px] border-amber-900/50 overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
        <img src={sceneBg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 75%, rgba(254,243,199,0.55) 0%, rgba(254,215,170,0.25) 35%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        <div className="absolute inset-0">
          <DetetiveBoard3D
            locations={LOCATIONS.map((l) => ({ id: l.id, name: l.name, emoji: l.emoji, color: l.color, x: l.x, y: l.y }))}
            currentIdx={state.currentIdx}
            completed={state.completed}
            onSelect={(id) => isPsi && openLocation(id as LocationId)}
          />
        </div>
        <div className="absolute top-2 left-3 text-[10px] font-black tracking-wider bg-white/85 text-amber-900 px-2 py-0.5 rounded-full shadow border border-amber-900/30 pointer-events-none">
          🎲 Arraste para girar · scroll para zoom
        </div>
      </div>

      {/* Game master / status bar */}
      {state.caseClosed ? (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-300 to-yellow-200 border-4 border-amber-600 text-center shadow-lg">
          <div className="text-2xl font-black text-amber-900">🏆 Caso encerrado, Detetive!</div>
          <div className="text-sm mt-1 text-amber-900/90">
            "<b>{state.thought}</b>" virou "<b>{state.reframe}</b>"
          </div>
          <div className="text-xs mt-2 text-amber-900/80">
            +{state.points} pontos · {state.earnedBadges.length} medalhas · Nível {level}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-3 bg-white border-4 border-amber-700/60 flex items-center gap-3 shadow-md">
          <div className={`text-3xl w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white shadow ${currentLoc.tw}`}>
            {currentLoc.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-black tracking-wider text-amber-700">
              Casa {state.currentIdx + 1}/{LOCATIONS.length} · {currentLoc.name}
            </div>
            <div className="font-bold text-sm truncate text-amber-900">{currentLoc.hint}</div>
          </div>

          {isPsi ? (
            <div className="flex items-center gap-2">
              <DiceWidget value={state.diceValue} rolling={state.diceRolling} />
              {state.pendingAdvance > 0 || state.activeEvent ? (
                <Button size="sm" onClick={() => openLocation(currentLoc.id)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  Jogar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={rollDice} disabled={state.diceRolling} className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
                  <Dices className="w-4 h-4 mr-1" /> Rolar
                </Button>
              )}
            </div>
          ) : (
            <DiceWidget value={state.diceValue} rolling={state.diceRolling} />
          )}
        </div>
      )}

      {/* Event card popup */}
      {state.activeEvent && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={dismissEvent}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`max-w-md w-full rounded-2xl border-4 shadow-2xl p-5 animate-scale-in ${
              state.activeEvent.kind === "ajuda" ? "bg-gradient-to-br from-emerald-100 to-teal-50 border-emerald-500" :
              state.activeEvent.kind === "desafio" ? "bg-gradient-to-br from-rose-100 to-orange-50 border-rose-500" :
              state.activeEvent.kind === "atalho" ? "bg-gradient-to-br from-sky-100 to-cyan-50 border-sky-500" :
              "bg-gradient-to-br from-violet-100 to-fuchsia-50 border-violet-500"
            }`}
          >
            <div className="text-[10px] uppercase font-black tracking-wider opacity-70">
              Carta de {state.activeEvent.kind} · +{state.activeEvent.bonus} pts
            </div>
            <h3 className="text-xl font-black mt-1">{state.activeEvent.title}</h3>
            <p className="mt-2 text-sm leading-relaxed">{state.activeEvent.text}</p>
            {isPsi && (
              <Button onClick={dismissEvent} className="mt-4 w-full bg-stone-800 hover:bg-stone-900 text-white font-bold">
                Continuar caso
              </Button>
            )}
          </div>
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowHistory(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl border-2 border-border shadow-2xl max-w-lg w-full max-h-[80vh] overflow-auto animate-scale-in">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><History className="w-4 h-4" /> Casos arquivados</h3>
              <button onClick={() => setShowHistory(false)} className="text-2xl text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-4 space-y-2">
              {history.length === 0 && <p className="text-sm text-muted-foreground">Nenhum caso encerrado ainda.</p>}
              {history.map((h, i) => (
                <div key={i} className="rounded-lg border-2 border-border p-3 text-sm">
                  <div className="text-[10px] text-muted-foreground">{new Date(h.date).toLocaleString()}</div>
                  <div className="mt-1"><b>Antes:</b> "{h.thought}"</div>
                  <div><b>Depois:</b> "{h.reframe}"</div>
                  {h.plano && <div className="mt-1 text-xs italic">📋 {h.plano}</div>}
                  <div className="mt-1 text-xs text-amber-700 font-bold">{h.points} pts · {h.badges} medalhas</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {showCelebration && state.caseClosed && (
        <CelebrationOverlay
          points={state.points}
          level={level}
          earnedBadges={BADGES.filter((b) => state.earnedBadges.includes(b.id))}
          onClose={() => setShowCelebration(false)}
        />
      )}

      {/* Location modal */}
      {openLoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={closeLocation}>
          <div className="bg-card rounded-2xl border-2 border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <LocationContent locId={openLoc} state={state} update={update} onComplete={() => completeLocation(openLoc)} onClose={closeLocation} isPsi={isPsi} />
          </div>
        </div>
      )}
    </div>
  );
}

function DiceWidget({ value, rolling }: { value: number | null; rolling: boolean }) {
  return (
    <div
      className={`w-12 h-12 rounded-xl border-2 border-violet-700 bg-gradient-to-br from-white to-violet-50 flex items-center justify-center text-2xl font-black text-violet-900 shadow ${
        rolling ? "animate-spin" : ""
      }`}
    >
      {value ?? "?"}
    </div>
  );
}

function LocationContent({
  locId,
  state,
  update,
  onComplete,
  onClose,
  isPsi,
}: {
  locId: LocationId;
  state: State;
  update: (p: Partial<State>) => void;
  onComplete: () => void;
  onClose: () => void;
  isPsi: boolean;
}) {
  const loc = LOCATIONS.find((l) => l.id === locId)!;
  const Header = (
    <div className="p-4 border-b bg-gradient-to-r from-amber-100 to-amber-50 dark:from-stone-800 dark:to-stone-900 rounded-t-2xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-3xl">{loc.emoji}</div>
          <h3 className="text-xl font-bold">{loc.name}</h3>
          <p className="text-xs text-muted-foreground">{loc.hint} · vale {loc.points} pts</p>
        </div>
        <button onClick={onClose} className="text-2xl text-muted-foreground hover:text-foreground">✕</button>
      </div>
    </div>
  );

  const FinishButton = ({ disabled, label }: { disabled?: boolean; label: string }) => (
    <Button disabled={disabled || !isPsi} onClick={onComplete} className="self-end">
      {label} <Check className="w-4 h-4 ml-1" />
    </Button>
  );

  if (locId === "cena") {
    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm">Conte os fatos da cena. Sem opinião, só o que aconteceu.</p>
          <textarea
            value={state.cena}
            onChange={(e) => update({ cena: e.target.value })}
            placeholder="Ex: Mandei mensagem pra um amigo e ele não respondeu..."
            className="min-h-[120px] p-3 rounded-lg border-2 border-border/60 bg-background resize-none focus:outline-none focus:border-primary"
          />
          <FinishButton disabled={!state.cena.trim()} label="Cena registrada" />
        </div>
      </>
    );
  }

  if (locId === "emocao") {
    const emocoes = ["😢 Tristeza", "😡 Raiva", "😨 Medo", "😰 Ansiedade", "😞 Vergonha", "😔 Culpa", "😶 Vazio"];
    // Parse "label:level | label:level" into array of {label, level}
    const parsed: { label: string; level: number }[] = state.emocao
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((chunk) => {
        const m = chunk.match(/^(.*?)(?::(\d{1,3}))?$/);
        const label = (m?.[1] ?? chunk).trim();
        const level = Math.min(100, Math.max(0, Number(m?.[2] ?? 0)));
        return { label, level };
      })
      .filter((x) => x.label);

    const serialize = (list: { label: string; level: number }[]) =>
      list.map((x) => `${x.label}:${x.level}`).join(" | ");

    const commit = (list: { label: string; level: number }[]) => {
      const maxLevel = list.reduce((acc, x) => Math.max(acc, x.level), 0);
      update({ emocao: serialize(list), emocaoIntensidade: maxLevel });
    };

    const isSelected = (label: string) => parsed.some((p) => p.label === label);
    const toggleEmo = (label: string) => {
      const next = isSelected(label)
        ? parsed.filter((x) => x.label !== label)
        : [...parsed, { label, level: 50 }];
      commit(next);
    };
    const setLevel = (label: string, level: number) => {
      commit(parsed.map((p) => (p.label === label ? { ...p, level } : p)));
    };
    const removeEmo = (label: string) => commit(parsed.filter((x) => x.label !== label));

    const allValid = parsed.length > 0 && parsed.every((p) => p.level > 0);

    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm">Quais emoções apareceram? (pode escolher mais de uma) Defina a intensidade de cada uma (0–100).</p>
          <div className="flex flex-wrap gap-1.5">
            {emocoes.map((e) => (
              <button
                key={e}
                onClick={() => toggleEmo(e)}
                className={`text-sm px-3 py-1.5 rounded-full border-2 font-semibold transition-all ${
                  isSelected(e)
                    ? "bg-orange-500 text-white border-orange-700 shadow"
                    : "bg-card border-border/60 hover:border-border opacity-80"
                }`}
              >
                {e} {isSelected(e) && <span className="ml-1 text-[10px]">✓</span>}
              </button>
            ))}
          </div>

          {parsed.length > 0 && (
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Intensidade por emoção</span>
              {parsed.map((p) => (
                <div key={p.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-orange-900">{p.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-800 tabular-nums">{p.level}/100</span>
                      <button onClick={() => removeEmo(p.label)} className="text-orange-700 hover:text-orange-900 text-lg leading-none" aria-label={`Remover ${p.label}`}>×</button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={p.level}
                    onChange={(ev) => setLevel(p.label, Number(ev.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
              ))}
            </div>
          )}

          <FinishButton disabled={!allValid} label="Termômetro registrado" />
        </div>
      </>
    );
  }

  if (locId === "corpo") {
    const partes = ["🧠 Cabeça", "💗 Peito", "🫁 Respiração", "🤲 Mãos", "🦵 Pernas", "🤢 Estômago", "😬 Mandíbula"];
    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm">Onde essa emoção apareceu no corpo? Como?</p>
          <div className="flex flex-wrap gap-1.5">
            {partes.map((p) => {
              const active = state.corpo.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => update({ corpo: active ? state.corpo.replace(p, "").trim() : (state.corpo + " " + p).trim() })}
                  className={`text-sm px-3 py-1.5 rounded-full border-2 font-semibold ${active ? "bg-red-500 text-white border-red-700" : "bg-card border-border/60 hover:border-border"}`}
                >{p}</button>
              );
            })}
          </div>
          <textarea value={state.corpo} onChange={(e) => update({ corpo: e.target.value })} placeholder="Coração acelerado, peso no peito..." className="min-h-[80px] p-3 rounded-lg border-2 border-border/60 bg-background resize-none focus:outline-none focus:border-primary" />
          <FinishButton disabled={!state.corpo.trim()} label="Corpo mapeado" />
        </div>
      </>
    );
  }

  if (locId === "interrogatorio") {
    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <div className="rounded-lg p-3 bg-muted/60 border-l-4 border-primary text-sm">
            <b>Cena: </b>{state.cena}
          </div>
          <p className="text-sm">Qual foi o pensamento automático que apareceu? Bem rápido, sem filtrar.</p>
          <textarea value={state.thought} onChange={(e) => update({ thought: e.target.value })} placeholder="Ex: Ele tá bravo comigo..." className="min-h-[100px] p-3 rounded-lg border-2 border-border/60 bg-background resize-none focus:outline-none focus:border-primary" />
          <FinishButton disabled={!state.thought.trim()} label="Pensamento capturado" />
        </div>
      </>
    );
  }

  if (locId === "cartas") {
    const toggle = (id: string) => {
      const has = state.selectedDistortions.includes(id);
      update({ selectedDistortions: has ? state.selectedDistortions.filter((d) => d !== id) : [...state.selectedDistortions, id] });
    };
    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <div className="rounded-lg p-3 bg-primary/10 border-l-4 border-primary">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensamento sob suspeita</div>
            <div className="italic font-semibold">"{state.thought}"</div>
          </div>
          <p className="text-sm">Vire as cartas que combinam com esse pensamento:</p>
          <div className="grid grid-cols-2 gap-2">
            {DISTORTIONS.map((d) => {
              const active = state.selectedDistortions.includes(d.id);
              return (
                <button key={d.id} onClick={() => toggle(d.id)} className={`p-2.5 rounded-lg border-2 text-left text-sm font-semibold flex items-center gap-2 transition-all ${active ? "border-primary bg-primary/10 shadow-md" : "border-border/60 bg-card hover:border-border"}`}>
                  <span className="text-xl">{d.emoji}</span>
                  <span className="flex-1">{d.label}</span>
                  {active && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <FinishButton disabled={state.selectedDistortions.length === 0} label="Cartas registradas" />
        </div>
      </>
    );
  }

  if (locId === "evidencias") {
    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm">Hora de pesar as provas reais. O que apoia o pensamento? O que o contraria?</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-destructive">⚖️ A FAVOR</label>
              <textarea value={state.evidenceFor} onChange={(e) => update({ evidenceFor: e.target.value })} placeholder="Fatos que sustentariam o pensamento..." className="min-h-[120px] p-3 rounded-lg border-2 border-destructive/40 bg-background resize-none focus:outline-none focus:border-destructive" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">⚖️ CONTRA</label>
              <textarea value={state.evidenceAgainst} onChange={(e) => update({ evidenceAgainst: e.target.value })} placeholder="Fatos que contrariam o pensamento..." className="min-h-[120px] p-3 rounded-lg border-2 border-primary/40 bg-background resize-none focus:outline-none focus:border-primary" />
            </div>
          </div>
          <FinishButton disabled={!state.evidenceFor.trim() && !state.evidenceAgainst.trim()} label="Evidências coletadas" />
        </div>
      </>
    );
  }

  if (locId === "valores") {
    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm">Nessa situação, o que realmente importa pra você? Que tipo de pessoa você quer ser aqui?</p>
          <textarea value={state.valores} onChange={(e) => update({ valores: e.target.value })} placeholder="Ex: Quero ser alguém que cuida das amizades sem se anular..." className="min-h-[120px] p-3 rounded-lg border-2 border-border/60 bg-background resize-none focus:outline-none focus:border-primary" />
          <FinishButton disabled={!state.valores.trim()} label="Bússola alinhada" />
        </div>
      </>
    );
  }

  if (locId === "reframe") {
    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <div className="rounded-lg p-3 bg-destructive/10 border-l-4 border-destructive">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensamento antigo</div>
            <div className="italic">"{state.thought}"</div>
          </div>
          {state.selectedDistortions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {state.selectedDistortions.map((id) => {
                const d = DISTORTIONS.find((x) => x.id === id)!;
                return <span key={id} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">{d.emoji} {d.label}</span>;
              })}
            </div>
          )}
          <p className="text-sm">Olhando todas as evidências e seus valores, qual é a versão mais justa e equilibrada do pensamento?</p>
          <textarea value={state.reframe} onChange={(e) => update({ reframe: e.target.value })} placeholder="Talvez ele esteja só ocupado..." className="min-h-[120px] p-3 rounded-lg border-2 border-border/60 bg-background resize-none focus:outline-none focus:border-primary" />
          <FinishButton disabled={!state.reframe.trim()} label="Reescrita pronta" />
        </div>
      </>
    );
  }

  if (locId === "plano") {
    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm">Qual é o próximo passo concreto, pequeno e possível, alinhado com seus valores?</p>
          <textarea value={state.plano} onChange={(e) => update({ plano: e.target.value })} placeholder="Ex: Hoje à noite vou mandar um áudio curto perguntando como ele está." className="min-h-[120px] p-3 rounded-lg border-2 border-border/60 bg-background resize-none focus:outline-none focus:border-primary" />
          <FinishButton disabled={!state.plano.trim()} label="Plano traçado" />
        </div>
      </>
    );
  }

  // arquivo
  return (
    <>
      {Header}
      <div className="p-4 flex flex-col gap-3">
        <div className="grid gap-2 text-sm">
          <div className="rounded-lg p-2 bg-muted/60"><b>Cena:</b> {state.cena}</div>
          <div className="rounded-lg p-2 bg-muted/60"><b>Emoção:</b> {state.emocao} ({state.emocaoIntensidade}/100)</div>
          <div className="rounded-lg p-2 bg-destructive/10"><b>Pensamento:</b> "{state.thought}"</div>
          <div className="rounded-lg p-2 bg-primary/10"><b>Reframe:</b> "{state.reframe}"</div>
          <div className="rounded-lg p-2 bg-amber-100"><b>Plano:</b> {state.plano}</div>
        </div>
        <p className="text-sm">Tudo pronto pra arquivar? Esse caso entra pro seu histórico de detetive.</p>
        <FinishButton label="🏆 Arquivar caso" />
      </div>
    </>
  );
}
