import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getSignedPatientFileUrl } from "@/lib/patientFiles";

export const Route = createFileRoute("/pacientes/$id")({
  head: () => ({ meta: [{ title: "Pasta do paciente — Mundo Pine" }] }),
  component: PatientFolderPage,
});

type FileRow = {
  id: string;
  file_name: string;
  file_path: string;
  game: string | null;
  created_at: string;
  size_bytes: number | null;
};

function PatientFolderPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState<string>("");
  const [files, setFiles] = useState<FileRow[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    refresh();
  }, [user, loading, id]);

  const refresh = async () => {
    const { data: p } = await supabase.from("patients").select("name").eq("id", id).maybeSingle();
    setPatientName(p?.name ?? "");
    const { data } = await supabase
      .from("patient_files")
      .select("id,file_name,file_path,game,created_at,size_bytes")
      .eq("patient_id", id)
      .order("created_at", { ascending: false });
    setFiles((data ?? []) as FileRow[]);
  };

  const open = async (f: FileRow) => {
    try {
      const url = await getSignedPatientFileUrl(f.file_path, 300);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      toast.error("Erro ao abrir", { description: e?.message });
    }
  };


  const remove = async (f: FileRow) => {
    if (!confirm(`Excluir "${f.file_name}"?`)) return;
    await supabase.storage.from("patient-files").remove([f.file_path]);
    const { error } = await supabase.from("patient_files").delete().eq("id", f.id);
    if (error) { toast.error("Erro", { description: error.message }); return; }
    refresh();
  };

  const fmtSize = (b: number | null) =>
    !b ? "" : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/pacientes"><ArrowLeft className="w-4 h-4 mr-1" /> Pacientes</Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">{patientName || "Paciente"}</h1>
      <p className="text-muted-foreground mb-6">{files.length} arquivo(s) salvo(s)</p>

      <div className="space-y-2">
        {files.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum arquivo ainda. Use o botão "Salvar na pasta" dentro de uma sala.
          </Card>
        ) : files.map((f) => (
          <Card key={f.id} className="p-3 flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{f.file_name}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(f.created_at).toLocaleString("pt-BR")}
                {f.game ? ` · ${f.game}` : ""}
                {f.size_bytes ? ` · ${fmtSize(f.size_bytes)}` : ""}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => open(f)} title="Abrir / baixar">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => remove(f)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </Card>
        ))}
      </div>
    </main>
  );
}
