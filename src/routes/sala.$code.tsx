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
import EntreLentes from "@/components/games/EntreLentes";
import RespiracaoQuadrada from "@/components/games/RespiracaoQuadrada";
import Ancoragem54321 from "@/components/games/Ancoragem54321";
import FolhasNoRio from "@/components/games/FolhasNoRio";
import BussolaValores from "@/components/games/BussolaValores";
import MinhaCasa from "@/components/games/MinhaCasa";

import { Copy, Check, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { getGame } from "@/lib/games";

const searchSchema = z.object({
  role: z.enum(["psi", "paciente"]).default("paciente"),
  game: z.enum(["whiteboard", "termometro", "detetive", "detetive-tabuleiro", "detetive-aventura", "mapa-corporal", "triangulo", "entre-lentes", "respiracao", "ancoragem", "folhas-no-rio", "bussola", "minha-casa"]).default("whiteboard"),
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

  const buildPatientUrl = () => {
    const origin = window.location.origin;
    // No editor/preview do Lovable, força usar o site publicado (público).
    const publicOrigin =
      origin.includes("lovableproject.com") ||
      origin.includes("id-preview--") ||
      origin.includes("localhost")
        ? "https://mundo-pine.lovable.app"
        : origin;
    return `${publicOrigin}/sala/${code}?role=paciente&game=${game}`;
  };

  const copyCode = async () => {
    const url = buildPatientUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link do paciente copiado", {
      description: "Cole no WhatsApp — abre direto no mesmo jogo.",
    });
    setTimeout(() => setCopied(false), 1500);
  };

  const shareWhatsApp = () => {
    const url = buildPatientUrl();
    const text = `Oi! Vamos fazer nossa sessão? Clica aqui para entrar no jogo: ${url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
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

        <div className="flex items-center gap-2">
          {role === "psi" && (
            <Button
              size="sm"
              onClick={shareWhatsApp}
              className="bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Enviar no WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>
          )}
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${room.peers > 1 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
            {room.peers > 1 ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {room.peers > 1 ? "Conectados" : "Aguardando..."}
          </div>
        </div>
      </header>


      <div className="flex-1 flex min-h-0">
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
          ) : game === "triangulo" ? (
            <TrianguloCognitivo room={room} />
          ) : game === "entre-lentes" ? (
            <EntreLentes room={room} />
          ) : game === "respiracao" ? (
            <RespiracaoQuadrada room={room} />
          ) : game === "ancoragem" ? (
            <Ancoragem54321 room={room} />
          ) : game === "folhas-no-rio" ? (
            <FolhasNoRio room={room} />
          ) : game === "bussola" ? (
            <BussolaValores room={room} />
          ) : game === "minha-casa" ? (
            <MinhaCasa room={room} />
          ) : (
            <Whiteboard room={room} role={role} />
          )}
        </main>
      </div>
    </div>
  );
}
