import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useRoom, type Role } from "@/lib/useRoom";
import Whiteboard from "@/components/games/Whiteboard";
import TherapyHouse from "@/components/games/TherapyHouse";
import CBTTriad from "@/components/games/CBTTriad";
import { Palette, Home, Brain, Copy, Check, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  role: z.enum(["psi", "paciente"]).default("paciente"),
});

export const Route = createFileRoute("/sala/$code")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [{ title: `Sala ${params.code} — Lúdico Clínico` }],
  }),
  component: SalaPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-destructive mb-4">{error.message}</p>
        <Link to="/" className="underline">Voltar</Link>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Sala não encontrada</div>,
});

const TABS = [
  { id: "whiteboard", label: "Quadro Branco", icon: Palette },
  { id: "house", label: "Casa Terapêutica", icon: Home },
  { id: "tcc", label: "Tríade TCC", icon: Brain },
] as const;

function SalaPage() {
  const { code } = Route.useParams();
  const { role } = Route.useSearch();
  const router = useRouter();
  const room = useRoom(code, role as Role);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("whiteboard");
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => router.navigate({ to: "/" })}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              {role === "psi" ? "Psicóloga" : "Paciente"} · Sala
            </div>
            <button onClick={copyCode} className="flex items-center gap-2 font-display text-2xl font-bold tracking-widest hover:text-primary">
              {code}
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 opacity-50" />}
            </button>
          </div>
        </div>

        <nav className="flex gap-1 p-1 bg-muted rounded-xl">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${room.peers > 1 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
          {room.peers > 1 ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {room.peers > 1 ? "Conectados" : "Aguardando..."}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {tab === "whiteboard" && <Whiteboard room={room} />}
        {tab === "house" && <TherapyHouse room={room} />}
        {tab === "tcc" && <CBTTriad room={room} />}
      </main>
    </div>
  );
}
