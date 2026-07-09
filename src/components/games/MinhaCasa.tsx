import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw, Download, Trash2, Sun, Moon, Sparkles, Cloud, EyeOff, X, StickyNote, Smile } from "lucide-react";
import jsPDF from "jspdf";

import casaBg from "@/assets/casa-pixar.jpg";
import imgCrianca from "@/assets/casa/char-crianca.png";
import imgAdolescente from "@/assets/casa/char-adolescente.png";
import imgMae from "@/assets/casa/char-mae.png";
import imgPai from "@/assets/casa/char-pai.png";
import imgAvo from "@/assets/casa/char-avo.png";
import imgAvo2 from "@/assets/casa/char-avo2.png";
import imgIrmao from "@/assets/casa/char-irmao.png";
import imgIrma from "@/assets/casa/char-irma.png";
import imgCuidador from "@/assets/casa/char-cuidador.png";
import imgCao from "@/assets/casa/char-cao.png";
import imgGato from "@/assets/casa/char-gato.png";
// família negra
import imgMaeNegra from "@/assets/casa/char-mae-negra.png";
import imgPaiNegro from "@/assets/casa/char-pai-negro.png";
import imgCriancaNegra from "@/assets/casa/char-crianca-negra.png";
import imgAdolescenteNegro from "@/assets/casa/char-adolescente-negro.png";
import imgAvoNegra from "@/assets/casa/char-avo-negra.png";
import imgAvo2Negro from "@/assets/casa/char-avo2-negro.png";
import imgIrmaoNegro from "@/assets/casa/char-irmao-negro.png";
import imgIrmaNegra from "@/assets/casa/char-irma-negra.png";
// extras (mais irmãos / bebês)
import imgBebe from "@/assets/casa/char-bebe.png";
import imgBebeNegro from "@/assets/casa/char-bebe-negro.png";
import imgIrmaoCacula from "@/assets/casa/char-irmao-caculado.png";
import imgIrmaMaisVelha from "@/assets/casa/char-irma-mais-velha.png";

type Props = { room: ReturnType<typeof useRoom> };

type CharGroup = "familia" | "familia-negra" | "extras" | "pets";
type CharDef = { id: string; label: string; img: string; group: CharGroup; isPet?: boolean };

const CHARACTERS: CharDef[] = [
  // Família
  { id: "crianca",     label: "Criança",     img: imgCrianca,     group: "familia" },
  { id: "adolescente", label: "Adolescente", img: imgAdolescente, group: "familia" },
  { id: "mae",         label: "Mãe",         img: imgMae,         group: "familia" },
  { id: "pai",         label: "Pai",         img: imgPai,         group: "familia" },
  { id: "avo",         label: "Avó",         img: imgAvo,         group: "familia" },
  { id: "avo2",        label: "Avô",         img: imgAvo2,        group: "familia" },
  { id: "irmao",       label: "Irmão",       img: imgIrmao,       group: "familia" },
  { id: "irma",        label: "Irmã",        img: imgIrma,        group: "familia" },
  { id: "cuidador",    label: "Cuidador(a)", img: imgCuidador,    group: "familia" },
  // Família negra
  { id: "mae-n",         label: "Mãe",         img: imgMaeNegra,         group: "familia-negra" },
  { id: "pai-n",         label: "Pai",         img: imgPaiNegro,         group: "familia-negra" },
  { id: "crianca-n",     label: "Criança",     img: imgCriancaNegra,     group: "familia-negra" },
  { id: "adolescente-n", label: "Adolescente", img: imgAdolescenteNegro, group: "familia-negra" },
  { id: "avo-n",         label: "Avó",         img: imgAvoNegra,         group: "familia-negra" },
  { id: "avo2-n",        label: "Avô",         img: imgAvo2Negro,        group: "familia-negra" },
  { id: "irmao-n",       label: "Irmão",       img: imgIrmaoNegro,       group: "familia-negra" },
  { id: "irma-n",        label: "Irmã",        img: imgIrmaNegra,        group: "familia-negra" },
  // Mais irmãos / bebês
  { id: "bebe",          label: "Bebê",            img: imgBebe,           group: "extras" },
  { id: "bebe-n",        label: "Bebê",            img: imgBebeNegro,      group: "extras" },
  { id: "irmao-cacula",  label: "Irmão caçula",    img: imgIrmaoCacula,    group: "extras" },
  { id: "irma-mais-velha", label: "Irmã mais velha", img: imgIrmaMaisVelha, group: "extras" },
  // Pets
  { id: "cao",         label: "Cachorro",    img: imgCao,  group: "pets", isPet: true },
  { id: "gato",        label: "Gato",        img: imgGato, group: "pets", isPet: true },
];

const GROUP_LABELS: Record<CharGroup, string> = {
  "familia": "Família",
  "familia-negra": "Família",
  "extras": "Mais integrantes",
  "pets": "Pets",
};

type Emotion = "feliz" | "calmo" | "amoroso" | "triste" | "bravo" | "ansioso" | "neutro";
const EMOTIONS: { id: Emotion; label: string; color: string }[] = [
  { id: "neutro",  label: "Neutro",  color: "transparent" },
  { id: "feliz",   label: "Feliz",   color: "#fbbf24" },
  { id: "calmo",   label: "Calmo",   color: "#60a5fa" },
  { id: "amoroso", label: "Amoroso", color: "#f472b6" },
  { id: "triste",  label: "Triste",  color: "#64748b" },
  { id: "bravo",   label: "Bravo",   color: "#ef4444" },
  { id: "ansioso", label: "Ansioso", color: "#a855f7" },
];

type Mood = "dia" | "aconchego" | "calmo" | "noite";
const MOODS: { id: Mood; label: string; icon: any; overlay: string; blend: string }[] = [
  { id: "dia",       label: "Dia",       icon: Sun,      overlay: "transparent",                          blend: "normal" },
  { id: "aconchego", label: "Aconchego", icon: Sparkles, overlay: "rgba(255,170,80,0.22)",                blend: "soft-light" },
  { id: "calmo",     label: "Calmo",     icon: Cloud,    overlay: "rgba(120,180,230,0.25)",               blend: "soft-light" },
  { id: "noite",     label: "Noite",     icon: Moon,     overlay: "rgba(15,20,55,0.55)",                  blend: "multiply" },
];

type Placed = {
  id: string;       // unique
  charId: string;   // CharDef.id
  x: number; y: number; // 0..1 (% do canvas)
  scale: number;        // 0.6..1.6
  flip: boolean;        // espelhar horizontalmente
  emotion: Emotion;
};

type Cover = {
  id: string;
  x: number; y: number;   // top-left 0..1
  w: number; h: number;   // 0..1
  label: string;
};

type Note = {
  id: string;
  x: number; y: number;   // top-left 0..1
  w: number; h: number;   // 0..1
  text: string;
  color: "amarelo" | "rosa" | "azul" | "verde";
};

const NOTE_COLORS: Record<Note["color"], { bg: string; border: string }> = {
  amarelo: { bg: "#fff7c2", border: "#f5d76e" },
  rosa:    { bg: "#ffd6e0", border: "#f48fb1" },
  azul:    { bg: "#cfe7ff", border: "#7fb8e8" },
  verde:   { bg: "#d6f5d6", border: "#7fc77f" },
};

type Sticker = {
  id: string;
  x: number; y: number;   // 0..1 (centro)
  scale: number;          // 0.6..2.2
  emoji: string;
};

const EMOJI_GROUPS: { label: string; items: { emoji: string; name: string }[] }[] = [
  {
    label: "Sentimentos",
    items: [
      { emoji: "😀", name: "feliz" },
      { emoji: "😊", name: "contente" },
      { emoji: "🥰", name: "amoroso" },
      { emoji: "😍", name: "apaixonado" },
      { emoji: "🤗", name: "abraço" },
      { emoji: "😌", name: "calmo" },
      { emoji: "😴", name: "sono" },
      { emoji: "😢", name: "triste" },
      { emoji: "😭", name: "chorando" },
      { emoji: "😞", name: "desanimado" },
      { emoji: "😟", name: "preocupado" },
      { emoji: "😨", name: "com medo" },
      { emoji: "😰", name: "ansioso" },
      { emoji: "😡", name: "bravo" },
      { emoji: "🤬", name: "muito bravo" },
      { emoji: "😤", name: "irritado" },
      { emoji: "😳", name: "envergonhado" },
      { emoji: "😬", name: "tenso" },
      { emoji: "🤒", name: "doente" },
      { emoji: "🤕", name: "machucado" },
      { emoji: "🥱", name: "entediado" },
      { emoji: "😶", name: "calado" },
      { emoji: "🤔", name: "pensativo" },
      { emoji: "😎", name: "confiante" },
    ],
  },
  {
    label: "Símbolos",
    items: [
      { emoji: "❤️", name: "amor" },
      { emoji: "💔", name: "coração partido" },
      { emoji: "✨", name: "brilho" },
      { emoji: "⭐", name: "estrela" },
      { emoji: "🌈", name: "arco-íris" },
      { emoji: "☀️", name: "sol" },
      { emoji: "☁️", name: "nuvem" },
      { emoji: "⛈️", name: "tempestade" },
      { emoji: "🔥", name: "fogo" },
      { emoji: "💤", name: "dormir" },
      { emoji: "💭", name: "pensamento" },
      { emoji: "💬", name: "fala" },
      { emoji: "❓", name: "dúvida" },
      { emoji: "❗", name: "atenção" },
      { emoji: "🚫", name: "não" },
      { emoji: "🎉", name: "festa" },
    ],
  },
];

type State = { items: Placed[]; mood: Mood; covers: Cover[]; notes: Note[]; stickers: Sticker[] };
const DEFAULT_STATE: State = { items: [], mood: "dia", covers: [], notes: [], stickers: [] };
const uid = () => Math.random().toString(36).slice(2, 9);

export default function MinhaCasa({ room }: Props) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // sync realtime — evita ping-pong: quando o estado chega do peer, NÃO rebroadcast.
  const remoteRef = useRef(false);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<State | null>(null);

  useEffect(() => {
    return room.on?.((m) => {
      if (m.type === "casa:state") {
        const p = m.payload as Partial<State>;
        remoteRef.current = true;
        setState({ ...DEFAULT_STATE, ...p, covers: p.covers ?? [], notes: p.notes ?? [], stickers: p.stickers ?? [] });
      }
    });
  }, [room]);

  useEffect(() => {
    if (remoteRef.current) {
      remoteRef.current = false;
      return;
    }
    pendingStateRef.current = state;
    if (sendTimerRef.current) return;
    sendTimerRef.current = setTimeout(() => {
      sendTimerRef.current = null;
      if (pendingStateRef.current) {
        room.send?.("casa:state", pendingStateRef.current);
        pendingStateRef.current = null;
      }
    }, 80);
  }, [state, room]);

  useEffect(() => () => {
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
  }, []);

  const mood = MOODS.find((m) => m.id === state.mood)!;
  

  const addCharacter = (c: CharDef) => {
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        { id: uid(), charId: c.id, x: 0.5, y: 0.7, scale: 1, flip: false, emotion: "neutro" },
      ],
    }));
  };
  const removeSelected = () => {
    if (!selectedId) return;
    setState((s) => ({
      ...s,
      items: s.items.filter((i) => i.id !== selectedId),
      covers: s.covers.filter((c) => c.id !== selectedId),
      notes: s.notes.filter((n) => n.id !== selectedId),
      stickers: s.stickers.filter((st) => st.id !== selectedId),
    }));
    setSelectedId(null);
  };
  const updateSelected = (patch: Partial<Placed>) => {
    if (!selectedId) return;
    setState((s) => ({ ...s, items: s.items.map((i) => i.id === selectedId ? { ...i, ...patch } : i) }));
  };

  const addCover = () => {
    const id = uid();
    setState((s) => ({
      ...s,
      covers: [...s.covers, { id, x: 0.35, y: 0.35, w: 0.3, h: 0.25, label: "não tenho" }],
    }));
    setSelectedId(id);
  };
  const updateCover = (id: string, patch: Partial<Cover>) => {
    setState((s) => ({ ...s, covers: s.covers.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  };
  const removeCover = (id: string) => {
    setState((s) => ({ ...s, covers: s.covers.filter((c) => c.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const addNote = () => {
    const id = uid();
    setState((s) => ({
      ...s,
      notes: [...s.notes, { id, x: 0.4, y: 0.4, w: 0.22, h: 0.18, text: "", color: "amarelo" }],
    }));
    setSelectedId(id);
  };
  const updateNote = (id: string, patch: Partial<Note>) => {
    setState((s) => ({ ...s, notes: s.notes.map((n) => n.id === id ? { ...n, ...patch } : n) }));
  };
  const removeNote = (id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const addSticker = (emoji: string) => {
    const id = uid();
    setState((s) => ({
      ...s,
      stickers: [...s.stickers, { id, x: 0.5, y: 0.5, scale: 1, emoji }],
    }));
    setSelectedId(id);
  };
  const updateSticker = (id: string, patch: Partial<Sticker>) => {
    setState((s) => ({ ...s, stickers: s.stickers.map((st) => st.id === id ? { ...st, ...patch } : st) }));
  };
  const removeSticker = (id: string) => {
    setState((s) => ({ ...s, stickers: s.stickers.filter((st) => st.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  // drag (personagens + covers + notas + stickers)
  type DragMode = "move" | "resize";
  type DragKind = "item" | "cover" | "note" | "sticker";
  const dragRef = useRef<{ id: string; kind: DragKind; mode: DragMode; offX: number; offY: number } | null>(null);

  const onPointerDownItem = (e: React.PointerEvent, item: Placed) => {
    e.stopPropagation();
    setSelectedId(item.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    dragRef.current = { id: item.id, kind: "item", mode: "move", offX: cx - item.x, offY: cy - item.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerDownBox = (
    e: React.PointerEvent,
    box: { id: string; x: number; y: number; w: number; h: number },
    kind: "cover" | "note",
    mode: DragMode,
  ) => {
    e.stopPropagation();
    setSelectedId(box.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    const offX = mode === "move" ? cx - box.x : cx - (box.x + box.w);
    const offY = mode === "move" ? cy - box.y : cy - (box.y + box.h);
    dragRef.current = { id: box.id, kind, mode, offX, offY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerDownSticker = (e: React.PointerEvent, st: Sticker) => {
    e.stopPropagation();
    setSelectedId(st.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    dragRef.current = { id: st.id, kind: "sticker", mode: "move", offX: cx - st.x, offY: cy - st.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    setState((s) => {
      if (d.kind === "item") {
        return {
          ...s,
          items: s.items.map((i) =>
            i.id !== d.id ? i : { ...i, x: Math.max(0.02, Math.min(0.98, cx - d.offX)), y: Math.max(0.05, Math.min(0.98, cy - d.offY)) },
          ),
        };
      }
      if (d.kind === "sticker") {
        return {
          ...s,
          stickers: s.stickers.map((st) =>
            st.id !== d.id ? st : { ...st, x: Math.max(0.02, Math.min(0.98, cx - d.offX)), y: Math.max(0.02, Math.min(0.98, cy - d.offY)) },
          ),
        };
      }
      const updateBox = <T extends { id: string; x: number; y: number; w: number; h: number }>(arr: T[]): T[] =>
        arr.map((b) => {
          if (b.id !== d.id) return b;
          if (d.mode === "move") {
            return { ...b, x: Math.max(0, Math.min(1 - b.w, cx - d.offX)), y: Math.max(0, Math.min(1 - b.h, cy - d.offY)) };
          }
          const nw = Math.max(0.08, Math.min(1 - b.x, cx - d.offX - b.x));
          const nh = Math.max(0.06, Math.min(1 - b.y, cy - d.offY - b.y));
          return { ...b, w: nw, h: nh };
        });
      if (d.kind === "cover") return { ...s, covers: updateBox(s.covers) };
      return { ...s, notes: updateBox(s.notes) };
    });
  }, []);
  const onPointerUp = () => { dragRef.current = null; };

  // leituras simbólicas
  const characters = state.items;
  const proximity = useMemo(() => {
    const pairs: { a: Placed; b: Placed; dist: number }[] = [];
    for (let i = 0; i < characters.length; i++)
      for (let j = i + 1; j < characters.length; j++) {
        const a = characters[i], b = characters[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        pairs.push({ a, b, dist });
      }
    return pairs.sort((p, q) => p.dist - q.dist);
  }, [characters]);

  const reset = () => { setState(DEFAULT_STATE); setSelectedId(null); };
  const exportPdf = () => exportCasaPdf(state, proximity);
  const selected = state.items.find((i) => i.id === selectedId) || null;
  const selectedDef = selected ? CHARACTERS.find((c) => c.id === selected.charId) : null;

  return (
    <div className="flex flex-col h-full gap-2 sm:gap-3 p-1 sm:p-0">
      {/* header */}
      <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Home className="w-5 h-5 text-amber-700 shrink-0" />
          <h2 className="font-display text-base sm:text-xl font-bold truncate">Minha Casa</h2>
          <span className="text-xs text-muted-foreground hidden md:inline">Quem mora aqui? Onde cada um fica?</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap relative">
          <Button size="sm" variant="outline" className="sm:hidden h-8 px-2" onClick={() => setSidebarOpen((v) => !v)}>
            👥 <span className="ml-1 text-xs">Pessoas</span>
          </Button>
          <div className="relative">
            <Button size="sm" variant="outline" onClick={() => setEmojiOpen((v) => !v)} title="Adicionar emoji">
              <Smile className="w-4 h-4" /> <span className="hidden sm:inline">Emojis</span>
            </Button>
            {emojiOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setEmojiOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-[320px] max-h-[360px] overflow-auto bg-white border rounded-xl shadow-xl p-3">
                  {EMOJI_GROUPS.map((grp) => (
                    <div key={grp.label} className="mb-2 last:mb-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-1 mb-1">{grp.label}</div>
                      <div className="grid grid-cols-8 gap-1">
                        {grp.items.map((it) => (
                          <button
                            key={it.emoji}
                            onClick={() => { addSticker(it.emoji); setEmojiOpen(false); }}
                            title={it.name}
                            className="aspect-square flex items-center justify-center text-2xl rounded-md hover:bg-amber-50 transition"
                          >
                            {it.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={addNote} title="Adicionar uma nota / caixa de texto">
            <StickyNote className="w-4 h-4" /> <span className="hidden sm:inline">Adicionar nota</span>
          </Button>
          <Button size="sm" variant="outline" onClick={addCover} title="Cobrir um cômodo que não existe">
            <EyeOff className="w-4 h-4" /> <span className="hidden sm:inline">Cobrir cômodo</span>
          </Button>
          <div className="flex gap-1 rounded-lg bg-white/80 border p-1 shadow-sm">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const active = state.mood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setState((s) => ({ ...s, mood: m.id }))}
                  title={m.label}
                  className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1 transition ${active ? "bg-amber-100 text-amber-900 font-semibold" : "hover:bg-amber-50 text-muted-foreground"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              );
            })}
          </div>
          <Button size="sm" variant="outline" onClick={exportPdf} disabled={state.items.length === 0 && state.notes.length === 0 && state.covers.length === 0 && state.stickers.length === 0}>
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        {/* sidebar de personagens */}
        <aside className="w-48 shrink-0 bg-white/85 border rounded-xl p-2 overflow-auto">
          {(["familia", "familia-negra", "extras", "pets"] as CharGroup[]).map((grp, idx) => {
            const items = CHARACTERS.filter((c) => c.group === grp);
            if (items.length === 0) return null;
            const label = GROUP_LABELS[grp];
            return (
              <div key={grp} className={idx > 0 ? "mt-3" : ""}>
                <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-1 mb-1">{label}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {items.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => addCharacter(c)}
                      title={`Adicionar ${c.label}`}
                      className="group flex flex-col items-center gap-0.5 p-1.5 rounded-lg border bg-white hover:bg-amber-50 hover:border-amber-300 transition"
                    >
                      <div className="w-full aspect-square bg-gradient-to-b from-amber-50 to-white rounded-md overflow-hidden flex items-end justify-center">
                        <img src={c.img} alt={c.label} className="h-full w-auto object-contain group-hover:scale-105 transition-transform" loading="lazy" />
                      </div>
                      <span className="text-[10px] font-semibold text-center leading-tight">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        {/* canvas casa */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="relative flex-1 rounded-2xl border-4 border-amber-900/20 overflow-hidden shadow-[0_25px_60px_-20px_rgba(0,0,0,0.4)]">
            <img
              src={casaBg}
              alt="Casa"
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
            {/* overlay de atmosfera */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: mood.overlay, mixBlendMode: mood.blend as any }}
            />
            {state.mood === "noite" && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.55) 100%)" }} />
            )}

            {/* área interativa */}
            <div
              ref={canvasRef}
              className="absolute inset-0"
              style={{ touchAction: "none" }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={() => setSelectedId(null)}
            >
              {state.items.map((it) => {
                const def = CHARACTERS.find((c) => c.id === it.charId);
                if (!def) return null;
                const isSel = it.id === selectedId;
                const emo = EMOTIONS.find((e) => e.id === it.emotion)!;
                const size = (def.isPet ? 70 : 110) * it.scale; // px na altura do container
                return (
                  <div
                    key={it.id}
                    onPointerDown={(e) => onPointerDownItem(e, it)}
                    className="absolute -translate-x-1/2 -translate-y-full cursor-grab active:cursor-grabbing select-none"
                    style={{
                      left: `${it.x * 100}%`,
                      top: `${it.y * 100}%`,
                      height: `${size}px`,
                      filter: isSel
                        ? `drop-shadow(0 0 12px ${emo.color === "transparent" ? "#fbbf24" : emo.color}) drop-shadow(0 6px 8px rgba(0,0,0,0.35))`
                        : it.emotion !== "neutro"
                          ? `drop-shadow(0 0 8px ${emo.color}) drop-shadow(0 4px 6px rgba(0,0,0,0.3))`
                          : "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
                      transition: "filter 0.2s",
                    }}
                  >
                    <img
                      src={def.img}
                      alt={def.label}
                      draggable={false}
                      className="h-full w-auto object-contain pointer-events-none"
                      style={{ transform: it.flip ? "scaleX(-1)" : undefined }}
                    />
                    {isSel && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded-full shadow whitespace-nowrap">
                        {def.label}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Coberturas de cômodos */}
              {state.covers.map((c) => {
                const isSel = c.id === selectedId;
                return (
                  <div
                    key={c.id}
                    onPointerDown={(e) => onPointerDownBox(e, c, "cover", "move")}
                    className={`absolute cursor-move select-none rounded-xl border-2 flex items-center justify-center text-center backdrop-blur-sm transition ${isSel ? "border-amber-500" : "border-white/70"}`}
                    style={{
                      left: `${c.x * 100}%`,
                      top: `${c.y * 100}%`,
                      width: `${c.w * 100}%`,
                      height: `${c.h * 100}%`,
                      background: "repeating-linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,255,255,0.78) 10px, rgba(245,235,220,0.78) 10px, rgba(245,235,220,0.78) 20px)",
                      boxShadow: isSel ? "0 0 0 3px rgba(251,191,36,0.35), 0 10px 25px -10px rgba(0,0,0,0.4)" : "0 6px 18px -8px rgba(0,0,0,0.35)",
                    }}
                  >
                    <span className="text-xs font-semibold text-amber-900/80 px-2 pointer-events-none">
                      {c.label}
                    </span>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); removeCover(c.id); }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border shadow flex items-center justify-center hover:bg-red-50 hover:border-red-300"
                      title="Remover cobertura"
                    >
                      <X className="w-3.5 h-3.5 text-red-600" />
                    </button>
                    <div
                      onPointerDown={(e) => onPointerDownBox(e, c, "cover", "resize")}
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-amber-500/80 rounded-tl-md"
                      title="Redimensionar"
                    />
                  </div>
                );
              })}

              {/* Notas / caixas de texto */}
              {state.notes.map((n) => {
                const isSel = n.id === selectedId;
                const col = NOTE_COLORS[n.color];
                return (
                  <div
                    key={n.id}
                    onPointerDown={(e) => onPointerDownBox(e, n, "note", "move")}
                    className={`absolute cursor-move select-none rounded-md flex flex-col transition ${isSel ? "ring-2 ring-amber-500" : ""}`}
                    style={{
                      left: `${n.x * 100}%`,
                      top: `${n.y * 100}%`,
                      width: `${n.w * 100}%`,
                      height: `${n.h * 100}%`,
                      background: col.bg,
                      border: `1.5px solid ${col.border}`,
                      boxShadow: "0 8px 18px -8px rgba(0,0,0,0.4), 2px 2px 0 rgba(0,0,0,0.04)",
                      transform: "rotate(-1deg)",
                    }}
                  >
                    <textarea
                      value={n.text}
                      maxLength={500}
                      onChange={(e) => updateNote(n.id, { text: e.target.value })}
                      onPointerDown={(e) => { e.stopPropagation(); setSelectedId(n.id); }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="o que acontece aqui? o que falam?"
                      className="flex-1 w-full bg-transparent resize-none outline-none text-[12px] leading-tight font-medium text-amber-950/90 placeholder:text-amber-900/40 p-2"
                      style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}
                    />
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); removeNote(n.id); }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border shadow flex items-center justify-center hover:bg-red-50 hover:border-red-300"
                      title="Remover nota"
                    >
                      <X className="w-3.5 h-3.5 text-red-600" />
                    </button>
                    <div
                      onPointerDown={(e) => onPointerDownBox(e, n, "note", "resize")}
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize"
                      style={{ background: col.border, borderTopLeftRadius: 4 }}
                      title="Redimensionar"
                    />
                  </div>
                );
              })}

              {/* Stickers / Emojis */}
              {state.stickers.map((st) => {
                const isSel = st.id === selectedId;
                const size = 56 * st.scale;
                return (
                  <div
                    key={st.id}
                    onPointerDown={(e) => onPointerDownSticker(e, st)}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
                    style={{
                      left: `${st.x * 100}%`,
                      top: `${st.y * 100}%`,
                      fontSize: `${size}px`,
                      lineHeight: 1,
                      filter: isSel
                        ? "drop-shadow(0 0 10px rgba(251,191,36,0.9)) drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                        : "drop-shadow(0 3px 5px rgba(0,0,0,0.35))",
                      transition: "filter 0.2s",
                    }}
                  >
                    <span className="pointer-events-none">{st.emoji}</span>
                    {isSel && (
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); removeSticker(st.id); }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border shadow flex items-center justify-center hover:bg-red-50 hover:border-red-300"
                        title="Remover emoji"
                      >
                        <X className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* painel inferior */}
          <div className="rounded-xl bg-white/85 border p-3 min-h-[96px]">
            {(() => {
              const selectedSticker = state.stickers.find((s) => s.id === selectedId);
              if (selectedSticker) {
                return (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl leading-none">{selectedSticker.emoji}</span>
                    <div className="font-semibold">Emoji</div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-muted-foreground">tamanho</span>
                      <input
                        type="range" min={0.6} max={2.2} step={0.05}
                        value={selectedSticker.scale}
                        onChange={(e) => updateSticker(selectedSticker.id, { scale: parseFloat(e.target.value) })}
                        className="w-32"
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground">arraste para mover</div>
                    <Button size="sm" variant="outline" onClick={() => removeSticker(selectedSticker.id)} className="ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> remover
                    </Button>
                  </div>
                );
              }
              const selectedNote = state.notes.find((n) => n.id === selectedId);
              if (selectedNote) {
                return (
                  <div className="flex items-center gap-3 flex-wrap">
                    <StickyNote className="w-5 h-5 text-amber-700 shrink-0" />
                    <div className="font-semibold">Nota</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">cor</span>
                      {(Object.keys(NOTE_COLORS) as Note["color"][]).map((col) => (
                        <button
                          key={col}
                          onClick={() => updateNote(selectedNote.id, { color: col })}
                          className={`w-6 h-6 rounded-full border-2 transition ${selectedNote.color === col ? "ring-2 ring-amber-500 scale-110" : "border-white"}`}
                          style={{ background: NOTE_COLORS[col].bg, borderColor: NOTE_COLORS[col].border }}
                          title={col}
                        />
                      ))}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      digite direto na nota · arraste o cantinho colorido para redimensionar
                    </div>
                    <Button size="sm" variant="outline" onClick={() => removeNote(selectedNote.id)} className="ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> remover
                    </Button>
                  </div>
                );
              }
              const selectedCover = state.covers.find((c) => c.id === selectedId);
              if (selectedCover) {
                return (
                  <div className="flex items-center gap-3 flex-wrap">
                    <EyeOff className="w-5 h-5 text-amber-700 shrink-0" />
                    <div className="font-semibold">Cobertura de cômodo</div>
                    <input
                      type="text"
                      value={selectedCover.label}
                      onChange={(e) => updateCover(selectedCover.id, { label: e.target.value })}
                      placeholder="ex.: não tenho, não uso, vazio"
                      className="text-xs border rounded-md px-2 py-1 bg-white min-w-[180px]"
                    />
                    <div className="text-[11px] text-muted-foreground">arraste para mover · canto inferior direito redimensiona</div>
                    <Button size="sm" variant="outline" onClick={() => removeCover(selectedCover.id)} className="ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> remover
                    </Button>
                  </div>
                );
              }
              if (selected && selectedDef) {
                return (
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-amber-50 to-white border flex items-end justify-center overflow-hidden shrink-0">
                      <img src={selectedDef.img} alt="" className="h-full w-auto object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold">{selectedDef.label}</div>
                        <button
                          onClick={() => updateSelected({ flip: !selected.flip })}
                          className="text-[10px] px-2 py-0.5 rounded-full border bg-white hover:bg-amber-50"
                          title="Virar"
                        >
                          ⇄ virar
                        </button>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-muted-foreground">tamanho</span>
                          <input
                            type="range" min={0.6} max={1.6} step={0.05}
                            value={selected.scale}
                            onChange={(e) => updateSelected({ scale: parseFloat(e.target.value) })}
                            className="w-24"
                          />
                        </div>
                        <Button size="sm" variant="outline" onClick={removeSelected} className="ml-auto">
                          <Trash2 className="w-3.5 h-3.5" /> remover
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {EMOTIONS.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => updateSelected({ emotion: e.id })}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition ${selected.emotion === e.id ? "bg-amber-100 border-amber-400 font-semibold" : "bg-white hover:bg-amber-50"}`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border"
                              style={{ background: e.color === "transparent" ? "white" : e.color, borderColor: e.color === "transparent" ? "#cbd5e1" : "transparent" }}
                            />
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
              <div className="text-sm text-muted-foreground">
                <strong>Como brincar:</strong> escolha pessoas e pets na lateral, arraste-os para os cômodos da casa. Clique em alguém para mudar tamanho, virar e escolher uma emoção (o brilho ao redor representa o sentimento). A iluminação muda a atmosfera da casa toda.
                {characters.length >= 2 && (
                  <div className="mt-1.5 text-xs">
                    <strong>Proximidades:</strong>{" "}
                    {proximity.slice(0, 3).map((p, i) => {
                      const a = CHARACTERS.find(c => c.id === p.a.charId)?.label;
                      const b = CHARACTERS.find(c => c.id === p.b.charId)?.label;
                      const tag = p.dist < 0.12 ? "muito próximos" : p.dist < 0.28 ? "próximos" : p.dist < 0.5 ? "distantes" : "muito distantes";
                      return <span key={i} className="mr-3">{a} ↔ {b}: <em>{tag}</em></span>;
                    })}
                  </div>
                )}
              </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
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
  const moodLabel = MOODS.find(m => m.id === state.mood)?.label;
  doc.text(`Sessão · ${new Date().toLocaleDateString("pt-BR")} · Atmosfera: ${moodLabel}`, 40, y);
  y += 24;
  doc.setTextColor(20);

  const section = (title: string) => {
    if (y > 760) { doc.addPage(); y = 56; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text(title, 40, y); y += 16;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  };
  const line = (txt: string) => {
    if (y > 780) { doc.addPage(); y = 56; }
    const wrapped = doc.splitTextToSize(txt, W - 80);
    doc.text(wrapped, 50, y);
    y += wrapped.length * 14;
  };

  section(`Moradores posicionados (${state.items.length})`);
  if (state.items.length === 0) line("— nenhum personagem posicionado.");
  state.items.forEach((it) => {
    const def = CHARACTERS.find(c => c.id === it.charId);
    const emo = EMOTIONS.find(e => e.id === it.emotion);
    line(`• ${def?.label ?? it.charId} — emoção: ${emo?.label ?? "neutro"}`);
  });
  y += 8;

  if (state.covers.length > 0) {
    section(`Cômodos cobertos (${state.covers.length})`);
    state.covers.forEach((c) => line(`• ${c.label || "(sem rótulo)"}`));
    y += 8;
  }

  if (state.notes.length > 0) {
    section(`Notas do paciente (${state.notes.length})`);
    state.notes.forEach((n, i) => line(`${i + 1}. ${n.text.trim() || "(em branco)"}`));
    y += 8;
  }

  if (state.stickers.length > 0) {
    const counts = new Map<string, number>();
    state.stickers.forEach((s) => counts.set(s.emoji, (counts.get(s.emoji) ?? 0) + 1));
    section(`Emojis colocados (${state.stickers.length})`);
    Array.from(counts.entries()).forEach(([emo, n]) => {
      const meta = EMOJI_GROUPS.flatMap((g) => g.items).find((i) => i.emoji === emo);
      line(`• ${emo} ${meta?.name ?? ""} ×${n}`);
    });
    y += 8;
  }

  if (proximity.length > 0) {
    section("Proximidades simbólicas");
    proximity.slice(0, 10).forEach((p) => {
      const a = CHARACTERS.find(c => c.id === p.a.charId)?.label;
      const b = CHARACTERS.find(c => c.id === p.b.charId)?.label;
      const tag = p.dist < 0.12 ? "muito próximos" : p.dist < 0.28 ? "próximos" : p.dist < 0.5 ? "distantes" : "muito distantes";
      line(`• ${a} ↔ ${b}: ${tag}`);
    });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9); doc.setTextColor(140);
    doc.text(`Minha Casa · página ${i} de ${pages}`, W / 2, 820, { align: "center" });
  }
  doc.save(`minha-casa-${new Date().toISOString().slice(0, 10)}.pdf`);
}
