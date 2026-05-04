import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Heart, Hand, Trophy, RotateCw } from "lucide-react";
import type { useRoom } from "@/lib/useRoom";

type Scenario = {
  situation: string;
  thoughts: { text: string; ok: boolean }[];
  emotions: { text: string; emoji: string; ok: boolean }[];
  behaviors: { text: string; ok: boolean }[];
};

const SCENARIOS: Scenario[] = [
  {
    situation: "Você foi convidado para apresentar um trabalho na frente da turma.",
    thoughts: [
      { text: "Vou errar tudo e rir vão de mim.", ok: false },
      { text: "Posso me preparar e dar o meu melhor.", ok: true },
      { text: "Sou péssimo em tudo.", ok: false },
    ],
    emotions: [
      { text: "Ansioso", emoji: "😨", ok: true },
      { text: "Animado", emoji: "🤩", ok: true },
      { text: "Furioso", emoji: "😡", ok: false },
    ],
    behaviors: [
      { text: "Treinar a apresentação", ok: true },
      { text: "Faltar à aula", ok: false },
      { text: "Pedir ajuda à professora", ok: true },
    ],
  },
  {
    situation: "Seu melhor amigo não respondeu sua mensagem hoje.",
    thoughts: [
      { text: "Talvez ele esteja ocupado.", ok: true },
      { text: "Ele me odeia agora.", ok: false },
      { text: "Posso falar com ele depois.", ok: true },
    ],
    emotions: [
      { text: "Triste", emoji: "😢", ok: true },
      { text: "Curioso", emoji: "🤔", ok: true },
      { text: "Com vontade de quebrar tudo", emoji: "💥", ok: false },
    ],
    behaviors: [
      { text: "Mandar 50 mensagens seguidas", ok: false },
      { text: "Esperar e fazer outra coisa", ok: true },
      { text: "Ligar com calma mais tarde", ok: true },
    ],
  },
  {
    situation: "Você tirou uma nota baixa numa prova.",
    thoughts: [
      { text: "Sou burro, nunca vou aprender.", ok: false },
      { text: "Errei aqui, posso estudar diferente.", ok: true },
      { text: "Foi só uma prova, posso melhorar.", ok: true },
    ],
    emotions: [
      { text: "Frustrado", emoji: "😤", ok: true },
      { text: "Triste", emoji: "😞", ok: true },
      { text: "Feliz", emoji: "😄", ok: false },
    ],
    behaviors: [
      { text: "Pedir ajuda no que não entendi", ok: true },
      { text: "Rasgar a prova", ok: false },
      { text: "Refazer os exercícios", ok: true },
    ],
  },
  {
    situation: "Alguém da turma fez uma piada com seu cabelo.",
    thoughts: [
      { text: "Meu cabelo é horrível.", ok: false },
      { text: "É só a opinião dele, eu gosto do meu cabelo.", ok: true },
      { text: "Não preciso agradar todo mundo.", ok: true },
    ],
    emotions: [
      { text: "Magoado", emoji: "💔", ok: true },
      { text: "Calmo", emoji: "😌", ok: true },
      { text: "Com nojo de mim", emoji: "🤢", ok: false },
    ],
    behaviors: [
      { text: "Conversar com alguém de confiança", ok: true },
      { text: "Brigar e revidar com xingamentos", ok: false },
      { text: "Dizer que não gostei", ok: true },
    ],
  },
  {
    situation: "Seus pais discutiram alto na sala.",
    thoughts: [
      { text: "É culpa minha que eles brigam.", ok: false },
      { text: "Adultos discutem às vezes, não é sobre mim.", ok: true },
      { text: "Posso falar como me sinto depois.", ok: true },
    ],
    emotions: [
      { text: "Com medo", emoji: "😟", ok: true },
      { text: "Triste", emoji: "😢", ok: true },
      { text: "Animado", emoji: "🥳", ok: false },
    ],
    behaviors: [
      { text: "Procurar um lugar calmo no quarto", ok: true },
      { text: "Gritar mais alto que eles", ok: false },
      { text: "Conversar com eles depois com calma", ok: true },
    ],
  },
];

const STEPS = [
  { key: "thoughts", icon: Brain, label: "Pensamento", color: "text-primary", help: "Quais pensamentos ajudam?" },
  { key: "emotions", icon: Heart, label: "Emoção", color: "text-accent", help: "Que emoções fazem sentido?" },
  { key: "behaviors", icon: Hand, label: "Comportamento", color: "text-primary", help: "Quais atitudes ajudam?" },
] as const;

export default function CBTTriad({ room }: { room: ReturnType<typeof useRoom> }) {
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<Record<string, boolean | null>>({});

  const sync = (next: { idx?: number; step?: number; score?: number; picked?: any }) => {
    if (next.idx !== undefined) setIdx(next.idx);
    if (next.step !== undefined) setStep(next.step);
    if (next.score !== undefined) setScore(next.score);
    if (next.picked !== undefined) setPicked(next.picked);
  };

  useEffect(() => {
    return room.on((m) => {
      if (m.type === "tcc:sync") sync(m.payload);
    });
  }, [room]);

  const send = (state: any) => room.send("tcc:sync", state);
  const scenario = SCENARIOS[idx];
  const current = STEPS[step];
  const options = scenario[current.key];

  const choose = (i: number, ok: boolean) => {
    const key = `${idx}-${step}-${i}`;
    if (picked[key] !== undefined) return;
    const newPicked = { ...picked, [key]: ok };
    const newScore = score + (ok ? 10 : 0);
    setPicked(newPicked);
    setScore(newScore);
    send({ picked: newPicked, score: newScore });
    setTimeout(() => {
      if (step < 2) {
        setStep(step + 1);
        send({ step: step + 1, picked: newPicked, score: newScore });
      } else {
        const nextIdx = (idx + 1) % SCENARIOS.length;
        setIdx(nextIdx); setStep(0); setPicked({});
        send({ idx: nextIdx, step: 0, picked: {}, score: newScore });
      }
    }, 900);
  };

  const reset = () => {
    setIdx(0); setStep(0); setScore(0); setPicked({});
    send({ idx: 0, step: 0, score: 0, picked: {} });
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Icon className="w-4 h-4" /> {s.label}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/20 text-accent-foreground font-bold">
            <Trophy className="w-4 h-4" /> {score}
          </div>
          <Button size="sm" variant="ghost" onClick={reset}><RotateCw className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-card to-secondary/40">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Situação</div>
        <p className="text-2xl font-display leading-snug">{scenario.situation}</p>
      </Card>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <current.icon className={`w-5 h-5 ${current.color}`} />
          <h3 className="font-bold text-lg">{current.help}</h3>
        </div>
        <div className="grid gap-3">
          {options.map((o, i) => {
            const key = `${idx}-${step}-${i}`;
            const result = picked[key];
            const shown = result !== undefined;
            return (
              <button
                key={i}
                onClick={() => choose(i, o.ok)}
                disabled={shown}
                className={`text-left p-4 rounded-xl border-2 transition-all hover:scale-[1.01] ${
                  !shown ? "bg-card border-border hover:border-primary" :
                  result === o.ok && o.ok ? "bg-primary/15 border-primary" :
                  "bg-destructive/10 border-destructive/40 opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  {"emoji" in o && <span className="text-3xl">{(o as any).emoji}</span>}
                  <span className="font-semibold flex-1">{o.text}</span>
                  {shown && (o.ok ? <span className="text-primary">✓ Ajuda</span> : <span className="text-destructive">Hmm</span>)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
