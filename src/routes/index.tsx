import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, Heart, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lúdico Clínico — Ferramentas terapêuticas online" },
      {
        name: "description",
        content:
          "Quadro branco, casa terapêutica e jogo da tríade TCC para sessões online com crianças e adolescentes.",
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

  const enter = (role: "psi" | "paciente", roomCode?: string) => {
    const c = (roomCode ?? code).toUpperCase().trim();
    if (!c) return;
    navigate({ to: "/sala/$code", params: { code: c }, search: { role } });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <section>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Ferramentas para sessão online
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] text-foreground">
            Brincar é
            <span className="block text-primary">linguagem clínica.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-md">
            Três ferramentas lúdicas em tempo real para psicólogas
            infantojuvenis: quadro branco, casa terapêutica e jogo da tríade TCC.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Heart className="w-4 h-4 text-accent" /> Vínculo</span>
            <span className="inline-flex items-center gap-2"><Users className="w-4 h-4 text-accent" /> Interação ao vivo</span>
            <span className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> Sem download</span>
          </div>
        </section>

        <Card className="p-7 shadow-xl border-2 border-border/60 backdrop-blur bg-card/95">
          <h2 className="text-2xl font-bold mb-1">Iniciar sessão</h2>
          <p className="text-sm text-muted-foreground mb-6">
            A psicóloga cria a sala e compartilha o código com o paciente.
          </p>

          <div className="space-y-3 mb-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sou psicóloga
            </label>
            <Button
              size="lg"
              className="w-full text-base font-semibold"
              onClick={() => enter("psi", genCode())}
            >
              Criar nova sala
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">ou</span></div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sou paciente — entrar com código
            </label>
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
                onClick={() => enter("paciente")}
                disabled={!code.trim()}
              >
                Entrar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
