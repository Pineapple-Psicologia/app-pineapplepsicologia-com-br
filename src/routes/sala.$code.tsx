import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useRoom, type Role } from "@/lib/useRoom";
import Whiteboard from "@/components/games/Whiteboard";
import Termometro from "@/components/games/Termometro";
import Detetive from "@/components/games/Detetive";
import DetetiveTabuleiro from "@/components/games/DetetiveTabuleiro";
import DetetiveAventura from "@/components/games/DetetiveAventura";
import MapaCorporal from "@/components/games/MapaCorporal";
import TrianguloCognitivo from "@/components/games/TrianguloCognitivo";
import { Copy, Check, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { getGame } from "@/lib/games";

const searchSchema = z.object({
  role: z.enum(["psi", "paciente"]).default("paciente"),
  game: z.enum(["whiteboard", "termometro", "detetive", "detetive-tabuleiro", "detetive-aventura", "mapa-corporal", "triangulo"]).default("whiteboard"),
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

function SalaPage() {
  const { code } = Route.useParams();
  const { role, game } = Route.useSearch();
  const router = useRouter();
  const room = useRoom(code, role as Role);
  const [copied, setCopied] = useState(false);

  const meta = getGame(game);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <Button size="sm" variant="ghost" onClick={() => router.navigate({ to: "/" })}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">
              {role === "psi" ? "Psicóloga" : "Paciente"} · {meta?.emoji} {meta?.title ?? "Sala"}
            </div>
            <button onClick={copyCode} className="flex items-center gap-2 font-display text-2xl font-bold tracking-widest hover:text-primary">
              {code}
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 opacity-50" />}
            </button>
          </div>
        </div>

        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${room.peers > 1 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
          {room.peers > 1 ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {room.peers > 1 ? "Conectados" : "Aguardando..."}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {game === "termometro" ? (
          <Termometro room={room} />
        ) : game === "detetive" ? (
          <Detetive room={room} />
        ) : game === "detetive-tabuleiro" ? (
          <DetetiveTabuleiro room={room} />
        ) : game === "detetive-aventura" ? (
          <DetetiveAventura room={room} />
        ) : game === "mapa-corporal" ? (
          <MapaCorporal room={room} />
        ) : (
          <Whiteboard room={room} role={role} />
        )}
      </main>
    </div>
  );
}
