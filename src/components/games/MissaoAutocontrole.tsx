import { useEffect, useMemo, useState } from "react";
import type { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import { OctagonPause, Wind, Lightbulb, Rocket, RotateCcw, ChevronRight, Star, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";

type Props = { room: ReturnType<typeof useRoom> };

/**
 * Missão Autocontrole — jogo para controle de impulsos (TOD).
 * Treina a técnica P.A.R.A.: Parar → Afastar → Respirar → Agir.
 * Fase 1: treino do botão de pausa (STOP). Fase 2: cenários do cotidiano
 * onde o paciente escolhe entre reação impulsiva e respostas pensadas.
 */

const STEPS = [
  { id: "parar", label: "Parar", emoji: "✋", icon: OctagonPause, desc: "Congele! Não faça nada ainda. Seu corpo quer agir rápido — você é o piloto.", color: "#E63946" },
  { id: "afastar", label: "Afastar", emoji: "🚶", icon: Rocket, desc: "Dê um passo pra trás, conte até 5. Distância do problema = visão melhor.", color: "#F77F00" },
  { id: "respirar", label: "Respirar", emoji: "🌬️", icon: Wind, desc: "3 respirações fundas: entra pelo nariz (4s), sai pela boca (6s).", color: "#3A86FF" },
  { id: "agir", label: "Agir", emoji: "🎯", icon: Lightbulb, desc: "Agora sim! Escolha a melhor jogada — aquela que você não vai se arrepender.", color: "#06D6A0" },
] as const;

type Scenario = {
  id: string;
  titulo: string;
  cena: string;
  impulsiva: string;
  opcoes: { texto: string; boa: boolean; feedback: string }[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "videogame",
    titulo: "O controle sumiu",
    cena: "Você chega em casa e seu irmão mais novo está jogando no SEU videogame, sem pedir. Seu sangue ferve na hora.",
    impulsiva: "Arrancar o controle da mão dele e gritar",
    opcoes: [
      { texto: "Arrancar o controle e gritar com ele", boa: false, feedback: "Impulso mandou! Gritar resolve na hora, mas estraga o resto do dia — e pode sobrar bronca pra você." },
      { texto: "Fazer o P.A.R.A. e dizer: 'Ei, me devolve o controle. Daqui a pouco você joga de novo'", boa: true, feedback: "Mandou bem! Você parou, respirou e resolveu sem guerra. Isso é autocontrole de verdade." },
      { texto: "Falar com um adulto se ele não devolver", boa: true, feedback: "Boa estratégia! Pedir ajuda não é fraqueza — é jogar inteligente." },
    ],
  },
  {
    id: "nao-da-mae",
    titulo: "O 'não' da mãe",
    cena: "Você pede pra sair com os amigos e sua mãe diz NÃO, sem explicar o motivo. Dá vontade de explodir.",
    impulsiva: "Bater a porta do quarto e xingar",
    opcoes: [
      { texto: "Bater a porta e gritar que ela nunca deixa nada", boa: false, feedback: "Explodir fecha o diálogo. Amanhã vai ser ainda mais difícil conseguir um 'sim'." },
      { texto: "Respirar fundo e perguntar: 'Por que não? O que eu posso fazer pra poder ir?'", boa: true, feedback: "Excelente! Negociar mostra maturidade — e aumenta suas chances da próxima vez." },
      { texto: "Esperar 10 minutos e conversar quando estiver mais calmo", boa: true, feedback: "Perfeito! Esperar a poeira baixar é uma jogada de mestre." },
    ],
  },
  {
    id: "provocacao",
    titulo: "A provocação na escola",
    cena: "Um colega te empurra no corredor e ri com os amigos: 'E aí, vai chorar?'. Todo mundo olhando.",
    impulsiva: "Empurrar de volta e partir pra briga",
    opcoes: [
      { texto: "Empurrar de volta e brigar", boa: false, feedback: "Era exatamente isso que ele queria! Brigar pode te trazer suspensão — ele ganha, você perde." },
      { texto: "Ignorar e sair andando de cabeça erguida", boa: true, feedback: "Fortíssimo! Não dar o show que ele esperava desarma completamente a provocação." },
      { texto: "Dizer firme: 'Não encosta em mim' e avisar um professor", boa: true, feedback: "Muito bem! Você se defendeu com palavras e buscou o suporte certo." },
    ],
  },
  {
    id: "jogo-perdido",
    titulo: "Derrota no jogo",
    cena: "Você perde a partida online no último segundo por causa de um erro bobo. A frustração explode.",
    impulsiva: "Jogar o controle/celular na parede",
    opcoes: [
      { texto: "Jogar o controle longe e xingar o jogo", boa: false, feedback: "O controle quebrado custa caro e a raiva continua. O impulso cobra um preço alto." },
      { texto: "Pausar, respirar 3 vezes e dizer: 'É só um jogo. Revanche!'", boa: true, feedback: "É isso! Perder faz parte. Quem controla a raiva joga melhor na próxima." },
      { texto: "Fechar o jogo e fazer outra coisa por 15 minutos", boa: true, feedback: "Ótima saída! Às vezes a melhor jogada é dar um tempo e voltar com a cabeça fria." },
    ],
  },
  {
    id: "injustica",
    titulo: "Acusado injustamente",
    cena: "O professor te repreende na frente da turma por uma bagunça que NÃO foi você quem fez.",
    impulsiva: "Gritar na hora: 'Não fui eu! Você é injusto!'",
    opcoes: [
      { texto: "Gritar na frente de todo mundo que não foi você", boa: false, feedback: "Gritar na hora faz você parecer culpado mesmo sendo inocente. A plateia só vê a explosão." },
      { texto: "Respirar, aguentar a raiva e pedir pra falar com ele em particular depois", boa: true, feedback: "Jogada de adulto! Resolver em particular tem muito mais chance de dar certo." },
      { texto: "Escrever o que sentiu num papel pra descarregar, e conversar depois", boa: true, feedback: "Genial! Colocar a raiva no papel tira ela de dentro de você sem causar estrago." },
    ],
  },
  {
    id: "celular",
    titulo: "Celular confiscado",
    cena: "Seu pai tira o celular da sua mão no meio de uma conversa importante com seus amigos, porque está na hora do jantar.",
    impulsiva: "Tentar pegar o celular de volta à força",
    opcoes: [
      { texto: "Puxar o celular de volta e discutir", boa: false, feedback: "Disputa física nunca termina bem — o castigo tende a dobrar." },
      { texto: "Fazer o P.A.R.A. e combinar: 'Ok, janto rápido e pego de volta depois, combinado?'", boa: true, feedback: "Negociação nota 10! Você cedeu no momento certo pra ganhar depois." },
      { texto: "Avisar os amigos: 'vou jantar, já volto' e entregar o celular", boa: true, feedback: "Maduro! Seus amigos entendem — e você não perde o celular por uma semana." },
    ],
  },
];

type Phase = "intro" | "treino" | "cenarios" | "fim";

export default function MissaoAutocontrole({ room }: Props) {
  const isPsi = (room as any).role === "psi" || true; // room não expõe role; ações locais sincronizam via broadcast
  const [phase, setPhase] = useState<Phase>("intro");
  const [stepIdx, setStepIdx] = useState(0);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [breathCount, setBreathCount] = useState(0);

  const scenario = SCENARIOS[scenarioIdx];

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "ma:state") {
        const s = m.payload;
        setPhase(s.phase); setStepIdx(s.stepIdx); setScenarioIdx(s.scenarioIdx);
        setPicked(s.picked); setScore(s.score); setBreathCount(s.breathCount ?? 0);
      }
    });
  }, [room]);

  const sync = (patch: Partial<{ phase: Phase; stepIdx: number; scenarioIdx: number; picked: number | null; score: number; breathCount: number }>) => {
    const s = { phase, stepIdx, scenarioIdx, picked, score, breathCount, ...patch };
    setPhase(s.phase); setStepIdx(s.stepIdx); setScenarioIdx(s.scenarioIdx);
    setPicked(s.picked); setScore(s.score); setBreathCount(s.breathCount);
    room.send("ma:state", s);
  };

  const pickOption = (i: number) => {
    if (picked !== null) return;
    const ok = scenario.opcoes[i].boa;
    sync({ picked: i, score: ok ? score + 10 : score });
    if (ok) toast.success("+10 pontos de autocontrole! ⭐");
  };

  const nextScenario = () => {
    if (scenarioIdx + 1 >= SCENARIOS.length) sync({ phase: "fim", picked: null });
    else sync({ scenarioIdx: scenarioIdx + 1, picked: null });
  };

  const maxScore = SCENARIOS.length * 10;
  const stars = useMemo(() => Math.round((score / maxScore) * 3), [score, maxScore]);

  return (
    <div className="min-h-full w-full flex flex-col bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl sm:text-2xl">🚀</span>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-sm sm:text-lg truncate">Missão Autocontrole</h2>
            <p className="text-[10px] sm:text-xs text-white/60 truncate">Treine o poder de parar antes de agir</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 bg-amber-400/20 text-amber-300 rounded-full px-2.5 py-1 text-xs sm:text-sm font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-300" /> {score}
          </div>
          <Button size="sm" variant="ghost" className="text-white/80 hover:text-white h-8 w-8 p-0" onClick={() => setShowHelp(true)}>
            <HelpCircle className="w-4.5 h-4.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-white/80 hover:text-white h-8 w-8 p-0" onClick={() => sync({ phase: "intro", stepIdx: 0, scenarioIdx: 0, picked: null, score: 0, breathCount: 0 })}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {/* INTRO */}
        {phase === "intro" && (
          <div className="max-w-lg mx-auto text-center space-y-5 py-6 animate-in fade-in">
            <div className="text-6xl">🧠</div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold">Cadete, bem-vindo à base!</h3>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Todo mundo sente raiva. O problema não é sentir — é o que a gente <b>faz</b> com ela.
              Nesta missão você vai treinar a técnica <b className="text-amber-300">P.A.R.A.</b> e
              enfrentar situações reais do dia a dia. Pronto pra mostrar quem manda nos seus impulsos?
            </p>
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {STEPS.map((s) => (
                <div key={s.id} className="rounded-xl p-2.5 text-center border border-white/15" style={{ backgroundColor: `${s.color}22` }}>
                  <div className="text-2xl">{s.emoji}</div>
                  <div className="text-[10px] sm:text-xs font-bold mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <Button size="lg" className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold" onClick={() => sync({ phase: "treino", stepIdx: 0 })}>
              Começar treino <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* TREINO P.A.R.A. */}
        {phase === "treino" && (
          <div className="max-w-lg mx-auto space-y-5 py-4 animate-in fade-in">
            <p className="text-center text-xs uppercase tracking-widest text-white/50 font-bold">Treino da técnica P.A.R.A.</p>
            <div className="flex justify-center gap-1.5">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`h-1.5 rounded-full transition-all ${i <= stepIdx ? "w-10" : "w-6 bg-white/20"}`} style={i <= stepIdx ? { backgroundColor: s.color } : {}} />
              ))}
            </div>
            {(() => {
              const step = STEPS[stepIdx];
              const Icon = step.icon;
              return (
                <div className="rounded-3xl border-2 p-6 sm:p-8 text-center space-y-4 bg-white/5" style={{ borderColor: step.color }}>
                  <div className="w-20 h-20 mx-auto rounded-full grid place-items-center shadow-lg" style={{ backgroundColor: `${step.color}33`, border: `3px solid ${step.color}` }}>
                    <span className="text-4xl">{step.emoji}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold" style={{ color: step.color }}>{step.label}</h3>
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed">{step.desc}</p>

                  {step.id === "respirar" && (
                    <div className="space-y-3">
                      <div className="w-24 h-24 mx-auto rounded-full border-4 border-sky-400 grid place-items-center animate-pulse bg-sky-400/10">
                        <Wind className="w-8 h-8 text-sky-300" />
                      </div>
                      <p className="text-sky-300 font-bold text-sm">Respirações feitas: {breathCount}/3</p>
                      <Button variant="outline" className="border-sky-400 text-sky-300 hover:bg-sky-400/10" onClick={() => sync({ breathCount: breathCount + 1 })}>
                        🌬️ Fiz uma respiração
                      </Button>
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="font-bold text-slate-900"
                    style={{ backgroundColor: step.color }}
                    disabled={step.id === "respirar" && breathCount < 3}
                    onClick={() => {
                      if (stepIdx + 1 >= STEPS.length) sync({ phase: "cenarios", scenarioIdx: 0, picked: null });
                      else sync({ stepIdx: stepIdx + 1 });
                    }}
                  >
                    {stepIdx + 1 >= STEPS.length ? "Ir para as missões! 🚀" : "Feito! Próximo passo"}
                  </Button>
                </div>
              );
            })()}
          </div>
        )}

        {/* CENÁRIOS */}
        {phase === "cenarios" && (
          <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-white/50 font-bold">Missão {scenarioIdx + 1} de {SCENARIOS.length}</p>
              <div className="flex gap-1">
                {SCENARIOS.map((s, i) => (
                  <div key={s.id} className={`h-1.5 w-5 rounded-full ${i < scenarioIdx ? "bg-emerald-400" : i === scenarioIdx ? "bg-amber-400" : "bg-white/20"}`} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 sm:p-6 space-y-2">
              <h3 className="font-display text-lg sm:text-xl font-bold text-amber-300">{scenario.titulo}</h3>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed">{scenario.cena}</p>
              <p className="text-xs sm:text-sm text-red-300/90 italic">⚡ Vontade imediata: {scenario.impulsiva}...</p>
            </div>

            <div className="space-y-2.5">
              {scenario.opcoes.map((op, i) => {
                const revealed = picked !== null;
                const isPicked = picked === i;
                return (
                  <div key={i}>
                    <button
                      onClick={() => pickOption(i)}
                      disabled={revealed}
                      className={`w-full text-left rounded-xl border-2 p-3.5 sm:p-4 text-sm sm:text-base font-medium transition-all ${
                        revealed
                          ? op.boa
                            ? "border-emerald-400 bg-emerald-400/15"
                            : isPicked
                              ? "border-red-400 bg-red-400/15"
                              : "border-white/10 bg-white/5 opacity-60"
                          : "border-white/15 bg-white/5 hover:border-amber-400/60 hover:bg-white/10 active:scale-[0.99]"
                      }`}
                    >
                      <span className="mr-2">{revealed ? (op.boa ? "✅" : isPicked ? "❌" : "⚪") : ["🅰️", "🅱️", "🅲"][i] ?? "•"}</span>
                      {op.texto}
                    </button>
                    {isPicked && (
                      <div className={`mt-1.5 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm ${op.boa ? "bg-emerald-400/15 text-emerald-200" : "bg-red-400/15 text-red-200"}`}>
                        {op.feedback}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {picked !== null && (
              <Button size="lg" className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold" onClick={nextScenario}>
                {scenarioIdx + 1 >= SCENARIOS.length ? "Ver resultado da missão 🏁" : "Próxima missão"} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* FIM */}
        {phase === "fim" && (
          <div className="max-w-lg mx-auto text-center space-y-5 py-8 animate-in fade-in">
            <div className="text-6xl">{stars >= 3 ? "🏆" : stars >= 2 ? "🎖️" : "💪"}</div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold">Missão concluída!</h3>
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <Star key={i} className={`w-10 h-10 ${i < stars ? "fill-amber-300 text-amber-300" : "text-white/20"}`} />
              ))}
            </div>
            <p className="text-white/80 text-sm sm:text-base">
              Você fez <b className="text-amber-300">{score} de {maxScore} pontos</b> de autocontrole.
            </p>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 text-sm sm:text-base text-white/90 text-left space-y-2">
              <p className="font-bold text-amber-300">📋 Lembrete pra vida real:</p>
              <p>Quando a raiva bater, use o <b>P.A.R.A.</b>: <b>P</b>arar, <b>A</b>fastar, <b>R</b>espirar, <b>A</b>gir.
              Você não controla o que sente — mas controla o que faz. E isso é um superpoder. 🦸</p>
            </div>
            <Button size="lg" className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold" onClick={() => sync({ phase: "cenarios", scenarioIdx: 0, picked: null, score: 0 })}>
              <RotateCcw className="w-4 h-4 mr-1.5" /> Jogar de novo
            </Button>
          </div>
        )}
      </div>

      {/* Ajuda */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-3 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Como jogar 🎮</h3>
              <button onClick={() => setShowHelp(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-white/85">
              <li><b>Treino:</b> aprenda os 4 passos da técnica P.A.R.A. (Parar, Afastar, Respirar, Agir).</li>
              <li><b>Missões:</b> em cada cena, escolha a resposta que mostra autocontrole.</li>
              <li>Respostas pensadas valem <b>+10 pontos</b>. Não perde ponto por errar — errar faz parte do treino!</li>
              <li>No final, converse com a psicóloga: qual missão parece com algo que acontece com você?</li>
            </ol>
            <p className="text-xs text-white/50">💡 Dica pra psi: use as escolhas impulsivas como porta de entrada pra conversar sobre consequências.</p>
          </div>
        </div>
      )}
    </div>
  );
}
