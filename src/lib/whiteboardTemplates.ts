// Pre-built therapeutic templates rendered as whiteboard objects.
// All coordinates are normalized (0-1) so they scale to any canvas.

type Path = { type: "path"; tool: "pen"; color: string; size: number; points: { x: number; y: number }[] };
type Shape = { type: "rect" | "circle" | "line" | "arrow"; color: string; size: number; x1: number; y1: number; x2: number; y2: number };
type TextObj = { type: "text"; color: string; size: number; x: number; y: number; text: string };
type Sticker = { type: "sticker"; emoji: string; x: number; y: number; size: number };
type Obj = (Path | Shape | TextObj | Sticker) & { id: string };

const uid = () => Math.random().toString(36).slice(2, 10);
const INK = "#1a1a1a";
const ACCENT = "#DF9628";
const OLIVE = "#8E9337";

function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 40): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + (to - from) * (i / steps);
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

export type TemplateId = "face" | "thermometer" | "body" | "family" | "feelings" | "scale";

export const TEMPLATES: { id: TemplateId; label: string; emoji: string; description: string }[] = [
  { id: "face", label: "Rosto", emoji: "🙂", description: "Rosto vazio para desenhar emoções" },
  { id: "feelings", label: "Sentimentos", emoji: "🎭", description: "Roda de emoções básicas" },
  { id: "thermometer", label: "Termômetro", emoji: "🌡️", description: "Termômetro do humor 0-10" },
  { id: "scale", label: "Escala", emoji: "📊", description: "Escala visual de 1 a 5" },
  { id: "body", label: "Corpo", emoji: "🧍", description: "Silhueta para mapear sensações" },
  { id: "family", label: "Família", emoji: "👨‍👩‍👧", description: "Figuras para representar a família" },
];

export function buildTemplate(id: TemplateId): Obj[] {
  switch (id) {
    case "face":      return faceTemplate();
    case "feelings":  return feelingsTemplate();
    case "thermometer": return thermometerTemplate();
    case "scale":     return scaleTemplate();
    case "body":      return bodyTemplate();
    case "family":    return familyTemplate();
  }
}

// ---------- Rosto vazio ----------
function faceTemplate(): Obj[] {
  const cx = 0.5, cy = 0.5, r = 0.22;
  return [
    { id: uid(), type: "path", tool: "pen", color: INK, size: 4, points: arc(cx, cy, r, 0, Math.PI * 2) },
    // eyes
    { id: uid(), type: "path", tool: "pen", color: INK, size: 4, points: arc(cx - r * 0.4, cy - r * 0.2, r * 0.07, 0, Math.PI * 2) },
    { id: uid(), type: "path", tool: "pen", color: INK, size: 4, points: arc(cx + r * 0.4, cy - r * 0.2, r * 0.07, 0, Math.PI * 2) },
    { id: uid(), type: "text", color: OLIVE, size: 4, x: 0.5 - 0.18, y: 0.08, text: "Como você está se sentindo?" },
  ];
}

// ---------- Roda de sentimentos ----------
function feelingsTemplate(): Obj[] {
  const items = [
    { e: "😀", t: "Feliz" },
    { e: "😢", t: "Triste" },
    { e: "😡", t: "Bravo" },
    { e: "😨", t: "Com medo" },
    { e: "😴", t: "Cansado" },
    { e: "🥰", t: "Amado" },
    { e: "🤔", t: "Confuso" },
    { e: "😌", t: "Calmo" },
  ];
  const objs: Obj[] = [
    { id: uid(), type: "text", color: OLIVE, size: 4, x: 0.5 - 0.16, y: 0.05, text: "Escolha o que você sente" },
  ];
  const cols = 4;
  items.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = 0.18 + col * 0.21;
    const y = 0.32 + row * 0.32;
    objs.push({ id: uid(), type: "sticker", emoji: it.e, x, y, size: 10 });
    objs.push({ id: uid(), type: "text", color: INK, size: 3, x: x - 0.05, y: y + 0.09, text: it.t });
  });
  return objs;
}

// ---------- Termômetro do humor ----------
function thermometerTemplate(): Obj[] {
  const x1 = 0.46, x2 = 0.54, top = 0.12, bot = 0.85;
  const objs: Obj[] = [
    { id: uid(), type: "text", color: OLIVE, size: 4, x: 0.32, y: 0.03, text: "Termômetro do humor" },
    { id: uid(), type: "rect", color: INK, size: 3, x1, y1: top, x2, y2: bot },
    { id: uid(), type: "path", tool: "pen", color: INK, size: 3, points: arc(0.5, bot + 0.05, 0.05, 0, Math.PI * 2) },
  ];
  for (let i = 0; i <= 10; i++) {
    const y = bot - (i / 10) * (bot - top);
    objs.push({ id: uid(), type: "line", color: INK, size: 2, x1: x2, y1: y, x2: x2 + 0.025, y2: y });
    objs.push({ id: uid(), type: "text", color: INK, size: 3, x: x2 + 0.04, y: y - 0.015, text: String(i) });
  }
  objs.push({ id: uid(), type: "text", color: ACCENT, size: 3, x: 0.18, y: top, text: "muito intenso" });
  objs.push({ id: uid(), type: "text", color: OLIVE, size: 3, x: 0.22, y: bot - 0.02, text: "tranquilo" });
  return objs;
}

// ---------- Escala 1 a 5 ----------
function scaleTemplate(): Obj[] {
  const faces = ["😄", "🙂", "😐", "😕", "😢"];
  const objs: Obj[] = [
    { id: uid(), type: "text", color: OLIVE, size: 4, x: 0.32, y: 0.15, text: "Quanto isso te incomoda?" },
  ];
  faces.forEach((f, i) => {
    const x = 0.15 + i * 0.175;
    objs.push({ id: uid(), type: "sticker", emoji: f, x, y: 0.5, size: 14 });
    objs.push({ id: uid(), type: "text", color: INK, size: 4, x: x - 0.01, y: 0.68, text: String(i + 1) });
  });
  return objs;
}

// ---------- Silhueta de corpo ----------
function bodyTemplate(): Obj[] {
  const cx = 0.5;
  const head = arc(cx, 0.18, 0.07, 0, Math.PI * 2);
  // body outline
  const body: { x: number; y: number }[] = [
    { x: cx - 0.04, y: 0.25 }, { x: cx - 0.16, y: 0.32 }, { x: cx - 0.18, y: 0.5 },
    { x: cx - 0.16, y: 0.5 }, { x: cx - 0.08, y: 0.55 }, { x: cx - 0.09, y: 0.85 },
    { x: cx - 0.02, y: 0.85 }, { x: cx, y: 0.6 },
    { x: cx + 0.02, y: 0.85 }, { x: cx + 0.09, y: 0.85 }, { x: cx + 0.08, y: 0.55 },
    { x: cx + 0.16, y: 0.5 }, { x: cx + 0.18, y: 0.5 }, { x: cx + 0.16, y: 0.32 },
    { x: cx + 0.04, y: 0.25 }, { x: cx - 0.04, y: 0.25 },
  ];
  return [
    { id: uid(), type: "text", color: OLIVE, size: 4, x: 0.22, y: 0.04, text: "Onde você sente no corpo?" },
    { id: uid(), type: "path", tool: "pen", color: INK, size: 4, points: head },
    { id: uid(), type: "path", tool: "pen", color: INK, size: 4, points: body },
  ];
}

// ---------- Família ----------
function familyTemplate(): Obj[] {
  const figs = [
    { x: 0.18, h: 0.42, label: "" },
    { x: 0.38, h: 0.45, label: "" },
    { x: 0.58, h: 0.30, label: "" },
    { x: 0.78, h: 0.22, label: "" },
  ];
  const objs: Obj[] = [
    { id: uid(), type: "text", color: OLIVE, size: 4, x: 0.22, y: 0.05, text: "Quem mora com você? Escreva o nome" },
  ];
  figs.forEach((f) => {
    const top = 0.85 - f.h;
    const headR = 0.035;
    objs.push({ id: uid(), type: "path", tool: "pen", color: INK, size: 4, points: arc(f.x, top + headR, headR, 0, Math.PI * 2) });
    // body line
    objs.push({ id: uid(), type: "line", color: INK, size: 4, x1: f.x, y1: top + headR * 2, x2: f.x, y2: 0.78 });
    // arms
    objs.push({ id: uid(), type: "line", color: INK, size: 4, x1: f.x - 0.05, y1: top + headR * 2 + 0.04, x2: f.x + 0.05, y2: top + headR * 2 + 0.04 });
    // legs
    objs.push({ id: uid(), type: "line", color: INK, size: 4, x1: f.x, y1: 0.78, x2: f.x - 0.04, y2: 0.85 });
    objs.push({ id: uid(), type: "line", color: INK, size: 4, x1: f.x, y1: 0.78, x2: f.x + 0.04, y2: 0.85 });
    // name line
    objs.push({ id: uid(), type: "line", color: OLIVE, size: 2, x1: f.x - 0.06, y1: 0.91, x2: f.x + 0.06, y2: 0.91 });
  });
  return objs;
}
