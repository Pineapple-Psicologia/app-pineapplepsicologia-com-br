import { useEffect, useMemo, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Compass, RotateCcw, ChevronRight, ChevronLeft, Download,
  Heart, Briefcase, Users, HeartPulse, Palette, Mountain, BookOpen, Globe,
} from "lucide-react";
import jsPDF from "jspdf";
import bussolaBg from "@/assets/scene-bussola.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type Importance = "muito" | "media" | "neutra" | null;

type ValueCard = {
  id: string;
  label: string;
  emoji: string;
};

const VALUES: ValueCard[] = [
  { id: "familia",      label: "Família",          emoji: "👨‍👩‍👧" },
  { id: "amizade",      label: "Amizades",         emoji: "🫂" },
  { id: "amor",         label: "Amor",             emoji: "❤️" },
  { id: "honestidade",  label: "Honestidade",      emoji: "🪞" },
  { id: "criatividade", label: "Criatividade",     emoji: "🎨" },
  { id: "aprendizado",  label: "Aprendizado",      emoji: "📚" },
  { id: "saude",        label: "Saúde",            emoji: "🌱" },
  { id: "coragem",      label: "Coragem",          emoji: "🦁" },
  { id: "liberdade",    label: "Liberdade",        emoji: "🕊️" },
  { id: "justica",      label: "Justiça",          emoji: "⚖️" },
  { id: "espiritual",   label: "Espiritualidade",  emoji: "✨" },
  { id: "natureza",     label: "Natureza",         emoji: "🌳" },
  { id: "humor",        label: "Humor",            emoji: "😄" },
  { id: "lealdade",     label: "Lealdade",         emoji: "🤝" },
  { id: "aventura",     label: "Aventura",         emoji: "🧗" },
  { id: "cuidado",      label: "Cuidado",          emoji: "🤲" },
  { id: "autonomia",    label: "Autonomia",        emoji: "🚪" },
  { id: "gratidao",     label: "Gratidão",         emoji: "🙏" },
  { id: "respeito",     label: "Respeito",         emoji: "🛡️" },
  { id: "calma",        label: "Calma",            emoji: "🌊" },
  { id: "trabalho",     label: "Trabalho com sentido", emoji: "🧰" },
  { id: "comunidade",   label: "Comunidade",       emoji: "🏘️" },
  { id: "fe",           label: "Fé",               emoji: "🕯️" },
  { id: "beleza",       label: "Beleza",           emoji: "🌸" },
];

type DomainId = "familia" | "amizades" | "saude" | "crescimento" | "trabalho" | "lazer" | "comunidade" | "espiritualidade";

const DOMAINS: { id: DomainId; label: string; emoji: string; angle: number; icon: any }[] = [
  { id: "familia",         label: "Família",         emoji: "👨‍👩‍👧", angle: 0,   icon: Heart },        // N
  { id: "amizades",        label: "Amizades",        emoji: "🫂",        angle: 45,  icon: Users },        // NE
  { id: "trabalho",        label: "Trabalho",        emoji: "🧰",        angle: 90,  icon: Briefcase },    // E
  { id: "crescimento",     label: "Crescimento",     emoji: "📚",        angle: 135, icon: BookOpen },     // SE
  { id: "saude",           label: "Saúde",           emoji: "🌱",        angle: 180, icon: HeartPulse },   // S
  { id: "lazer",           label: "Lazer",           emoji: "🎨",        angle: 225, icon: Palette },      // SW
  { id: "comunidade",      label: "Comunidade",      emoji: "🏘️",        angle: 270, icon: Globe },        // W
  { id: "espiritualidade", label: "Espiritualidade", emoji: "✨",         angle: 315, icon: Mountain },     // NW
];

type Step = "sort" | "rank" | "place";

type State = {
  step: Step;
  importance: Record<string, Importance>;   // valueId -> importance
  rank: string[];                            // ordered top-5 valueIds
  placement: Partial<Record<DomainId, string>>; // domain -> valueId (top picks placed on compass)
};

const DEFAULT_STATE: State = {
  step: "sort",
  importance: {},
  rank: [],
  placement: {},
};

export default function BussolaValores({ room }: Props) {
  const [state, setState] = useState<State>(DEFAULT_STATE);

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "bussola:state") setState(m.payload as State);
    });
  }, [room]);

  const broadcast = (next: State | ((s: State) => State)) => {
    setState((prev) => {
      const n = typeof next === "function" ? (next as (s: State) => State)(prev) : next;
      room.send("bussola:state", n);
      return n;
    });
  };

  const reset = () => broadcast(DEFAULT_STATE);

  const goto = (step: Step) => broadcast((s) => ({ ...s, step }));

  const sortedMuito = useMemo(
    () => VALUES.filter((v) => state.importance[v.id] === "muito"),
    [state.importance],
  );

  const canNextFromSort = sortedMuito.length >= 5;
  const canNextFromRank = state.rank.length >= 3;
  const placedCount = Object.values(state.placement).filter(Boolean).length;
  const canNextFromPlace = placedCount >= 3;
  const exportPdf = () => exportBussolaPdf(state, sortedMuito);

  return (
    <div
      className="h-full w-full p-3 md:p-5 flex flex-col gap-3 rounded-2xl border-4 border-amber-900/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.45)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(254,243,199,0.18), rgba(0,0,0,0.35)), url(${bussolaBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3 bg-white/90 backdrop-blur rounded-2xl border-2 border-white shadow-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-700" />
          <div>
            <h2 className="text-xl font-bold leading-tight">Bússola de Valores</h2>
            <p className="text-[11px] text-muted-foreground leading-tight">
              ACT · clarificação de valores — para onde sua vida aponta?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-full p-1">
          <StepChip id="sort"    cur={state.step} label="1 · Triagem" />
          <StepChip id="rank"    cur={state.step} label="2 · Top 5" />
          <StepChip id="place"   cur={state.step} label="3 · Bússola" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={exportPdf}
            disabled={placedCount === 0 && state.rank.length === 0 && sortedMuito.length === 0}
            title="Baixar respostas em PDF"
          >
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto">
        {state.step === "sort" && (
          <StepSort state={state} broadcast={broadcast} />
        )}
        {state.step === "rank" && (
          <StepRank state={state} broadcast={broadcast} sortedMuito={sortedMuito} />
        )}
        {state.step === "place" && (
          <StepPlace state={state} broadcast={broadcast} />
        )}
      </div>

      {/* Footer nav */}
      <footer className="flex items-center justify-between bg-white/90 backdrop-blur rounded-2xl border-2 border-white shadow-lg px-3 py-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const order: Step[] = ["sort", "rank", "place"];
            const idx = order.indexOf(state.step);
            if (idx > 0) goto(order[idx - 1]);
          }}
          disabled={state.step === "sort"}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div className="text-xs text-muted-foreground font-semibold">
          {state.step === "sort" && `Marque pelo menos 5 como "Muito" (${sortedMuito.length}/5)`}
          {state.step === "rank" && `Escolha 3–5 prioridades (${state.rank.length}/5)`}
          {state.step === "place" && `Coloque ao menos 3 na bússola (${placedCount}/${state.rank.length})`}
        </div>
        <Button
          size="sm"
          onClick={() => {
            const order: Step[] = ["sort", "rank", "place"];
            const idx = order.indexOf(state.step);
            if (idx < order.length - 1) goto(order[idx + 1]);
          }}
          disabled={
            (state.step === "sort" && !canNextFromSort) ||
            (state.step === "rank" && !canNextFromRank) ||
            state.step === "place"
          }
        >
          Avançar <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </footer>
    </div>
  );
}

/* ============================ STEP 1 — SORT ============================ */

function StepSort({
  state, broadcast,
}: {
  state: State;
  broadcast: (n: State | ((s: State) => State)) => void;
}) {
  const setImp = (id: string, imp: Importance) => {
    broadcast((s) => {
      const next = { ...s.importance, [id]: imp };
      // if removed from "muito", drop from rank
      const rank = imp !== "muito" ? s.rank.filter((r) => r !== id) : s.rank;
      return { ...s, importance: next, rank };
    });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {VALUES.map((v) => {
        const imp = state.importance[v.id] ?? null;
        return (
          <div
            key={v.id}
            className={`rounded-xl border-2 bg-white/95 backdrop-blur p-2.5 shadow-sm transition-all ${
              imp === "muito" ? "border-amber-500 shadow-md scale-[1.02]" :
              imp === "media" ? "border-sky-400" :
              imp === "neutra" ? "border-stone-300 opacity-60" :
              "border-stone-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{v.emoji}</span>
              <span className="text-sm font-bold leading-tight">{v.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setImp(v.id, imp === "muito" ? null : "muito")}
                className={`text-[10px] font-bold py-1 rounded ${
                  imp === "muito" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >Muito</button>
              <button
                onClick={() => setImp(v.id, imp === "media" ? null : "media")}
                className={`text-[10px] font-bold py-1 rounded ${
                  imp === "media" ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-700 hover:bg-sky-100"
                }`}
              >Médio</button>
              <button
                onClick={() => setImp(v.id, imp === "neutra" ? null : "neutra")}
                className={`text-[10px] font-bold py-1 rounded ${
                  imp === "neutra" ? "bg-stone-400 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >Neutro</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================ STEP 2 — RANK ============================ */

function StepRank({
  state, broadcast, sortedMuito,
}: {
  state: State;
  broadcast: (n: State | ((s: State) => State)) => void;
  sortedMuito: ValueCard[];
}) {
  const toggle = (id: string) => {
    broadcast((s) => {
      if (s.rank.includes(id)) {
        return { ...s, rank: s.rank.filter((r) => r !== id) };
      }
      if (s.rank.length >= 5) return s;
      return { ...s, rank: [...s.rank, id] };
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    broadcast((s) => {
      const idx = s.rank.indexOf(id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= s.rank.length) return s;
      const next = [...s.rank];
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...s, rank: next };
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-white drop-shadow-sm mb-2">
          ✨ Seus "Muito importantes"
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {sortedMuito.map((v) => {
            const picked = state.rank.includes(v.id);
            return (
              <button
                key={v.id}
                onClick={() => toggle(v.id)}
                className={`rounded-xl border-2 p-2.5 text-left bg-white/95 backdrop-blur shadow-sm transition-all ${
                  picked ? "border-amber-500 scale-[1.02] shadow-md" : "border-stone-200 hover:border-amber-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{v.emoji}</span>
                  <span className="text-sm font-bold flex-1">{v.label}</span>
                  {picked && (
                    <span className="text-xs font-black text-amber-600 bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center">
                      {state.rank.indexOf(v.id) + 1}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-white drop-shadow-sm mb-2">
          🏆 Top da bússola
        </h3>
        <div className="bg-white/95 backdrop-blur rounded-2xl border-2 border-amber-300 p-3 shadow-md flex flex-col gap-2 min-h-[200px]">
          {state.rank.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-8">
              Toque numa carta ao lado pra colocar aqui
            </p>
          )}
          {state.rank.map((id, i) => {
            const v = VALUES.find((vv) => vv.id === id)!;
            return (
              <div key={id} className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2">
                <span className="text-lg font-black text-amber-700 w-6 text-center">{i + 1}</span>
                <span className="text-lg">{v.emoji}</span>
                <span className="text-sm font-bold flex-1">{v.label}</span>
                <button className="text-stone-500 hover:text-stone-800" onClick={() => move(id, -1)} disabled={i === 0}>↑</button>
                <button className="text-stone-500 hover:text-stone-800" onClick={() => move(id, +1)} disabled={i === state.rank.length - 1}>↓</button>
                <button className="text-red-500 hover:text-red-700 text-xs font-bold" onClick={() => toggle(id)}>✕</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================ STEP 3 — PLACE on COMPASS ============================ */

function StepPlace({
  state, broadcast,
}: {
  state: State;
  broadcast: (n: State | ((s: State) => State)) => void;
}) {
  const place = (domain: DomainId, valueId: string | null) => {
    broadcast((s) => {
      const next = { ...s.placement };
      // remove value from any other domain first
      (Object.keys(next) as DomainId[]).forEach((d) => {
        if (next[d] === valueId) delete next[d];
      });
      if (valueId === null) delete next[domain];
      else next[domain] = valueId;
      return { ...s, placement: next };
    });
  };

  const placedIds = new Set(Object.values(state.placement).filter(Boolean) as string[]);
  const availableTop = state.rank.filter((id) => !placedIds.has(id));

  const SIZE = 340;
  const radius = SIZE / 2 - 28;
  const center = SIZE / 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
      {/* Compass */}
      <div className="flex justify-center">
        <div className="relative bg-white/95 backdrop-blur rounded-full border-4 border-amber-700 shadow-2xl" style={{ width: SIZE, height: SIZE }}>
          {/* compass rose */}
          <svg width={SIZE} height={SIZE} className="absolute inset-0">
            <circle cx={center} cy={center} r={radius + 12} fill="none" stroke="#b45309" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
            <circle cx={center} cy={center} r={radius - 30} fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
            {/* spokes */}
            {DOMAINS.map((d) => {
              const rad = ((d.angle - 90) * Math.PI) / 180;
              const x = center + Math.cos(rad) * radius;
              const y = center + Math.sin(rad) * radius;
              return (
                <line key={d.id} x1={center} y1={center} x2={x} y2={y} stroke="#d4a04c" strokeWidth="1" opacity="0.5" />
              );
            })}
            {/* needle */}
            <polygon points={`${center},${center - radius + 32} ${center - 8},${center} ${center},${center + radius - 32} ${center + 8},${center}`} fill="#b91c1c" opacity="0.85" />
            <circle cx={center} cy={center} r="6" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
          </svg>

          {/* domain slots */}
          {DOMAINS.map((d) => {
            const rad = ((d.angle - 90) * Math.PI) / 180;
            const x = center + Math.cos(rad) * radius;
            const y = center + Math.sin(rad) * radius;
            const placedId = state.placement[d.id];
            const v = placedId ? VALUES.find((vv) => vv.id === placedId) : null;
            return (
              <div
                key={d.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: x, top: y }}
              >
                <button
                  onClick={() => placedId && place(d.id, null)}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 text-center transition-all shadow-md ${
                    v ? "bg-amber-500 border-amber-700 text-white w-20 h-20 scale-105"
                      : "bg-white border-amber-300 text-amber-900 w-16 h-16 hover:scale-105"
                  }`}
                  title={v ? `Remover ${v.label}` : d.label}
                >
                  <span className="text-base">{d.emoji}</span>
                  <span className="text-[9px] font-bold leading-none mt-0.5">{d.label}</span>
                  {v && (
                    <span className="text-[10px] font-black mt-0.5 leading-none">
                      {v.emoji} {v.label}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* available pool */}
      <div className="bg-white/95 backdrop-blur rounded-2xl border-2 border-white shadow-lg p-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Arraste seus valores
        </h3>
        <p className="text-[11px] text-muted-foreground mb-2">
          Toque num valor, depois num domínio da bússola pra colocar.
        </p>
        <PlacePicker available={availableTop} placement={state.placement} onPlace={place} />
      </div>
    </div>
  );
}

function PlacePicker({
  available, placement, onPlace,
}: {
  available: string[];
  placement: Partial<Record<DomainId, string>>;
  onPlace: (d: DomainId, id: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {available.length === 0 && (
          <p className="text-[11px] italic text-muted-foreground">Todos colocados ✨</p>
        )}
        {available.map((id) => {
          const v = VALUES.find((vv) => vv.id === id)!;
          const active = selected === id;
          return (
            <button
              key={id}
              onClick={() => setSelected(active ? null : id)}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-full border-2 transition-all ${
                active ? "bg-amber-500 text-white border-amber-700 scale-105" :
                "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400"
              }`}
            >
              {v.emoji} {v.label}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="border-t border-stone-200 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1.5">
            Em qual domínio?
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => { onPlace(d.id, selected); setSelected(null); }}
                className="text-xs font-semibold px-2 py-1.5 rounded-lg border-2 border-amber-200 bg-white hover:bg-amber-50 hover:border-amber-400 text-left"
              >
                {d.emoji} {d.label}
                {placement[d.id] && (
                  <span className="block text-[9px] text-stone-500 italic">substitui atual</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ Helpers ============================ */

function StepChip({ id, cur, label }: { id: Step; cur: Step; label: string }) {
  const active = id === cur;
  return (
    <span
      className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
        active ? "bg-amber-500 text-white shadow" : "text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

/* ============================ PDF EXPORT ============================ */

function exportBussolaPdf(state: State, sortedMuito: string[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  let y = 56;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - 56) {
      doc.addPage();
      y = 56;
    }
  };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(120, 72, 20);
  doc.text("Bússola de Valores", marginX, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  doc.text(`Sessão · ${today}`, marginX, y);
  y += 8;
  doc.setDrawColor(220, 180, 100);
  doc.setLineWidth(1);
  doc.line(marginX, y, pageW - marginX, y);
  y += 22;

  // Section: Triagem
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text("1 · Triagem — importância de cada valor", marginX, y);
  y += 16;

  const importanceGroups: Array<{ label: string; tone: [number, number, number]; ids: string[] }> = [
    { label: "Muito importantes", tone: [180, 100, 30],
      ids: Object.entries(state.importance).filter(([, v]) => v === "muito").map(([k]) => k) },
    { label: "Média importância", tone: [140, 120, 60],
      ids: Object.entries(state.importance).filter(([, v]) => v === "media").map(([k]) => k) },
    { label: "Neutras",           tone: [130, 130, 130],
      ids: Object.entries(state.importance).filter(([, v]) => v === "neutra").map(([k]) => k) },
  ];

  doc.setFontSize(10);
  importanceGroups.forEach((g) => {
    if (g.ids.length === 0) return;
    ensureSpace(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(g.tone[0], g.tone[1], g.tone[2]);
    doc.text(`${g.label} (${g.ids.length})`, marginX, y);
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const labels = g.ids
      .map((id) => VALUES.find((v) => v.id === id)?.label)
      .filter(Boolean)
      .join(" · ");
    const lines = doc.splitTextToSize(labels, pageW - marginX * 2);
    ensureSpace(lines.length * 12 + 8);
    doc.text(lines, marginX, y);
    y += lines.length * 12 + 8;
  });

  if (importanceGroups.every((g) => g.ids.length === 0)) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(140, 140, 140);
    doc.text("Nenhum valor classificado ainda.", marginX, y);
    y += 14;
  }
  y += 8;

  // Section: Top 5
  ensureSpace(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text("2 · Top prioridades", marginX, y);
  y += 16;

  doc.setFontSize(11);
  if (state.rank.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(140, 140, 140);
    doc.text("Nenhuma prioridade ranqueada.", marginX, y);
    y += 14;
  } else {
    state.rank.forEach((id, i) => {
      const v = VALUES.find((x) => x.id === id);
      if (!v) return;
      ensureSpace(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 100, 30);
      doc.text(`${i + 1}.`, marginX, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.text(v.label, marginX + 22, y);
      y += 15;
    });
  }
  y += 12;

  // Section: Bússola
  ensureSpace(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text("3 · Bússola — valor por domínio de vida", marginX, y);
  y += 16;

  const placedEntries = (Object.entries(state.placement) as [DomainId, string][])
    .filter(([, id]) => Boolean(id));

  if (placedEntries.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(140, 140, 140);
    doc.text("Nenhum valor colocado na bússola.", marginX, y);
    y += 14;
  } else {
    DOMAINS.forEach((d) => {
      const valId = state.placement[d.id];
      if (!valId) return;
      const v = VALUES.find((x) => x.id === valId);
      if (!v) return;
      ensureSpace(22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text(d.label.toUpperCase(), marginX, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(v.label, marginX + 130, y);
      y += 18;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text(
      "Bússola de Valores · ACT · clarificação de valores",
      marginX,
      pageH - 28,
    );
    doc.text(`${p}/${pageCount}`, pageW - marginX, pageH - 28, { align: "right" });
  }

  const filename = `bussola-valores-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  // silence unused warning
  void sortedMuito;
}
