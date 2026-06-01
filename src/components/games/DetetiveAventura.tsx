import { useEffect, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Search, RotateCcw, Check, MapPin, Sparkles, Moon, Sun, BookOpen, Plus, X, Scale, Download } from "lucide-react";
import cenaCrime from "@/assets/aventura-cena-crime.jpg";
import cenaInterrogatorio from "@/assets/aventura-interrogatorio.jpg";
import cenaLaboratorio from "@/assets/aventura-laboratorio.jpg";
import cenaTribunal from "@/assets/aventura-tribunal.jpg";
import cenaArquivo from "@/assets/aventura-arquivo.jpg";
import cenaVeredito from "@/assets/aventura-veredito.jpg";

type Props = { room: ReturnType<typeof useRoom> };

type SceneId = "crime" | "interrogatorio" | "laboratorio" | "analise" | "arquivo" | "veredito";
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
  analise: [
    { id: "balanca-an", x: 50, y: 48, label: "Balança", emoji: "⚖️", hint: "Pese os dois lados: o que apoia o pensamento e o que o contradiz?" },
    { id: "provas-pro", x: 18, y: 65, label: "Provas a favor", emoji: "📂", hint: "Que fatos REAIS sustentam esse pensamento? Só fatos, sem 'eu acho'." },
    { id: "provas-contra", x: 82, y: 65, label: "Provas contra", emoji: "📜", hint: "Que fatos REAIS contradizem esse pensamento? Exceções, evidências do contrário." },
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
  { id: "analise", title: "Tribunal de Evidências", emoji: "⚖️", bg: cenaTribunal, subtitle: "Etapa 4 · A favor x Contra" },
  { id: "arquivo", title: "Arquivo", emoji: "📜", bg: cenaArquivo, subtitle: "Etapa 5 · Reescrever o caso" },
  { id: "veredito", title: "Veredito", emoji: "⚖️", bg: cenaVeredito, subtitle: "Etapa 6 · Caso resolvido" },
];

type State = {
  scene: SceneId;
  visual: Visual;
  situation: string;
  thought: string;
  distortions: string[];
  evidencePro: string[];
  evidenceCon: string[];
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
  evidencePro: [],
  evidenceCon: [],
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
      className="h-full w-full flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 rounded-2xl border-2 sm:border-4 border-amber-900/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(20,15,10,0.55), rgba(20,15,10,0.55)), url(${cenaLaboratorio})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between gap-2 bg-card border-2 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
          <h2 className="text-sm sm:text-lg md:text-xl font-bold truncate">Detetive 🕵️</h2>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="px-2 sm:px-3 h-8">
                <BookOpen className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Como jogar</span>
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
                  <h3 className="font-bold text-base mb-1">🗺️ As 6 cenas</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                    <li>
                      <b>🔦 Cena do Crime — Os fatos.</b> Escreva a <i>situação</i> de forma objetiva,
                      sem interpretação.
                    </li>
                    <li>
                      <b>💡 Interrogatório — O pensamento suspeito.</b> Identifique o pensamento
                      automático que surgiu.
                    </li>
                    <li>
                      <b>🧪 Laboratório — Distorções.</b> Marque quais "armadilhas cognitivas"
                      combinam com o pensamento.
                    </li>
                    <li>
                      <b>⚖️ Tribunal de Evidências — A favor x Contra.</b> Liste fatos REAIS que
                      sustentam o pensamento e fatos que o contradizem. Este é o coração da
                      reestruturação: analisar evidências em vez de presumir.
                    </li>
                    <li>
                      <b>📜 Arquivo — Reescrever.</b> Construa uma versão mais equilibrada do
                      pensamento, com base nas evidências levantadas.
                    </li>
                    <li>
                      <b>⚖️ Veredito — Caso resolvido.</b> Comparem o pensamento antigo x o novo.
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
            onClick={() => downloadCasePdf(state)}
            disabled={!state.thought.trim() && !state.situation.trim()}
            title="Baixar resumo do caso em PDF"
            className="px-2 sm:px-3 h-8"
          >
            <Download className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Baixar PDF</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => update({ visual: isNoir ? "cartoon" : "noir" })}
            title={isNoir ? "Modo cartoon (cores)" : "Modo noir (preto e branco)"}
            className="px-2 sm:px-3 h-8"
          >
            {isNoir ? <Sun className="w-4 h-4 sm:mr-1" /> : <Moon className="w-4 h-4 sm:mr-1" />}
            <span className="hidden sm:inline">{isNoir ? "Cartoon" : "Noir"}</span>
          </Button>
          <Button size="sm" variant="outline" onClick={reset} className="px-2 sm:px-3 h-8">
            <RotateCcw className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Recomeçar</span>
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
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap border-2 transition-all ${
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

      {/* Wrapper: stacks vertically; lado a lado em landscape curto (celular deitado) */}
      <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-h-0 short:flex-row short:gap-2">

      {/* Scene viewport with hotspots */}
      <div className="relative h-[38vh] min-h-[200px] sm:h-auto sm:flex-1 sm:min-h-[320px] short:h-full short:min-h-0 short:flex-1 short:sm:min-h-0 rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-amber-900/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)]">
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
                className={`relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full text-xl sm:text-2xl border-2 shadow-lg transition-transform group-hover:scale-110 active:scale-95 ${
                  collected
                    ? "bg-emerald-100 border-emerald-500"
                    : "bg-amber-100 border-amber-500"
                }`}
              >
                {collected ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" /> : h.emoji}
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
      <div className="bg-card border-2 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 flex-1 sm:flex-none sm:max-h-[42vh] overflow-auto min-h-0 short:flex-none short:max-h-none short:h-full short:w-[46%] short:shrink-0">
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
            <Button size="sm" disabled={state.distortions.length === 0} onClick={() => update({ scene: "analise", activeHint: null })} className="self-end">
              Próxima cena → Tribunal
            </Button>
          </div>
        )}

        {state.scene === "analise" && (
          <AnalisePanel state={state} update={update} />
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
              {(state.evidencePro.length > 0 || state.evidenceCon.length > 0) && (
                <div className="rounded-lg p-2 bg-muted/40 sm:col-span-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">✅ A favor ({state.evidencePro.length})</div>
                    <ul className="text-[11px] space-y-0.5 list-disc pl-4">
                      {state.evidencePro.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-1">❌ Contra ({state.evidenceCon.length})</div>
                    <ul className="text-[11px] space-y-0.5 list-disc pl-4">
                      {state.evidenceCon.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
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
            <div className="flex gap-2 flex-wrap justify-center">
              <Button onClick={() => downloadCasePdf(state)} variant="outline">
                <Download className="w-4 h-4 mr-2" /> Baixar PDF
              </Button>
              <Button onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-2" /> Novo caso
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function AnalisePanel({ state, update }: { state: State; update: (p: Partial<State>) => void }) {
  const [pro, setPro] = useState("");
  const [con, setCon] = useState("");

  const addPro = () => {
    if (!pro.trim()) return;
    update({ evidencePro: [...state.evidencePro, pro.trim()] });
    setPro("");
  };
  const addCon = () => {
    if (!con.trim()) return;
    update({ evidenceCon: [...state.evidenceCon, con.trim()] });
    setCon("");
  };
  const removePro = (i: number) => update({ evidencePro: state.evidencePro.filter((_, idx) => idx !== i) });
  const removeCon = (i: number) => update({ evidenceCon: state.evidenceCon.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-2">
      {state.thought && (
        <div className="rounded-lg p-2 bg-primary/10 border-l-4 border-primary">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensamento em julgamento</div>
          <div className="text-sm font-semibold italic">"{state.thought}"</div>
        </div>
      )}
      <h3 className="font-bold flex items-center gap-1.5">
        <Scale className="w-4 h-4 text-primary" /> Análise: a favor x contra
      </h3>
      <p className="text-xs text-muted-foreground">
        Liste fatos REAIS — coisas que aconteceram, não opiniões. Quanto mais concreto, melhor.
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        {/* A favor */}
        <div className="rounded-lg border-2 border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm text-emerald-700 dark:text-emerald-400">✅ Evidências A FAVOR</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold">
              {state.evidencePro.length}
            </span>
          </div>
          <div className="flex gap-1">
            <input
              value={pro}
              onChange={(e) => setPro(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPro()}
              placeholder="Ex: Ele realmente disse que..."
              className="flex-1 px-2 py-1.5 rounded-md border bg-background text-xs focus:outline-none focus:border-emerald-500"
            />
            <Button size="sm" onClick={addPro} variant="outline" className="border-emerald-500 h-8">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ul className="flex flex-col gap-1 max-h-40 overflow-auto">
            {state.evidencePro.length === 0 && (
              <li className="text-[11px] text-muted-foreground italic">Nenhuma evidência ainda.</li>
            )}
            {state.evidencePro.map((e, i) => (
              <li key={i} className="flex items-start gap-1.5 bg-background/80 rounded px-2 py-1 text-xs border border-emerald-200">
                <span className="flex-1">{e}</span>
                <button onClick={() => removePro(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contra */}
        <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm text-destructive">❌ Evidências CONTRA</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold">
              {state.evidenceCon.length}
            </span>
          </div>
          <div className="flex gap-1">
            <input
              value={con}
              onChange={(e) => setCon(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCon()}
              placeholder="Ex: Outras vezes ele respondeu rápido..."
              className="flex-1 px-2 py-1.5 rounded-md border bg-background text-xs focus:outline-none focus:border-destructive"
            />
            <Button size="sm" onClick={addCon} variant="outline" className="border-destructive h-8">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ul className="flex flex-col gap-1 max-h-40 overflow-auto">
            {state.evidenceCon.length === 0 && (
              <li className="text-[11px] text-muted-foreground italic">Nenhuma evidência ainda.</li>
            )}
            {state.evidenceCon.map((e, i) => (
              <li key={i} className="flex items-start gap-1.5 bg-background/80 rounded px-2 py-1 text-xs border border-destructive/30">
                <span className="flex-1">{e}</span>
                <button onClick={() => removeCon(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-md bg-muted/50 p-2 text-[11px] text-muted-foreground">
        💡 <b>Pergunta-chave:</b> se um amigo seu vivesse essa situação e tivesse esse pensamento,
        que evidências você apresentaria pra ele rever a ideia?
      </div>

      <Button
        size="sm"
        disabled={state.evidencePro.length + state.evidenceCon.length === 0}
        onClick={() => update({ scene: "arquivo", activeHint: null })}
        className="self-end"
      >
        Próxima cena → Arquivo
      </Button>
    </div>
  );
}

async function downloadCasePdf(state: State) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeBlock = (label: string, text: string, opts?: { italic?: boolean; color?: [number, number, number] }) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    ensureSpace(16);
    doc.text(label.toUpperCase(), margin, y);
    y += 14;
    doc.setFont("helvetica", opts?.italic ? "italic" : "normal");
    doc.setFontSize(12);
    const [r, g, b] = opts?.color ?? [30, 30, 30];
    doc.setTextColor(r, g, b);
    const lines = doc.splitTextToSize(text || "—", maxW);
    ensureSpace(lines.length * 16 + 8);
    doc.text(lines, margin, y);
    y += lines.length * 16 + 12;
  };

  const writeList = (label: string, items: string[], color: [number, number, number]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(color[0], color[1], color[2]);
    ensureSpace(18);
    doc.text(label, margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    if (items.length === 0) {
      ensureSpace(16);
      doc.setTextColor(150, 150, 150);
      doc.text("— (nenhuma)", margin + 12, y);
      y += 18;
      return;
    }
    items.forEach((it) => {
      const lines = doc.splitTextToSize(`• ${it}`, maxW - 12);
      ensureSpace(lines.length * 14 + 4);
      doc.text(lines, margin + 12, y);
      y += lines.length * 14 + 4;
    });
    y += 6;
  };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text("🕵️  Meu Caso de Detetive", margin, y);
  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  const today = new Date().toLocaleDateString("pt-BR");
  doc.text(`Resolvido em ${today}`, margin, y);
  y += 24;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  writeBlock("Cena do crime (situação)", state.situation);
  writeBlock("Pensamento suspeito", `"${state.thought}"`, { italic: true, color: [180, 60, 60] });

  // Distorções
  const distLabels = state.distortions
    .map((id) => DISTORTIONS.find((d) => d.id === id))
    .filter(Boolean)
    .map((d) => `${d!.label}`);
  writeBlock("Distorções identificadas", distLabels.join(", ") || "—");

  // Evidências
  writeList("✅ Evidências A FAVOR", state.evidencePro, [40, 130, 80]);
  writeList("❌ Evidências CONTRA", state.evidenceCon, [180, 60, 60]);

  writeBlock("Pensamento reescrito", `"${state.reframe}"`, { italic: true, color: [40, 100, 160] });

  // Footer
  ensureSpace(40);
  y = Math.max(y, pageH - margin - 30);
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 14;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text("Mundo Pine · Detetive Aventura", margin, y);

  doc.save(`meu-caso-detetive-${today.replace(/\//g, "-")}.pdf`);
}
