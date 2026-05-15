import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVideoRoom } from "@/lib/useVideoRoom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Check,
  Copy,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

const search = z.object({
  role: z.enum(["psi", "paciente"]).default("psi"),
});

export const Route = createFileRoute("/v/$code")({
  validateSearch: search,
  head: ({ params }) => ({
    meta: [{ title: `Sala de vídeo ${params.code}` }],
  }),
  component: VideoRoute,
});

function VideoRoute() {
  const { code } = Route.useParams();
  const { role } = Route.useSearch();
  return <CallView code={code} role={role} />;
}

const REACTIONS = ["❤️", "👏", "😂", "🎉", "👍", "🤩", "🌟", "🔥"] as const;
type FloatingEmoji = {
  id: string;
  emoji: string;
  side: "local" | "remote";
  drift: number;
};

const AVATAR_PALETTE = [
  { from: "#FFD27A", to: "#DF9628", emoji: "🦊" },
  { from: "#A8E6CF", to: "#3DB78F", emoji: "🐢" },
  { from: "#FFB7C5", to: "#E94EAB", emoji: "🐰" },
  { from: "#B5C7FF", to: "#6573E0", emoji: "🦉" },
  { from: "#F4B860", to: "#C97B3F", emoji: "🦁" },
  { from: "#C5E1A5", to: "#7CB342", emoji: "🐸" },
];

function pickAvatar(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function CallView({ code, role }: { code: string; role: "psi" | "paciente" }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [remoteVideoOn, setRemoteVideoOn] = useState(true);
  const [floats, setFloats] = useState<FloatingEmoji[]>([]);

  const localRef = useRef<HTMLVideoElement>(null);

  const acquire = useCallback(async () => {
    try {
      setError(null);
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 } },
        audio: true,
      });
      setStream(s);
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível acessar a câmera.");
    }
  }, []);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  useEffect(() => {
    if (localRef.current && stream) localRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = audioOn));
  }, [audioOn, stream]);

  useEffect(() => {
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = videoOn));
  }, [videoOn, stream]);

  const { remoteStreams, members, connected } = useVideoRoom({
    code,
    kind: role === "psi" ? "psi" : "cam",
    label: "face",
    localStream: stream,
    enabled: !!stream,
  });

  const otherKind = role === "psi" ? "cam" : "psi";
  const otherPresent = members.some((m) => m.kind === otherKind);
  const remote = Object.values(remoteStreams)[0]?.stream ?? null;

  // Side channel for reactions + camera-state
  const fxChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    if (!stream) return;
    const ch = supabase.channel(`v:${code}:fx`, {
      config: { broadcast: { self: false } },
    });
    ch.on("broadcast", { event: "reaction" }, ({ payload }) => {
      pushFloat({
        emoji: String(payload.emoji ?? "❤️"),
        side: "remote",
      });
    });
    ch.on("broadcast", { event: "cam" }, ({ payload }) => {
      setRemoteVideoOn(Boolean(payload.on));
    });
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.send({ type: "broadcast", event: "cam", payload: { on: videoOn } });
      }
    });
    fxChannelRef.current = ch;
    return () => {
      ch.unsubscribe();
      supabase.removeChannel(ch);
      fxChannelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, stream]);

  // Broadcast camera state changes
  useEffect(() => {
    fxChannelRef.current?.send({
      type: "broadcast",
      event: "cam",
      payload: { on: videoOn },
    });
  }, [videoOn]);

  const pushFloat = useCallback((p: { emoji: string; side: "local" | "remote" }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const drift = Math.round((Math.random() - 0.5) * 80);
    setFloats((f) => [...f, { id, emoji: p.emoji, side: p.side, drift }]);
    setTimeout(() => {
      setFloats((f) => f.filter((x) => x.id !== id));
    }, 2400);
  }, []);

  const sendReaction = (emoji: string) => {
    pushFloat({ emoji, side: "local" });
    fxChannelRef.current?.send({
      type: "broadcast",
      event: "reaction",
      payload: { emoji },
    });
  };

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/v/${code}?role=${role === "psi" ? "paciente" : "psi"}`
      : "";

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 1500);
  };

  const endCall = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    window.location.href = "/";
  };

  const localAvatar = useMemo(() => pickAvatar(role + ":me:" + code), [role, code]);
  const remoteAvatar = useMemo(() => pickAvatar(otherKind + ":remote:" + code), [otherKind, code]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 py-3 border-b flex items-center gap-3 bg-card/80 backdrop-blur">
        <Link to="/">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Sala de vídeo · {role === "psi" ? "Psicóloga" : "Paciente"}
          </div>
          <div className="font-display text-xl font-bold tracking-widest">{code}</div>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            connected && otherPresent
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {connected && otherPresent ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {!stream
            ? "Aguardando"
            : otherPresent
              ? "Conectado"
              : `Esperando ${role === "psi" ? "paciente" : "psi"}`}
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-3">
        {!stream ? (
          <Card className="p-6 text-center max-w-md mx-auto mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Libere câmera e microfone para entrar na sala.
            </p>
            {error && <p className="text-xs text-destructive mb-3">{error}</p>}
            <Button size="lg" onClick={acquire}>
              Entrar na chamada
            </Button>
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Link para o {role === "psi" ? "paciente" : "psicóloga"}:
              </p>
              <Button size="sm" variant="outline" className="w-full" onClick={copyInvite}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copiar link
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[300px]">
              <Tile
                stream={remote}
                label={role === "psi" ? "Paciente" : "Psicóloga"}
                muted={false}
                videoOff={!remoteVideoOn}
                avatar={remoteAvatar}
                placeholder={
                  otherPresent
                    ? "Conectando vídeo…"
                    : `Aguardando ${role === "psi" ? "paciente" : "psi"} entrar`
                }
                floats={floats.filter((f) => f.side === "remote")}
              />
              <Tile
                stream={stream}
                label="Você"
                muted
                videoRef={localRef}
                mirror
                videoOff={!videoOn}
                avatar={localAvatar}
                floats={floats.filter((f) => f.side === "local")}
              />
            </div>

            {/* Quick reactions */}
            <div className="flex gap-1.5 justify-center flex-wrap pt-1">
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => sendReaction(e)}
                  className="text-2xl w-11 h-11 rounded-full bg-card border hover:bg-accent hover:scale-110 transition-transform active:scale-95"
                  aria-label={`Enviar ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-center pt-1">
              <Button
                variant={audioOn ? "secondary" : "destructive"}
                size="sm"
                onClick={() => setAudioOn((v) => !v)}
              >
                {audioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
              <Button
                variant={videoOn ? "secondary" : "destructive"}
                size="sm"
                onClick={() => setVideoOn((v) => !v)}
              >
                {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={copyInvite}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Convidar
              </Button>
              <Button variant="destructive" size="sm" onClick={endCall}>
                <PhoneOff className="w-4 h-4" />
                Encerrar
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Tile({
  stream,
  label,
  muted,
  videoRef,
  mirror,
  placeholder,
  videoOff,
  avatar,
  floats,
}: {
  stream: MediaStream | null;
  label: string;
  muted: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  mirror?: boolean;
  placeholder?: string;
  videoOff?: boolean;
  avatar?: { from: string; to: string; emoji: string };
  floats?: FloatingEmoji[];
}) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? internalRef;
  useEffect(() => {
    if (!videoRef && internalRef.current && stream) internalRef.current.srcObject = stream;
  }, [stream, videoRef]);

  const showAvatar = stream && videoOff && avatar;

  return (
    <div className="relative bg-black rounded-xl overflow-hidden border min-h-[240px]">
      <div className="absolute top-2 left-2 z-20 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-semibold">
        {label}
      </div>

      {stream && !videoOff ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover bg-black ${mirror ? "scale-x-[-1]" : ""}`}
        />
      ) : showAvatar ? (
        <div
          className="w-full h-full grid place-items-center relative overflow-hidden"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${avatar!.from}, ${avatar!.to})`,
          }}
        >
          {/* playful bubbles */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
            <div className="absolute bottom-4 right-6 w-24 h-24 rounded-full bg-white/20 blur-xl" />
            <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/15 blur-lg" />
          </div>
          <div className="relative flex flex-col items-center gap-2">
            <div
              className="text-7xl drop-shadow-lg select-none animate-avatar-bob"
              aria-hidden
            >
              {avatar!.emoji}
            </div>
            <div className="px-3 py-1 rounded-full bg-black/30 text-white/90 text-xs font-semibold">
              Câmera desligada
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full grid place-items-center text-white/60 text-sm p-4 text-center">
          {placeholder ?? "Aguardando…"}
        </div>
      )}

      {/* floating reaction emojis */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {floats?.map((f) => (
          <span
            key={f.id}
            className="absolute left-1/2 bottom-6 text-5xl animate-float-up select-none"
            style={{ ["--drift" as any]: `${f.drift}px` }}
          >
            {f.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
