import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type PreviewState = {
  name: string;
  mime: string;
  url: string;
} | null;

function PatientFolderPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState<string>("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [preview, setPreview] = useState<PreviewState>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    refresh();
  }, [user, loading, id]);

  useEffect(() => {
    return () => {
      if (preview?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

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

  const mimeOf = (name: string, fallback?: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    return ext === "pdf" ? "application/pdf"
      : ext === "png" ? "image/png"
      : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
      : ext === "gif" ? "image/gif"
      : ext === "webp" ? "image/webp"
      : fallback || "application/octet-stream";
  };

  const open = async (f: FileRow) => {
    try {
      const url = await getSignedPatientFileUrl(f.file_path, 300);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const mime = mimeOf(f.file_name, blob.type);

      if (
        mime !== "application/pdf" &&
        !mime.startsWith("image/")
      ) {
        await download(f);
        return;
      }

      const objectUrl = URL.createObjectURL(new Blob([blob], { type: mime }));
      setPreview((current) => {
        if (current?.url?.startsWith("blob:")) URL.revokeObjectURL(current.url);
        return { name: f.file_name, mime, url: objectUrl };
      });
    } catch (e: any) {
      toast.error("Erro ao abrir", { description: e?.message });
    }
  };

  const download = async (f: FileRow) => {
    try {
      const url = await getSignedPatientFileUrl(f.file_path, 300);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const typed = new Blob([blob], { type: mimeOf(f.file_name, blob.type) });
      const objectUrl = URL.createObjectURL(typed);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = f.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (e: any) {
      toast.error("Erro ao baixar", { description: e?.message });
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
    <>
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
              <button
                type="button"
                onClick={() => open(f)}
                className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                title="Abrir arquivo"
              >
                <div className="font-semibold truncate underline-offset-4 hover:underline">{f.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleString("pt-BR")}
                  {f.game ? ` · ${f.game}` : ""}
                  {f.size_bytes ? ` · ${fmtSize(f.size_bytes)}` : ""}
                </div>
              </button>
              <Button variant="ghost" size="icon" onClick={() => download(f)} title="Baixar">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(f)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      </main>

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) {
            setPreview((current) => {
              if (current?.url?.startsWith("blob:")) URL.revokeObjectURL(current.url);
              return null;
            });
          }
        }}
      >
        <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="truncate pr-8">{preview?.name}</DialogTitle>
            <DialogDescription>
              Visualização do arquivo salvo.
            </DialogDescription>
          </DialogHeader>

          <div className="h-full bg-muted/20">
            {preview?.mime === "application/pdf" ? (
              <iframe
                src={preview.url}
                title={preview.name}
                className="h-full w-full border-0"
              />
            ) : preview?.mime.startsWith("image/") ? (
              <div className="h-full w-full overflow-auto p-4 flex items-start justify-center">
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="max-w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
