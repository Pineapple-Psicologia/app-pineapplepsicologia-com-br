import { useEffect, useMemo, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Shuffle, RotateCcw, HelpCircle, X, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

type Props = { room: ReturnType<typeof useRoom> };

/**
 * História em Espiral — baralho de figuras variadas (natureza, animais, pessoas,
 * situações, objetos, lugares). O paciente vira as cartas, escolhe 3 ou 4 e
 * usa o modelo de espiral mostrado na tela para escrever a história na folha.
 */

type Card = { id: string; emoji: string; label: string; cat: string };

const DECK: Card[] = [
  // Natureza
  { id: "montanha", emoji: "⛰️", label: "Montanha", cat: "Natureza" },
  { id: "floresta", emoji: "🌳", label: "Floresta", cat: "Natureza" },
  { id: "tempestade", emoji: "⛈️", label: "Tempestade", cat: "Natureza" },
  { id: "arcoiris", emoji: "🌈", label: "Arco-íris", cat: "Natureza" },
  { id: "mar", emoji: "🌊", label: "Mar", cat: "Natureza" },
  { id: "fogueira", emoji: "🔥", label: "Fogueira", cat: "Natureza" },
  { id: "lua", emoji: "🌙", label: "Noite de lua", cat: "Natureza" },
  { id: "semente", emoji: "🌱", label: "Semente brotando", cat: "Natureza" },
  // Animais
  { id: "cachorro", emoji: "🐶", label: "Cachorro", cat: "Animais" },
  { id: "gato", emoji: "🐱", label: "Gato", cat: "Animais" },
  { id: "leao", emoji: "🦁", label: "Leão", cat: "Animais" },
  { id: "passaro", emoji: "🐦", label: "Pássaro", cat: "Animais" },
  { id: "tartaruga", emoji: "🐢", label: "Tartaruga", cat: "Animais" },
  { id: "borboleta", emoji: "🦋", label: "Borboleta", cat: "Animais" },
  { id: "lobo", emoji: "🐺", label: "Lobo", cat: "Animais" },
  { id: "peixe", emoji: "🐠", label: "Peixe", cat: "Animais" },
  // Pessoas e família
  { id: "mae", emoji: "👩", label: "Mãe", cat: "Pessoas" },
  { id: "pai", emoji: "👨", label: "Pai", cat: "Pessoas" },
  { id: "familia", emoji: "👨‍👩‍👧", label: "Família junta", cat: "Pessoas" },
  { id: "irmaos", emoji: "🧒🧒", label: "Irmãos", cat: "Pessoas" },
  { id: "avo", emoji: "👵", label: "Avó", cat: "Pessoas" },
  { id: "amigos", emoji: "🧑‍🤝‍🧑", label: "Amigos", cat: "Pessoas" },
  { id: "professor", emoji: "🧑‍🏫", label: "Professor(a)", cat: "Pessoas" },
  { id: "bebe", emoji: "👶", label: "Bebê", cat: "Pessoas" },
  // Situações
  { id: "discussao", emoji: "😠", label: "Discussão", cat: "Situações" },
  { id: "abraco", emoji: "🤗", label: "Abraço", cat: "Situações" },
  { id: "choro", emoji: "😢", label: "Alguém chorando", cat: "Situações" },
  { id: "mudanca", emoji: "📦", label: "Mudança de casa", cat: "Situações" },
  { id: "festa", emoji: "🎉", label: "Festa", cat: "Situações" },
  { id: "prova", emoji: "📝", label: "Dia de prova", cat: "Situações" },
  { id: "despedida", emoji: "👋", label: "Despedida", cat: "Situações" },
  { id: "segredo", emoji: "🤫", label: "Um segredo", cat: "Situações" },
  { id: "medico", emoji: "🏥", label: "Ir ao médico", cat: "Situações" },
  { id: "sozinho", emoji: "🚪", label: "Ficar sozinho", cat: "Situações" },
  { id: "ajuda", emoji: "🤝", label: "Pedir ajuda", cat: "Situações" },
  { id: "conquista", emoji: "🏆", label: "Conquista", cat: "Situações" },
  // Lugares e objetos
  { id: "escola", emoji: "🏫", label: "Escola", cat: "Lugares" },
  { id: "casa", emoji: "🏠", label: "Casa", cat: "Lugares" },
  { id: "parque", emoji: "🛝", label: "Parque", cat: "Lugares" },
  { id: "estrada", emoji: "🛣️", label: "Estrada", cat: "Lugares" },
  { id: "ponte", emoji: "🌉", label: "Ponte", cat: "Lugares" },
  { id: "chave", emoji: "🗝️", label: "Chave", cat: "Objetos" },
  { id: "carta", emoji: "✉️", label: "Carta", cat: "Objetos" },
  { id: "espelho", emoji: "🪞", label: "Espelho", cat: "Objetos" },
  { id: "relogio", emoji: "⏰", label: "Relógio", cat: "Objetos" },
  { id: "caixa", emoji: "🎁", label: "Caixa fechada", cat: "Objetos" },
  { id: "escada", emoji: "🪜", label: "Escada", cat: "Objetos" },
  { id: "barco", emoji: "⛵", label: "Barco", cat: "Objetos" },
];

const STATIONS = [
  { titulo: "Começo", prompt: "Quem é? Onde está? Como tudo começou?", color: "#3A86FF" },
  { titulo: "Acontece algo", prompt: "O que muda na história? O que aparece?", color: "#06D6A0" },
  { titulo: "Complica", prompt: "Qual é o problema, o medo ou a dificuldade?", color: "#F77F00" },
  { titulo: "Desfecho", prompt: "Como termina? O que ficou de aprendizado?", color: "#9B5DE5" },
];

const CARD_COUNT = 12;

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const drawIds = () => shuffle(DECK).slice(0, CARD_COUNT).map((c) => c.id);

const byId = (id: string) => DECK.find((c) => c.id === id)!;

/** Ponto na espiral (arquimediana), do centro para fora. */
const spiralPoint = (t: number, cx: number, cy: number) => {
  const angle = t * Math.PI * 3.2;
  const r = 22 + t * 130;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
};

const spiralPath = (cx: number, cy: number) => {
  let d = "";
  for (let i = 0; i <= 240; i++) {
    const [x, y] = spiralPoint(i / 240, cx, cy);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d;
};

export default function HistoriaEspiral({ room }: Props) {
  const [deckIds, setDeckIds] = useState<string[]>(() => drawIds());
  const [flipped, setFlipped] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [phase, setPhase] = useState<"cartas" | "espiral">("cartas");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "he:state") {
        const s = m.payload;
        setDeckIds(s.deckIds); setFlipped(s.flipped); setChosen(s.chosen); setPhase(s.phase);
      }
    });
  }, [room]);

  const sync = (patch: Partial<{ deckIds: string[]; flipped: string[]; chosen: string[]; phase: "cartas" | "espiral" }>) => {
    const s = { deckIds, flipped, chosen, phase, ...patch };
    setDeckIds(s.deckIds); setFlipped(s.flipped); setChosen(s.chosen); setPhase(s.phase);
    room.send("he:state", s);
  };

  const flip = (id: string) => {
    if (flipped.includes(id)) {
      toggleChoose(id);
      return;
    }
    sync({ flipped: [...flipped, id] });
  };

  const toggleChoose = (id: string) => {
    if (chosen.includes(id)) {
      sync({ chosen: chosen.filter((c) => c !== id) });
      return;
    }
    if (chosen.length >= 4) {
      toast.info("Máximo de 4 cartas. Tire uma para trocar.");
      return;
    }
    sync({ chosen: [...chosen, id] });
  };

  const sortear = () => {
    const id = deckIds.find((d) => !flipped.includes(d));
    if (!id) return toast.info("Todas as cartas já foram viradas.");
    sync({ flipped: [...flipped, id] });
  };

  const novoBaralho = () => sync({ deckIds: drawIds(), flipped: [], chosen: [], phase: "cartas" });

  const chosenCards = useMemo(() => chosen.map(byId), [chosen]);
  const stations = STATIONS.slice(0, Math.max(3, chosenCards.length || 3));

  return (
    <div className="relative min-h-full p-2 sm:p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-2xl font-bold flex items-center gap-2">
              🌀 História em Espiral
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Vire as cartas, escolha 3 ou 4 e conte a história seguindo a espiral na folha.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={sortear} className="h-8">
              <Sparkles className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Sortear carta</span>
            </Button>
            <Button size="sm" variant="outline" onClick={novoBaralho} className="h-8">
              <Shuffle className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Novo baralho</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowHelp(true)} className="h-8 w-8 p-0">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {phase === "cartas" ? (
          <>
            {/* Baralho */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
              {deckIds.map((id) => {
                const card = byId(id);
                const isFlipped = flipped.includes(id);
                const isChosen = chosen.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => flip(id)}
                    className={`group relative aspect-[3/4] rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                      isChosen
                        ? "border-primary shadow-lg scale-[1.03] bg-primary/10"
                        : isFlipped
                        ? "border-border bg-card hover:border-primary/50"
                        : "border-transparent bg-gradient-to-br from-primary/80 to-accent/80 hover:brightness-110"
                    }`}
                  >
                    {isFlipped ? (
                      <div className="h-full w-full flex flex-col items-center justify-center gap-1 p-1">
                        <span className="text-3xl sm:text-5xl leading-none">{card.emoji}</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">{card.label}</span>
                        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{card.cat}</span>
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-2xl sm:text-4xl opacity-90">🌀</span>
                      </div>
                    )}
                    {isChosen && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                        {chosen.indexOf(id) + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bandeja de escolhidas */}
            <div className="mt-4 rounded-2xl border bg-card/70 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Cartas escolhidas ({chosen.length}/4)
                </span>
                <Button
                  size="sm"
                  disabled={chosen.length < 3}
                  onClick={() => sync({ phase: "espiral" })}
                >
                  Ver modelo da espiral <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {chosen.length === 0 && (
                  <p className="text-sm text-muted-foreground">Vire uma carta e clique de novo nela para escolher.</p>
                )}
                {chosenCards.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => toggleChoose(c.id)}
                    className="flex items-center gap-2 rounded-xl border bg-background px-3 py-1.5 hover:border-destructive"
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-xs font-semibold">{i + 1}. {c.label}</span>
                    <X className="w-3.5 h-3.5 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Modelo da espiral */
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border bg-card p-2 sm:p-4">
              <svg viewBox="0 0 420 360" className="w-full h-auto">
                <defs>
                  <linearGradient id="he-spiral" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3A86FF" />
                    <stop offset="50%" stopColor="#06D6A0" />
                    <stop offset="100%" stopColor="#9B5DE5" />
                  </linearGradient>
                </defs>
                <rect x="4" y="4" width="412" height="352" rx="14" fill="hsl(var(--muted))" opacity="0.35" />
                <path d={spiralPath(210, 180)} fill="none" stroke="url(#he-spiral)" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
                {stations.map((st, i) => {
                  const t = stations.length === 1 ? 0 : i / (stations.length - 1);
                  const [x, y] = spiralPoint(t, 210, 180);
                  const card = chosenCards[i];
                  return (
                    <g key={st.titulo}>
                      <circle cx={x} cy={y} r="26" fill="hsl(var(--card))" stroke={st.color} strokeWidth="4" />
                      <text x={x} y={y + 8} textAnchor="middle" fontSize="24">
                        {card ? card.emoji : "✏️"}
                      </text>
                      <circle cx={x + 20} cy={y - 20} r="10" fill={st.color} />
                      <text x={x + 20} y={y - 16} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
                <text x="210" y="346" textAnchor="middle" fontSize="12" fill="hsl(var(--muted-foreground))">
                  Comece no centro e escreva girando para fora ↻
                </text>
              </svg>
            </div>

            <div className="space-y-2">
              <div className="rounded-2xl border bg-card p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                  Como desenhar na folha
                </p>
                <ol className="text-sm space-y-1.5 list-decimal list-inside text-muted-foreground">
                  <li>Desenhe uma espiral grande na folha sulfite, começando no centro.</li>
                  <li>Marque {stations.length} paradas ao longo da linha, do centro para fora.</li>
                  <li>Em cada parada, desenhe a figura da carta e escreva esse trecho da história.</li>
                  <li>Siga escrevendo acompanhando a curva da espiral até a borda.</li>
                </ol>
              </div>
              {stations.map((st, i) => (
                <div key={st.titulo} className="rounded-xl border bg-card p-3 flex gap-3 items-start">
                  <span
                    className="w-7 h-7 shrink-0 rounded-full text-xs font-bold text-white flex items-center justify-center"
                    style={{ background: st.color }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {st.titulo} {chosenCards[i] ? `· ${chosenCards[i].emoji} ${chosenCards[i].label}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{st.prompt}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => sync({ phase: "cartas" })}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar às cartas
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={novoBaralho}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Recomeçar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showHelp && (
        <div className="absolute inset-0 z-40 bg-background/95 backdrop-blur p-4 overflow-auto">
          <div className="mx-auto max-w-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Como usar</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowHelp(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="rounded-xl border bg-card p-3 text-sm space-y-2">
              <p><strong>1. Virar cartas:</strong> clique numa carta para revelar a figura, ou use "Sortear carta".</p>
              <p><strong>2. Escolher:</strong> clique de novo na carta revelada para escolhê-la (3 ou 4 cartas).</p>
              <p><strong>3. Espiral:</strong> o modelo mostra a ordem das paradas. O paciente desenha a espiral na folha sulfite e escreve a história ali.</p>
              <p><strong>Clínico:</strong> observe quais figuras ele evita, quem aparece como personagem, como resolve o conflito e qual o desfecho — projeções úteis para vínculo familiar, medos e recursos de enfrentamento.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
