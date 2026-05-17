import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import {
  Home, RotateCcw, Download, Trash2, Sun, Moon, Sparkles, Cloud,
  Plus, Users, Sofa,
} from "lucide-react";
import jsPDF from "jspdf";

type Props = { room: ReturnType<typeof useRoom> };

// ----- catálogos ------------------------------------------------------------

type RoomType =
  | "quarto-infantil" | "quarto-adolescente" | "quarto-pais"
  | "cozinha" | "sala" | "banheiro" | "estudos" | "cantinho" | "varanda" | "quintal";

const ROOM_CATALOG: { type: RoomType; label: string; emoji: string; color: string }[] = [
  { type: "quarto-infantil",    label: "Quarto infantil",    emoji: "🧸", color: "#fde2e4" },
  { type: "quarto-adolescente", label: "Quarto adolescente", emoji: "🎧", color: "#dbeafe" },
  { type: "quarto-pais",        label: "Quarto dos pais",    emoji: "🛏️", color: "#ede0d4" },
  { type: "sala",               label: "Sala",               emoji: "🛋️", color: "#fff4d6" },
  { type: "cozinha",            label: "Cozinha",            emoji: "🍳", color: "#fde6c8" },
  { type: "banheiro",           label: "Banheiro",           emoji: "🛁", color: "#cfeefb" },
  { type: "estudos",            label: "Espaço de estudos",  emoji: "📚", color: "#e6dcf7" },
  { type: "cantinho",           label: "Cantinho emocional", emoji: "💗", color: "#fcd5ce" },
  { type: "varanda",            label: "Varanda",            emoji: "🪴", color: "#d8f3dc" },
  { type: "quintal",            label: "Quintal",            emoji: "🌳", color: "#b7e4c7" },
];

const FURNITURE = [
  { type: "cama",       label: "Cama",            emoji: "🛏️" },
  { type: "sofa",       label: "Sofá",            emoji: "🛋️" },
  { type: "tv",         label: "TV",              emoji: "📺" },
  { type: "livros",     label: "Livros",          emoji: "📚" },
  { type: "brinquedos", label: "Brinquedos",      emoji: "🧸" },
  { type: "videogame",  label: "Videogame",       emoji: "🎮" },
  { type: "planta",     label: "Planta",          emoji: "🪴" },
  { type: "computador", label: "Computador",      emoji: "💻" },
  { type: "mesa",       label: "Mesa",            emoji: "🪑" },
  { type: "desenho",    label: "Desenho",         emoji: "🖼️" },
  { type: "bagunca",    label: "Bagunça",         emoji: "🧦" },
  { type: "afeto",      label: "Item afetivo",    emoji: "💖" },
  { type: "diario",     label: "Diário",          emoji: "📔" },
  { type: "violao",     label: "Violão",          emoji: "🎸" },
  { type: "luz",        label: "Abajur",          emoji: "💡" },
  { type: "espelho",    label: "Espelho",         emoji: "🪞" },
];

type CharType = "crianca" | "adolescente" | "mae" | "pai" | "avo" | "avo2" | "irmao" | "irma" | "cuidador" | "pet" | "pet2";

const CHARACTER_CATALOG: { type: CharType; label: string; emoji: string }[] = [
  { type: "crianca",     label: "Criança",     emoji: "🧒" },
  { type: "adolescente", label: "Adolescente", emoji: "🧑" },
  { type: "mae",         label: "Mãe",         emoji: "👩" },
  { type: "pai",         label: "Pai",         emoji: "👨" },
  { type: "avo",         label: "Avó",         emoji: "👵" },
  { type: "avo2",        label: "Avô",         emoji: "👴" },
  { type: "irmao",       label: "Irmão",       emoji: "👦" },
  { type: "irma",        label: "Irmã",        emoji: "👧" },
  { type: "cuidador",    label: "Cuidador(a)", emoji: "🧑‍🍼" },
  { type: "pet",         label: "Cachorro",    emoji: "🐶" },
  { type: "pet2",        label: "Gato",        emoji: "🐱" },
];

type Expression = "feliz" | "triste" | "bravo" | "calmo" | "ansioso" | "amoroso";
const EXPRESSIONS: { id: Expression; label: string; emoji: string }[] = [
  { id: "feliz",    label: "Feliz",    emoji: "😊" },
  { id: "calmo",    label: "Calmo",    emoji: "😌" },
  { id: "amoroso",  label: "Amoroso",  emoji: "🥰" },
  { id: "triste",   label: "Triste",   emoji: "😢" },
  { id: "bravo",    label: "Bravo",    emoji: "😠" },
  { id: "ansioso",  label: "Ansioso",  emoji: "😟" },
];

type Mood = "warm" | "neutral" | "cool" | "night";
const MOODS: { id: Mood; label: string; icon: any; tint: string; bg: string }[] = [
  { id: "warm",    label: "Aconchego",  icon: Sun,      tint: "rgba(255, 196, 120, 0.22)", bg: "linear-gradient(180deg,#fef3e2,#fde0c2)" },
  { id: "neutral", label: "Neutro",     icon: Cloud,    tint: "rgba(255,255,255,0.10)",     bg: "linear-gradient(180deg,#f8fafc,#eef2f7)" },
  { id: "cool",    label: "Calmo",      icon: Sparkles, tint: "rgba(120, 180, 230, 0.20)", bg: "linear-gradient(180deg,#e7f0fb,#d4e4f7)" },
  { id: "night",   label: "Noite",      icon: Moon,     tint: "rgba(30, 30, 70, 0.35)",     bg: "linear-gradient(180deg,#1f2540,#0e1126)" },
];

// ----- estado ---------------------------------------------------------------

type Placed = {
  id: string;
  kind: "room" | "furniture" | "character";
  type: string;
  label: string;
  emoji: string;
  x: number; y: number;
  w?: number; h?: number;
  color?: string;
  expression?: Expression;
};

type State = {
  items: Placed[];
  mood: Mood;
};

const CANVAS_W = 1200;
const CANVAS_H = 760;

const DEFAULT_STATE: State = { items: [], mood: "warm" };

const uid = () => Math.random().toString(36).slice(2, 9);

// ----- componente -----------------------------------------------------------

export default function MinhaCasa({ room }: Props) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"rooms" | "furniture" | "characters">("rooms");
  const canvasRef = useRef<HTMLDivElement>(null);

  // realtime sync (mesmo padrão dos outros jogos)
  useEffect(() => {
    return room.on?.((m) => {
      if (m.type === "casa:state") setState(m.payload as State);
    });
  }, [room]);
  useEffect(() => {
    room.send?.("casa:state", state);
  }, [state, room]);

  const mood = MOODS.find((m) => m.id === state.mood)!;

  // ----- adicionar -----
  const addRoom = (r: typeof ROOM_CATALOG[number]) => {
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        {
          id: uid(), kind: "room", type: r.type, label: r.label, emoji: r.emoji,
          x: 120 + (s.items.filter(i => i.kind === "room").length * 30) % 400,
          y: 120 + (s.items.filter(i => i.kind === "room").length * 30) % 300,
          w: 240, h: 180, color: r.color,
        },
      ],
    }));
  };
  const addFurniture = (f: typeof FURNITURE[number]) => {
    setState((s) => ({
      ...s,
      items: [...s.items, { id: uid(), kind: "furniture", type: f.type, label: f.label, emoji: f.emoji, x: CANVAS_W / 2, y: CANVAS_H / 2 }],
    }));
  };
  const addCharacter = (c: typeof CHARACTER_CATALOG[number]) => {
    setState((s) => ({
      ...s,
      items: [...s.items, { id: uid(), kind: "character", type: c.type, label: c.label, emoji: c.emoji, x: CANVAS_W / 2, y: CANVAS_H / 2, expression: "calmo" }],
    }));
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== selectedId) }));
    setSelectedId(null);
  };

  const setExpression = (exp: Expression) => {
    if (!selectedId) return;
    setState((s) => ({ ...s, items: s.items.map((i) => i.id === selectedId ? { ...i, expression: exp } : i) }));
  };

  // ----- drag -----
  const dragRef = useRef<{ id: string; offX: number; offY: number; mode: "move" | "resize" } | null>(null);

  const onPointerDownItem = (e: React.PointerEvent, item: Placed, mode: "move" | "resize" = "move") => {
    e.stopPropagation();
    setSelectedId(item.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / CANVAS_W;
    const cx = (e.clientX - rect.left) / scale;
    const cy = (e.clientY - rect.top) / scale;
    dragRef.current = { id: item.id, offX: cx - item.x, offY: cy - item.y, mode };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / CANVAS_W;
    const cx = (e.clientX - rect.left) / scale;
    const cy = (e.clientY - rect.top) / scale;
    setState((s) => ({
      ...s,
      items: s.items.map((i) => {
        if (i.id !== d.id) return i;
        if (d.mode === "move") {
          return { ...i, x: Math.max(0, Math.min(CANVAS_W, cx - d.offX)), y: Math.max(0, Math.min(CANVAS_H, cy - d.offY)) };
        }
        return { ...i, w: Math.max(120, cx - i.x), h: Math.max(100, cy - i.y) };
      }),
    }));
  }, []);
  const onPointerUp = () => { dragRef.current = null; };

  // ----- leitura simbólica -----
  const characters = state.items.filter((i) => i.kind === "character");
  const proximity = useMemo(() => {
    const pairs: { a: Placed; b: Placed; dist: number }[] = [];
    for (let i = 0; i < characters.length; i++)
      for (let j = i + 1; j < characters.length; j++) {
        const a = characters[i], b = characters[j];
        const dist = Math.round(Math.hypot(a.x - b.x, a.y - b.y));
        pairs.push({ a, b, dist });
      }
    return pairs.sort((p, q) => p.dist - q.dist);
  }, [characters]);

  const reset = () => { setState(DEFAULT_STATE); setSelectedId(null); };
  const exportPdf = () => exportCasaPdf(state, proximity);

  const selected = state.items.find((i) => i.id === selectedId) || null;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-amber-700" />
          <h2 className="font-display text-xl font-bold">Minha Casa</h2>
          <span className="text-xs text-muted-foreground hidden md:inline">construa simbolicamente sua casa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-white/70 border p-1">
            {MOODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setState((s) => ({ ...s, mood: m.id }))}
                  title={m.label}
                  className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition ${state.mood === m.id ? "bg-amber-100 text-amber-900 font-semibold" : "hover:bg-amber-50"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              );
            })}
          </div>
          <Button size="sm" variant="outline" onClick={exportPdf} disabled={state.items.length === 0}>
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        {/* sidebar */}
        <aside className="w-60 shrink-0 flex flex-col bg-white/80 border rounded-xl overflow-hidden">
          <div className="flex border-b">
            {[
              { id: "rooms" as const,      label: "Cômodos",   icon: Home },
              { id: "furniture" as const,  label: "Objetos",   icon: Sofa },
              { id: "characters" as const, label: "Pessoas",   icon: Users },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition ${tab === t.id ? "bg-amber-100 text-amber-900" : "text-muted-foreground hover:bg-amber-50"}`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {tab === "rooms" && ROOM_CATALOG.map((r) => (
              <button
                key={r.type}
                onClick={() => addRoom(r)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg border bg-white hover:bg-amber-50 text-sm text-left"
              >
                <span className="text-xl">{r.emoji}</span>
                <span className="flex-1 truncate">{r.label}</span>
                <Plus className="w-3.5 h-3.5 opacity-40" />
              </button>
            ))}
            {tab === "furniture" && (
              <div className="grid grid-cols-2 gap-1">
                {FURNITURE.map((f) => (
                  <button
                    key={f.type}
                    onClick={() => addFurniture(f)}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-lg border bg-white hover:bg-amber-50"
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-[10px] text-center leading-tight">{f.label}</span>
                  </button>
                ))}
              </div>
            )}
            {tab === "characters" && (
              <div className="grid grid-cols-2 gap-1">
                {CHARACTER_CATALOG.map((c) => (
                  <button
                    key={c.type}
                    onClick={() => addCharacter(c)}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-lg border bg-white hover:bg-amber-50"
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-[10px] text-center leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* canvas */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div
            className="relative flex-1 rounded-2xl border-4 border-amber-900/15 overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)]"
            style={{ background: mood.bg }}
          >
            <div
              ref={canvasRef}
              className="absolute inset-0 select-none"
              style={{ touchAction: "none" }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={() => setSelectedId(null)}
            >
              {/* grade sutil */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke={state.mood === "night" ? "#fff" : "#000"} strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />
              </svg>

              {/* itens em coordenadas relativas via SVG-like wrapper */}
              <div className="absolute inset-0" style={{ transform: "scale(1)", transformOrigin: "top left" }}>
                <div className="relative w-full h-full" style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}>
                  <CanvasInner
                    state={state}
                    canvasRef={canvasRef}
                    selectedId={selectedId}
                    onPointerDownItem={onPointerDownItem}
                  />
                </div>
              </div>

              {/* overlay de iluminação */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-soft-light"
                style={{ background: `radial-gradient(ellipse at 50% 40%, ${mood.tint} 0%, transparent 70%)` }}
              />
              {state.mood === "night" && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)" }} />
              )}
            </div>
          </div>

          {/* painel inferior: seleção + leitura */}
          <div className="rounded-xl bg-white/80 border p-3 flex gap-3 items-start min-h-[88px]">
            {selected ? (
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-3xl">{selected.emoji}</div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{selected.kind === "room" ? "Cômodo" : selected.kind === "character" ? "Pessoa" : "Objeto"}</div>
                    <div className="font-semibold truncate">{selected.label}</div>
                    {selected.kind === "character" && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {EXPRESSIONS.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => setExpression(e.id)}
                            className={`px-2 py-0.5 rounded-full text-xs border transition ${selected.expression === e.id ? "bg-amber-200 border-amber-400 font-semibold" : "bg-white hover:bg-amber-50"}`}
                          >
                            {e.emoji} {e.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={removeSelected}>
                  <Trash2 className="w-4 h-4" /> remover
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground flex-1">
                <strong>Como brincar:</strong> escolha cômodos na lateral, arraste para posicionar. Adicione móveis e personagens. Clique em alguém para mudar a expressão. A iluminação muda a atmosfera da casa.
                {characters.length >= 2 && (
                  <div className="mt-1 text-xs">
                    <strong>Proximidades:</strong>{" "}
                    {proximity.slice(0, 3).map((p, i) => (
                      <span key={i} className="mr-2">
                        {p.a.emoji}↔{p.b.emoji} {p.dist < 100 ? "muito próximo" : p.dist < 250 ? "próximo" : p.dist < 450 ? "distante" : "muito distante"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- canvas interno -------------------------------------------------------

function CanvasInner({
  state, canvasRef, selectedId, onPointerDownItem,
}: {
  state: State;
  canvasRef: React.RefObject<HTMLDivElement>;
  selectedId: string | null;
  onPointerDownItem: (e: React.PointerEvent, item: Placed, mode?: "move" | "resize") => void;
}) {
  // converte coords lógicas (CANVAS_W x CANVAS_H) em % para escalar com o container
  const pct = (v: number, axis: "x" | "y") => (axis === "x" ? (v / CANVAS_W) * 100 : (v / CANVAS_H) * 100);

  const sorted = [...state.items].sort((a, b) => {
    const order = { room: 0, furniture: 1, character: 2 } as const;
    return order[a.kind] - order[b.kind];
  });

  return (
    <>
      {sorted.map((it) => {
        const isSel = it.id === selectedId;
        if (it.kind === "room") {
          return (
            <div
              key={it.id}
              onPointerDown={(e) => onPointerDownItem(e, it)}
              className={`absolute rounded-2xl border-2 cursor-grab active:cursor-grabbing shadow-md transition-shadow ${isSel ? "ring-4 ring-amber-400/60" : ""}`}
              style={{
                left: `${pct(it.x, "x")}%`,
                top: `${pct(it.y, "y")}%`,
                width: `${pct(it.w!, "x")}%`,
                height: `${pct(it.h!, "y")}%`,
                background: `linear-gradient(135deg, ${it.color}, ${it.color}cc)`,
                borderColor: state.mood === "night" ? "rgba(255,255,255,0.25)" : "rgba(120,80,30,0.25)",
              }}
            >
              <div className="absolute top-1 left-2 text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 backdrop-blur">
                <span>{it.emoji}</span> {it.label}
              </div>
              <div
                onPointerDown={(e) => onPointerDownItem(e, it, "resize")}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-white/70 rounded-tl-md"
                title="redimensionar"
              />
            </div>
          );
        }
        const size = it.kind === "character" ? 56 : 44;
        return (
          <div
            key={it.id}
            onPointerDown={(e) => onPointerDownItem(e, it)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${isSel ? "scale-110" : ""} transition-transform`}
            style={{
              left: `${pct(it.x, "x")}%`,
              top: `${pct(it.y, "y")}%`,
              fontSize: size,
              filter: isSel ? "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
              lineHeight: 1,
            }}
          >
            <span>{it.emoji}</span>
            {it.kind === "character" && it.expression && (
              <span
                className="absolute -top-1 -right-2 text-base bg-white rounded-full px-1 shadow"
                style={{ fontSize: 18 }}
              >
                {EXPRESSIONS.find((e) => e.id === it.expression)?.emoji}
              </span>
            )}
          </div>
        );
      })}
      <PointerProxy canvasRef={canvasRef} />
    </>
  );
}

// dummy para silenciar warning de canvasRef não usado no inner
function PointerProxy({ canvasRef }: { canvasRef: React.RefObject<HTMLDivElement> }) {
  void canvasRef;
  return null;
}

// ----- PDF ------------------------------------------------------------------

function exportCasaPdf(state: State, proximity: { a: Placed; b: Placed; dist: number }[]) {
  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Minha Casa", 40, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Sessão · ${new Date().toLocaleDateString("pt-BR")} · Atmosfera: ${MOODS.find(m => m.id === state.mood)?.label}`, 40, y);
  y += 24;
  doc.setTextColor(20);

  const section = (title: string) => {
    if (y > 760) { doc.addPage(); y = 56; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, 40, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };
  const line = (txt: string) => {
    if (y > 780) { doc.addPage(); y = 56; }
    const wrapped = doc.splitTextToSize(txt, W - 80);
    doc.text(wrapped, 50, y);
    y += wrapped.length * 14;
  };

  const rooms = state.items.filter(i => i.kind === "room");
  const furn = state.items.filter(i => i.kind === "furniture");
  const chars = state.items.filter(i => i.kind === "character");

  section(`Cômodos (${rooms.length})`);
  if (rooms.length === 0) line("— nenhum cômodo construído.");
  rooms.forEach(r => line(`• ${r.label}`));
  y += 8;

  section(`Pessoas e pets (${chars.length})`);
  if (chars.length === 0) line("— nenhum personagem posicionado.");
  chars.forEach(c => {
    const exp = EXPRESSIONS.find(e => e.id === c.expression);
    line(`• ${c.label}${exp ? ` — expressão: ${exp.label}` : ""}`);
  });
  y += 8;

  if (proximity.length > 0) {
    section("Proximidades simbólicas");
    proximity.slice(0, 8).forEach(p => {
      const tag = p.dist < 100 ? "muito próximo" : p.dist < 250 ? "próximo" : p.dist < 450 ? "distante" : "muito distante";
      line(`• ${p.a.label} ↔ ${p.b.label}: ${tag}`);
    });
    y += 8;
  }

  section(`Objetos escolhidos (${furn.length})`);
  if (furn.length === 0) line("— nenhum objeto adicionado.");
  const counts = furn.reduce<Record<string, number>>((acc, f) => { acc[f.label] = (acc[f.label] || 0) + 1; return acc; }, {});
  Object.entries(counts).forEach(([label, n]) => line(`• ${label}${n > 1 ? ` ×${n}` : ""}`));

  // footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(`Minha Casa · página ${i} de ${pages}`, W / 2, 820, { align: "center" });
  }

  doc.save(`minha-casa-${new Date().toISOString().slice(0, 10)}.pdf`);
}
