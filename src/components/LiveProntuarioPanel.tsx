import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ChevronLeft, FileText, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Patient = { id: string; name: string };

type Props = { roomCode: string };

const LS_KEY = (code: string) => `sala:${code}:sessionId`;

export default function LiveProntuarioPanel({ roomCode }: Props) {
  const [open, setOpen] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load patients + restore session from localStorage
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("patients")
        .select("id, name")
        .order("name");
      setPatients(data ?? []);

      const stored = localStorage.getItem(LS_KEY(roomCode));
      if (stored) {
        const { data: s } = await supabase
          .from("sessions")
          .select("id, patient_id, prontuario")
          .eq("id", stored)
          .maybeSingle();
        if (s) {
          setSessionId(s.id);
          setPatientId(s.patient_id);
          setNotes(s.prontuario ?? "");
        } else {
          localStorage.removeItem(LS_KEY(roomCode));
        }
      }
    })();
  }, [roomCode]);

  // Create session when patient picked
  const startSession = async (pid: string) => {
    setPatientId(pid);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        psychologist_id: user.id,
        patient_id: pid,
        status: "draft",
        prontuario: "",
      })
      .select("id")
      .single();
    if (error) {
      toast.error("Não foi possível iniciar a sessão");
      return;
    }
    setSessionId(data.id);
    localStorage.setItem(LS_KEY(roomCode), data.id);
    setNotes("");
    toast.success("Sessão iniciada — anotações sincronizadas");
  };

  // Debounced autosave
  useEffect(() => {
    if (!sessionId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase
        .from("sessions")
        .update({ prontuario: notes, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
      setSaving(false);
      if (!error) setSavedAt(new Date());
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [notes, sessionId]);

  const finish = async () => {
    if (!sessionId) return;
    await supabase
      .from("sessions")
      .update({ prontuario: notes, status: "ready" })
      .eq("id", sessionId);
    localStorage.removeItem(LS_KEY(roomCode));
    toast.success("Prontuário salvo");
    setSessionId(null);
    setPatientId("");
    setNotes("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground rounded-l-md px-2 py-3 shadow-lg flex flex-col items-center gap-1"
        aria-label="Abrir prontuário"
      >
        <ChevronLeft className="w-4 h-4" />
        <FileText className="w-4 h-4" />
      </button>
    );
  }

  const activePatient = patients.find((p) => p.id === patientId);

  return (
    <aside className="w-[340px] shrink-0 border-l bg-card flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <FileText className="w-4 h-4" />
          Prontuário ao vivo
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Paciente</label>
        <Select value={patientId} onValueChange={(v) => !sessionId && startSession(v)} disabled={!!sessionId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activePatient && (
          <Link
            to="/pacientes/$patientId"
            params={{ patientId: activePatient.id }}
            className="text-xs text-primary hover:underline"
          >
            Ver histórico de {activePatient.name} →
          </Link>
        )}
      </div>

      <div className="flex-1 flex flex-col p-3 min-h-0">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            sessionId
              ? "Escreva aqui durante a sessão. Salvo automaticamente."
              : "Selecione um paciente para começar."
          }
          disabled={!sessionId}
          className="flex-1 resize-none text-sm"
        />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground h-5">
          {saving ? (
            <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> salvando…</span>
          ) : savedAt ? (
            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> salvo {savedAt.toLocaleTimeString()}</span>
          ) : <span />}
        </div>
      </div>

      {sessionId && (
        <div className="p-3 border-t">
          <Button onClick={finish} className="w-full" size="sm">
            Finalizar e salvar prontuário
          </Button>
        </div>
      )}
    </aside>
  );
}
