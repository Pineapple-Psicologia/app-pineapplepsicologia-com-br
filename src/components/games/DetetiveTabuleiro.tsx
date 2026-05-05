import { useEffect, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, ChevronRight } from "lucide-react";
import DetetiveBoard3D from "./DetetiveBoard3D";
import sceneBg from "@/assets/scene-detetive-tabuleiro.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type LocationId = "cena" | "interrogatorio" | "cartas" | "evidencias" | "arquivo";

const LOCATIONS: {
  id: LocationId;
  name: string;
  emoji: string;
  hint: string;
  color: string; // hex for 3D
  tw: string;    // tailwind bg for status bar
  x: number;
  y: number;
}[] = [
  { id: "cena",           name: "Cena do Crime",          emoji: "🔍", hint: "Descreva o que aconteceu",       color: "#fb7185", tw: "bg-rose-400",    x: 14, y: 82 },
  { id: "interrogatorio", name: "Sala de Interrogatório", emoji: "💭", hint: "Qual pensamento foi flagrado?",  color: "#38bdf8", tw: "bg-sky-400",     x: 32, y: 42 },
  { id: "cartas",         name: "Mesa de Cartas",         emoji: "🃏", hint: "Identifique as armadilhas",      color: "#a78bfa", tw: "bg-violet-400",  x: 56, y: 70 },
  { id: "evidencias",     name: "Sala de Evidências",     emoji: "⚖️", hint: "Pese provas a favor e contra",    color: "#34d399", tw: "bg-emerald-400", x: 78, y: 32 },
  { id: "arquivo",        name: "Arquivo Final",          emoji: "🏆", hint: "Arquive o pensamento reescrito", color: "#fbbf24", tw: "bg-amber-400",   x: 90, y: 78 },
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

type State = {
  currentIdx: number;
  completed: LocationId[];
  cena: string;
  thought: string;
  selectedDistortions: string[];
  evidenceFor: string;
  evidenceAgainst: string;
  reframe: string;
  caseClosed: boolean;
};

const INITIAL: State = {
  currentIdx: 0,
  completed: [],
  cena: "",
  thought: "",
  selectedDistortions: [],
  evidenceFor: "",
  evidenceAgainst: "",
  reframe: "",
  caseClosed: false,
};

export default function DetetiveTabuleiro({ room }: Props) {
  const [state, setState] = useState<State>(INITIAL);
  const [openLoc, setOpenLoc] = useState<LocationId | null>(null);

  useEffect(() => {
    const off = room.on((m) => {
      if (m.type === "detective-board:state") setState(m.payload as State);
      if (m.type === "detective-board:open") setOpenLoc(m.payload as LocationId);
    });
    return off;
  }, [room]);

  const update = (patch: Partial<State>) => {
    const next = { ...state, ...patch };
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
    const completed = state.completed.includes(id) ? state.completed : [...state.completed, id];
    const nextIdx = Math.max(state.currentIdx, idx + 1);
    const isLast = id === "arquivo";
    update({
      completed,
      currentIdx: Math.min(nextIdx, LOCATIONS.length - 1),
      caseClosed: isLast || state.caseClosed,
    });
    setOpenLoc(null);
    room.send("detective-board:open", null);
  };

  const reset = () => {
    setState(INITIAL);
    setOpenLoc(null);
    room.send("detective-board:state", INITIAL);
    room.send("detective-board:open", null);
  };

  const currentLoc = LOCATIONS[state.currentIdx];

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
            Avance pelas casas e desvende o caso! Casa atual: <b>{currentLoc.name}</b>
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={reset} className="bg-white/80 border-amber-700 text-amber-900 hover:bg-white">
          <RotateCcw className="w-4 h-4 mr-1" /> Novo caso
        </Button>
      </header>

      {/* 3D Board over Pixar diorama scene */}
      <div className="relative flex-1 min-h-[480px] rounded-3xl border-[6px] border-amber-900/50 overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
        {/* Pixar diorama background */}
        <img
          src={sceneBg}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />
        {/* warm vignette to blend the 3D board with the scene */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 75%, rgba(254,243,199,0.55) 0%, rgba(254,215,170,0.25) 35%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        <div className="absolute inset-0">
          <DetetiveBoard3D
            locations={LOCATIONS.map((l) => ({
              id: l.id,
              name: l.name,
              emoji: l.emoji,
              color: l.color,
              x: l.x,
              y: l.y,
            }))}
            currentIdx={state.currentIdx}
            completed={state.completed}
            onSelect={(id) => openLocation(id as LocationId)}
          />
        </div>
        <div className="absolute top-2 left-3 text-[10px] font-black tracking-wider bg-white/85 text-amber-900 px-2 py-0.5 rounded-full shadow border border-amber-900/30 pointer-events-none">
          🎲 Arraste para girar · scroll para zoom
        </div>
      </div>

      {/* Status bar */}
      {state.caseClosed ? (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-300 to-yellow-200 border-4 border-amber-600 text-center shadow-lg">
          <div className="text-2xl font-black text-amber-900">🏆 Caso encerrado, Detetive!</div>
          <div className="text-sm mt-1 text-amber-900/90">
            "<b>{state.thought}</b>" virou "<b>{state.reframe}</b>"
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-3 bg-white border-4 border-amber-700/60 flex items-center gap-3 shadow-md">
          <div className={`text-3xl w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white shadow ${currentLoc.tw}`}>
            {currentLoc.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-black tracking-wider text-amber-700">
              Próxima casa · {state.currentIdx + 1}/{LOCATIONS.length}
            </div>
            <div className="font-bold text-sm truncate text-amber-900">{currentLoc.hint}</div>
          </div>
          <Button size="sm" onClick={() => openLocation(currentLoc.id)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
            Jogar <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Modal for active location */}
      {openLoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={closeLocation}
        >
          <div
            className="bg-card rounded-2xl border-2 border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <LocationContent
              locId={openLoc}
              state={state}
              update={update}
              onComplete={() => completeLocation(openLoc)}
              onClose={closeLocation}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LocationContent({
  locId,
  state,
  update,
  onComplete,
  onClose,
}: {
  locId: LocationId;
  state: State;
  update: (p: Partial<State>) => void;
  onComplete: () => void;
  onClose: () => void;
}) {
  const loc = LOCATIONS.find((l) => l.id === locId)!;
  const Header = (
    <div className="p-4 border-b bg-gradient-to-r from-amber-100 to-amber-50 dark:from-stone-800 dark:to-stone-900 rounded-t-2xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-3xl">{loc.emoji}</div>
          <h3 className="text-xl font-bold">{loc.name}</h3>
          <p className="text-xs text-muted-foreground">{loc.hint}</p>
        </div>
        <button onClick={onClose} className="text-2xl text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
    </div>
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
            placeholder="Ex: Mandei mensagem pra um amigo e ele não respondeu o dia todo..."
            className="min-h-[120px] p-3 rounded-lg border-2 border-border/60 bg-background resize-none focus:outline-none focus:border-primary"
          />
          <Button disabled={!state.cena.trim()} onClick={onComplete} className="self-end">
            Cena registrada <Check className="w-4 h-4 ml-1" />
          </Button>
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
          <textarea
            value={state.thought}
            onChange={(e) => update({ thought: e.target.value })}
            placeholder="Ex: Ele tá bravo comigo, não quer mais minha amizade..."
            className="min-h-[100px] p-3 rounded-lg border-2 border-border/60 bg-background resize-none focus:outline-none focus:border-primary"
          />
          <Button disabled={!state.thought.trim()} onClick={onComplete} className="self-end">
            Pensamento capturado <Check className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </>
    );
  }

  if (locId === "cartas") {
    const toggle = (id: string) => {
      const has = state.selectedDistortions.includes(id);
      update({
        selectedDistortions: has
          ? state.selectedDistortions.filter((d) => d !== id)
          : [...state.selectedDistortions, id],
      });
    };
    return (
      <>
        {Header}
        <div className="p-4 flex flex-col gap-3">
          <div className="rounded-lg p-3 bg-primary/10 border-l-4 border-primary">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pensamento sob suspeita
            </div>
            <div className="italic font-semibold">"{state.thought}"</div>
          </div>
          <p className="text-sm">Vire as cartas que combinam com esse pensamento:</p>
          <div className="grid grid-cols-2 gap-2">
            {DISTORTIONS.map((d) => {
              const active = state.selectedDistortions.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggle(d.id)}
                  className={`p-2.5 rounded-lg border-2 text-left text-sm font-semibold flex items-center gap-2 transition-all ${
                    active
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border/60 bg-card hover:border-border"
                  }`}
                >
                  <span className="text-xl">{d.emoji}</span>
                  <span className="flex-1">{d.label}</span>
                  {active && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <Button
            disabled={state.selectedDistortions.length === 0}
            onClick={onComplete}
            className="self-end"
          >
            Cartas registradas <Check className="w-4 h-4 ml-1" />
          </Button>
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
              <label className="text-xs font-bold uppercase tracking-wider text-destructive">
                ⚖️ Evidências A FAVOR
              </label>
              <textarea
                value={state.evidenceFor}
                onChange={(e) => update({ evidenceFor: e.target.value })}
                placeholder="Fatos que sustentariam o pensamento..."
                className="min-h-[120px] p-3 rounded-lg border-2 border-destructive/40 bg-background resize-none focus:outline-none focus:border-destructive"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">
                ⚖️ Evidências CONTRA
              </label>
              <textarea
                value={state.evidenceAgainst}
                onChange={(e) => update({ evidenceAgainst: e.target.value })}
                placeholder="Fatos que contrariam o pensamento..."
                className="min-h-[120px] p-3 rounded-lg border-2 border-primary/40 bg-background resize-none focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <Button
            disabled={!state.evidenceFor.trim() && !state.evidenceAgainst.trim()}
            onClick={onComplete}
            className="self-end"
          >
            Evidências coletadas <Check className="w-4 h-4 ml-1" />
          </Button>
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
          <div className="rounded-lg p-3 bg-destructive/10 border-l-4 border-destructive">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensamento antigo</div>
            <div className="italic">"{state.thought}"</div>
          </div>
          {state.selectedDistortions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {state.selectedDistortions.map((id) => {
                const d = DISTORTIONS.find((x) => x.id === id)!;
                return (
                  <span key={id} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                    {d.emoji} {d.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-sm">Olhando todas as evidências, qual é a versão mais justa e equilibrada do pensamento?</p>
        <textarea
          value={state.reframe}
          onChange={(e) => update({ reframe: e.target.value })}
          placeholder="Talvez ele esteja só ocupado, não significa que..."
          className="min-h-[120px] p-3 rounded-lg border-2 border-border/60 bg-background resize-none focus:outline-none focus:border-primary"
        />
        <Button disabled={!state.reframe.trim()} onClick={onComplete} className="self-end">
          🏆 Arquivar caso
        </Button>
      </div>
    </>
  );
}
