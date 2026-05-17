import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw, Download, Trash2, Sun, Moon, Sparkles, Cloud } from "lucide-react";
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

type State = { items: Placed[]; mood: Mood };
const DEFAULT_STATE: State = { items: [], mood: "dia" };
const uid = () => Math.random().toString(36).slice(2, 9);

export default function MinhaCasa({ room }: Props) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // sync realtime
  useEffect(() => {
    return room.on?.((m) => {
      if (m.type === "casa:state") setState(m.payload as State);
    });
  }, [room]);
  useEffect(() => { room.send?.("casa:state", state); }, [state, room]);

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
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== selectedId) }));
    setSelectedId(null);
  };
  const updateSelected = (patch: Partial<Placed>) => {
    if (!selectedId) return;
    setState((s) => ({ ...s, items: s.items.map((i) => i.id === selectedId ? { ...i, ...patch } : i) }));
  };

  // drag
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const onPointerDownItem = (e: React.PointerEvent, item: Placed) => {
    e.stopPropagation();
    setSelectedId(item.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    dragRef.current = { id: item.id, offX: cx - item.x, offY: cy - item.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    setState((s) => ({
      ...s,
      items: s.items.map((i) =>
        i.id !== d.id ? i : { ...i, x: Math.max(0.02, Math.min(0.98, cx - d.offX)), y: Math.max(0.05, Math.min(0.98, cy - d.offY)) },
      ),
    }));
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
    <div className="flex flex-col h-full gap-3">
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-1 flex-wrap">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-amber-700" />
          <h2 className="font-display text-xl font-bold">Minha Casa</h2>
          <span className="text-xs text-muted-foreground hidden md:inline">Quem mora aqui? Onde cada um fica?</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <Button size="sm" variant="outline" onClick={exportPdf} disabled={state.items.length === 0}>
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        {/* sidebar de personagens */}
        <aside className="w-44 shrink-0 bg-white/85 border rounded-xl p-2 overflow-auto">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-1 mb-1">Família · Pets</div>
          <div className="grid grid-cols-2 gap-1.5">
            {CHARACTERS.map((c) => (
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
            </div>
          </div>

          {/* painel inferior */}
          <div className="rounded-xl bg-white/85 border p-3 min-h-[96px]">
            {selected && selectedDef ? (
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
            ) : (
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
            )}
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
