import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVideoRoom, type CamLabel } from "@/lib/useVideoRoom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  MicOff,
  MonitorUp,
  Smartphone,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

const search = z.object({
  role: z.enum(["psi", "cam"]).default("psi"),
  cam: z.enum(["face", "ambiente", "tela"]).optional(),
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
  const { role, cam } = Route.useSearch();
  if (role === "cam") return <CamView code={code} label={cam ?? "face"} />;
  return <PsiView code={code} />;
}

/* ---------------- PSI ---------------- */

function PsiView({ code }: { code: string }) {
  const { remoteStreams, members, connected } = useVideoRoom({
    code,
    kind: "psi",
    localStream: null,
    enabled: true,
  });

  const cams = members.filter((m) => m.kind === "cam");
  const camCount = cams.length;

  const tile = (label: CamLabel) => {
    const entry = Object.values(remoteStreams).find((r) => r.label === label);
    return <VideoTile key={label} label={label} stream={entry?.stream ?? null} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button size="sm" variant="ghost"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Sala de vídeo · Psicóloga
            </div>
            <div className="font-display text-2xl font-bold tracking-widest">{code}</div>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
            connected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {camCount} câmera{camCount === 1 ? "" : "s"} conectada{camCount === 1 ? "" : "s"}
        </div>
      </header>

      <main className="grid lg:grid-cols-[1fr_320px] gap-4 p-4">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[minmax(220px,1fr)]">
          {tile("face")}
          {tile("ambiente")}
          <div className="md:col-span-2">{tile("tela")}</div>
        </section>

        <aside className="space-y-3">
          <Card className="p-4">
            <h3 className="text-sm font-bold mb-1">Convidar a família</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Mostre o QR Code abaixo. O paciente abre no notebook; o pai/mãe
              escaneia com o celular para a câmera de ambiente.
            </p>
            <InviteRow code={code} cam="face" icon={<Camera className="w-4 h-4" />} title="Câmera do rosto (notebook)" />
            <InviteRow code={code} cam="ambiente" icon={<Smartphone className="w-4 h-4" />} title="Câmera de ambiente (celular)" />
            <InviteRow code={code} cam="tela" icon={<MonitorUp className="w-4 h-4" />} title="Tela do computador" />
          </Card>
        </aside>
      </main>
    </div>
  );
}

function InviteRow({
  code,
  cam,
  icon,
  title,
}: {
  code: string;
  cam: CamLabel;
  icon: React.ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(cam === "ambiente");
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/v/${code}?role=cam&cam=${cam}`
      : "";
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="border rounded-lg p-3 mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left text-sm font-semibold"
      >
        {icon}
        <span className="flex-1">{title}</span>
        <span className="text-xs text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <div className="bg-white p-2 rounded flex justify-center">
            <QRCodeSVG value={url} size={140} />
          </div>
          <Button size="sm" variant="outline" className="w-full" onClick={copy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            Copiar link
          </Button>
        </div>
      )}
    </div>
  );
}

function VideoTile({ label, stream }: { label: CamLabel; stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  const titles: Record<CamLabel, string> = {
    face: "🙂 Rosto",
    ambiente: "🛋️ Ambiente",
    tela: "🖥️ Tela do computador",
  };

  return (
    <div className="relative bg-black rounded-xl overflow-hidden border">
      <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-semibold">
        {titles[label]}
      </div>
      {stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={label !== "face"}
          className="w-full h-full object-cover bg-black"
        />
      ) : (
        <div className="w-full h-full min-h-[200px] grid place-items-center text-white/60 text-sm">
          Aguardando…
        </div>
      )}
    </div>
  );
}

/* ---------------- CAM (publisher) ---------------- */

function CamView({ code, label }: { code: string; label: CamLabel }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(label === "face");
  const [videoOn, setVideoOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const acquire = useCallback(async () => {
    try {
      setError(null);
      let s: MediaStream;
      if (label === "tela") {
        s = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 15 },
          audio: false,
        });
      } else if (label === "ambiente") {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
      } else {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 } },
          audio: true,
        });
      }
      setStream(s);
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível acessar a câmera.");
    }
  }, [label]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = audioOn));
  }, [audioOn, stream]);

  useEffect(() => {
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = videoOn));
  }, [videoOn, stream]);

  const { connected, members } = useVideoRoom({
    code,
    kind: "cam",
    label,
    localStream: stream,
    enabled: !!stream,
  });

  const psiPresent = members.some((m) => m.kind === "psi");

  const titles: Record<CamLabel, { title: string; sub: string; icon: React.ReactNode }> = {
    face: {
      title: "Câmera do rosto",
      sub: "Vamos usar a webcam do notebook.",
      icon: <Camera className="w-5 h-5" />,
    },
    ambiente: {
      title: "Câmera de ambiente",
      sub: "Aponte o celular para mostrar a criança e o espaço.",
      icon: <Smartphone className="w-5 h-5" />,
    },
    tela: {
      title: "Compartilhar a tela",
      sub: "A psicóloga verá o que a criança faz no computador.",
      icon: <MonitorUp className="w-5 h-5" />,
    },
  };
  const meta = titles[label];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 py-3 border-b flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{meta.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Sala {code}
          </div>
          <div className="font-bold truncate">{meta.title}</div>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            psiPresent && stream
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {psiPresent && stream ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {!stream ? "Aguardando" : psiPresent ? "Conectada" : "Esperando psi"}
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-3">
        {!stream && (
          <Card className="p-6 text-center max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-4">{meta.sub}</p>
            {error && <p className="text-xs text-destructive mb-3">{error}</p>}
            <Button size="lg" onClick={acquire}>
              {label === "tela" ? "Compartilhar tela" : "Liberar câmera"}
            </Button>
          </Card>
        )}

        {stream && (
          <>
            <div className="relative bg-black rounded-xl overflow-hidden flex-1 min-h-[300px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs">
                Pré-visualização (você)
              </div>
            </div>

            {label === "face" && (
              <div className="flex gap-2 justify-center">
                <Button
                  variant={audioOn ? "secondary" : "destructive"}
                  size="sm"
                  onClick={() => setAudioOn((v) => !v)}
                >
                  {audioOn ? <Camera className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {audioOn ? "Áudio ligado" : "Áudio mudo"}
                </Button>
                <Button
                  variant={videoOn ? "secondary" : "destructive"}
                  size="sm"
                  onClick={() => setVideoOn((v) => !v)}
                >
                  {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  {videoOn ? "Vídeo ligado" : "Vídeo desligado"}
                </Button>
              </div>
            )}

            {label === "ambiente" && (
              <p className="text-xs text-center text-muted-foreground">
                Apoie o celular num lugar firme apontando para a criança.
                O áudio fica desligado para evitar microfonia.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
