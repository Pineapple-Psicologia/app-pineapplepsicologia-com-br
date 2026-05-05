import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Eraser, Trash2, Pencil, Undo2, Download, Brush, Highlighter,
  Square, Circle as CircleIcon, Minus, ArrowRight, Type, Smile,
  LayoutGrid, Sparkles, Wand2, Waves, Zap, Rainbow, SprayCan, PaintBucket, Plus,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { useRoom, RoomMessage } from "@/lib/useRoom";
import { TEMPLATES, buildTemplate, type TemplateId } from "@/lib/whiteboardTemplates";

type BrushTool = "pen" | "marker" | "brush" | "neon" | "rainbow" | "spray";
type Tool = BrushTool | "rect" | "circle" | "line" | "arrow" | "text" | "sticker" | "eraser" | "fill";

type Path = { type: "path"; tool: BrushTool; color: string; size: number; points: { x: number; y: number; w?: number }[] };
type Shape = { type: "rect" | "circle" | "line" | "arrow"; color: string; size: number; x1: number; y1: number; x2: number; y2: number };
type TextObj = { type: "text"; color: string; size: number; x: number; y: number; text: string };
type Sticker = { type: "sticker"; emoji: string; x: number; y: number; size: number };
type Fill = { type: "fill"; color: string; x: number; y: number };
type Obj = (Path | Shape | TextObj | Sticker | Fill) & { id: string };

const COLORS = [
  "#1a1a1a", "#ffffff", "#DF9628", "#8E9337",
  "#e63946", "#f4a261", "#ffd166", "#06d6a0",
  "#3a86ff", "#7b2cbf", "#ff70a6", "#8d5524",
];
const EXTRA_COLORS = [
  "#2b2d42", "#6c757d", "#adb5bd", "#f8edeb",
  "#ff006e", "#fb5607", "#ffbe0b", "#8338ec",
  "#3a0ca3", "#4361ee", "#4cc9f0", "#80ed99",
  "#2a9d8f", "#264653", "#bc6c25", "#dda15e",
  "#fec5bb", "#cdb4db", "#a2d2ff", "#bde0fe",
  "#ffafcc", "#ffc8dd", "#b5179e", "#590d22",
];
const STICKERS = ["⭐", "❤️", "😀", "😢", "😡", "😨", "🥰", "🤔", "🎈", "🌈", "☀️", "🌧️", "⚡", "🌸", "🐶", "🐱", "🦄", "🧸", "🎨", "🏠"];
const BACKGROUNDS = [
  { id: "blank", label: "Liso" },
  { id: "grid", label: "Grade" },
  { id: "dots", label: "Pontos" },
  { id: "lined", label: "Pautado" },
] as const;
type BgId = typeof BACKGROUNDS[number]["id"];

const uid = () => Math.random().toString(36).slice(2, 10);

export default function Whiteboard({ room }: { room: ReturnType<typeof useRoom> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(10);
  const [bg, setBg] = useState<BgId>("blank");
  const [sticker, setSticker] = useState(STICKERS[0]);
  const [showStickers, setShowStickers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [stabilize, setStabilize] = useState(true);
  const [shapeAssist, setShapeAssist] = useState(true);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string; id?: string; color?: string; size?: number } | null>(null);

  const objectsRef = useRef<Obj[]>([]);
  const draftRef = useRef<Obj | null>(null);
  const drawingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const peerCursor = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastSentCursor = useRef(0);
  const localCursor = useRef<{ x: number; y: number; t: number; inside: boolean } | null>(null);
  const lastPoint = useRef<{ x: number; y: number; t: number } | null>(null);
  const smoothedRef = useRef<{ x: number; y: number } | null>(null);
  const eraseModeRef = useRef(false);
  const textDragRef = useRef<{ id: string; offsetX: number; offsetY: number; moved: boolean; startX: number; startY: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ---------- drawing ----------
  const drawObj = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, o: Obj) => {
    ctx.save();
    if (o.type === "path") {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const baseW =
        o.tool === "marker" ? o.size * 2.5 :
        o.tool === "brush" ? o.size * 1.6 :
        o.tool === "neon" ? o.size * 1.2 :
        o.tool === "spray" ? o.size * 0.6 :
        o.size;
      const pts = o.points;

      if (o.tool === "spray") {
        // spray: scatter dots around each point
        ctx.fillStyle = o.color;
        ctx.globalAlpha = 0.55;
        const radius = o.size * 2.2;
        for (const p of pts) {
          const px = p.x * w, py = p.y * h;
          const dots = Math.max(6, Math.round(o.size * 1.2));
          for (let i = 0; i < dots; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * radius;
            ctx.beginPath();
            ctx.arc(px + Math.cos(a) * r, py + Math.sin(a) * r, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        return;
      }

      ctx.strokeStyle = o.color;
      if (o.tool === "marker") ctx.globalAlpha = 0.35;
      if (o.tool === "brush") {
        ctx.shadowColor = o.color;
        ctx.shadowBlur = o.size * 0.8;
      }
      if (o.tool === "neon") {
        ctx.shadowColor = o.color;
        ctx.shadowBlur = o.size * 2.4;
      }

      const drawSmoothPath = (strokeColor?: string) => {
        if (strokeColor) ctx.strokeStyle = strokeColor;
        ctx.lineWidth = baseW;
        ctx.beginPath();
        ctx.moveTo(pts[0].x * w, pts[0].y * h);
        for (let i = 1; i < pts.length - 1; i++) {
          const cx = (pts[i].x * w + pts[i + 1].x * w) / 2;
          const cy = (pts[i].y * h + pts[i + 1].y * h) / 2;
          ctx.quadraticCurveTo(pts[i].x * w, pts[i].y * h, cx, cy);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x * w, last.y * h);
        ctx.stroke();
      };

      if (pts.length < 2) {
        ctx.beginPath();
        ctx.arc(pts[0].x * w, pts[0].y * h, baseW / 2, 0, Math.PI * 2);
        ctx.fillStyle = o.color;
        ctx.fill();
      } else if (o.tool === "rainbow") {
        // segment-by-segment hue cycling
        ctx.lineWidth = baseW;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i];
          const hue = ((i / pts.length) * 360 + (o.points.length * 7)) % 360;
          ctx.strokeStyle = `hsl(${hue}, 90%, 55%)`;
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          const next = pts[i + 1] ?? b;
          const cx = (b.x * w + next.x * w) / 2;
          const cy = (b.y * h + next.y * h) / 2;
          ctx.quadraticCurveTo(b.x * w, b.y * h, cx, cy);
          ctx.stroke();
        }
      } else if (o.tool === "neon") {
        // double-pass: glow then bright white core
        drawSmoothPath();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.95;
        drawSmoothPath("#ffffff");
        ctx.lineWidth = Math.max(1, baseW * 0.4);
        drawSmoothPath("#ffffff");
      } else if (o.tool === "brush" && pts.some((p) => p.w !== undefined)) {
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i];
          const wa = (a.w ?? 1) * baseW;
          const wb = (b.w ?? 1) * baseW;
          ctx.lineWidth = (wa + wb) / 2;
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          const next = pts[i + 1] ?? b;
          const cx = (b.x * w + next.x * w) / 2;
          const cy = (b.y * h + next.y * h) / 2;
          ctx.quadraticCurveTo(b.x * w, b.y * h, cx, cy);
          ctx.stroke();
        }
      } else {
        drawSmoothPath();
      }
    } else if (o.type === "fill") {
      // True flood fill: only fills the connected region at (x,y),
      // respecting strokes/contours already drawn on the canvas.
      const sx = Math.max(0, Math.min(w - 1, Math.floor(o.x * w)));
      const sy = Math.max(0, Math.min(h - 1, Math.floor(o.y * h)));
      const img = ctx.getImageData(0, 0, w, h);
      const data = img.data;
      const idx = (x: number, y: number) => (y * w + x) * 4;
      const startIdx = idx(sx, sy);
      const tr = data[startIdx], tg = data[startIdx + 1], tb = data[startIdx + 2], ta = data[startIdx + 3];

      // parse fill color (hex #rrggbb)
      const hex = o.color.replace("#", "");
      const fr = parseInt(hex.substring(0, 2), 16);
      const fg = parseInt(hex.substring(2, 4), 16);
      const fb = parseInt(hex.substring(4, 6), 16);
      const fa = 255;

      // skip if already same color
      if (!(tr === fr && tg === fg && tb === fb && ta === fa)) {
        const tol = 32; // tolerance to bridge antialiased edges
        const match = (i: number) =>
          Math.abs(data[i] - tr) <= tol &&
          Math.abs(data[i + 1] - tg) <= tol &&
          Math.abs(data[i + 2] - tb) <= tol &&
          Math.abs(data[i + 3] - ta) <= tol;

        // scanline flood fill
        const stack: number[] = [sx, sy];
        const visited = new Uint8Array(w * h);
        while (stack.length) {
          const y = stack.pop()!;
          let x = stack.pop()!;
          let i = idx(x, y);
          if (visited[y * w + x] || !match(i)) continue;
          // walk left
          let xl = x;
          while (xl >= 0 && !visited[y * w + xl] && match(idx(xl, y))) xl--;
          xl++;
          // walk right
          let xr = x;
          while (xr < w && !visited[y * w + xr] && match(idx(xr, y))) xr++;
          xr--;
          for (let cx = xl; cx <= xr; cx++) {
            const ci = idx(cx, y);
            data[ci] = fr; data[ci + 1] = fg; data[ci + 2] = fb; data[ci + 3] = fa;
            visited[y * w + cx] = 1;
            if (y > 0) {
              const ai = idx(cx, y - 1);
              if (!visited[(y - 1) * w + cx] && match(ai)) stack.push(cx, y - 1);
            }
            if (y < h - 1) {
              const bi = idx(cx, y + 1);
              if (!visited[(y + 1) * w + cx] && match(bi)) stack.push(cx, y + 1);
            }
          }
        }
        ctx.putImageData(img, 0, 0);
      }
    } else if (o.type === "rect" || o.type === "circle" || o.type === "line" || o.type === "arrow") {
      ctx.strokeStyle = o.color;
      ctx.lineWidth = o.size;
      ctx.lineCap = "round";
      const x1 = o.x1 * w, y1 = o.y1 * h, x2 = o.x2 * w, y2 = o.y2 * h;
      ctx.beginPath();
      if (o.type === "rect") ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      else if (o.type === "circle") {
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (o.type === "line" || o.type === "arrow") {
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (o.type === "arrow") {
          const a = Math.atan2(y2 - y1, x2 - x1);
          const head = Math.max(10, o.size * 3);
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - head * Math.cos(a - Math.PI / 6), y2 - head * Math.sin(a - Math.PI / 6));
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - head * Math.cos(a + Math.PI / 6), y2 - head * Math.sin(a + Math.PI / 6));
          ctx.stroke();
        }
      }
    } else if (o.type === "text") {
      ctx.fillStyle = o.color;
      ctx.font = `600 ${o.size * 4}px "Nunito", system-ui`;
      ctx.textBaseline = "top";
      o.text.split("\n").forEach((line, i) => ctx.fillText(line, o.x * w, o.y * h + i * o.size * 4.6));
    } else if (o.type === "sticker") {
      ctx.font = `${o.size * 6}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(o.emoji, o.x * w, o.y * h);
    }
    ctx.restore();
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    if (bg === "blank") return;
    ctx.strokeStyle = "rgba(142,147,55,0.18)";
    ctx.lineWidth = 1;
    const step = 28;
    if (bg === "grid") {
      for (let x = 0; x <= w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    } else if (bg === "lined") {
      for (let y = step; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    } else if (bg === "dots") {
      ctx.fillStyle = "rgba(142,147,55,0.35)";
      for (let x = step; x < w; x += step)
        for (let y = step; y < h; y += step) { ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill(); }
    }
  }, [bg]);

  const redraw = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    drawBackground(ctx, c.width, c.height);
    objectsRef.current.forEach((o) => drawObj(ctx, c.width, c.height, o));
    if (draftRef.current) drawObj(ctx, c.width, c.height, draftRef.current);
  }, [drawBackground, drawObj]);

  // resize keeping image
  useEffect(() => {
    const c = canvasRef.current!, o = overlayRef.current!;
    const resize = () => {
      const rect = wrapperRef.current!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      [c, o].forEach((el) => {
        el.width = rect.width * dpr;
        el.height = rect.height * dpr;
      });
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapperRef.current!);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => { redraw(); }, [bg, redraw]);

  // ---------- realtime ----------
  useEffect(() => {
    room.send("wb:request", {});
    return room.on((m: RoomMessage) => {
      if (m.type === "wb:request") {
        room.send("wb:snapshot", { objects: objectsRef.current, bg });
      } else if (m.type === "wb:snapshot") {
        if (Array.isArray(m.payload?.objects)) {
          objectsRef.current = m.payload.objects;
          if (m.payload.bg) setBg(m.payload.bg);
          redraw();
        }
      } else if (m.type === "wb:add") {
        objectsRef.current.push(m.payload);
        redraw();
      } else if (m.type === "wb:draft") {
        draftRef.current = m.payload;
        redraw();
      } else if (m.type === "wb:undo") {
        objectsRef.current = objectsRef.current.filter((o) => o.id !== m.payload.id);
        redraw();
      } else if (m.type === "wb:clear") {
        objectsRef.current = [];
        draftRef.current = null;
        redraw();
      } else if (m.type === "wb:bg") {
        setBg(m.payload);
      } else if (m.type === "wb:cursor") {
        peerCursor.current = { ...m.payload, t: Date.now() };
      }
    });
  }, [room, redraw, bg]);

  // overlay render loop (peer cursor + local brush preview)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const o = overlayRef.current;
      if (o) {
        const ctx = o.getContext("2d")!;
        ctx.clearRect(0, 0, o.width, o.height);
        // peer cursor
        const pc = peerCursor.current;
        if (pc && Date.now() - pc.t < 3000) {
          const x = pc.x * o.width, y = pc.y * o.height;
          ctx.fillStyle = "#DF9628";
          ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
        }
        // local brush preview
        const lc = localCursor.current;
        const isBrushTool = tool === "pen" || tool === "marker" || tool === "brush" || tool === "neon" || tool === "rainbow" || tool === "spray" || tool === "eraser";
        if (lc && lc.inside && isBrushTool) {
          const x = lc.x * o.width, y = lc.y * o.height;
          const dpr = window.devicePixelRatio || 1;
          const baseW =
            tool === "marker" ? size * 2.5 :
            tool === "brush" ? size * 1.6 :
            tool === "neon" ? size * 1.2 :
            tool === "spray" ? size * 2.2 :
            size;
          const r = (tool === "eraser" ? 14 : baseW / 2) * dpr;

          // "Lazy brush" leash: while drawing with stabilizer on, show the line
          // between the actual cursor and the smoothed pen tip — child sees the
          // brush following firmly behind their hand.
          const sm = smoothedRef.current;
          if (drawingRef.current && stabilize && sm && tool !== "eraser") {
            const sx = sm.x * o.width, sy = sm.y * o.height;
            ctx.strokeStyle = "rgba(0,0,0,0.25)";
            ctx.lineWidth = 1 * dpr;
            ctx.setLineDash([3 * dpr, 3 * dpr]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(sx, sy);
            ctx.stroke();
            ctx.setLineDash([]);
            // small dot at the smoothed tip
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(2 * dpr, r * 0.2), 0, Math.PI * 2);
            ctx.fill();
          }

          if (tool === "eraser") {
            // white halo + red dashed ring
            ctx.strokeStyle = "rgba(255,255,255,0.95)";
            ctx.lineWidth = 4 * dpr;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = "rgba(230, 57, 70, 0.95)";
            ctx.lineWidth = 2 * dpr;
            ctx.setLineDash([4 * dpr, 4 * dpr]);
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
          } else {
            // soft fill
            ctx.fillStyle = color + (tool === "marker" ? "40" : "26");
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            // white halo so it stays visible on any color
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 3 * dpr;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
            // colored ring on top
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5 * dpr;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
          }

          // precision crosshair at exact pointer position
          ctx.strokeStyle = "rgba(0,0,0,0.85)";
          ctx.lineWidth = 1 * dpr;
          const cross = 4 * dpr;
          ctx.beginPath();
          ctx.moveTo(x - cross, y); ctx.lineTo(x + cross, y);
          ctx.moveTo(x, y - cross); ctx.lineTo(x, y + cross);
          ctx.stroke();
          // tiny white center dot
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.beginPath(); ctx.arc(x, y, 1.2 * dpr, 0, Math.PI * 2); ctx.fill();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tool, size, color, stabilize]);

  // ---------- input ----------
  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!, r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const commit = (o: Obj) => {
    objectsRef.current.push(o);
    room.send("wb:add", o);
    draftRef.current = null;
    redraw();
  };

  const onDown = (e: React.PointerEvent) => {
    if (textInput) return;
    const p = pos(e);

    // right-click = eraser shortcut
    const rightClick = e.button === 2;
    eraseModeRef.current = rightClick;
    const activeTool: Tool = rightClick ? "eraser" : tool;

    if (activeTool === "sticker") {
      commit({ id: uid(), type: "sticker", emoji: sticker, x: p.x, y: p.y, size });
      return;
    }
    if (activeTool === "text") {
      // Don't capture pointer in text mode — it would steal focus from the textarea.
      // Check if clicking on an existing text to edit/move it
      const c = canvasRef.current!;
      const hit = [...objectsRef.current].reverse().find((o) => o.type === "text" && hitText(o as TextObj & { id: string }, p, c.width, c.height)) as (TextObj & { id: string }) | undefined;
      if (hit) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        textDragRef.current = { id: hit.id, offsetX: p.x - hit.x, offsetY: p.y - hit.y, moved: false, startX: p.x, startY: p.y };
        return;
      }
      setTextInput({ x: p.x, y: p.y, value: "" });
      return;
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (activeTool === "fill") {
      commit({ id: uid(), type: "fill", color, x: p.x, y: p.y });
      return;
    }
    if (activeTool === "eraser") {
      const r = 0.02;
      const hit = [...objectsRef.current].reverse().find((o) => isNear(o, p, r));
      if (hit) {
        objectsRef.current = objectsRef.current.filter((o) => o.id !== hit.id);
        room.send("wb:undo", { id: hit.id });
        redraw();
      }
      drawingRef.current = true;
      return;
    }

    drawingRef.current = true;
    startRef.current = p;
    lastPoint.current = { x: p.x, y: p.y, t: performance.now() };
    smoothedRef.current = { x: p.x, y: p.y };
    const isBrush = activeTool === "pen" || activeTool === "marker" || activeTool === "brush" || activeTool === "neon" || activeTool === "rainbow" || activeTool === "spray";
    if (isBrush) {
      const pressure = e.pressure && e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : 1;
      const w = activeTool === "brush" ? pressure : 1;
      draftRef.current = { id: uid(), type: "path", tool: activeTool as BrushTool, color, size, points: [{ x: p.x, y: p.y, w }] };
    } else {
      draftRef.current = { id: uid(), type: activeTool as any, color, size, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    }
    redraw();
  };

  const onMove = (e: React.PointerEvent) => {
    const p = pos(e);
    const now = Date.now();
    // local cursor preview (immediate)
    localCursor.current = { x: p.x, y: p.y, t: now, inside: true };
    // throttled remote cursor
    if (now - lastSentCursor.current > 40) {
      lastSentCursor.current = now;
      room.send("wb:cursor", { x: p.x, y: p.y });
    }
    // Text drag-to-reposition
    if (textDragRef.current) {
      const td = textDragRef.current;
      const obj = objectsRef.current.find((o) => o.id === td.id) as (TextObj & { id: string }) | undefined;
      if (obj) {
        const nx = Math.max(0, Math.min(1, p.x - td.offsetX));
        const ny = Math.max(0, Math.min(1, p.y - td.offsetY));
        if (Math.hypot(p.x - td.startX, p.y - td.startY) > 0.005) td.moved = true;
        obj.x = nx; obj.y = ny;
        redraw();
      }
      return;
    }
    if (!drawingRef.current) return;
    const activeTool: Tool = eraseModeRef.current ? "eraser" : tool;
    if (activeTool === "eraser") {
      const r = 0.02;
      const hit = [...objectsRef.current].reverse().find((o) => isNear(o, p, r));
      if (hit) {
        objectsRef.current = objectsRef.current.filter((o) => o.id !== hit.id);
        room.send("wb:undo", { id: hit.id });
        redraw();
      }
      return;
    }
    const d = draftRef.current; if (!d) return;
    if (d.type === "path") {
      // stabilizer (lazy brush): smooth target point toward cursor
      let sx = p.x, sy = p.y;
      if (stabilize && smoothedRef.current) {
        const alpha = 0.35; // lower = more smoothing
        sx = smoothedRef.current.x + (p.x - smoothedRef.current.x) * alpha;
        sy = smoothedRef.current.y + (p.y - smoothedRef.current.y) * alpha;
        smoothedRef.current = { x: sx, y: sy };
      } else {
        smoothedRef.current = { x: p.x, y: p.y };
      }
      // velocity-based width for brush; pressure overrides if available
      let w = 1;
      if (d.tool === "brush") {
        const usePressure = e.pressure && e.pressure > 0 && e.pressure !== 0.5;
        if (usePressure) {
          w = e.pressure;
        } else {
          const lp = lastPoint.current;
          const tNow = performance.now();
          if (lp) {
            const dt = Math.max(1, tNow - lp.t);
            const dist = Math.hypot(sx - lp.x, sy - lp.y);
            const speed = dist / dt;
            const target = Math.max(0.35, Math.min(1, 1 - speed * 80));
            const prev = (d.points[d.points.length - 1]?.w ?? 1);
            w = prev * 0.7 + target * 0.3;
          }
        }
      }
      d.points.push({ x: sx, y: sy, w });
      lastPoint.current = { x: sx, y: sy, t: performance.now() };
    } else if ("x2" in d) { d.x2 = p.x; d.y2 = p.y; }
    redraw();
    if (now - (lastSentCursor.current - 40) > 60) room.send("wb:draft", d);
  };

  const onUp = () => {
    drawingRef.current = false;
    eraseModeRef.current = false;
    lastPoint.current = null;
    smoothedRef.current = null;
    // Finalize text drag/click-to-edit
    if (textDragRef.current) {
      const td = textDragRef.current;
      const obj = objectsRef.current.find((o) => o.id === td.id) as (TextObj & { id: string }) | undefined;
      textDragRef.current = null;
      if (obj) {
        if (!td.moved) {
          // Click without drag → open editor pre-filled with the text content
          objectsRef.current = objectsRef.current.filter((o) => o.id !== obj.id);
          room.send("wb:undo", { id: obj.id });
          setTextInput({ x: obj.x, y: obj.y, value: obj.text, color: obj.color, size: obj.size });
          redraw();
        } else {
          // Persist new position by replacing the object on peers
          room.send("wb:undo", { id: obj.id });
          room.send("wb:add", obj);
          redraw();
        }
      }
      return;
    }
    const d = draftRef.current;
    if (!d) return;
    if (d.type === "path" && d.points.length < 2) { draftRef.current = null; redraw(); return; }
    if ("x2" in d && Math.hypot((d.x2 - d.x1), (d.y2 - d.y1)) < 0.005) { draftRef.current = null; redraw(); return; }
    // shape recognition: convert pen strokes into clean shapes if user drew one
    let toCommit: Obj = d;
    if (shapeAssist && d.type === "path" && d.tool === "pen" && d.points.length > 8) {
      const recognized = recognizeShape(d);
      if (recognized) toCommit = { ...recognized, id: d.id };
    }
    commit(toCommit);
    room.send("wb:draft", null);
  };

  const onLeave = () => {
    if (localCursor.current) localCursor.current.inside = false;
  };
  const onEnter = (e: React.PointerEvent) => {
    const p = pos(e);
    localCursor.current = { x: p.x, y: p.y, t: Date.now(), inside: true };
  };

  const undo = () => {
    const last = objectsRef.current.pop();
    if (last) { room.send("wb:undo", { id: last.id }); redraw(); }
  };

  const clearAll = () => {
    objectsRef.current = []; draftRef.current = null;
    room.send("wb:clear", {}); redraw();
  };

  const changeBg = (b: BgId) => { setBg(b); room.send("wb:bg", b); };

  const applyTemplate = (id: TemplateId) => {
    const objs = buildTemplate(id);
    objectsRef.current.push(...objs);
    objs.forEach((o) => room.send("wb:add", o));
    setShowTemplates(false);
    redraw();
  };

  const download = () => {
    const c = canvasRef.current!;
    const link = document.createElement("a");
    link.download = `quadro-${Date.now()}.png`;
    link.href = c.toDataURL("image/png");
    link.click();
  };

  const submitText = () => {
    if (!textInput) return;
    const t = textInput.value.trim();
    if (t) {
      const useColor = textInput.color ?? color;
      const useSize = textInput.size ?? size;
      commit({ id: textInput.id ?? uid(), type: "text", color: useColor, size: useSize, x: textInput.x, y: textInput.y, text: t });
    }
    setTextInput(null);
  };

  // ---------- UI ----------
  const ToolBtn = ({ id, label, icon: Icon }: { id: Tool; label: string; icon: any }) => (
    <button
      onClick={() => { setTool(id); setShowStickers(id === "sticker"); }}
      title={label}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border-2 transition ${
        tool === id ? "bg-primary text-primary-foreground border-primary shadow" : "bg-card border-border hover:border-primary/50"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-bold leading-none">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-stretch gap-2 p-2.5 bg-card rounded-2xl border-2 border-border shadow-sm">
        <div className="flex gap-1.5">
          <ToolBtn id="pen" label="Lápis" icon={Pencil} />
          <ToolBtn id="marker" label="Marcador" icon={Highlighter} />
          <ToolBtn id="brush" label="Pincel" icon={Brush} />
          <ToolBtn id="eraser" label="Borracha" icon={Eraser} />
        </div>
        <div className="w-px bg-border" />
        <div className="flex gap-1.5">
          <ToolBtn id="neon" label="Neon" icon={Zap} />
          <ToolBtn id="rainbow" label="Arco-íris" icon={Rainbow} />
          <ToolBtn id="spray" label="Spray" icon={SprayCan} />
          <ToolBtn id="fill" label="Balde" icon={PaintBucket} />
        </div>
        <div className="w-px bg-border" />
        <div className="flex gap-1.5">
          <ToolBtn id="line" label="Linha" icon={Minus} />
          <ToolBtn id="arrow" label="Seta" icon={ArrowRight} />
          <ToolBtn id="rect" label="Quadrado" icon={Square} />
          <ToolBtn id="circle" label="Círculo" icon={CircleIcon} />
        </div>
        <div className="w-px bg-border" />
        <div className="flex gap-1.5">
          <ToolBtn id="text" label="Texto" icon={Type} />
          <ToolBtn id="sticker" label="Adesivo" icon={Smile} />
        </div>

        <div className="w-px bg-border" />

        <div className="flex flex-col justify-center gap-1">
          <div className="flex items-center gap-1">
            <div className="grid grid-cols-6 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-foreground scale-110" : "border-border/60"} transition-transform`}
                  style={{ background: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  title="Mais cores"
                  className="w-6 h-6 rounded-full border-2 border-dashed border-border/80 flex items-center justify-center hover:border-primary"
                  style={{ background: "conic-gradient(#e63946,#f4a261,#ffd166,#06d6a0,#3a86ff,#7b2cbf,#ff70a6,#e63946)" }}
                >
                  <Plus className="w-3 h-3 text-white drop-shadow" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-8 gap-1.5">
                  {EXTRA_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-foreground scale-110" : "border-border/60"} transition-transform`}
                      style={{ background: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                  <label
                    className="w-6 h-6 rounded-full border-2 border-dashed border-border/80 flex items-center justify-center cursor-pointer hover:border-primary"
                    title="Cor personalizada"
                  >
                    <Plus className="w-3 h-3 text-muted-foreground" />
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2">
          <span className="text-[10px] font-bold text-muted-foreground">TAM</span>
          <input type="range" min={2} max={28} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-20" />
          <div className="rounded-full bg-foreground" style={{ width: size, height: size }} />
        </div>

        <div className="w-px bg-border" />

        <div className="flex items-center gap-1">
          <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
          {BACKGROUNDS.map((b) => (
            <button
              key={b.id}
              onClick={() => changeBg(b.id)}
              className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${bg === b.id ? "bg-accent/20 border-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => setStabilize((v) => !v)}
            title="Estabilizador: deixa o traço suave e firme, sem tremer"
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-md border-2 transition ${stabilize ? "bg-accent/20 border-accent text-foreground" : "bg-card border-border text-muted-foreground"}`}
          >
            <Waves className="w-3.5 h-3.5" />Firme
          </button>
          <button
            onClick={() => setShapeAssist((v) => !v)}
            title="Forma Mágica: endireita círculos, quadrados e linhas desenhados à mão"
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-md border-2 transition ${shapeAssist ? "bg-accent/20 border-accent text-foreground" : "bg-card border-border text-muted-foreground"}`}
          >
            <Wand2 className="w-3.5 h-3.5" />Forma Mágica
          </button>
          <Button
            size="sm"
            variant={showTemplates ? "default" : "outline"}
            onClick={() => setShowTemplates((v) => !v)}
          >
            <Sparkles className="w-4 h-4 mr-1" />Modelos
          </Button>
          <Button size="sm" variant="outline" onClick={undo}><Undo2 className="w-4 h-4 mr-1" />Desfazer</Button>
          <Button size="sm" variant="outline" onClick={download}><Download className="w-4 h-4 mr-1" />Salvar</Button>
          <Button size="sm" variant="outline" onClick={clearAll}><Trash2 className="w-4 h-4 mr-1" />Limpar</Button>
        </div>
      </div>

      {/* Templates tray */}
      {showTemplates && (
        <div className="flex flex-wrap gap-2 p-2.5 bg-card rounded-xl border-2 border-accent/40">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t.id)}
              title={t.description}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-border bg-background hover:border-accent hover:bg-accent/10 transition"
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="text-xs font-bold">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sticker tray */}
      {showStickers && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-card rounded-xl border-2 border-border">
          {STICKERS.map((s) => (
            <button
              key={s}
              onClick={() => setSticker(s)}
              className={`text-2xl w-10 h-10 rounded-lg border-2 transition ${sticker === s ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}
            >{s}</button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div ref={wrapperRef} className="relative flex-1 rounded-2xl border-2 border-border bg-white overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerEnter={onEnter}
          onPointerLeave={onLeave}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute inset-0 w-full h-full touch-none"
          style={{
            cursor:
              tool === "sticker" ? "copy"
              : tool === "text" ? "text"
              : (tool === "pen" || tool === "marker" || tool === "brush" || tool === "neon" || tool === "rainbow" || tool === "spray" || tool === "eraser") ? "none"
              : tool === "fill" ? "crosshair"
              : "crosshair"
          }}
        />
        <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        {textInput && (
          <div
            className="absolute z-10"
            style={{ left: `${textInput.x * 100}%`, top: `${textInput.y * 100}%` }}
          >
            <textarea
              autoFocus
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onBlur={submitText}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitText(); } if (e.key === "Escape") setTextInput(null); }}
              className="bg-white/90 border-2 border-primary rounded-md px-2 py-1 text-sm font-semibold outline-none shadow-lg"
              style={{ color: textInput.color ?? color, fontSize: (textInput.size ?? size) * 4 }}
              placeholder="Digite..."
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// hit-test for eraser (rough)
function isNear(o: Obj, p: { x: number; y: number }, r: number): boolean {
  if (o.type === "path") return o.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) < r);
  if (o.type === "sticker" || o.type === "text") return Math.hypot(o.x - p.x, o.y - p.y) < r * 2;
  if ("x2" in o) {
    const minX = Math.min(o.x1, o.x2) - r, maxX = Math.max(o.x1, o.x2) + r;
    const minY = Math.min(o.y1, o.y2) - r, maxY = Math.max(o.y1, o.y2) + r;
    return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
  }
  return false;
}

// Recognize whether a freehand pen stroke is meant to be a circle, rectangle or straight line.
function recognizeShape(d: Path): Shape | null {
  const pts = d.points;
  if (pts.length < 8) return null;
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX, h = maxY - minY;
  if (w < 0.02 && h < 0.02) return null;

  const first = pts[0], last = pts[pts.length - 1];
  const closeDist = Math.hypot(last.x - first.x, last.y - first.y);
  const diag = Math.hypot(w, h);
  const closed = closeDist < diag * 0.25;

  // Straight line: small bbox in one dimension OR very direct path
  let pathLen = 0;
  for (let i = 1; i < pts.length; i++) pathLen += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const directness = diag / Math.max(pathLen, 0.0001);
  if (!closed && directness > 0.92 && pathLen > 0.05) {
    return { type: "line", color: d.color, size: d.size, x1: first.x, y1: first.y, x2: last.x, y2: last.y };
  }

  if (!closed) return null;

  // Circle vs rectangle: measure how well points fit a circle around centroid
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const rx = w / 2, ry = h / 2;
  const r = (rx + ry) / 2;
  let circleErr = 0;
  for (const p of pts) {
    const dist = Math.hypot(p.x - cx, p.y - cy);
    circleErr += Math.abs(dist - r);
  }
  circleErr /= pts.length;
  // Rectangle: most points near the bbox edges
  let rectErr = 0;
  for (const p of pts) {
    const dx = Math.min(Math.abs(p.x - minX), Math.abs(p.x - maxX));
    const dy = Math.min(Math.abs(p.y - minY), Math.abs(p.y - maxY));
    rectErr += Math.min(dx, dy);
  }
  rectErr /= pts.length;

  const aspect = Math.min(w, h) / Math.max(w, h);
  // Prefer circle when aspect is roughly square AND fit is tight
  if (circleErr < r * 0.22 && circleErr < rectErr * 1.1) {
    return { type: "circle", color: d.color, size: d.size, x1: minX, y1: minY, x2: maxX, y2: maxY };
  }
  if (rectErr < diag * 0.04 && aspect > 0.25) {
    return { type: "rect", color: d.color, size: d.size, x1: minX, y1: minY, x2: maxX, y2: maxY };
  }
  return null;
}

// Pixel-accurate hit-test for text objects (matches drawObj font metrics).
function hitText(o: { x: number; y: number; size: number; text: string }, p: { x: number; y: number }, w: number, h: number): boolean {
  const fontPx = o.size * 4;
  const lineH = o.size * 4.6;
  const lines = o.text.split("\n");
  const x0 = o.x * w, y0 = o.y * h;
  const px = p.x * w, py = p.y * h;
  if (py < y0 - 4 || py > y0 + lines.length * lineH + 4) return false;
  // Approximate width: 0.6 * fontPx per char on widest line
  const maxChars = Math.max(...lines.map((l) => l.length));
  const width = Math.max(20, maxChars * fontPx * 0.6);
  return px >= x0 - 4 && px <= x0 + width + 4;
}
