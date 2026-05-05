import { useEffect, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Thermometer, RotateCcw, X } from "lucide-react";
import SceneBackdrop from "./SceneBackdrop";
import sceneBg from "@/assets/scene-termometro.jpg";

type Props = { room: ReturnType<typeof useRoom> };

const EMOTIONS = [
  { id: "alegria", label: "Alegria", emoji: "😄", color: "#FFD166" },
  { id: "tristeza", label: "Tristeza", emoji: "😢", color: "#3A86FF" },
  { id: "raiva", label: "Raiva", emoji: "😡", color: "#E63946" },
  { id: "medo", label: "Medo", emoji: "😨", color: "#7B2CBF" },
  { id: "ansiedade", label: "Ansiedade", emoji: "😰", color: "#FB5607" },
  { id: "calma", label: "Calma", emoji: "😌", color: "#06D6A0" },
];

const LEVEL_LABELS = [
  "Nada", "Quase nada", "Pouquinho", "Pouco", "Mais ou menos",
  "Médio", "Bastante", "Muito", "Muitíssimo", "Quase no máximo", "Máximo",
];

type Selected = { id: string; level: number };

export default function Termometro({ room }: Props) {
  const [selected, setSelected] = useState<Selected[]>([{ id: "alegria", level: 0 }]);
  const [activeId, setActiveId] = useState<string>("alegria");
  const [note, setNote] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const activeEmotion =
    EMOTIONS.find((e) => e.id === activeId) ?? EMOTIONS[0];
  const activeLevel =
    selected.find((s) => s.id === activeId)?.level ?? 0;

  // Receive remote updates
  useEffect(() => {
    const off = room.on((m) => {
      if (m.type === "thermo:state") {
        const p = m.payload as {
          selected?: Selected[];
          activeId?: string;
          note?: string;
          // legacy
          emotionId?: string;
          level?: number;
        };
        if (Array.isArray(p.selected)) {
          setSelected(p.selected);
          if (p.activeId) setActiveId(p.activeId);
          else if (p.selected[0]) setActiveId(p.selected[0].id);
        } else if (p.emotionId) {
          // legacy single-emotion payload
          setSelected([{ id: p.emotionId, level: p.level ?? 0 }]);
          setActiveId(p.emotionId);
        }
        if (typeof p.note === "string") setNote(p.note);
      }
    });
    return off;
  }, [room]);

  const broadcast = (next: {
    selected?: Selected[];
    activeId?: string;
    note?: string;
  }) => {
    room.send("thermo:state", {
      selected: next.selected ?? selected,
      activeId: next.activeId ?? activeId,
      note: next.note ?? note,
    });
  };

  const toggleEmotion = (id: string) => {
    const exists = selected.some((s) => s.id === id);
    let next: Selected[];
    let nextActive = activeId;
    if (exists) {
      next = selected.filter((s) => s.id !== id);
      if (next.length === 0) {
        next = [{ id, level: 0 }];
        nextActive = id;
      } else if (activeId === id) {
        nextActive = next[0].id;
      }
    } else {
      next = [...selected, { id, level: 0 }];
      nextActive = id;
    }
    setSelected(next);
    setActiveId(nextActive);
    broadcast({ selected: next, activeId: nextActive });
  };

  const updateActiveLevel = (v: number) => {
    const next = selected.map((s) =>
      s.id === activeId ? { ...s, level: v } : s,
    );
    setSelected(next);
    broadcast({ selected: next });
  };

  const setLevelFromY = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / rect.height;
    const v = Math.round(Math.max(0, Math.min(1, ratio)) * 10);
    updateActiveLevel(v);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setLevelFromY(e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    setLevelFromY(e.clientY);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };

  const fillPct = (activeLevel / 10) * 100;

  const resetAll = () => {
    const next = selected.map((s) => ({ ...s, level: 0 }));
    setSelected(next);
    setNote("");
    broadcast({ selected: next, note: "" });
  };

  return (
    <SceneBackdrop src={sceneBg} vignette={0.35} tint="rgba(186,230,253,0.45)">
      <div className="h-full w-full p-4 md:p-6 flex flex-col gap-4">
        <header className="flex items-center justify-between flex-wrap gap-3 bg-white/85 backdrop-blur rounded-2xl border-2 border-white shadow-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Termômetro das Emoções</h2>
          </div>
          <Button size="sm" variant="outline" onClick={resetAll}>
            <RotateCcw className="w-4 h-4 mr-1" /> Zerar
          </Button>
        </header>

        {/* Emotion picker (multi-select) */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Escolha uma ou mais emoções
          </p>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => {
              const isSelected = selected.some((s) => s.id === e.id);
              const isActive = e.id === activeId;
              return (
                <button
                  key={e.id}
                  onClick={() => toggleEmotion(e.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold transition-all ${
                    isSelected
                      ? "shadow-md"
                      : "border-border/60 hover:border-border bg-card opacity-70"
                  } ${isActive ? "scale-105 ring-2 ring-offset-1 ring-foreground/40" : ""}`}
                  style={
                    isSelected
                      ? { backgroundColor: e.color + "30", borderColor: e.color }
                      : {}
                  }
                >
                  <span className="text-lg">{e.emoji}</span> {e.label}
                  {isSelected && <span className="ml-1 text-[10px] opacity-70">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected emotions summary chips (with quick switch + remove) */}
        {selected.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => {
              const em = EMOTIONS.find((e) => e.id === s.id);
              if (!em) return null;
              const isActive = s.id === activeId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveId(s.id);
                    broadcast({ activeId: s.id });
                  }}
                  className={`group flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border-2 cursor-pointer transition-all text-xs font-bold ${
                    isActive ? "scale-105 shadow" : "opacity-80"
                  }`}
                  style={{ backgroundColor: em.color + "25", borderColor: em.color }}
                >
                  <span className="text-base">{em.emoji}</span>
                  <span>{em.label}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-white text-[10px]"
                    style={{ backgroundColor: em.color }}
                  >
                    {s.level}
                  </span>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggleEmotion(s.id);
                    }}
                    className="ml-0.5 w-5 h-5 rounded-full hover:bg-white/60 grid place-items-center"
                    aria-label={`Remover ${em.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-stretch min-h-[400px]">
          {/* Thermometer (active emotion) */}
          <div className="flex items-center justify-center">
            <div className="flex items-end gap-3 select-none">
              <div className="flex flex-col justify-between h-[360px] text-xs font-bold text-muted-foreground py-1">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>

              <div className="relative">
                <div
                  ref={trackRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className="relative w-16 h-[360px] rounded-full bg-muted border-4 border-foreground/80 cursor-pointer overflow-hidden touch-none"
                  style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.4)" }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-150 ease-out"
                    style={{
                      height: `${fillPct}%`,
                      background: `linear-gradient(to top, ${activeEmotion.color}, ${activeEmotion.color}cc)`,
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={i} className="h-px bg-foreground/20 mx-2" />
                    ))}
                  </div>
                </div>
                <div
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-foreground/80 flex items-center justify-center text-3xl"
                  style={{ backgroundColor: activeEmotion.color }}
                >
                  {activeEmotion.emoji}
                </div>
              </div>
            </div>
          </div>

          {/* Reading + note */}
          <div className="flex flex-col gap-4 min-w-0">
            <div
              className="rounded-xl p-5 border-2 text-center"
              style={{
                backgroundColor: activeEmotion.color + "20",
                borderColor: activeEmotion.color,
              }}
            >
              <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                {activeEmotion.label}
              </div>
              <div
                className="text-6xl font-black my-1"
                style={{ color: activeEmotion.color }}
              >
                {activeLevel}
              </div>
              <div className="text-sm font-semibold">
                {LEVEL_LABELS[activeLevel]}
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                O que está acontecendo? (opcional)
              </label>
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  broadcast({ note: e.target.value });
                }}
                placeholder="Conte aqui o que faz você sentir assim..."
                className="flex-1 min-h-[120px] p-3 rounded-lg border-2 border-border/60 bg-card resize-none focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <p className="text-xs text-muted-foreground italic">
              Toque numa emoção para selecionar/remover. Toque numa selecionada
              para ajustar o nível dela no termômetro.
            </p>
          </div>
        </div>
      </div>
    </SceneBackdrop>
  );
}
