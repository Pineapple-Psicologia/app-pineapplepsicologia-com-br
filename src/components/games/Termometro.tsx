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
  { id: "amor", label: "Amor", emoji: "🥰", color: "#FF4D8D" },
  { id: "gratidao", label: "Gratidão", emoji: "🙏", color: "#F4A261" },
  { id: "orgulho", label: "Orgulho", emoji: "😎", color: "#8338EC" },
  { id: "esperanca", label: "Esperança", emoji: "🌱", color: "#52B788" },
  { id: "surpresa", label: "Surpresa", emoji: "😲", color: "#48CAE4" },
  { id: "nojo", label: "Nojo", emoji: "🤢", color: "#7CB518" },
  { id: "vergonha", label: "Vergonha", emoji: "😳", color: "#EF8354" },
  { id: "culpa", label: "Culpa", emoji: "😔", color: "#6D597A" },
  { id: "inveja", label: "Inveja", emoji: "😒", color: "#386641" },
  { id: "ciume", label: "Ciúme", emoji: "😤", color: "#9D4EDD" },
  { id: "solidao", label: "Solidão", emoji: "🥺", color: "#4A6FA5" },
  { id: "tedio", label: "Tédio", emoji: "😑", color: "#A8A8A8" },
  { id: "cansaco", label: "Cansaço", emoji: "😮‍💨", color: "#6C757D" },
  { id: "frustracao", label: "Frustração", emoji: "😣", color: "#BC4749" },
  { id: "confusao", label: "Confusão", emoji: "😕", color: "#9C89B8" },
  { id: "alivio", label: "Alívio", emoji: "😮‍💨", color: "#80B918" },
  { id: "entusiasmo", label: "Entusiasmo", emoji: "🤩", color: "#FF006E" },
  { id: "curiosidade", label: "Curiosidade", emoji: "🤔", color: "#00B4D8" },
  { id: "afeto", label: "Afeto", emoji: "🤗", color: "#FFB4A2" },
  { id: "coragem", label: "Coragem", emoji: "💪", color: "#D00000" },
  { id: "insegurança", label: "Insegurança", emoji: "😬", color: "#5A189A" },
  { id: "irritacao", label: "Irritação", emoji: "😠", color: "#F77F00" },
];

const LEVEL_LABELS = [
  "Nada", "Quase nada", "Pouquinho", "Pouco", "Mais ou menos",
  "Médio", "Bastante", "Muito", "Muitíssimo", "Quase no máximo", "Máximo",
];

type Selected = { id: string; level: number };

function ThermoColumn({
  emotion,
  level,
  onChange,
  onRemove,
}: {
  emotion: typeof EMOTIONS[number];
  level: number;
  onChange: (v: number) => void;
  onRemove: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const setLevelFromY = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / rect.height;
    onChange(Math.round(Math.max(0, Math.min(1, ratio)) * 10));
  };

  const fillPct = (level / 10) * 100;

  return (
    <div
      className="relative flex flex-col items-center gap-2 p-3 pt-2 rounded-2xl border-2 bg-white/80 backdrop-blur shadow-md min-w-[110px]"
      style={{ borderColor: emotion.color }}
    >
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 hover:bg-white grid place-items-center border border-border/60"
        aria-label={`Remover ${emotion.label}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-1.5 text-sm font-bold">
        <span className="text-xl">{emotion.emoji}</span>
        <span>{emotion.label}</span>
      </div>

      <div className="flex items-end gap-2 select-none">
        <div className="flex flex-col justify-between h-[min(280px,42vh)] text-[10px] font-bold text-muted-foreground py-1">
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>

        <div className="relative">
          <div
            ref={trackRef}
            onPointerDown={(e) => {
              draggingRef.current = true;
              (e.target as Element).setPointerCapture?.(e.pointerId);
              setLevelFromY(e.clientY);
            }}
            onPointerMove={(e) => {
              if (!draggingRef.current) return;
              setLevelFromY(e.clientY);
            }}
            onPointerUp={() => (draggingRef.current = false)}
            onPointerCancel={() => (draggingRef.current = false)}
            className="relative w-10 sm:w-12 h-[min(280px,42vh)] rounded-full bg-muted border-4 border-foreground/80 cursor-pointer overflow-hidden touch-none"
            style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.4)" }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-150 ease-out"
              style={{
                height: `${fillPct}%`,
                background: `linear-gradient(to top, ${emotion.color}, ${emotion.color}cc)`,
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="h-px bg-foreground/20 mx-2" />
              ))}
            </div>
          </div>
          <div
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-[3px] border-foreground/80 flex items-center justify-center text-2xl shadow"
            style={{ backgroundColor: emotion.color }}
          >
            {emotion.emoji}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="text-3xl font-black leading-none" style={{ color: emotion.color }}>
          {level}
        </div>
        <div className="text-[11px] font-semibold mt-0.5">{LEVEL_LABELS[level]}</div>
      </div>
    </div>
  );
}

export default function Termometro({ room }: Props) {
  const [selected, setSelected] = useState<Selected[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    const off = room.on((m) => {
      if (m.type === "thermo:state") {
        const p = m.payload as {
          selected?: Selected[];
          note?: string;
          emotionId?: string;
          level?: number;
        };
        if (Array.isArray(p.selected)) {
          setSelected(p.selected);
        } else if (p.emotionId) {
          setSelected([{ id: p.emotionId, level: p.level ?? 0 }]);
        }
        if (typeof p.note === "string") setNote(p.note);
      }
    });
    return off;
  }, [room]);

  const broadcast = (next: { selected?: Selected[]; note?: string }) => {
    room.send("thermo:state", {
      selected: next.selected ?? selected,
      note: next.note ?? note,
    });
  };

  const toggleEmotion = (id: string) => {
    const exists = selected.some((s) => s.id === id);
    let next: Selected[];
    if (exists) {
      next = selected.filter((s) => s.id !== id);
      if (next.length === 0) next = [{ id, level: 0 }];
    } else {
      next = [...selected, { id, level: 0 }];
    }
    setSelected(next);
    broadcast({ selected: next });
  };

  const updateLevel = (id: string, v: number) => {
    const next = selected.map((s) => (s.id === id ? { ...s, level: v } : s));
    setSelected(next);
    broadcast({ selected: next });
  };

  const resetAll = () => {
    const next = selected.map((s) => ({ ...s, level: 0 }));
    setSelected(next);
    setNote("");
    broadcast({ selected: next, note: "" });
  };

  return (
    <SceneBackdrop src={sceneBg} vignette={0.35} tint="rgba(186,230,253,0.45)">
      <div className="h-full w-full p-4 md:p-6 flex flex-col gap-4 overflow-auto">
        <header className="flex items-center justify-between flex-wrap gap-3 bg-white/85 backdrop-blur rounded-2xl border-2 border-white shadow-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Termômetro das Emoções</h2>
          </div>
          <Button size="sm" variant="outline" onClick={resetAll}>
            <RotateCcw className="w-4 h-4 mr-1" /> Zerar
          </Button>
        </header>

        {/* Emotion picker */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Escolha uma ou mais emoções ({selected.length} selecionada{selected.length > 1 ? "s" : ""})
          </p>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => {
              const isSelected = selected.some((s) => s.id === e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => toggleEmotion(e.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold transition-all ${
                    isSelected ? "shadow-md scale-105" : "border-border/60 hover:border-border bg-card opacity-70"
                  }`}
                  style={isSelected ? { backgroundColor: e.color + "30", borderColor: e.color } : {}}
                >
                  <span className="text-lg">{e.emoji}</span> {e.label}
                  {isSelected && <span className="ml-1 text-[10px] opacity-70">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thermometers — one per selected emotion */}
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 px-1 -mx-1">
          {selected.map((s) => {
            const em = EMOTIONS.find((e) => e.id === s.id);
            if (!em) return null;
            return (
              <ThermoColumn
                key={s.id}
                emotion={em}
                level={s.level}
                onChange={(v) => updateLevel(s.id, v)}
                onRemove={() => toggleEmotion(s.id)}
              />
            );
          })}
        </div>

        {/* Note */}
        <div className="flex flex-col gap-2">
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
            className="min-h-[100px] p-3 rounded-lg border-2 border-border/60 bg-card/90 backdrop-blur resize-none focus:outline-none focus:border-primary text-sm"
          />
          <p className="text-xs text-muted-foreground italic">
            Toque numa emoção para adicionar ou remover. Arraste cada termômetro para ajustar o nível.
          </p>
        </div>
      </div>
    </SceneBackdrop>
  );
}
