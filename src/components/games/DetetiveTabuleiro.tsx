import { useEffect, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, ChevronRight, Lock } from "lucide-react";

type Props = { room: ReturnType<typeof useRoom> };

type LocationId = "cena" | "interrogatorio" | "cartas" | "evidencias" | "arquivo";

const LOCATIONS: {
  id: LocationId;
  name: string;
  emoji: string;
  hint: string;
  color: string; // tailwind bg color for tile
  ring: string;  // ring color
  x: number;
  y: number;
}[] = [
  { id: "cena",           name: "Cena do Crime",         emoji: "🔍", hint: "Descreva o que aconteceu",        color: "bg-rose-400",    ring: "ring-rose-600",    x: 14, y: 82 },
  { id: "interrogatorio", name: "Sala de Interrogatório", emoji: "💭", hint: "Qual pensamento foi flagrado?",   color: "bg-sky-400",     ring: "ring-sky-600",     x: 32, y: 42 },
  { id: "cartas",         name: "Mesa de Cartas",        emoji: "🃏", hint: "Identifique as armadilhas",       color: "bg-violet-400",  ring: "ring-violet-600",  x: 56, y: 70 },
  { id: "evidencias",     name: "Sala de Evidências",    emoji: "⚖️", hint: "Pese provas a favor e contra",     color: "bg-emerald-400", ring: "ring-emerald-600", x: 78, y: 32 },
  { id: "arquivo",        name: "Arquivo Final",         emoji: "🏆", hint: "Arquive o pensamento reescrito",  color: "bg-amber-400",   ring: "ring-amber-600",   x: 90, y: 78 },
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
  const pawn = currentLoc;

  // Build path string between locations
  const pathD = LOCATIONS.map((l, i) => `${i === 0 ? "M" : "L"} ${l.x} ${l.y}`).join(" ");

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

      {/* Board – perspective wrapper */}
      <div
        className="relative flex-1 min-h-[480px] rounded-3xl"
        style={{ perspective: "1100px", perspectiveOrigin: "50% 30%" }}
      >
        <div
          className="absolute inset-0 rounded-3xl border-[6px] border-amber-900/50 overflow-hidden"
          style={{
            transform: "rotateX(38deg) scale(1.02)",
            transformOrigin: "50% 60%",
            backgroundImage:
              "radial-gradient(ellipse at 25% 30%, #a7f3d0 0%, transparent 40%), radial-gradient(ellipse at 75% 70%, #fecaca 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, #fef3c7 0%, transparent 60%), linear-gradient(135deg, #fef9c3 0%, #fce7f3 100%)",
            boxShadow:
              "0 30px 60px -20px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -10px 20px rgba(120,53,15,0.18)",
          }}
        >
          {/* wood grain overlay */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(120,53,15,0.05) 0 2px, transparent 2px 6px), repeating-linear-gradient(0deg, rgba(120,53,15,0.04) 0 1px, transparent 1px 4px)",
            }}
          />
          {/* confetti dots */}
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #f472b6 1.5px, transparent 1.5px), radial-gradient(circle, #60a5fa 1.5px, transparent 1.5px), radial-gradient(circle, #34d399 1.5px, transparent 1.5px)",
              backgroundSize: "40px 40px, 60px 60px, 80px 80px",
              backgroundPosition: "0 0, 20px 20px, 40px 10px",
            }}
          />

          {/* corners */}
          <div className="absolute top-2 left-3 text-2xl rotate-[-12deg] drop-shadow">🎯</div>
          <div className="absolute top-2 right-3 text-2xl rotate-[12deg] drop-shadow">🎲</div>
          <div className="absolute bottom-2 left-3 text-2xl drop-shadow">🧭</div>
          <div className="absolute bottom-2 right-3 text-2xl drop-shadow">🏁</div>

          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <path d={pathD} fill="none" stroke="#78350f" strokeWidth="2.4" strokeLinecap="round" opacity="0.25" />
            <path
              d={pathD}
              fill="none"
              stroke="#fff"
              strokeWidth="1.6"
              strokeDasharray="2 1.6"
              strokeLinecap="round"
              opacity="0.95"
            />
            {state.completed.length > 0 && (
              <path
                d={LOCATIONS.slice(0, state.completed.length + 1)
                  .map((l, i) => `${i === 0 ? "M" : "L"} ${l.x} ${l.y}`)
                  .join(" ")}
                fill="none"
                stroke="#16a34a"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.9"
              />
            )}
          </svg>
        </div>

        {/* 3D pieces float above the tilted board (counter-rotated so they look upright) */}
        <div
          className="absolute inset-0"
          style={{
            transform: "rotateX(38deg) scale(1.02)",
            transformStyle: "preserve-3d",
            transformOrigin: "50% 60%",
          }}
        >
          {LOCATIONS.map((loc, i) => {
            const done = state.completed.includes(loc.id);
            const unlocked = i <= state.currentIdx;
            const isCurrent = i === state.currentIdx && !done;
            return (
              <button
                key={loc.id}
                disabled={!unlocked}
                onClick={() => openLocation(loc.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                  unlocked ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                }`}
                style={{
                  left: `${loc.x}%`,
                  top: `${loc.y}%`,
                  transform: "translate(-50%, -50%) rotateX(-38deg) translateZ(18px)",
                  transition: "transform 200ms",
                }}
                onMouseEnter={(e) => {
                  if (unlocked)
                    e.currentTarget.style.transform =
                      "translate(-50%, -50%) rotateX(-38deg) translateZ(28px) scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform =
                    "translate(-50%, -50%) rotateX(-38deg) translateZ(18px)";
                }}
              >
                <div className="relative">
                  {/* drop shadow on board */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-14 h-3 bg-black/40 rounded-[50%] blur-md" />
                  {/* chunky 3D side stack */}
                  <div className={`absolute inset-0 translate-y-2 rounded-2xl ${loc.color} brightness-50`} />
                  <div className={`absolute inset-0 translate-y-1.5 rounded-2xl ${loc.color} brightness-75`} />
                  <div className={`absolute inset-0 translate-y-1 rounded-2xl ${loc.color} brightness-90`} />
                  {/* top face */}
                  <div
                    className={`relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl flex flex-col items-center justify-center border-[3px] border-white ${
                      done ? "bg-green-500" : loc.color
                    } ${isCurrent ? `ring-4 ${loc.ring} animate-pulse` : ""}`}
                    style={{
                      boxShadow:
                        "inset 0 4px 8px rgba(255,255,255,0.45), inset 0 -4px 8px rgba(0,0,0,0.18), 0 6px 12px rgba(0,0,0,0.25)",
                    }}
                  >
                    <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white border-2 border-amber-900 text-amber-900 text-[11px] font-black flex items-center justify-center shadow-md">
                      {i + 1}
                    </div>
                    {done ? (
                      <Check className="w-7 h-7 text-white drop-shadow" strokeWidth={3} />
                    ) : !unlocked ? (
                      <Lock className="w-5 h-5 text-white/90" />
                    ) : (
                      <span className="text-3xl md:text-[34px] drop-shadow-md">{loc.emoji}</span>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap text-[10px] md:text-xs font-black bg-white text-amber-900 px-2 py-0.5 rounded-full shadow-lg border border-amber-900/30">
                    {loc.name}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Detective pawn — 3D, lifted off the board */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
            style={{
              left: `${pawn.x}%`,
              top: `${pawn.y - 8}%`,
              transform: "translate(-50%, -50%) rotateX(-38deg) translateZ(60px)",
              transition: "left 700ms ease-out, top 700ms ease-out",
            }}
          >
            <div className="relative">
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-8 h-2 bg-black/45 rounded-[50%] blur-md" />
              <div className="text-5xl md:text-6xl drop-shadow-[0_8px_6px_rgba(0,0,0,0.4)] animate-bounce">🕵️</div>
            </div>
          </div>
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
          <div className={`text-3xl w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white shadow ${currentLoc.color}`}>
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
