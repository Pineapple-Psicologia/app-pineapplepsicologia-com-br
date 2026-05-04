import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2, Pencil } from "lucide-react";
import type { useRoom } from "@/lib/useRoom";

const COLORS = ["#1a1a1a", "#DF9628", "#8E9337", "#d6334d", "#3a86ff", "#7b2cbf", "#ff8fab"];

type Stroke = { x: number; y: number; color: string; size: number; nx: number; ny: number };

export default function Whiteboard({ room }: { room: ReturnType<typeof useRoom> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(4);
  const [erasing, setErasing] = useState(false);

  // Use normalized coords (0..1) so different screen sizes sync
  const drawSegment = (s: Stroke) => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.beginPath();
    ctx.moveTo(s.x * c.width, s.y * c.height);
    ctx.lineTo(s.nx * c.width, s.ny * c.height);
    ctx.stroke();
  };

  const clearAll = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };

  useEffect(() => {
    const c = canvasRef.current!;
    const resize = () => {
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "wb:stroke") drawSegment(m.payload);
      if (m.type === "wb:clear") clearAll();
    });
  }, [room]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const onDown = (e: React.PointerEvent) => {
    drawingRef.current = true;
    lastRef.current = pos(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !lastRef.current) return;
    const p = pos(e);
    const stroke: Stroke = {
      x: lastRef.current.x,
      y: lastRef.current.y,
      nx: p.x,
      ny: p.y,
      color: erasing ? "#ffffff" : color,
      size: erasing ? 24 : size,
    };
    drawSegment(stroke);
    room.send("wb:stroke", stroke);
    lastRef.current = p;
  };
  const onUp = () => {
    drawingRef.current = false;
    lastRef.current = null;
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card rounded-xl border">
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setErasing(false); }}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c && !erasing ? "border-foreground scale-110" : "border-border"}`}
              style={{ background: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-muted-foreground" />
          <input
            type="range" min={2} max={20} value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          size="sm"
          variant={erasing ? "default" : "outline"}
          onClick={() => setErasing((v) => !v)}
        >
          <Eraser className="w-4 h-4 mr-1" /> Borracha
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => { clearAll(); room.send("wb:clear", {}); }}
        >
          <Trash2 className="w-4 h-4 mr-1" /> Apagar tudo
        </Button>
      </div>
      <div className="flex-1 rounded-xl border-2 border-border bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="w-full h-full touch-none cursor-crosshair"
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
}
