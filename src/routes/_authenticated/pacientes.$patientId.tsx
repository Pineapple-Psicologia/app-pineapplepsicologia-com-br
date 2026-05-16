import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Mic, Square, Loader2, Trash2 } from "lucide-react";
import { generateProntuario } from "@/lib/prontuario.functions";

export const Route = createFileRoute("/_authenticated/pacientes/$patientId")({
  component: PatientDetailPage,
});

type Patient = { id: string; name: string; age: number | null };
type Session = {
  id: string;
  session_date: string;
  prontuario: string | null;
  transcript: string | null;
  status: string;
};

function PatientDetailPage() {
  const { patientId } = Route.useParams();
  const generate = useServerFn(generateProntuario);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("patients").select("id, name, age").eq("id", patientId).maybeSingle(),
      supabase
        .from("sessions")
        .select("id, session_date, prontuario, transcript, status")
        .eq("patient_id", patientId)
        .order("session_date", { ascending: false }),
    ]);
    setPatient(p);
    setSessions(s ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash && sessions.some((s) => s.id === hash)) {
      setOpenSessionId(hash);
    }
  }, [sessions]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        await handleProcess(blob, mime);
      };
      mr.start();
      mediaRef.current = mr;
      setElapsed(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      toast.error("Não foi possível acessar o microfone");
      console.error(err);
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    if (timerRef.current) window.clearInterval(timerRef.current);
    setRecording(false);
  };

  const handleProcess = async (blob: Blob, mime: string) => {
    setProcessing(true);
    toast.info("Transcrevendo e gerando prontuário…");
    try {
      const audioBase64 = await blobToBase64(blob);
      const res = await generate({ data: { patientId, audioBase64, mimeType: mime } });
      toast.success("Prontuário gerado");
      setOpenSessionId(res.sessionId);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar prontuário");
    } finally {
      setProcessing(false);
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Excluir esta sessão?")) return;
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Sessão excluída");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (loading) return <main className="max-w-5xl mx-auto px-4 py-8"><p className="text-sm text-muted-foreground">Carregando…</p></main>;
  if (!patient) return <main className="max-w-5xl mx-auto px-4 py-8"><p>Paciente não encontrado.</p></main>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 w-full">
      <Link to="/pacientes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">{patient.name}</h1>
        <p className="text-sm text-muted-foreground">
          {patient.age != null ? `${patient.age} anos` : "Idade não informada"}
        </p>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="font-semibold mb-1">Nova sessão com IA</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Grave a sessão. Ao parar, a IA transcreve o áudio e gera o prontuário automaticamente.
        </p>
        <div className="flex items-center gap-4">
          {!recording ? (
            <Button onClick={startRecording} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mic className="h-4 w-4 mr-2" />}
              {processing ? "Processando…" : "Iniciar gravação"}
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive">
              <Square className="h-4 w-4 mr-2" /> Parar gravação
            </Button>
          )}
          {recording && (
            <span className="text-sm font-mono text-muted-foreground">
              ● {formatTime(elapsed)}
            </span>
          )}
        </div>
      </Card>

      <h2 className="font-semibold mb-3">Sessões anteriores</h2>
      {sessions.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma sessão registrada ainda.
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => setOpenSessionId(openSessionId === s.id ? null : s.id)}
                  className="text-left flex-1"
                >
                  <p className="font-medium">
                    {new Date(s.session_date).toLocaleString("pt-BR", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {openSessionId === s.id ? "Ocultar prontuário" : "Ver prontuário"}
                  </p>
                </button>
                <Button variant="ghost" size="icon" onClick={() => deleteSession(s.id)} aria-label="Excluir">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {openSessionId === s.id && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm mb-2">Prontuário</h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {s.prontuario ?? "(vazio)"}
                  </pre>
                  {s.transcript && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Ver transcrição completa
                      </summary>
                      <pre className="whitespace-pre-wrap font-sans text-xs mt-2 text-muted-foreground">
                        {s.transcript}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
