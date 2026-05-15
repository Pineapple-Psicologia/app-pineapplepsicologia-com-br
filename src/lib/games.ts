export type GameId = "whiteboard" | "termometro" | "detetive" | "detetive-tabuleiro" | "detetive-aventura" | "mapa-corporal" | "triangulo";

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
    id: "detetive-tabuleiro",
    title: "Detetive: Mapa de Investigação",
    emoji: "🗺️",
    description:
      "Versão tabuleiro do Detetive: percorra cena do crime, sala de interrogatório, mesa de cartas, evidências e arquivo. Mais lúdico e imersivo.",
    ageRange: "9–15 anos",
    approach: "TCC + jogo de tabuleiro",
    available: true,
  },
  {
    id: "detetive-aventura",
    title: "Detetive: Aventura Investigativa",
    emoji: "🔦",
    description:
      "Modo point & click: entre em cada cena (crime, interrogatório, laboratório, arquivo, veredito), clique em pistas e resolva o caso junto. Visual cartoon ou noir.",
    ageRange: "9–17 anos",
    approach: "TCC imersiva",
    available: true,
  },
  {
    id: "mapa-corporal",
    title: "Mapa Corporal",
    emoji: "🧍",
    description:
      "Silhueta interativa onde o paciente pinta onde sente cada emoção no corpo. Ótimo pra abrir e fechar sessão.",
    ageRange: "7–12 anos",
    approach: "Consciência corporal",
    available: true,
  },
  {
    id: "triangulo",
    title: "Triângulo Cognitivo",
    emoji: "🔺",
    description:
      "Psicoeducação sobre pensamento, emoção e comportamento: visualizar o triângulo, classificar cartas e preencher uma situação real.",
    ageRange: "9–17 anos",
    approach: "TCC · psicoeducação",
    available: true,
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
