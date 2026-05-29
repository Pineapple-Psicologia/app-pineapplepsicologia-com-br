import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  elementToPdf,
  uploadPatientPdf,
  downloadPdfBlob,
} from "@/lib/patientFiles";
import { Download, FolderPlus, Save } from "lucide-react";

type Patient = { id: string; name: string };

export function SaveToPatientDialog({
  open,
  onOpenChange,
  targetEl,
  game,
  defaultFileName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetEl: HTMLElement | null;
  game?: string | null;
  defaultFileName?: string;
}) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [fileName, setFileName] = useState(defaultFileName ?? "atividade.pdf");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("patients")
      .select("id,name")
      .order("name")
      .then(({ data }) => {
        setPatients((data ?? []) as Patient[]);
        if (data && data.length && !selectedId) setSelectedId(data[0].id);
      });
    setFileName(defaultFileName ?? `atividade-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [open, user]);

  const ensurePdf = (name: string) =>
    name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;

  const createPatient = async () => {
    if (!user || !newName.trim()) return;
    const { data, error } = await supabase
      .from("patients")
      .insert({ user_id: user.id, name: newName.trim() })
      .select("id,name")
      .single();
    if (error) {
      toast.error("Não foi possível criar paciente", { description: error.message });
      return;
    }
    setPatients((p) => [...p, data as Patient].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedId(data!.id);
    setNewName("");
    toast.success("Paciente criado");
  };

  const resolveTarget = (): HTMLElement | null => {
    if (!targetEl) return null;
    const inner = targetEl.querySelector<HTMLElement>("[data-capture-target]");
    return inner ?? targetEl;
  };

  const handleDownloadOnly = async () => {
    const el = resolveTarget();
    if (!el) return;
    setBusy(true);
    try {
      const { blob } = await elementToPdf(el, fileName);
      downloadPdfBlob(blob, ensurePdf(fileName));
    } catch (e: any) {
      toast.error("Erro ao gerar PDF", { description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    const el = resolveTarget();
    if (!user || !el || !selectedId) {
      toast.error("Selecione um paciente.");
      return;
    }
    setBusy(true);
    try {
      const finalName = ensurePdf(fileName);
      const { blob } = await elementToPdf(el, finalName);
      const res = await uploadPatientPdf({
        userId: user.id,
        patientId: selectedId,
        fileName: finalName,
        game,
        blob,
      });
      if (!res.ok) {
        toast.error("Erro ao salvar", { description: res.error });
        return;
      }
      toast.success("Salvo na pasta do paciente");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro ao gerar/salvar PDF", { description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar atividade</DialogTitle>
          <DialogDescription>
            Gera um PDF da tela atual e salva na pasta do paciente escolhido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Paciente</Label>
            {patients.length > 0 ? (
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted-foreground">
                Você ainda não tem pacientes. Crie um abaixo.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Criar novo paciente</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do paciente"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={createPatient} disabled={!newName.trim()}>
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome do arquivo</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={handleDownloadOnly} disabled={busy}>
            <Download className="w-4 h-4 mr-1" /> Baixar
          </Button>
          <Button type="button" onClick={handleSave} disabled={busy || !selectedId}>
            <Save className="w-4 h-4 mr-1" /> Salvar na pasta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
