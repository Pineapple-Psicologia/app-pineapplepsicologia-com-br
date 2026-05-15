import { useEffect, useMemo, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Eye, RotateCcw, Search, Sparkles, Volume2, VolumeX } from "lucide-react";
import salaImg from "@/assets/lentes-sala.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type LensId = "neutra" | "vergonha" | "catastrofe" | "curiosa";

type Lens = {
  id: LensId;
  label: string;
  short: string;
  color: string;
  ring: string;
  emoji: string;
  description: string;
  audio: string;
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
    audio: "Burburinho ambiente da sala, neutro.",
  },
  {
    id: "vergonha",
    label: "Lente da vergonha",
    short: "‘Estão rindo de mim’",
    color: "#b85c7a",
    ring: "#7a3450",
    emoji: "🫣",
    description: "Pequenos sinais ficam enormes. A atenção dos outros parece sempre voltada pra você.",
    audio: "Sons abafados, eco interno, batimento cardíaco subindo.",
  },
  {
    id: "catastrofe",
    label: "Lente da catástrofe",
    short: "‘Vai dar tudo errado’",
    color: "#7a3a2a",
    ring: "#4a1f15",
    emoji: "🌩️",
    description: "Qualquer detalhe vira o começo de algo terrível. O futuro escurece.",
    audio: "Trilha tensa, distorção grave, silêncio nas vozes.",
  },
  {
    id: "curiosa",
    label: "Lente curiosa",
    short: "‘O que será que aconteceu?’",
    color: "#7a8a3a",
    ring: "#4a5a2a",
    emoji: "🔍",
    description: "A cena vira um quebra-cabeça aberto. Você procura contexto antes de concluir.",
    audio: "Sons claros, conversas inteligíveis, leveza.",
  },
];

const lensById = (id: LensId) => LENSES.find((l) => l.id === id)!;

// ---------- Cena: sala de aula. 4 NPCs + protagonista entrando pela porta. ----------
type NpcId = "ana" | "bruno" | "clara" | "diego";

type NpcView = {
  expression: string; // emoji shown above head
  thoughtPerLens: Record<LensId, string>;
  // What they are *actually* doing (revealed by investigating clues)
  truth: string;
};

const NPCS: Record<NpcId, { name: string; x: number; y: number; color: string; view: NpcView }> = {
  ana: {
    name: "Ana",
    x: 33,
    y: 60,
    color: "#c98a5b",
    view: {
      expression: "😂",
      thoughtPerLens: {
        neutra: "Ana está rindo olhando pro celular.",
        vergonha: "Ana riu assim que você entrou. Deve ser de você.",
        catastrofe: "Se ela está rindo, com certeza fez piada com você. Amanhã a turma toda vai saber.",
        curiosa: "Ana segura o celular. Será que viu algo engraçado?",
      },
      truth: "Está vendo um vídeo de gato no celular há 10 minutos.",
    },
  },
  bruno: {
    name: "Bruno",
    x: 43,
    y: 53,
    color: "#5b8ac9",
    view: {
      expression: "😄",
      thoughtPerLens: {
        neutra: "Bruno ri junto da Ana, olhando a mesma tela.",
        vergonha: "Bruno olhou pra você e depois riu. Foi de você.",
        catastrofe: "Os dois estão combinando alguma humilhação.",
        curiosa: "Bruno também está olhando o celular da Ana. Riram da mesma coisa.",
      },
      truth: "Está vendo o mesmo vídeo da Ana, debruçado na carteira dela.",
    },
  },
  clara: {
    name: "Clara",
    x: 53,
    y: 55,
    color: "#9b6bb5",
    view: {
      expression: "🙂",
      thoughtPerLens: {
        neutra: "Clara está organizando o caderno.",
        vergonha: "Clara fingiu não ver você entrar. Te ignorou.",
        catastrofe: "Ela vai contar pra todo mundo que você chegou esquisito.",
        curiosa: "Clara parece concentrada. Talvez nem tenha notado a porta abrir.",
      },
      truth: "Está copiando a matéria que perdeu ontem, totalmente focada.",
    },
  },
  diego: {
    name: "Diego",
    x: 78,
    y: 58,
    color: "#4a8a6b",
    view: {
      expression: "😐",
      thoughtPerLens: {
        neutra: "Diego olhou pra porta quando você entrou.",
        vergonha: "Diego encarou você. Reparou em tudo.",
        catastrofe: "Aquele olhar foi de quem viu alguma coisa muito errada em você.",
        curiosa: "Diego olhou pra porta como qualquer pessoa olha quando ouve barulho.",
      },
      truth: "Estava esperando a professora, achou que você fosse ela.",
    },
  },
};

const CLUE_POSITIONS = {
  celular: { x: 32, y: 78 },
  caderno: { x: 80, y: 82 },
  porta: { x: 6, y: 50 },
  relogio: { x: 57, y: 18 },
} as const;

// ---------- Pistas investigáveis: cada uma revela contexto e adiciona "clareza". ----------
type Clue = {
  id: string;
  label: string;
  x: number; // % within scene
  y: number;
  reveals: string;
};

const CLUES: Clue[] = [
  { id: "celular", label: "Celular da Ana", x: CLUE_POSITIONS.celular.x, y: CLUE_POSITIONS.celular.y, reveals: "É um vídeo de gato caindo da estante. Ana mostrou pro Bruno antes de você entrar." },
  { id: "caderno", label: "Caderno da Clara", x: CLUE_POSITIONS.caderno.x, y: CLUE_POSITIONS.caderno.y, reveals: "‘Matéria de ontem — copiar antes da prof chegar’. Ela está atrasada com a matéria, não com você." },
  { id: "porta", label: "Barulho da porta", x: CLUE_POSITIONS.porta.x, y: CLUE_POSITIONS.porta.y, reveals: "A porta range alto. Quase todo mundo olha quando alguém entra — é reflexo, não julgamento." },
  { id: "relogio", label: "Relógio da sala", x: CLUE_POSITIONS.relogio.x, y: CLUE_POSITIONS.relogio.y, reveals: "Faltam 2 minutos pra aula. A turma está dispersa, cada um no seu canto." },
];

// ---------- Estado sincronizado ----------
type State = {
  lens: LensId;
  intensity: Record<LensId, number>; // 0..3
  clarity: number; // 0..CLUES.length
  revealedClues: string[];
  log: { lens: LensId; at: number }[];
};

const initialState: State = {
  lens: "neutra",
  intensity: { neutra: 0, vergonha: 0, catastrofe: 0, curiosa: 0 },
  clarity: 0,
  revealedClues: [],
  log: [],
};

export default function EntreLentes({ room }: Props) {
  const [state, setState] = useState<State>(initialState);
  const [muted, setMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobCache = useRef<Map<LensId, string>>(new Map());

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "lentes:state") setState(m.payload);
    });
  }, [room]);

  // Load + play SFX whenever the lens changes
  useEffect(() => {
    let cancelled = false;
    const lensId = state.lens;
    (async () => {
      try {
        let url = blobCache.current.get(lensId);
        if (!url) {
          const res = await fetch(`/api/lentes-sfx?lens=${lensId}`);
          if (!res.ok) return;
          const blob = await res.blob();
          url = URL.createObjectURL(blob);
          blobCache.current.set(lensId, url);
        }
        if (cancelled) return;
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.loop = true;
          audioRef.current.volume = 0.55;
        }
        const a = audioRef.current;
        if (a.src !== url) {
          a.src = url;
        }
        a.muted = muted;
        try {
          await a.play();
          setAudioReady(true);
        } catch {
          // Browser blocked autoplay — wait for user gesture
          setAudioReady(false);
        }
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.lens, muted]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      blobCache.current.forEach((u) => URL.revokeObjectURL(u));
      blobCache.current.clear();
    };
  }, []);

  const tryStartAudio = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setAudioReady(true);
    } catch {
      /* still blocked */
    }
  };

  const update = (patch: Partial<State> | ((s: State) => State)) => {
    setState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      room.send("lentes:state", next);
      return next;
    });
  };

  const equipLens = (id: LensId) => {
    update((s) => {
      const bumped = id === "neutra" ? s.intensity[id] : Math.min(3, s.intensity[id] + 1);
      // Curious lens slightly "cleans" itself by adding clarity gently
      const bonusClarity = id === "curiosa" ? Math.min(CLUES.length, s.clarity + (s.clarity < CLUES.length ? 0 : 0)) : s.clarity;
      return {
        ...s,
        lens: id,
        intensity: { ...s.intensity, [id]: bumped },
        clarity: bonusClarity,
        log: [...s.log.slice(-5), { lens: id, at: Date.now() }],
      };
    });
  };

  const investigate = (clueId: string) => {
    update((s) => {
      if (s.revealedClues.includes(clueId)) return s;
      const revealed = [...s.revealedClues, clueId];
      // Each clue reduces intensity of the currently equipped *distorting* lens
      const decayable: LensId[] = ["vergonha", "catastrofe"];
      const intensity = { ...s.intensity };
      for (const k of decayable) intensity[k] = Math.max(0, intensity[k] - 1);
      return {
        ...s,
        revealedClues: revealed,
        clarity: Math.min(CLUES.length, s.clarity + 1),
        intensity,
      };
    });
  };

  const reset = () => update(() => initialState);

  const lens = lensById(state.lens);
  const intensity = state.intensity[state.lens];

  // Visual envelope: filter, vignette and shake derived from lens + intensity
  const sceneStyle = useMemo<React.CSSProperties>(() => {
    const t = intensity / 3;
    const clarityT = state.clarity / CLUES.length;
    const dampen = 1 - clarityT * 0.55; // clarity softens distortion
    if (state.lens === "neutra") {
      return { filter: "saturate(1) contrast(1)" };
    }
    if (state.lens === "curiosa") {
      return { filter: `saturate(${1 + t * 0.15}) brightness(${1 + t * 0.05})` };
    }
    if (state.lens === "vergonha") {
      const desat = 1 - t * 0.55 * dampen;
      const blur = t * 1.4 * dampen;
      return {
        filter: `saturate(${desat}) blur(${blur}px) brightness(${1 - t * 0.18 * dampen})`,
      };
    }
    // catastrofe
    const contrast = 1 + t * 0.45 * dampen;
    return {
      filter: `contrast(${contrast}) saturate(${1 - t * 0.25 * dampen}) hue-rotate(${-t * 12 * dampen}deg) brightness(${1 - t * 0.22 * dampen})`,
    };
  }, [state.lens, intensity, state.clarity]);

  const vignetteAlpha = state.lens === "neutra" || state.lens === "curiosa"
    ? 0
    : Math.min(0.78, (intensity / 3) * 0.8 * (1 - (state.clarity / CLUES.length) * 0.6));

  const tintColor = state.lens === "vergonha"
    ? "rgba(184,92,122,VAR)"
    : state.lens === "catastrofe"
      ? "rgba(40,15,10,VAR)"
      : "rgba(0,0,0,VAR)";

  return (
    <div className="h-full w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 text-stone-800">
      {/* ---------------- SCENE ---------------- */}
      <div className="relative rounded-2xl overflow-hidden border-4 border-[#4a5a2a]/30 shadow-[0_20px_50px_-15px_rgba(40,50,20,0.45)] bg-[#e9ead4]">
        <div className="absolute inset-0 transition-[filter] duration-700" style={sceneStyle}>
          <img
            src={salaImg}
            alt="Sala de aula em estilo Pixar com colegas rindo, escrevendo e olhando para a porta"
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

        {/* NPC thoughts overlay */}
        {(Object.keys(NPCS) as NpcId[]).map((id) => {
          const npc = NPCS[id];
          const text = state.revealedClues.length >= 2 && state.lens !== "vergonha" && state.lens !== "catastrofe"
            ? npc.view.truth
            : npc.view.thoughtPerLens[state.lens];
          return (
            <div
              key={id}
              className="absolute -translate-x-1/2 -translate-y-full max-w-[180px]"
              style={{ left: `${npc.x}%`, top: `${npc.y - 8}%` }}
            >
              <div className="rounded-2xl bg-white/95 border border-[#4a5a2a]/25 px-3 py-1.5 text-[11px] leading-snug shadow-md">
                <div className="font-bold text-[#4a5a2a]">{npc.name}</div>
                <div className="text-stone-700">{text}</div>
              </div>
              <div className="w-2 h-2 bg-white/95 rotate-45 mx-auto -mt-1 border-r border-b border-[#4a5a2a]/25" />
            </div>
          );
        })}

        {/* Internal protagonist thought */}
        <div className="absolute left-1/2 bottom-4 -translate-x-1/2 max-w-[80%] text-center">
          <div className="inline-block rounded-full px-4 py-2 bg-black/70 text-white text-sm italic backdrop-blur">
            {protagonistThought(state.lens, intensity, state.clarity)}
          </div>
        </div>

        {/* Audio cue chip */}
        <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-black/55 text-white text-[11px] px-3 py-1.5 backdrop-blur">
          <Volume2 className="w-3.5 h-3.5" /> {lens.audio}
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
          <div className="text-[10px] uppercase tracking-widest opacity-80">Cena</div>
          <h2 className="font-bold text-lg leading-tight">Sala de aula · você acabou de entrar</h2>
          <p className="text-xs opacity-90 mt-1">Algumas pessoas riem. O mesmo momento muda dependendo da lente que você equipa.</p>
        </header>

        <section className="rounded-2xl bg-white border border-[#4a5a2a]/20 p-3 shadow-sm">
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
          <ul className="mt-2 space-y-1 text-[11px]">
            {CLUES.map((c) => {
              const found = state.revealedClues.includes(c.id);
              return (
                <li key={c.id} className={`rounded-md px-2 py-1 ${found ? "bg-[#eef0d4] text-stone-700" : "text-stone-400"}`}>
                  <span className="font-semibold">{found ? "✓" : "○"} {c.label}</span>
                  {found && <span className="block text-stone-600 italic">{c.reveals}</span>}
                </li>
              );
            })}
          </ul>
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

function protagonistThought(lens: LensId, intensity: number, clarity: number): string {
  if (lens === "neutra") return "Entrei na sala. Algumas pessoas riram em algum momento.";
  if (lens === "curiosa") {
    if (clarity >= 2) return "Faz sentido. Cada um tava no seu mundo. A risada não era sobre mim.";
    return "Hum, será que riram de algo no celular? Vou olhar antes de concluir.";
  }
  if (lens === "vergonha") {
    if (clarity >= 3) return "Ainda incomoda um pouco… mas dá pra ver que não era de mim.";
    if (intensity >= 3) return "Todo mundo notou. Eu não devia ter entrado assim.";
    if (intensity === 2) return "Acho que estão olhando pra mim. Que vergonha.";
    return "Será que riram de mim?";
  }
  // catastrofe
  if (clarity >= 3) return "Ok, talvez não fosse o fim do mundo. Respira.";
  if (intensity >= 3) return "Amanhã a escola toda vai saber. Acabou.";
  if (intensity === 2) return "Isso vai virar uma fofoca enorme.";
  return "E se isso ficar pra sempre?";
}

// ---------------- Classroom illustration (pure SVG, olive palette) ----------------
function ClassroomSvg({ lens, revealedClues }: { lens: LensId; revealedClues: string[] }) {
  const npcExpression = (id: NpcId): string => {
    const base = NPCS[id].view.expression;
    if (lens === "vergonha") return id === "diego" ? "👀" : id === "clara" ? "🙄" : "😆";
    if (lens === "catastrofe") return id === "diego" ? "😠" : "😈";
    if (lens === "curiosa") return base;
    return base;
  };

  return (
    <svg viewBox="0 0 800 500" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      {/* Floor */}
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9ead4" />
          <stop offset="100%" stopColor="#cdd0a3" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a89b6c" />
          <stop offset="100%" stopColor="#7a6f48" />
        </linearGradient>
        <linearGradient id="board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4a25" />
          <stop offset="100%" stopColor="#2a3a18" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="800" height="320" fill="url(#wall)" />
      <rect x="0" y="320" width="800" height="180" fill="url(#floor)" />

      {/* Window */}
      <g>
        <rect x="540" y="60" width="180" height="120" fill="#cfe6e8" stroke="#4a5a2a" strokeWidth="4" />
        <line x1="630" y1="60" x2="630" y2="180" stroke="#4a5a2a" strokeWidth="3" />
        <line x1="540" y1="120" x2="720" y2="120" stroke="#4a5a2a" strokeWidth="3" />
        <circle cx="700" cy="85" r="14" fill="#f4d27a" opacity="0.9" />
      </g>

      {/* Blackboard */}
      <g>
        <rect x="180" y="50" width="300" height="130" rx="6" fill="url(#board)" stroke="#1f2a10" strokeWidth="4" />
        <text x="200" y="100" fill="#d8e3b4" fontFamily="ui-sans-serif" fontSize="18" fontWeight="700">
          Aula 12 — Frações
        </text>
        <text x="200" y="135" fill="#d8e3b4" fontFamily="ui-sans-serif" fontSize="14">
          Hoje: somar denominadores diferentes
        </text>
      </g>

      {/* Wall clock */}
      <g>
        <circle cx="440" cy="90" r="22" fill="#fafaef" stroke="#4a5a2a" strokeWidth="3" />
        <line x1="440" y1="90" x2="440" y2="74" stroke="#4a5a2a" strokeWidth="2.5" />
        <line x1="440" y1="90" x2="452" y2="92" stroke="#4a5a2a" strokeWidth="2" />
      </g>

      {/* Door (left) */}
      <g>
        <rect x="40" y="140" width="80" height="180" rx="4" fill="#7a6f48" stroke="#4a3f20" strokeWidth="4" />
        <circle cx="105" cy="235" r="4" fill="#3a3018" />
        {/* Protagonist silhouette in the doorway */}
        <g transform="translate(80,250)">
          <circle cx="0" cy="-30" r="16" fill="#f1c79b" stroke="#4a3a20" strokeWidth="2" />
          <path d="M-14,-44 q14,-12 28,0 q-2,-8 -14,-10 q-12,2 -14,10z" fill="#3a2a18" />
          <rect x="-16" y="-15" width="32" height="40" rx="6" fill="#7a8a3a" stroke="#4a5a2a" strokeWidth="2" />
          <rect x="-18" y="20" width="36" height="20" rx="4" fill="#3a3a2a" />
          <text x="0" y="-58" textAnchor="middle" fontSize="16">😶</text>
        </g>
      </g>

      {/* Desks + NPCs */}
      {(Object.keys(NPCS) as NpcId[]).map((id) => {
        const n = NPCS[id];
        const cx = (n.x / 100) * 800;
        const cy = (n.y / 100) * 500;
        return (
          <g key={id} transform={`translate(${cx},${cy})`}>
            {/* desk */}
            <rect x="-44" y="20" width="88" height="40" rx="4" fill="#a89b6c" stroke="#5a4f2a" strokeWidth="2" />
            <rect x="-44" y="55" width="88" height="6" fill="#5a4f2a" />
            {/* body */}
            <rect x="-22" y="-8" width="44" height="36" rx="6" fill={n.color} stroke="#2a2a1a" strokeWidth="2" />
            {/* head */}
            <circle cx="0" cy="-26" r="18" fill="#f1c79b" stroke="#2a2a1a" strokeWidth="2" />
            {/* hair */}
            <path d="M-16,-38 q16,-14 32,0 q-2,-10 -16,-12 q-14,2 -16,12z" fill="#3a2a18" />
            {/* face emoji */}
            <text x="0" y="-22" textAnchor="middle" fontSize="22">{npcExpression(id)}</text>
            {/* name tag */}
            <text x="0" y="78" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2a2a1a">{n.name}</text>
          </g>
        );
      })}

      {/* Little props that respond to clues */}
      {revealedClues.includes("celular") && (
        <g transform="translate(176,304)">
          <rect x="0" y="0" width="22" height="34" rx="4" fill="#1f2a10" />
          <rect x="2" y="2" width="18" height="26" fill="#b9c66a" />
          <text x="11" y="22" textAnchor="middle" fontSize="12">🐱</text>
        </g>
      )}
      {revealedClues.includes("caderno") && (
        <g transform="translate(528,316)">
          <rect x="0" y="0" width="44" height="30" fill="#fafaef" stroke="#4a5a2a" strokeWidth="2" />
          <line x1="4" y1="10" x2="40" y2="10" stroke="#9aa063" />
          <line x1="4" y1="18" x2="40" y2="18" stroke="#9aa063" />
          <line x1="4" y1="26" x2="40" y2="26" stroke="#9aa063" />
        </g>
      )}
    </svg>
  );
}
