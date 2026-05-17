import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, Heart, Users, Lock } from "lucide-react";
import { GAMES, type GameId } from "@/lib/games";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lúdico Clínico — Ferramentas terapêuticas online" },
      {
        name: "description",
        content:
          "Estante de jogos terapêuticos colaborativos para psicólogas infantojuvenis usarem em sessões online.",
      },
    ],
  }),
  component: Home,
});

function genCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function Home() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const openGame = (game: GameId) => {
    navigate({
      to: "/sala/$code",
      params: { code: genCode() },
      search: { role: "psi", game },
    });
  };

  const enterAsPaciente = () => {
    const c = code.toUpperCase().trim();
    if (!c) return;
    navigate({
      to: "/sala/$code",
      params: { code: c },
      search: { role: "paciente" },
    });
  };

  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Área da psicóloga</Link>
          </Button>
        </div>
        <header className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Estante de jogos terapêuticos
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-[1.05] text-foreground">
            Brincar é <span className="text-primary">linguagem clínica.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Escolha um recurso, abra a sala e compartilhe o código com seu
            paciente. Tudo ao vivo, sem download.
          </p>
        </header>



        <section className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Sou psicóloga — escolher recurso
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAMES.map((g) => (
              <Card
                key={g.id}
                className={`p-5 flex flex-col gap-3 border-2 transition-all ${
                  g.available
                    ? "hover:border-primary hover:shadow-xl cursor-pointer hover:-translate-y-0.5"
                    : "opacity-60"
                }`}
                onClick={() => g.available && openGame(g.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-4xl">{g.emoji}</div>
                  {!g.available && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> em breve
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{g.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {g.approach}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-full">
                      {g.ageRange}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground flex-1">
                  {g.description}
                </p>
                {g.available && (
                  <Button
                    size="sm"
                    className="w-full mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      openGame(g.id);
                    }}
                  >
                    Abrir jogo
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-md mx-auto">
          <Card className="p-6 border-2 border-border/60 bg-card/95 backdrop-blur">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Sou paciente — entrar com código
            </h2>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={6}
                className="text-center text-2xl tracking-[0.3em] font-bold h-12"
              />
              <Button
                size="lg"
                variant="secondary"
                onClick={enterAsPaciente}
                disabled={!code.trim()}
              >
                Entrar
              </Button>
            </div>
          </Card>

          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Heart className="w-4 h-4 text-accent" /> Vínculo</span>
            <span className="inline-flex items-center gap-2"><Users className="w-4 h-4 text-accent" /> Ao vivo</span>
            <span className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> Sem download</span>
          </div>
        </section>
      </div>
    </main>
  );
}
