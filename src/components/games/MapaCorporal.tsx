import { useEffect, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Eraser } from "lucide-react";
import personagem from "@/assets/mapa-personagem.png";

type Props = { room: ReturnType<typeof useRoom> };

type ItemKind = "emocao" | "sensacao";

type PaletteItem = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  kind: ItemKind;
};

const EMOCOES: PaletteItem[] = [
  { id: "alegria", label: "Alegria", emoji: "😄", color: "#f5c518", kind: "emocao" },
  { id: "tristeza", label: "Tristeza", emoji: "😢", color: "#3b82f6", kind: "emocao" },
  { id: "raiva", label: "Raiva", emoji: "😠", color: "#ef4444", kind: "emocao" },
  { id: "medo", label: "Medo", emoji: "😨", color: "#7c3aed", kind: "emocao" },
  { id: "calma", label: "Calma", emoji: "😌", color: "#22c55e", kind: "emocao" },
  { id: "amor", label: "Amor", emoji: "🥰", color: "#ec4899", kind: "emocao" },
  { id: "nojo", label: "Nojo", emoji: "🤢", color: "#84cc16", kind: "emocao" },
  { id: "vergonha", label: "Vergonha", emoji: "🫣", color: "#fb7185", kind: "emocao" },
];

const SENSACOES: PaletteItem[] = [
  { id: "falta-ar", label: "Falta de ar", emoji: "🫁", color: "#0ea5e9", kind: "sensacao" },
  { id: "coracao", label: "Coração acelerado", emoji: "💓", color: "#e11d48", kind: "sensacao" },
  { id: "no-garganta", label: "Nó na garganta", emoji: "😮‍💨", color: "#a855f7", kind: "sensacao" },
  { id: "dor-barriga", label: "Dor de barriga", emoji: "🤢", color: "#65a30d", kind: "sensacao" },
  { id: "tensao", label: "Tensão muscular", emoji: "💪", color: "#b91c1c", kind: "sensacao" },
  { id: "tremor", label: "Tremor / formigamento", emoji: "🫨", color: "#0891b2", kind: "sensacao" },
  { id: "calor", label: "Calor / rosto quente", emoji: "🥵", color: "#f97316", kind: "sensacao" },
  { id: "frio", label: "Suor frio / arrepio", emoji: "🥶", color: "#60a5fa", kind: "sensacao" },
  { id: "tontura", label: "Tontura", emoji: "😵‍💫", color: "#c026d3", kind: "sensacao" },
  { id: "peso", label: "Peso / cansaço", emoji: "🪨", color: "#78716c", kind: "sensacao" },
];

const ALL_ITEMS = [...EMOCOES, ...SENSACOES];
const itemById = (id: string) => ALL_ITEMS.find((i) => i.id === id);

// Body hit-zones overlaid on the Pixar character image.
// viewBox 270x480 matches image aspect (1080x1920 ~ 9:16).
type Zone = { id: string; label: string; shape: "ellipse"; cx: number; cy: number; rx: number; ry: number; rot?: number };

const ZONES: Zone[] = [
  { id: "cabeca", label: "Cabeça", shape: "ellipse", cx: 135, cy: 88, rx: 56, ry: 66 },
  { id: "pescoco", label: "Pescoço", shape: "ellipse", cx: 135, cy: 158, rx: 18, ry: 12 },
  { id: "peito", label: "Peito", shape: "ellipse", cx: 135, cy: 205, rx: 56, ry: 38 },
  { id: "barriga", label: "Barriga", shape: "ellipse", cx: 135, cy: 263, rx: 48, ry: 28 },
  { id: "quadril", label: "Quadril", shape: "ellipse", cx: 135, cy: 308, rx: 44, ry: 22 },
  { id: "braco-dir", label: "Braço direito", shape: "ellipse", cx: 78, cy: 220, rx: 20, ry: 42, rot: -12 },
  { id: "braco-esq", label: "Braço esquerdo", shape: "ellipse", cx: 192, cy: 220, rx: 20, ry: 42, rot: 12 },
  { id: "antebraco-dir", label: "Antebraço direito", shape: "ellipse", cx: 56, cy: 280, rx: 18, ry: 30, rot: -8 },
  { id: "antebraco-esq", label: "Antebraço esquerdo", shape: "ellipse", cx: 214, cy: 280, rx: 18, ry: 30, rot: 8 },
  { id: "mao-dir", label: "Mão direita", shape: "ellipse", cx: 46, cy: 312, rx: 18, ry: 14 },
  { id: "mao-esq", label: "Mão esquerda", shape: "ellipse", cx: 224, cy: 312, rx: 18, ry: 14 },
  { id: "coxa-dir", label: "Coxa direita", shape: "ellipse", cx: 113, cy: 360, rx: 22, ry: 36 },
  { id: "coxa-esq", label: "Coxa esquerda", shape: "ellipse", cx: 157, cy: 360, rx: 22, ry: 36 },
  { id: "perna-dir", label: "Perna direita", shape: "ellipse", cx: 110, cy: 425, rx: 20, ry: 30 },
  { id: "perna-esq", label: "Perna esquerda", shape: "ellipse", cx: 160, cy: 425, rx: 20, ry: 30 },
  { id: "pe-dir", label: "Pé direito", shape: "ellipse", cx: 108, cy: 466, rx: 20, ry: 10 },
  { id: "pe-esq", label: "Pé esquerdo", shape: "ellipse", cx: 162, cy: 466, rx: 20, ry: 10 },
];

type State = {
  mode: ItemKind;
  selected: string;
  // partId -> itemId (single mark per region)
  paint: Record<string, string>;
};

const INITIAL: State = { mode: "emocao", selected: "alegria", paint: {} };

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

  const paintZone = (zoneId: string) => {
    if (eraseMode) {
      const { [zoneId]: _r, ...rest } = state.paint;
      update({ paint: rest });
    } else {
      update({ paint: { ...state.paint, [zoneId]: state.selected } });
    }
  };

  const reset = () => update({ ...INITIAL, mode: state.mode, selected: state.selected });

  const palette = state.mode === "emocao" ? EMOCOES : SENSACOES;
  const selectedItem = itemById(state.selected) ?? palette[0];

  // Group painted zones by item for the legend
  const usage = ALL_ITEMS.map((it) => ({
    ...it,
    zones: Object.entries(state.paint)
      .filter(([, id]) => id === it.id)
      .map(([z]) => z),
  })).filter((u) => u.zones.length > 0);

  return (
    <div
      className="h-full w-full flex flex-col gap-3 p-3 md:p-4 rounded-2xl border-4 border-amber-900/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(255,250,240,0.5), rgba(186,230,253,0.35)), url(${mapaBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3 bg-card border-2 rounded-2xl px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">🧍</span>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold leading-tight">Mapa Corporal</h2>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Onde você sente cada emoção ou sensação no corpo?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={eraseMode ? "default" : "outline"}
            onClick={() => setEraseMode((v) => !v)}
          >
            <Eraser className="w-4 h-4 mr-1" /> {eraseMode ? "Borracha ativa" : "Borracha"}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Limpar
          </Button>
        </div>
      </header>

      {/* Mode tabs + palette */}
      <div className="bg-card border-2 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-1 mb-3 bg-muted rounded-full p-1 w-fit">
          {(["emocao", "sensacao"] as const).map((m) => {
            const active = state.mode === m;
            const label = m === "emocao" ? "💗 Emoções" : "🩺 Sensações físicas";
            return (
              <button
                key={m}
                onClick={() => {
                  setEraseMode(false);
                  const first = (m === "emocao" ? EMOCOES : SENSACOES)[0];
                  update({ mode: m, selected: first.id });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {palette.map((e) => {
            const active = e.id === state.selected && !eraseMode;
            return (
              <button
                key={e.id}
                onClick={() => {
                  setEraseMode(false);
                  update({ selected: e.id });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  active ? "scale-105 shadow-md" : "hover:scale-105 opacity-85"
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

        {state.mode === "sensacao" && (
          <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
            Sensações físicas costumam aparecer junto com a ansiedade. Marcar onde elas aparecem
            ajuda a perceber o corpo respondendo — e que isso passa.
          </p>
        )}
      </div>

      {/* Body + legend */}
      <div className="flex-1 grid lg:grid-cols-[1fr_300px] gap-3 min-h-0">
        {/* Pixar character with hit zones */}
        <div
          className="relative bg-gradient-to-b from-sky-50 via-white to-violet-50 border-2 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden p-3"
          onMouseUp={() => setIsPainting(false)}
          onMouseLeave={() => setIsPainting(false)}
          onTouchEnd={() => setIsPainting(false)}
        >
          <div className="relative h-full max-h-[68vh] aspect-[9/16] mx-auto">
            <img
              src={personagem}
              alt="Personagem"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
              style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.18))" }}
              draggable={false}
            />
            <svg
              viewBox="0 0 270 480"
              className="absolute inset-0 w-full h-full select-none touch-none"
              preserveAspectRatio="xMidYMid meet"
            >
              {ZONES.map((z) => {
                const itemId = state.paint[z.id];
                const item = itemId ? itemById(itemId) : undefined;
                const filled = !!item;
                const transform = z.rot ? `rotate(${z.rot} ${z.cx} ${z.cy})` : undefined;
                return (
                  <g key={z.id} transform={transform}>
                    <ellipse
                      cx={z.cx}
                      cy={z.cy}
                      rx={z.rx}
                      ry={z.ry}
                      fill={item ? item.color : "transparent"}
                      fillOpacity={filled ? 0.55 : 0}
                      stroke={item ? item.color : "#1f293755"}
                      strokeWidth={filled ? 1.5 : 0.8}
                      strokeDasharray={filled ? "none" : "3 3"}
                      className="cursor-pointer transition-all hover:fill-amber-300 hover:fill-opacity-25 hover:stroke-amber-500"
                      onMouseDown={() => {
                        setIsPainting(true);
                        paintZone(z.id);
                      }}
                      onMouseEnter={() => {
                        if (isPainting) paintZone(z.id);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        setIsPainting(true);
                        paintZone(z.id);
                      }}
                      data-zone={z.id}
                    >
                      <title>{`${z.label}${item ? ` — ${item.label}` : ""}`}</title>
                    </ellipse>
                    {filled && item && (
                      <text
                        x={z.cx}
                        y={z.cy + 5}
                        textAnchor="middle"
                        fontSize={z.rx > 30 ? 18 : 13}
                        className="pointer-events-none select-none"
                        style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))" }}
                      >
                        {item.emoji}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active tool indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-card/90 backdrop-blur rounded-full border-2 px-3 py-1 text-xs font-semibold shadow">
            <span
              className="w-3 h-3 rounded-full border"
              style={{
                backgroundColor: eraseMode ? "transparent" : selectedItem.color,
                borderColor: eraseMode ? "#9ca3af" : selectedItem.color,
              }}
            />
            {eraseMode ? "Apagando" : `${selectedItem.emoji} ${selectedItem.label}`}
          </div>
        </div>

        {/* Legend */}
        <aside className="bg-card border-2 rounded-2xl p-3 shadow-sm flex flex-col gap-2 overflow-auto">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            O que o corpo está dizendo
          </div>
          {usage.length === 0 ? (
            <p className="text-xs text-muted-foreground leading-snug">
              Toque ou arraste sobre o corpo para pintar onde aparece cada emoção ou sensação.
              Use a borracha para tirar uma marca.
            </p>
          ) : (
            <div className="grid gap-2">
              {usage.map((u) => (
                <div key={u.id} className="rounded-lg border bg-background/60 p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className="w-4 h-4 rounded-full border-2 shrink-0"
                      style={{ backgroundColor: u.color, borderColor: u.color }}
                    />
                    <span className="flex-1 font-semibold truncate">
                      {u.emoji} {u.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {u.kind === "emocao" ? "Emoção" : "Sensação"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 pl-6">
                    {u.zones
                      .map((zid) => ZONES.find((z) => z.id === zid)?.label ?? zid)
                      .join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-auto pt-2 border-t text-[11px] text-muted-foreground leading-snug">
            <strong className="text-foreground">Dica:</strong> a mesma região pode mudar de cor ao
            longo da sessão. Não existe resposta certa — o corpo sente do jeito dele.
          </div>
        </aside>
      </div>
    </div>
  );
}
