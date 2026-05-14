import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVideoRoom } from "@/lib/useVideoRoom";
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

function CallView({ code, role }: { code: string; role: "psi" | "paciente" }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [copied, setCopied] = useState(false);

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

  // Map our two roles onto the existing signaling hook.
  // The "cam" side initiates offers to the "psi" side; both publish+subscribe.
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
                placeholder={
                  otherPresent
                    ? "Conectando vídeo…"
                    : `Aguardando ${role === "psi" ? "paciente" : "psi"} entrar`
                }
              />
              <Tile
                stream={stream}
                label="Você"
                muted
                videoRef={localRef}
                mirror
              />
            </div>

            <div className="flex gap-2 justify-center pt-2">
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
}: {
  stream: MediaStream | null;
  label: string;
  muted: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  mirror?: boolean;
  placeholder?: string;
}) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? internalRef;
  useEffect(() => {
    if (!videoRef && internalRef.current && stream) internalRef.current.srcObject = stream;
  }, [stream, videoRef]);

  return (
    <div className="relative bg-black rounded-xl overflow-hidden border min-h-[240px]">
      <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-semibold">
        {label}
      </div>
      {stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover bg-black ${mirror ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-full h-full grid place-items-center text-white/60 text-sm p-4 text-center">
          {placeholder ?? "Aguardando…"}
        </div>
      )}
    </div>
  );
}
