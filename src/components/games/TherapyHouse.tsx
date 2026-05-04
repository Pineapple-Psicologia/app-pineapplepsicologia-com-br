import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { useRoom } from "@/lib/useRoom";

const ROOMS = [
  { id: "sala", label: "Sala", color: "#FFE8B0" },
  { id: "cozinha", label: "Cozinha", color: "#D4E7C5" },
  { id: "quarto", label: "Quarto", color: "#C4D9F0" },
  { id: "banho", label: "Banheiro", color: "#F0C4D9" },
];
const FURNITURE = ["🛋️", "🛏️", "🍽️", "📺", "🪑", "🚿", "🧸", "🪴"];
const EMOTIONS = ["😀", "😢", "😠", "😨", "😐", "🥰"];
const ROLES = ["Mãe", "Pai", "Criança", "Irmão", "Irmã", "Avó", "Avô", "Outro"];

type Char = { id: string; name: string; role: string; emotion: string; room: string; speech?: string };
type Item = { id: string; emoji: string; room: string };
type State = { chars: Char[]; items: Item[] };

const initial: State = { chars: [], items: [] };

export default function TherapyHouse({ room }: { room: ReturnType<typeof useRoom> }) {
  const [state, setState] = useState<State>(initial);
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [selected, setSelected] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const apply = (next: State, broadcast = true) => {
    setState(next);
    if (broadcast) room.send("house:state", next);
  };

  useEffect(() => {
    // request snapshot on mount
    room.send("house:request", {});
    return room.on((m) => {
      if (m.type === "house:state") setState(m.payload);
      if (m.type === "house:request") room.send("house:state", stateRef.current);
    });
  }, [room]);

  const addChar = () => {
    if (!name.trim()) return;
    const c: Char = {
      id: Math.random().toString(36).slice(2, 8),
      name: name.trim(), role, emotion, room: ROOMS[0].id,
    };
    apply({ ...state, chars: [...state.chars, c] });
    setName("");
  };
  const moveChar = (id: string, roomId: string) =>
    apply({ ...state, chars: state.chars.map((c) => c.id === id ? { ...c, room: roomId } : c) });
  const setEmotionOf = (id: string, em: string) =>
    apply({ ...state, chars: state.chars.map((c) => c.id === id ? { ...c, emotion: em } : c) });
  const setSpeech = (id: string, text: string) =>
    apply({ ...state, chars: state.chars.map((c) => c.id === id ? { ...c, speech: text } : c) });
  const removeChar = (id: string) =>
    apply({ ...state, chars: state.chars.filter((c) => c.id !== id) });

  const addItem = (emoji: string, roomId: string) =>
    apply({ ...state, items: [...state.items, { id: Math.random().toString(36).slice(2, 8), emoji, room: roomId }] });
  const removeItem = (id: string) =>
    apply({ ...state, items: state.items.filter((i) => i.id !== id) });

  const reset = () => apply(initial);
  const sel = state.chars.find((c) => c.id === selected);

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-4 h-full">
      <aside className="space-y-4 overflow-auto">
        <div className="p-4 bg-card rounded-xl border space-y-3">
          <h3 className="font-bold">Novo personagem</h3>
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="w-full h-10 px-3 rounded-md border bg-background" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <div className="flex gap-1 flex-wrap">
            {EMOTIONS.map((e) => (
              <button key={e} onClick={() => setEmotion(e)} className={`text-2xl p-1 rounded ${emotion === e ? "bg-accent/30" : ""}`}>{e}</button>
            ))}
          </div>
          <Button onClick={addChar} className="w-full"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
        </div>

        {sel && (
          <div className="p-4 bg-accent/10 border-2 border-accent/40 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold">{sel.name}</div>
                <div className="text-xs text-muted-foreground">{sel.role}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { removeChar(sel.id); setSelected(null); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1">Emoção</div>
              <div className="flex gap-1 flex-wrap">
                {EMOTIONS.map((e) => (
                  <button key={e} onClick={() => setEmotionOf(sel.id, e)} className={`text-2xl p-1 rounded ${sel.emotion === e ? "bg-accent/40" : ""}`}>{e}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1">Fala</div>
              <Input placeholder="O que ele diz?" value={sel.speech ?? ""} onChange={(e) => setSpeech(sel.id, e.target.value)} />
            </div>
            <div>
              <div className="text-xs font-semibold mb-1">Mover para</div>
              <div className="grid grid-cols-2 gap-1">
                {ROOMS.map((r) => (
                  <Button key={r.id} size="sm" variant={sel.room === r.id ? "default" : "outline"} onClick={() => moveChar(sel.id, r.id)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={reset}>Reiniciar casa</Button>
      </aside>

      <div className="grid grid-cols-2 grid-rows-2 gap-3 min-h-[480px]">
        {ROOMS.map((r) => (
          <div key={r.id} className="rounded-2xl border-2 border-border p-3 flex flex-col" style={{ background: r.color }}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-foreground/80">{r.label}</span>
              <div className="flex gap-1">
                {FURNITURE.map((f) => (
                  <button key={f} onClick={() => addItem(f, r.id)} className="text-lg hover:scale-125 transition-transform" title={`Adicionar ${f}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 content-start flex-1">
              {state.items.filter((i) => i.room === r.id).map((i) => (
                <button key={i.id} onClick={() => removeItem(i.id)} className="text-3xl hover:opacity-50" title="Remover">{i.emoji}</button>
              ))}
              {state.chars.filter((c) => c.room === r.id).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`flex flex-col items-center bg-white/80 rounded-xl px-2 py-1.5 border-2 transition ${selected === c.id ? "border-accent" : "border-transparent"}`}
                >
                  <div className="text-3xl">{c.emotion}</div>
                  <div className="text-xs font-semibold">{c.name}</div>
                  {c.speech && (
                    <div className="text-[10px] mt-1 max-w-[100px] bg-white px-2 py-0.5 rounded-full border">💬 {c.speech}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
