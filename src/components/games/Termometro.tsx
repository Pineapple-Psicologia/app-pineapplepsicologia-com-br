import { useEffect, useRef, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Thermometer, RotateCcw } from "lucide-react";
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

export default function Termometro({ room }: Props) {
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [level, setLevel] = useState(0);
  const [note, setNote] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Receive remote updates
  useEffect(() => {
    const off = room.on((m) => {
      if (m.type === "thermo:state") {
        const p = m.payload as { emotionId: string; level: number; note?: string };
        const found = EMOTIONS.find((e) => e.id === p.emotionId);
        if (found) setEmotion(found);
        setLevel(p.level);
        if (typeof p.note === "string") setNote(p.note);
      }
    });
    return off;
  }, [room]);

  const broadcast = (next: { emotionId?: string; level?: number; note?: string }) => {
    room.send("thermo:state", {
      emotionId: next.emotionId ?? emotion.id,
      level: next.level ?? level,
      note: next.note ?? note,
    });
  };

  const setLevelFromY = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / rect.height;
    const v = Math.round(Math.max(0, Math.min(1, ratio)) * 10);
    setLevel(v);
    broadcast({ level: v });
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

  const fillPct = (level / 10) * 100;

  return (
    <div className="h-full w-full bg-gradient-to-br from-background to-muted/40 rounded-xl border-2 border-border/60 p-4 md:p-6 flex flex-col gap-4 overflow-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Termômetro das Emoções</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLevel(0);
            setNote("");
            broadcast({ level: 0, note: "" });
          }}
        >
          <RotateCcw className="w-4 h-4 mr-1" /> Zerar
        </Button>
      </header>

      {/* Emotion picker */}
      <div className="flex flex-wrap gap-2">
        {EMOTIONS.map((e) => {
          const active = e.id === emotion.id;
          return (
            <button
              key={e.id}
              onClick={() => {
                setEmotion(e);
                broadcast({ emotionId: e.id });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold transition-all ${
                active
                  ? "border-foreground shadow-md scale-105"
                  : "border-border/60 hover:border-border bg-card"
              }`}
              style={active ? { backgroundColor: e.color + "30", borderColor: e.color } : {}}
            >
              <span className="text-lg">{e.emoji}</span> {e.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-stretch min-h-[400px]">
        {/* Thermometer */}
        <div className="flex items-center justify-center">
          <div className="flex items-end gap-3 select-none">
            {/* numbers */}
            <div className="flex flex-col justify-between h-[360px] text-xs font-bold text-muted-foreground py-1">
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>

            {/* thermometer body */}
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
                {/* fill */}
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-150 ease-out"
                  style={{
                    height: `${fillPct}%`,
                    background: `linear-gradient(to top, ${emotion.color}, ${emotion.color}cc)`,
                  }}
                />
                {/* tick marks */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className="h-px bg-foreground/20 mx-2" />
                  ))}
                </div>
              </div>
              {/* bulb */}
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-foreground/80 flex items-center justify-center text-3xl"
                style={{ backgroundColor: emotion.color }}
              >
                {emotion.emoji}
              </div>
            </div>
          </div>
        </div>

        {/* Reading + note */}
        <div className="flex flex-col gap-4 min-w-0">
          <div
            className="rounded-xl p-5 border-2 text-center"
            style={{ backgroundColor: emotion.color + "20", borderColor: emotion.color }}
          >
            <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              {emotion.label}
            </div>
            <div className="text-6xl font-black my-1" style={{ color: emotion.color }}>
              {level}
            </div>
            <div className="text-sm font-semibold">{LEVEL_LABELS[level]}</div>
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
            Arraste no termômetro pra mudar o nível. O outro lado vê em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
