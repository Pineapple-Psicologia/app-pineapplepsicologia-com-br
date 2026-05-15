import { useEffect, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Eraser } from "lucide-react";

type Props = { room: ReturnType<typeof useRoom> };

type EmotionId = "alegria" | "tristeza" | "raiva" | "medo" | "calma" | "nojo" | "amor" | "ansiedade";

type Emotion = {
  id: EmotionId;
  label: string;
  emoji: string;
  color: string; // hex
};

const EMOTIONS: Emotion[] = [
  { id: "alegria", label: "Alegria", emoji: "😄", color: "#f5c518" },
  { id: "tristeza", label: "Tristeza", emoji: "😢", color: "#3b82f6" },
  { id: "raiva", label: "Raiva", emoji: "😠", color: "#ef4444" },
  { id: "medo", label: "Medo", emoji: "😨", color: "#7c3aed" },
  { id: "calma", label: "Calma", emoji: "😌", color: "#22c55e" },
  { id: "nojo", label: "Nojo", emoji: "🤢", color: "#84cc16" },
  { id: "amor", label: "Amor", emoji: "🥰", color: "#ec4899" },
  { id: "ansiedade", label: "Ansiedade", emoji: "😰", color: "#f97316" },
];

type BodyPart = {
  id: string;
  label: string;
  // SVG path data for the body region
  d: string;
};

// Simple front-view silhouette decomposed into clickable regions.
// Coordinates designed for a 200x420 viewBox.
const PARTS: BodyPart[] = [
  // Head
  {
    id: "cabeca",
    label: "Cabeça",
    d: "M100,10 C124,10 140,28 140,52 C140,76 124,94 100,94 C76,94 60,76 60,52 C60,28 76,10 100,10 Z",
  },
  // Neck
  {
    id: "pescoco",
    label: "Pescoço",
    d: "M86,94 L114,94 L116,112 L84,112 Z",
  },
  // Chest (upper torso including shoulders)
  {
    id: "peito",
    label: "Peito",
    d: "M84,112 L116,112 L160,124 L162,170 L38,170 L40,124 Z",
  },
  // Belly
  {
    id: "barriga",
    label: "Barriga",
    d: "M38,170 L162,170 L158,222 L42,222 Z",
  },
  // Pelvis / hips
  {
    id: "quadril",
    label: "Quadril",
    d: "M42,222 L158,222 L154,256 L46,256 Z",
  },
  // Left arm (viewer's left = body's right)
  {
    id: "braco-esq",
    label: "Braço esquerdo",
    d: "M160,124 L182,128 L188,196 L172,200 L162,170 Z",
  },
  // Right arm
  {
    id: "braco-dir",
    label: "Braço direito",
    d: "M40,124 L18,128 L12,196 L28,200 L38,170 Z",
  },
  // Left forearm
  {
    id: "antebraco-esq",
    label: "Antebraço esq.",
    d: "M172,200 L188,196 L194,260 L178,264 Z",
  },
  // Right forearm
  {
    id: "antebraco-dir",
    label: "Antebraço dir.",
    d: "M28,200 L12,196 L6,260 L22,264 Z",
  },
  // Left hand
  {
    id: "mao-esq",
    label: "Mão esquerda",
    d: "M178,264 L194,260 L196,288 L180,292 Z",
  },
  // Right hand
  {
    id: "mao-dir",
    label: "Mão direita",
    d: "M22,264 L6,260 L4,288 L20,292 Z",
  },
  // Left thigh
  {
    id: "coxa-esq",
    label: "Coxa esquerda",
    d: "M100,256 L154,256 L150,326 L104,326 Z",
  },
  // Right thigh
  {
    id: "coxa-dir",
    label: "Coxa direita",
    d: "M46,256 L100,256 L96,326 L50,326 Z",
  },
  // Left shin
  {
    id: "perna-esq",
    label: "Perna esquerda",
    d: "M104,326 L150,326 L146,392 L108,392 Z",
  },
  // Right shin
  {
    id: "perna-dir",
    label: "Perna direita",
    d: "M50,326 L96,326 L92,392 L54,392 Z",
  },
  // Left foot
  {
    id: "pe-esq",
    label: "Pé esquerdo",
    d: "M108,392 L146,392 L150,410 L106,410 Z",
  },
  // Right foot
  {
    id: "pe-dir",
    label: "Pé direito",
    d: "M54,392 L92,392 L94,410 L50,410 Z",
  },
];

type State = {
  selected: EmotionId;
  // partId -> emotionId
  paint: Record<string, EmotionId>;
};

const INITIAL: State = { selected: "alegria", paint: {} };

export default function MapaCorporal({ room }: Props) {
  const [state, setState] = useState<State>(INITIAL);
  const [isPainting, setIsPainting] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);

  useEffect(() => {
    const off = room.on((m) => {
      if (m.type === "mapa:state") setState(m.payload as State);
    });
    return off;
  }, [room]);

  const update = (patch: Partial<State>) => {
    const next = { ...state, ...patch };
    setState(next);
    room.send("mapa:state", next);
  };

  const paintPart = (partId: string) => {
    if (eraseMode) {
      const { [partId]: _removed, ...rest } = state.paint;
      update({ paint: rest });
    } else {
      update({ paint: { ...state.paint, [partId]: state.selected } });
    }
  };

  const reset = () => update({ selected: state.selected, paint: {} });

  const counts = EMOTIONS.map((e) => ({
    ...e,
    count: Object.values(state.paint).filter((v) => v === e.id).length,
  }));

  const selectedEmotion = EMOTIONS.find((e) => e.id === state.selected)!;

  return (
    <div className="h-full w-full flex flex-col gap-3">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3 bg-card border-2 rounded-2xl px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">🧍</span>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold leading-tight">Mapa Corporal das Emoções</h2>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Pinte onde sente cada emoção no corpo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={eraseMode ? "default" : "outline"}
            onClick={() => setEraseMode((v) => !v)}
            title="Borracha"
          >
            <Eraser className="w-4 h-4 mr-1" /> {eraseMode ? "Borracha ativa" : "Borracha"}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Limpar
          </Button>
        </div>
      </header>

      {/* Emotion palette */}
      <div className="bg-card border-2 rounded-2xl p-3 shadow-sm">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
          Escolha uma emoção
        </div>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((e) => {
            const active = e.id === state.selected && !eraseMode;
            return (
              <button
                key={e.id}
                onClick={() => {
                  setEraseMode(false);
                  update({ selected: e.id });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  active ? "scale-110 shadow-md" : "hover:scale-105 opacity-80"
                }`}
                style={{
                  backgroundColor: active ? e.color : `${e.color}22`,
                  borderColor: e.color,
                  color: active ? "#fff" : "#111",
                }}
              >
                <span className="text-base">{e.emoji}</span>
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body + legend */}
      <div className="flex-1 grid lg:grid-cols-[1fr_280px] gap-3 min-h-0">
        {/* Body canvas */}
        <div
          className="relative bg-gradient-to-b from-sky-50 to-violet-50 border-2 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden p-3"
          onMouseUp={() => setIsPainting(false)}
          onMouseLeave={() => setIsPainting(false)}
          onTouchEnd={() => setIsPainting(false)}
        >
          <svg
            viewBox="0 0 200 420"
            className="h-full w-auto max-h-[60vh] select-none touch-none"
            style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.12))" }}
          >
            {/* Body outline halo */}
            <g>
              {PARTS.map((p) => (
                <path key={`${p.id}-shadow`} d={p.d} fill="#ffffff" />
              ))}
            </g>
            {/* Painted regions */}
            {PARTS.map((p) => {
              const emotionId = state.paint[p.id];
              const fill = emotionId ? EMOTIONS.find((e) => e.id === emotionId)!.color : "#f3eee7";
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill={fill}
                  stroke="#1f2937"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  className="cursor-pointer transition-colors"
                  style={{ opacity: emotionId ? 0.92 : 1 }}
                  onMouseDown={() => {
                    setIsPainting(true);
                    paintPart(p.id);
                  }}
                  onMouseEnter={() => {
                    if (isPainting) paintPart(p.id);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setIsPainting(true);
                    paintPart(p.id);
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (el && el.tagName === "path") {
                      const id = (el as SVGPathElement).getAttribute("data-part");
                      if (id) paintPart(id);
                    }
                  }}
                  data-part={p.id}
                >
                  <title>{p.label}</title>
                </path>
              );
            })}
            {/* Subtle face hint */}
            <g opacity="0.35" stroke="#1f2937" strokeWidth="1.2" fill="none" strokeLinecap="round">
              <circle cx="86" cy="48" r="2" fill="#1f2937" />
              <circle cx="114" cy="48" r="2" fill="#1f2937" />
              <path d="M88,68 Q100,76 112,68" />
            </g>
          </svg>

          {/* Active tool indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-card/90 backdrop-blur rounded-full border-2 px-3 py-1 text-xs font-semibold shadow">
            <span
              className="w-3 h-3 rounded-full border"
              style={{
                backgroundColor: eraseMode ? "transparent" : selectedEmotion.color,
                borderColor: eraseMode ? "#9ca3af" : selectedEmotion.color,
              }}
            />
            {eraseMode ? "Apagando" : `${selectedEmotion.emoji} ${selectedEmotion.label}`}
          </div>
        </div>

        {/* Legend */}
        <aside className="bg-card border-2 rounded-2xl p-3 shadow-sm flex flex-col gap-2 overflow-auto">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Mapa de sensações
          </div>
          <div className="grid gap-1.5">
            {counts
              .filter((c) => c.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-4 h-4 rounded-full border-2 shrink-0"
                    style={{ backgroundColor: c.color, borderColor: c.color }}
                  />
                  <span className="flex-1 truncate">
                    {c.emoji} {c.label}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {c.count} {c.count === 1 ? "região" : "regiões"}
                  </span>
                </div>
              ))}
            {Object.keys(state.paint).length === 0 && (
              <p className="text-xs text-muted-foreground leading-snug">
                Toque ou arraste sobre o corpo para pintar onde você sente cada emoção. Use a
                borracha para desfazer uma região.
              </p>
            )}
          </div>
          <div className="mt-auto pt-2 border-t text-[11px] text-muted-foreground leading-snug">
            <strong className="text-foreground">Dica:</strong> não existe resposta certa. O corpo
            sente do jeito dele. Você pode pintar a mesma região com cores diferentes ao longo da
            sessão.
          </div>
        </aside>
      </div>
    </div>
  );
}
