import { useEffect, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, ChevronRight, Check } from "lucide-react";

type Props = { room: ReturnType<typeof useRoom> };

type Stage = "situation" | "thought" | "distortions" | "reframe" | "done";

const DISTORTIONS = [
  { id: "tudo-nada", emoji: "⚫⚪", label: "Tudo ou nada", desc: "Vejo só extremos, sem meio-termo." },
  { id: "catastrofe", emoji: "💥", label: "Catastrofização", desc: "Imagino o pior cenário possível." },
  { id: "leitura", emoji: "🔮", label: "Leitura mental", desc: "Acho que sei o que o outro pensa." },
  { id: "adivinhacao", emoji: "🎱", label: "Adivinhação", desc: "Prevejo o futuro como se fosse certo." },
  { id: "rotulo", emoji: "🏷️", label: "Rotulação", desc: "Me defino por um único defeito." },
  { id: "filtro", emoji: "🕶️", label: "Filtro mental", desc: "Só vejo o lado ruim, ignoro o bom." },
  { id: "personalizar", emoji: "🎯", label: "Personalização", desc: "Acho que tudo é culpa minha." },
  { id: "deveria", emoji: "📜", label: "Deveria", desc: "Me cobro com regras rígidas." },
  { id: "generalizar", emoji: "♾️", label: "Generalização", desc: "Uma vez = sempre." },
  { id: "emocional", emoji: "💭", label: "Raciocínio emocional", desc: "Sinto, então deve ser verdade." },
];

type State = {
  stage: Stage;
  situation: string;
  thought: string;
  selectedDistortions: string[];
  reframe: string;
};

const INITIAL: State = {
  stage: "situation",
  situation: "",
  thought: "",
  selectedDistortions: [],
  reframe: "",
};

const SUGGESTIONS = [
  { situation: "Mandei mensagem pra um amigo e ele não respondeu o dia todo.", thought: "Ele tá bravo comigo, não quer mais minha amizade." },
  { situation: "Tirei uma nota baixa numa prova.", thought: "Sou burro(a), nunca vou conseguir nada na vida." },
  { situation: "Tenho que apresentar um trabalho na frente da turma.", thought: "Vou travar, todo mundo vai rir de mim." },
  { situation: "Minha mãe estava séria no jantar.", thought: "Eu fiz alguma coisa errada, é culpa minha." },
];

export default function Detetive({ room }: Props) {
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    const off = room.on((m) => {
      if (m.type === "detect:state") setState(m.payload as State);
    });
    return off;
  }, [room]);

  const update = (patch: Partial<State>) => {
    const next = { ...state, ...patch };
    setState(next);
    room.send("detect:state", next);
  };

  const toggleDistortion = (id: string) => {
    const has = state.selectedDistortions.includes(id);
    update({
      selectedDistortions: has
        ? state.selectedDistortions.filter((d) => d !== id)
        : [...state.selectedDistortions, id],
    });
  };

  const reset = () => update(INITIAL);

  const stages: Stage[] = ["situation", "thought", "distortions", "reframe", "done"];
  const stepIdx = stages.indexOf(state.stage);

  return (
    <div className="h-full w-full bg-gradient-to-br from-background to-muted/40 rounded-xl border-2 border-border/60 p-4 md:p-6 flex flex-col gap-4 overflow-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Detetive de Pensamentos 🕵️</h2>
        </div>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="w-4 h-4 mr-1" /> Recomeçar caso
        </Button>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
        {["1. Cena", "2. Pensamento", "3. Distorções", "4. Reescrever", "✓ Caso resolvido"].map((label, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div
              className={`flex-1 text-center px-2 py-1.5 rounded ${
                i === stepIdx
                  ? "bg-primary text-primary-foreground"
                  : i < stepIdx
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {label}
            </div>
            {i < 4 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      {/* Stage 1: Situation */}
      {state.stage === "situation" && (
        <div className="flex flex-col gap-3 flex-1">
          <div>
            <h3 className="font-bold text-lg">🔍 O caso a investigar</h3>
            <p className="text-sm text-muted-foreground">
              Conte uma situação concreta que aconteceu. Sem opinião ainda, só os fatos.
            </p>
          </div>
          <textarea
            value={state.situation}
            onChange={(e) => update({ situation: e.target.value })}
            placeholder="Ex: Hoje na escola, na hora do recreio..."
            className="min-h-[120px] p-3 rounded-lg border-2 border-border/60 bg-card resize-none focus:outline-none focus:border-primary"
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Ou comece com um exemplo:</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => update({ situation: s.situation, thought: s.thought })}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-accent/20 hover:bg-accent/30 border border-accent/40 text-left max-w-[260px] truncate"
                >
                  {s.situation}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={() => update({ stage: "thought" })}
            disabled={!state.situation.trim()}
            className="self-end mt-auto"
          >
            Próximo: pensamento <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Stage 2: Thought */}
      {state.stage === "thought" && (
        <div className="flex flex-col gap-3 flex-1">
          <div className="rounded-lg p-3 bg-muted/60 border-l-4 border-primary text-sm">
            <span className="font-bold">Cena: </span>
            {state.situation}
          </div>
          <div>
            <h3 className="font-bold text-lg">💭 O pensamento automático</h3>
            <p className="text-sm text-muted-foreground">
              O que passou na sua cabeça nesse momento? Bem rapidinho, sem pensar muito.
            </p>
          </div>
          <textarea
            value={state.thought}
            onChange={(e) => update({ thought: e.target.value })}
            placeholder="Ex: Ninguém gosta de mim..."
            className="min-h-[100px] p-3 rounded-lg border-2 border-border/60 bg-card resize-none focus:outline-none focus:border-primary"
          />
          <div className="flex justify-between mt-auto">
            <Button variant="ghost" onClick={() => update({ stage: "situation" })}>
              ← Voltar
            </Button>
            <Button
              onClick={() => update({ stage: "distortions" })}
              disabled={!state.thought.trim()}
            >
              Investigar distorções <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Stage 3: Distortions */}
      {state.stage === "distortions" && (
        <div className="flex flex-col gap-3 flex-1">
          <div className="rounded-lg p-3 bg-primary/10 border-l-4 border-primary">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensamento sob investigação</div>
            <div className="text-base font-semibold italic">"{state.thought}"</div>
          </div>
          <div>
            <h3 className="font-bold text-lg">🔎 Quais "armadilhas" aparecem aqui?</h3>
            <p className="text-sm text-muted-foreground">
              Toque nas cartas que combinam com esse pensamento. Pode escolher quantas quiser.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {DISTORTIONS.map((d) => {
              const active = state.selectedDistortions.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDistortion(d.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                      : "border-border/60 bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{d.emoji}</span>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="font-bold text-sm mt-1">{d.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{d.desc}</div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-auto">
            <Button variant="ghost" onClick={() => update({ stage: "thought" })}>
              ← Voltar
            </Button>
            <Button
              onClick={() => update({ stage: "reframe" })}
              disabled={state.selectedDistortions.length === 0}
            >
              Reescrever pensamento <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Stage 4: Reframe */}
      {state.stage === "reframe" && (
        <div className="flex flex-col gap-3 flex-1">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-lg p-3 bg-destructive/10 border-l-4 border-destructive">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensamento original</div>
              <div className="text-sm italic">"{state.thought}"</div>
            </div>
            <div className="rounded-lg p-3 bg-muted/60">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Distorções encontradas</div>
              <div className="flex flex-wrap gap-1">
                {state.selectedDistortions.map((id) => {
                  const d = DISTORTIONS.find((x) => x.id === id)!;
                  return (
                    <span key={id} className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                      {d.emoji} {d.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg">✨ Pensamento mais justo</h3>
            <p className="text-sm text-muted-foreground">
              Olhando as evidências reais, qual é uma versão mais equilibrada e verdadeira desse pensamento?
            </p>
          </div>
          <textarea
            value={state.reframe}
            onChange={(e) => update({ reframe: e.target.value })}
            placeholder="Ex: Talvez ele esteja ocupado. Já tive amigos que demoraram pra responder e tudo ficou bem..."
            className="min-h-[120px] p-3 rounded-lg border-2 border-border/60 bg-card resize-none focus:outline-none focus:border-primary"
          />
          <div className="flex justify-between mt-auto">
            <Button variant="ghost" onClick={() => update({ stage: "distortions" })}>
              ← Voltar
            </Button>
            <Button
              onClick={() => update({ stage: "done" })}
              disabled={!state.reframe.trim()}
            >
              Finalizar caso <Check className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Stage 5: Done */}
      {state.stage === "done" && (
        <div className="flex flex-col gap-4 flex-1 items-center justify-center text-center max-w-2xl mx-auto">
          <div className="text-6xl">🎉</div>
          <h3 className="text-2xl font-bold">Caso resolvido, Detetive!</h3>
          <div className="w-full grid gap-3 text-left">
            <div className="rounded-lg p-4 bg-muted/60">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cena</div>
              <div className="text-sm">{state.situation}</div>
            </div>
            <div className="rounded-lg p-4 bg-destructive/10 border-l-4 border-destructive">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensamento antigo</div>
              <div className="text-sm italic line-through opacity-70">"{state.thought}"</div>
            </div>
            <div className="rounded-lg p-4 bg-primary/10 border-l-4 border-primary">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensamento novo</div>
              <div className="text-base font-semibold">"{state.reframe}"</div>
            </div>
          </div>
          <Button onClick={reset} size="lg">
            <RotateCcw className="w-4 h-4 mr-2" /> Novo caso
          </Button>
        </div>
      )}
    </div>
  );
}
