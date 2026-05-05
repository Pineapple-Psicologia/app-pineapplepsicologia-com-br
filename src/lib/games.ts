export type GameId = "whiteboard" | "termometro" | "detetive";

export type GameMeta = {
  id: GameId;
  title: string;
  emoji: string;
  description: string;
  ageRange: string;
  approach: string;
  available: boolean;
};

export const GAMES: GameMeta[] = [
  {
    id: "whiteboard",
    title: "Quadro Livre",
    emoji: "🎨",
    description:
      "Espaço aberto pra desenhar, escrever e brincar junto. Garatuja, anamnese visual, expressão livre.",
    ageRange: "7–17 anos",
    approach: "Expressão livre",
    available: true,
  },
  {
    id: "termometro",
    title: "Termômetro das Emoções",
    emoji: "🌡️",
    description:
      "Escala visual 0–10 que o paciente arrasta ao vivo. Ideal pra abrir e fechar a sessão, rastrear intensidade emocional.",
    ageRange: "7–17 anos",
    approach: "Psicoeducação emocional",
    available: true,
  },
  {
    id: "detetive",
    title: "Detetive de Pensamentos",
    emoji: "🕵️",
    description:
      "Investigar pensamentos automáticos com cartas de distorções cognitivas. Reescrever junto, em 4 etapas.",
    ageRange: "11–17 anos",
    approach: "TCC",
    available: true,
  },
  {
    id: "mapa" as GameId,
    title: "Mapa Corporal",
    emoji: "🧍",
    description:
      "Silhueta onde o paciente pinta onde sente cada emoção no corpo.",
    ageRange: "7–12 anos",
    approach: "Consciência corporal",
    available: false,
  },
  {
    id: "balanca" as GameId,
    title: "Balança da Evidência",
    emoji: "⚖️",
    description:
      "Pesar evidências a favor e contra um pensamento. A balança inclina visualmente.",
    ageRange: "11–17 anos",
    approach: "TCC",
    available: false,
  },
];

export const getGame = (id: string): GameMeta | undefined =>
  GAMES.find((g) => g.id === id);
