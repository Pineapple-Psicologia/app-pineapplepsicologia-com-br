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
  // Mais natureza
  { id: "deserto", emoji: "🏜️", label: "Deserto", cat: "Natureza" },
  { id: "neve", emoji: "❄️", label: "Neve", cat: "Natureza" },
  { id: "vulcao", emoji: "🌋", label: "Vulcão", cat: "Natureza" },
  { id: "cachoeira", emoji: "💧", label: "Cachoeira", cat: "Natureza" },
  { id: "sol", emoji: "☀️", label: "Sol forte", cat: "Natureza" },
  { id: "vento", emoji: "🌪️", label: "Redemoinho", cat: "Natureza" },
  { id: "flor", emoji: "🌻", label: "Flor", cat: "Natureza" },
  { id: "estrelas", emoji: "✨", label: "Estrelas", cat: "Natureza" },
  { id: "ilha", emoji: "🏝️", label: "Ilha", cat: "Natureza" },
  { id: "caverna", emoji: "🕳️", label: "Buraco escuro", cat: "Natureza" },
  // Mais animais
  { id: "cavalo", emoji: "🐴", label: "Cavalo", cat: "Animais" },
  { id: "coelho", emoji: "🐰", label: "Coelho", cat: "Animais" },
  { id: "urso", emoji: "🐻", label: "Urso", cat: "Animais" },
  { id: "cobra", emoji: "🐍", label: "Cobra", cat: "Animais" },
  { id: "coruja", emoji: "🦉", label: "Coruja", cat: "Animais" },
  { id: "aranha", emoji: "🕷️", label: "Aranha", cat: "Animais" },
  { id: "elefante", emoji: "🐘", label: "Elefante", cat: "Animais" },
  { id: "macaco", emoji: "🐵", label: "Macaco", cat: "Animais" },
  { id: "tubarao", emoji: "🦈", label: "Tubarão", cat: "Animais" },
  { id: "formiga", emoji: "🐜", label: "Formiga", cat: "Animais" },
  { id: "dragao", emoji: "🐉", label: "Dragão", cat: "Animais" },
  { id: "unicornio", emoji: "🦄", label: "Unicórnio", cat: "Animais" },
  // Mais pessoas
  { id: "avo-homem", emoji: "👴", label: "Avô", cat: "Pessoas" },
  { id: "medica", emoji: "🧑‍⚕️", label: "Médica", cat: "Pessoas" },
  { id: "policial", emoji: "👮", label: "Policial", cat: "Pessoas" },
  { id: "heroi", emoji: "🦸", label: "Herói", cat: "Pessoas" },
  { id: "vilao", emoji: "🦹", label: "Vilão", cat: "Pessoas" },
  { id: "palhaco", emoji: "🤡", label: "Palhaço", cat: "Pessoas" },
  { id: "rei", emoji: "🤴", label: "Rei", cat: "Pessoas" },
  { id: "rainha", emoji: "👸", label: "Rainha", cat: "Pessoas" },
  { id: "bruxa", emoji: "🧙", label: "Bruxo(a)", cat: "Pessoas" },
  { id: "bombeiro", emoji: "🧑‍🚒", label: "Bombeiro", cat: "Pessoas" },
  { id: "bebe-pet", emoji: "🐾", label: "Pegadas", cat: "Pessoas" },
  // Mais situações
  { id: "grito", emoji: "😱", label: "Susto", cat: "Situações" },
  { id: "briga-irmaos", emoji: "🤼", label: "Briga", cat: "Situações" },
  { id: "presente", emoji: "🎂", label: "Aniversário", cat: "Situações" },
  { id: "viagem", emoji: "✈️", label: "Viagem", cat: "Situações" },
  { id: "perdido", emoji: "🧭", label: "Estar perdido", cat: "Situações" },
  { id: "sonho", emoji: "💭", label: "Sonho", cat: "Situações" },
  { id: "pesadelo", emoji: "😴", label: "Pesadelo", cat: "Situações" },
  { id: "silencio", emoji: "🔇", label: "Silêncio", cat: "Situações" },
  { id: "corrida", emoji: "🏃", label: "Fugir/correr", cat: "Situações" },
  { id: "esconder", emoji: "🙈", label: "Se esconder", cat: "Situações" },
  { id: "chuva-casa", emoji: "☔", label: "Dia de chuva", cat: "Situações" },
  { id: "musica", emoji: "🎵", label: "Música", cat: "Situações" },
  { id: "comida", emoji: "🍲", label: "Refeição junto", cat: "Situações" },
  { id: "telefone", emoji: "📞", label: "Telefonema", cat: "Situações" },
  { id: "hospital2", emoji: "🚑", label: "Ambulância", cat: "Situações" },
  { id: "esporte", emoji: "⚽", label: "Jogo de bola", cat: "Situações" },
  // Mais lugares e objetos
  { id: "castelo", emoji: "🏰", label: "Castelo", cat: "Lugares" },
  { id: "cidade", emoji: "🏙️", label: "Cidade", cat: "Lugares" },
  { id: "fazenda", emoji: "🚜", label: "Fazenda", cat: "Lugares" },
  { id: "igreja", emoji: "⛪", label: "Igreja", cat: "Lugares" },
  { id: "circo", emoji: "🎪", label: "Circo", cat: "Lugares" },
  { id: "trem", emoji: "🚂", label: "Trem", cat: "Lugares" },
  { id: "quarto", emoji: "🛏️", label: "Quarto", cat: "Lugares" },
  { id: "labirinto", emoji: "🌀", label: "Labirinto", cat: "Lugares" },
  { id: "livro", emoji: "📖", label: "Livro", cat: "Objetos" },
  { id: "guarda-chuva", emoji: "🌂", label: "Guarda-chuva", cat: "Objetos" },
  { id: "lanterna", emoji: "🔦", label: "Lanterna", cat: "Objetos" },
  { id: "mochila", emoji: "🎒", label: "Mochila", cat: "Objetos" },
  { id: "coracao", emoji: "❤️", label: "Coração", cat: "Objetos" },
  { id: "corda", emoji: "🪢", label: "Corda", cat: "Objetos" },
  { id: "mapa", emoji: "🗺️", label: "Mapa", cat: "Objetos" },
  { id: "balao", emoji: "🎈", label: "Balão", cat: "Objetos" },
  { id: "bicicleta", emoji: "🚲", label: "Bicicleta", cat: "Objetos" },
  { id: "ursinho", emoji: "🧸", label: "Ursinho", cat: "Objetos" },
  { id: "camera", emoji: "📷", label: "Foto antiga", cat: "Objetos" },
  { id: "muro", emoji: "🧱", label: "Muro", cat: "Objetos" },
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

/** Folha A4 retrato em unidades SVG (mm). */
const SHEET_W = 210;
const SHEET_H = 297;
const CX = SHEET_W / 2;
const CY = SHEET_H / 2;
const TURNS = 4;
const R_MAX = 128;

/** Ponto na espiral (arquimediana), do centro para fora. */
const spiralPoint = (t: number) => {
  const angle = t * Math.PI * 2 * TURNS;
  const r = 10 + t * (R_MAX - 10);
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle) * 1.28] as const;
};

const spiralPath = () => {
  let d = "";
  for (let i = 0; i <= 600; i++) {
    const [x, y] = spiralPoint(i / 600);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
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
              Vire as cartas, escolha 3 ou 4 e crie sua própria história seguindo a espiral na folha.
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
          /* Modelo da espiral em folha A4 */
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Modelo da espiral: desenhe assim na folha sulfite e escreva a história acompanhando a linha, do centro para fora.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => sync({ phase: "cartas" })}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Cartas
                </Button>
                <Button size="sm" variant="outline" onClick={novoBaralho}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Recomeçar
                </Button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[560px]">
              <div className="rounded-xl border bg-card p-2 shadow-sm">
                <svg viewBox={`0 0 ${SHEET_W} ${SHEET_H}`} className="w-full h-auto rounded-lg" style={{ aspectRatio: "210 / 297" }}>
                  <defs>
                    <linearGradient id="he-spiral" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3A86FF" />
                      <stop offset="50%" stopColor="#06D6A0" />
                      <stop offset="100%" stopColor="#9B5DE5" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width={SHEET_W} height={SHEET_H} rx="3" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.6" />
                  <path d={spiralPath()} fill="none" stroke="url(#he-spiral)" strokeWidth="1.6" strokeLinecap="round" />
                  {chosenCards.map((card, i) => {
                    const t = chosenCards.length === 1 ? 0 : i / (chosenCards.length - 1);
                    const [x, y] = spiralPoint(t);
                    return (
                      <g key={card.id}>
                        <circle cx={x} cy={y} r="11" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1.2" />
                        <text x={x} y={y + 4.5} textAnchor="middle" fontSize="12">{card.emoji}</text>
                      </g>
                    );
                  })}
                  <circle cx={CX} cy={CY} r="2" fill="hsl(var(--primary))" />
                </svg>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Folha A4 · comece no centro ↻
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {chosenCards.map((c) => (
                <span key={c.id} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold">
                  <span className="text-base">{c.emoji}</span> {c.label}
                </span>
              ))}
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
              <p><strong>3. Espiral:</strong> o modelo serve só para mostrar o formato da espiral. O paciente desenha a espiral na folha sulfite e escreve a história dele ali, do centro para fora — a trama, os personagens e o final são inteiramente dele.</p>
              <p><strong>Clínico:</strong> observe quais figuras ele evita, quem aparece como personagem, como resolve o conflito e qual o desfecho — projeções úteis para vínculo familiar, medos e recursos de enfrentamento.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
