export type GameId = "whiteboard" | "termometro" | "detetive" | "detetive-tabuleiro" | "detetive-aventura" | "triangulo" | "entre-lentes" | "ancoragem" | "folhas-no-rio" | "bussola" | "minha-casa" | "missao-autocontrole";

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
    id: "triangulo",
    title: "Ciclo Cognitivo",
    emoji: "🔄",
    description:
      "Psicoeducação sobre situação, pensamento, emoção e comportamento: um ciclo que se retroalimenta, com cartas para classificar e prática real.",
    ageRange: "9–17 anos",
    approach: "TCC · psicoeducação",
    available: true,
  },
  {
    id: "entre-lentes",
    title: "Entre Lentes",
    emoji: "🔭",
    description:
      "Jogo narrativo: a mesma cena escolar muda conforme a lente cognitiva equipada (vergonha, catástrofe, curiosa). Investigue pistas pra ganhar clareza.",
    ageRange: "9–16 anos",
    approach: "TCC · flexibilidade cognitiva",
    available: true,
  },
  {
    id: "ancoragem",
    title: "5-4-3-2-1 Ancoragem",
    emoji: "⚓",
    description:
      "Grounding guiado pelos 5 sentidos para crises de ansiedade ou dissociação. Mede intensidade antes e depois.",
    ageRange: "7–17 anos",
    approach: "Grounding · ansiedade aguda",
    available: true,
  },
  {
    id: "folhas-no-rio",
    title: "Folhas no Rio",
    emoji: "🍃",
    description:
      "ACT · desfusão cognitiva. Escreva pensamentos em folhas e veja-as fluir num rio Pixar. Algumas ficam presas em pedras — pratique soltar.",
    ageRange: "9–17 anos",
    approach: "ACT · desfusão",
    available: true,
  },
  {
    id: "bussola",
    title: "Bússola de Valores",
    emoji: "🧭",
    description:
      "ACT · clarificação de valores. Triagem de 24 valores, ranking, bússola de 8 domínios e micro-compromissos para a semana.",
    ageRange: "11–17 anos",
    approach: "ACT · valores",
    available: true,
  },
  {
    id: "minha-casa",
    title: "Minha Casa",
    emoji: "🏠",
    description:
      "Construa simbolicamente sua casa: cômodos, móveis, família e pets. Iluminação, expressões e proximidades revelam vínculos e emoções.",
    ageRange: "7–17 anos",
    approach: "Lúdico simbólico · família",
    available: true,
  },
  {
    id: "missao-autocontrole",
    title: "Missão Autocontrole",
    emoji: "🚀",
    description:
      "Treino de controle de impulsos com a técnica P.A.R.A. (Parar, Afastar, Respirar, Agir) e missões com dilemas reais do dia a dia. Ideal para TOD.",
    ageRange: "10–15 anos",
    approach: "TCC · controle de impulsos · TOD",
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
