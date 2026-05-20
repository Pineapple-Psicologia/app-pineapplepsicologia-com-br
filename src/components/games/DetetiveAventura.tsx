import { useEffect, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Search, RotateCcw, Check, MapPin, Sparkles, Moon, Sun, BookOpen, Plus, X, Scale } from "lucide-react";
import cenaCrime from "@/assets/aventura-cena-crime.jpg";
import cenaInterrogatorio from "@/assets/aventura-interrogatorio.jpg";
import cenaLaboratorio from "@/assets/aventura-laboratorio.jpg";
import cenaTribunal from "@/assets/aventura-tribunal.jpg";
import cenaArquivo from "@/assets/aventura-arquivo.jpg";
import cenaVeredito from "@/assets/aventura-veredito.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type SceneId = "crime" | "interrogatorio" | "laboratorio" | "arquivo" | "veredito";
type Visual = "cartoon" | "noir";

const DISTORTIONS = [
  { id: "tudo-nada", emoji: "⚫⚪", label: "Tudo ou nada", desc: "Só extremos, sem meio-termo." },
  { id: "catastrofe", emoji: "💥", label: "Catastrofização", desc: "Imagino o pior cenário." },
  { id: "leitura", emoji: "🔮", label: "Leitura mental", desc: "Acho que sei o que o outro pensa." },
  { id: "adivinhacao", emoji: "🎱", label: "Adivinhação", desc: "Prevejo o futuro como certo." },
  { id: "rotulo", emoji: "🏷️", label: "Rotulação", desc: "Me defino por um defeito." },
  { id: "filtro", emoji: "🕶️", label: "Filtro mental", desc: "Só vejo o lado ruim." },
  { id: "personalizar", emoji: "🎯", label: "Personalização", desc: "Tudo é culpa minha." },
  { id: "deveria", emoji: "📜", label: "Deveria", desc: "Regras rígidas sobre mim." },
  { id: "generalizar", emoji: "♾️", label: "Generalização", desc: "Uma vez = sempre." },
  { id: "emocional", emoji: "💭", label: "Raciocínio emocional", desc: "Sinto, então é verdade." },
];

const SUGGESTIONS = [
  { situation: "Mandei mensagem pra um amigo e ele não respondeu o dia todo.", thought: "Ele tá bravo comigo, não quer mais minha amizade." },
  { situation: "Tirei uma nota baixa numa prova.", thought: "Sou burro(a), nunca vou conseguir nada." },
  { situation: "Tenho que apresentar um trabalho na frente da turma.", thought: "Vou travar, todo mundo vai rir." },
  { situation: "Minha mãe estava séria no jantar.", thought: "Eu fiz alguma coisa errada, é culpa minha." },
];

type Hotspot = {
  id: string;
  x: number; // %
  y: number; // %
  label: string;
  emoji: string;
  hint: string;
};

const HOTSPOTS: Record<SceneId, Hotspot[]> = {
  crime: [
    { id: "lupa", x: 47, y: 72, label: "Lupa", emoji: "🔍", hint: "Toda investigação começa olhando os fatos de perto. O que aconteceu, exatamente?" },
    { id: "pegadas", x: 72, y: 70, label: "Pegadas", emoji: "🐾", hint: "As pegadas mostram o caminho — onde, quando e com quem isso aconteceu?" },
    { id: "fita", x: 30, y: 22, label: "Fita policial", emoji: "🚧", hint: "A cena está isolada. Só os FATOS entram aqui — opiniões ficam de fora por enquanto." },
  ],
  interrogatorio: [
    { id: "lampada", x: 50, y: 14, label: "Holofote", emoji: "💡", hint: "Sob a luz, qual foi o pensamento que apareceu na sua cabeça naquele momento?" },
    { id: "espelho", x: 78, y: 30, label: "Espelho", emoji: "🪞", hint: "O espelho devolve sua voz interna. Qual frase ela disse?" },
    { id: "cadeira", x: 50, y: 65, label: "Cadeira do suspeito", emoji: "🪑", hint: "O pensamento é o suspeito. Convide ele pra sentar e escute o que ele diz." },
  ],
  laboratorio: [
    { id: "cartas", x: 50, y: 55, label: "Cartas das distorções", emoji: "🃏", hint: "Cada carta é uma 'armadilha' do pensamento. Quais combinam com o seu suspeito?" },
    { id: "potes", x: 18, y: 30, label: "Reagentes", emoji: "🧪", hint: "Misture as evidências: o pensamento é mesmo verdade 100% das vezes?" },
    { id: "lupa-lab", x: 75, y: 75, label: "Lupa do laboratório", emoji: "🔬", hint: "Olhe de perto: que prova existe contra esse pensamento?" },
  ],
  arquivo: [
    { id: "maquina", x: 50, y: 55, label: "Máquina de escrever", emoji: "📜", hint: "Hora de reescrever. Uma versão mais justa, equilibrada e verdadeira." },
    { id: "livros", x: 12, y: 40, label: "Arquivos antigos", emoji: "📚", hint: "Casos parecidos do passado: como você se saiu antes? O que aprendeu?" },
    { id: "papeis", x: 78, y: 25, label: "Papéis voando", emoji: "📄", hint: "Solte os pensamentos antigos. Eles podem ir embora pela janela." },
  ],
  veredito: [
    { id: "balanca", x: 30, y: 55, label: "Balança", emoji: "⚖️", hint: "As evidências pesam. O pensamento novo é mais leve, mais justo." },
    { id: "martelo", x: 60, y: 70, label: "Martelo", emoji: "🔨", hint: "Caso encerrado, Detetive! O pensamento velho não tem mais poder aqui." },
    { id: "luz", x: 50, y: 22, label: "Luz da janela", emoji: "🌅", hint: "Uma nova luz entra. Você consegue ver a situação com mais clareza." },
  ],
};

const SCENES: { id: SceneId; title: string; emoji: string; bg: string; subtitle: string }[] = [
  { id: "crime", title: "Cena do Crime", emoji: "🔦", bg: cenaCrime, subtitle: "Etapa 1 · Os fatos" },
  { id: "interrogatorio", title: "Sala de Interrogatório", emoji: "💡", bg: cenaInterrogatorio, subtitle: "Etapa 2 · O pensamento suspeito" },
  { id: "laboratorio", title: "Laboratório", emoji: "🧪", bg: cenaLaboratorio, subtitle: "Etapa 3 · Distorções encontradas" },
  { id: "arquivo", title: "Arquivo", emoji: "📜", bg: cenaArquivo, subtitle: "Etapa 4 · Reescrever o caso" },
  { id: "veredito", title: "Veredito", emoji: "⚖️", bg: cenaVeredito, subtitle: "Etapa 5 · Caso resolvido" },
];

type State = {
  scene: SceneId;
  visual: Visual;
  situation: string;
  thought: string;
  distortions: string[];
  reframe: string;
  clues: string[]; // collected hotspot ids globally
  activeHint: { sceneId: SceneId; hotspotId: string } | null;
};

const INITIAL: State = {
  scene: "crime",
  visual: "cartoon",
  situation: "",
  thought: "",
  distortions: [],
  reframe: "",
  clues: [],
  activeHint: null,
};

export default function DetetiveAventura({ room }: Props) {
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    const off = room.on((m) => {
      if (m.type === "aventura:state") setState(m.payload as State);
    });
    return off;
  }, [room]);

  const update = (patch: Partial<State>) => {
    const next = { ...state, ...patch };
    setState(next);
    room.send("aventura:state", next);
  };

  const reset = () => update({ ...INITIAL, visual: state.visual });

  const scene = SCENES.find((s) => s.id === state.scene)!;
  const sceneIdx = SCENES.findIndex((s) => s.id === state.scene);
  const isNoir = state.visual === "noir";

  const clickHotspot = (h: Hotspot) => {
    const clueKey = `${state.scene}:${h.id}`;
    const newClues = state.clues.includes(clueKey) ? state.clues : [...state.clues, clueKey];
    update({ clues: newClues, activeHint: { sceneId: state.scene, hotspotId: h.id } });
  };

  const closeHint = () => update({ activeHint: null });

  const toggleDistortion = (id: string) => {
    const has = state.distortions.includes(id);
    update({ distortions: has ? state.distortions.filter((d) => d !== id) : [...state.distortions, id] });
  };

  const activeHotspot =
    state.activeHint && state.activeHint.sceneId === state.scene
      ? HOTSPOTS[state.scene].find((h) => h.id === state.activeHint!.hotspotId)
      : undefined;

  return (
    <div
      className="h-full w-full flex flex-col gap-3 p-3 md:p-4 rounded-2xl border-4 border-amber-900/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(20,15,10,0.55), rgba(20,15,10,0.55)), url(${cenaLaboratorio})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between flex-wrap gap-3 bg-card border-2 rounded-2xl px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <h2 className="text-lg md:text-xl font-bold truncate">Detetive: Aventura 🕵️</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline">
                <BookOpen className="w-4 h-4 mr-1" /> Como jogar
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" /> Guia da Detetive
                </SheetTitle>
                <SheetDescription>
                  Manual rápido para conduzir o jogo com seu paciente.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-5 text-sm leading-relaxed">
                <section>
                  <h3 className="font-bold text-base mb-1">🎯 Objetivo terapêutico</h3>
                  <p className="text-muted-foreground">
                    Um jogo de <b>reestruturação cognitiva</b> em formato <i>point &amp; click</i>.
                    O paciente investiga um pensamento como se fosse um suspeito: coleta fatos,
                    identifica distorções e reescreve uma versão mais justa.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-base mb-1">👥 Como funciona em sessão</h3>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>O jogo é compartilhado em tempo real entre você e o paciente.</li>
                    <li>Qualquer um dos dois pode clicar, escrever e avançar etapas.</li>
                    <li>Use <b>Noir</b> (preto e branco) para um clima mais sério, ou <b>Cartoon</b> para crianças/adolescentes.</li>
                    <li><b>Recomeçar</b> limpa tudo para um novo caso.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-base mb-1">🗺️ As 5 cenas</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                    <li>
                      <b>🔦 Cena do Crime — Os fatos.</b> Escreva a <i>situação</i> de forma objetiva,
                      sem interpretação. Clique nos pontos da cena (lupa, pegadas, fita) para
                      pistas de como descrever só os fatos.
                    </li>
                    <li>
                      <b>💡 Interrogatório — O pensamento suspeito.</b> Identifique o pensamento
                      automático que surgiu. Os hotspots ajudam a acessar a voz interna.
                    </li>
                    <li>
                      <b>🧪 Laboratório — Distorções.</b> Marque na lista quais "armadilhas
                      cognitivas" combinam com o pensamento (catastrofização, leitura mental, etc).
                    </li>
                    <li>
                      <b>📜 Arquivo — Reescrever.</b> Construa uma versão mais equilibrada e
                      verdadeira do pensamento.
                    </li>
                    <li>
                      <b>⚖️ Veredito — Caso resolvido.</b> Comparem o pensamento antigo x o novo.
                      Encerra o ciclo de investigação.
                    </li>
                  </ol>
                </section>

                <section>
                  <h3 className="font-bold text-base mb-1">💡 Pistas (hotspots)</h3>
                  <p className="text-muted-foreground">
                    Cada cena tem 3 ícones clicáveis. Eles abrem dicas curtas que orientam a
                    próxima ação. As pistas coletadas ficam marcadas — útil para revisar o
                    raciocínio com o paciente.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-base mb-1">✨ Sugestões prontas</h3>
                  <p className="text-muted-foreground">
                    Na cena do Crime há um botão <b>"Sugerir um caso"</b> com situações comuns
                    (notas, relacionamentos, apresentações). Útil quando o paciente trava ou
                    para aquecer no início.
                  </p>
                </section>

                <section className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
                  <h3 className="font-bold text-base mb-1">🧭 Dica de condução</h3>
                  <p className="text-muted-foreground">
                    Avance uma cena por vez, em voz alta. Deixe o paciente clicar — o
                    movimento de "investigar" externaliza o processo cognitivo e reduz
                    a fusão com o pensamento.
                  </p>
                </section>
              </div>
            </SheetContent>
          </Sheet>
          <Button
            size="sm"
            variant="outline"
            onClick={() => update({ visual: isNoir ? "cartoon" : "noir" })}
            title={isNoir ? "Modo cartoon (cores)" : "Modo noir (preto e branco)"}
          >
            {isNoir ? <Sun className="w-4 h-4 mr-1" /> : <Moon className="w-4 h-4 mr-1" />}
            {isNoir ? "Cartoon" : "Noir"}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Recomeçar
          </Button>
        </div>
      </header>

      {/* Scene navigation chips */}
      <nav className="flex items-center gap-1 overflow-x-auto pb-1">
        {SCENES.map((s, i) => {
          const active = s.id === state.scene;
          const visited = i <= sceneIdx;
          return (
            <button
              key={s.id}
              onClick={() => update({ scene: s.id, activeHint: null })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border-2 transition-all ${
                active
                  ? "bg-primary text-primary-foreground border-primary scale-105"
                  : visited
                    ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              }`}
            >
              <span className="text-base">{s.emoji}</span>
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </nav>

      {/* Scene viewport with hotspots */}
      <div className="relative flex-1 min-h-[320px] rounded-2xl overflow-hidden border-4 border-amber-900/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)]">
        <img
          src={scene.bg}
          alt={scene.title}
          loading="lazy"
          width={1280}
          height={832}
          className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-500"
          style={{
            filter: isNoir ? "grayscale(0.95) contrast(1.25) brightness(0.85)" : "none",
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isNoir
              ? "radial-gradient(ellipse at 50% 50%, rgba(255,235,180,0.15) 0%, rgba(0,0,0,0.55) 100%)"
              : "radial-gradient(ellipse at 50% 50%, rgba(254,243,199,0.35) 0%, rgba(0,0,0,0.35) 100%)",
          }}
        />

        {/* Title plate */}
        <div className="absolute top-3 left-3 z-10 bg-card/90 backdrop-blur rounded-xl border-2 px-3 py-1.5 shadow-lg">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{scene.subtitle}</div>
          <div className="font-bold text-sm flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {scene.title}
          </div>
        </div>

        {/* Hotspots */}
        {HOTSPOTS[state.scene].map((h) => {
          const collected = state.clues.includes(`${state.scene}:${h.id}`);
          return (
            <button
              key={h.id}
              onClick={() => clickHotspot(h)}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              aria-label={h.label}
            >
              <span
                className={`absolute inset-0 -m-3 rounded-full ${
                  collected ? "bg-emerald-400/30" : "bg-amber-300/40"
                } animate-ping`}
              />
              <span
                className={`relative flex items-center justify-center w-11 h-11 rounded-full text-2xl border-2 shadow-lg transition-transform group-hover:scale-110 ${
                  collected
                    ? "bg-emerald-100 border-emerald-500"
                    : "bg-amber-100 border-amber-500"
                }`}
              >
                {collected ? <Check className="w-5 h-5 text-emerald-700" /> : h.emoji}
              </span>
              <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {h.label}
              </span>
            </button>
          );
        })}

        {/* Hotspot hint popover */}
        {activeHotspot && (
          <div className="absolute inset-x-3 bottom-3 z-20 bg-card/95 backdrop-blur rounded-xl border-2 border-primary p-3 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-3xl shrink-0">{activeHotspot.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary">{activeHotspot.label}</div>
              <div className="text-sm">{activeHotspot.hint}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={closeHint}>
              ✕
            </Button>
          </div>
        )}
      </div>

      {/* Interactive panel for current scene */}
      <div className="bg-card border-2 rounded-2xl p-3 md:p-4 max-h-[42vh] overflow-auto">
        {state.scene === "crime" && (
          <div className="flex flex-col gap-2">
            <h3 className="font-bold flex items-center gap-1.5">🔍 Registre os fatos da cena</h3>
            <p className="text-xs text-muted-foreground">Sem opinião ainda — só o que aconteceu, como uma câmera registraria.</p>
            <textarea
              value={state.situation}
              onChange={(e) => update({ situation: e.target.value })}
              placeholder="Ex: Hoje na escola, na hora do recreio..."
              className="min-h-[80px] p-2.5 rounded-lg border-2 bg-background resize-none focus:outline-none focus:border-primary text-sm"
            />
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => update({ situation: s.situation, thought: s.thought })}
                  className="text-[11px] px-2 py-1 rounded-full bg-accent/20 hover:bg-accent/30 border border-accent/40 max-w-[240px] truncate"
                >
                  {s.situation}
                </button>
              ))}
            </div>
            <Button size="sm" disabled={!state.situation.trim()} onClick={() => update({ scene: "interrogatorio", activeHint: null })} className="self-end">
              Próxima cena → Interrogatório
            </Button>
          </div>
        )}

        {state.scene === "interrogatorio" && (
          <div className="flex flex-col gap-2">
            {state.situation && (
              <div className="rounded-lg p-2 bg-muted/60 border-l-4 border-primary text-xs">
                <span className="font-bold">Cena: </span>{state.situation}
              </div>
            )}
            <h3 className="font-bold flex items-center gap-1.5">💭 O pensamento suspeito</h3>
            <p className="text-xs text-muted-foreground">O que passou na cabeça naquele momento? Bem rapidinho.</p>
            <textarea
              value={state.thought}
              onChange={(e) => update({ thought: e.target.value })}
              placeholder="Ex: Ninguém gosta de mim..."
              className="min-h-[70px] p-2.5 rounded-lg border-2 bg-background resize-none focus:outline-none focus:border-primary text-sm"
            />
            <Button size="sm" disabled={!state.thought.trim()} onClick={() => update({ scene: "laboratorio", activeHint: null })} className="self-end">
              Próxima cena → Laboratório
            </Button>
          </div>
        )}

        {state.scene === "laboratorio" && (
          <div className="flex flex-col gap-2">
            {state.thought && (
              <div className="rounded-lg p-2 bg-primary/10 border-l-4 border-primary">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suspeito sob análise</div>
                <div className="text-sm font-semibold italic">"{state.thought}"</div>
              </div>
            )}
            <h3 className="font-bold">🧪 Quais armadilhas aparecem?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
              {DISTORTIONS.map((d) => {
                const active = state.distortions.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDistortion(d.id)}
                    className={`p-2 rounded-lg border-2 text-left transition-all ${
                      active ? "border-primary bg-primary/10 shadow scale-[1.02]" : "border-border/60 bg-background hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{d.emoji}</span>
                      {active && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <div className="font-bold text-xs mt-0.5 leading-tight">{d.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{d.desc}</div>
                  </button>
                );
              })}
            </div>
            <Button size="sm" disabled={state.distortions.length === 0} onClick={() => update({ scene: "arquivo", activeHint: null })} className="self-end">
              Próxima cena → Arquivo
            </Button>
          </div>
        )}

        {state.scene === "arquivo" && (
          <div className="flex flex-col gap-2">
            <div className="grid sm:grid-cols-2 gap-2">
              {state.thought && (
                <div className="rounded-lg p-2 bg-destructive/10 border-l-4 border-destructive">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensamento original</div>
                  <div className="text-xs italic">"{state.thought}"</div>
                </div>
              )}
              {state.distortions.length > 0 && (
                <div className="rounded-lg p-2 bg-muted/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Distorções</div>
                  <div className="flex flex-wrap gap-1">
                    {state.distortions.map((id) => {
                      const d = DISTORTIONS.find((x) => x.id === id)!;
                      return (
                        <span key={id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                          {d.emoji} {d.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <h3 className="font-bold">📜 Reescreva o caso</h3>
            <p className="text-xs text-muted-foreground">Olhando as evidências reais, qual versão é mais justa e equilibrada?</p>
            <textarea
              value={state.reframe}
              onChange={(e) => update({ reframe: e.target.value })}
              placeholder="Ex: Talvez ele esteja ocupado. Já tive amigos que demoraram pra responder e tudo ficou bem..."
              className="min-h-[80px] p-2.5 rounded-lg border-2 bg-background resize-none focus:outline-none focus:border-primary text-sm"
            />
            <Button size="sm" disabled={!state.reframe.trim()} onClick={() => update({ scene: "veredito", activeHint: null })} className="self-end">
              Ler veredito ⚖️
            </Button>
          </div>
        )}

        {state.scene === "veredito" && (
          <div className="flex flex-col gap-3 items-center text-center">
            <div className="text-4xl">
              <Sparkles className="w-10 h-10 text-amber-500 inline" /> 🎉
            </div>
            <h3 className="text-xl font-bold">Caso resolvido, Detetive!</h3>
            <div className="w-full grid sm:grid-cols-2 gap-2 text-left">
              <div className="rounded-lg p-2 bg-destructive/10 border-l-4 border-destructive">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Antes</div>
                <div className="text-xs italic line-through opacity-70">"{state.thought}"</div>
              </div>
              <div className="rounded-lg p-2 bg-primary/10 border-l-4 border-primary">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Agora</div>
                <div className="text-sm font-semibold">"{state.reframe}"</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Pistas coletadas: <strong>{state.clues.length}</strong> / {Object.values(HOTSPOTS).flat().length}
            </div>
            <Button onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-2" /> Novo caso
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
