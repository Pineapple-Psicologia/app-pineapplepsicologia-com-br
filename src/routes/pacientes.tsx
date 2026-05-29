import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FolderPlus, Folder, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — Mundo Pine" }] }),
  component: PacientesPage,
});

type Patient = { id: string; name: string; created_at: string; notes: string | null };

function PacientesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    refresh();
  }, [user, loading]);

  const refresh = async () => {
    const { data } = await supabase
      .from("patients")
      .select("id,name,created_at,notes")
      .order("name");
    setPatients((data ?? []) as Patient[]);

    const { data: files } = await supabase
      .from("patient_files")
      .select("patient_id");
    const c: Record<string, number> = {};
    (files ?? []).forEach((f: any) => { c[f.patient_id] = (c[f.patient_id] ?? 0) + 1; });
    setCounts(c);
  };

  const create = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("patients").insert({ user_id: user.id, name: name.trim() });
    if (error) { toast.error("Erro", { description: error.message }); return; }
    setName("");
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta pasta e todos os arquivos do paciente?")) return;
    // remove storage objects first (best-effort)
    const { data: files } = await supabase
      .from("patient_files")
      .select("file_path")
      .eq("patient_id", id);
    if (files?.length) {
      await supabase.storage.from("patient-files").remove(files.map((f: any) => f.file_path));
    }
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) { toast.error("Erro", { description: error.message }); return; }
    refresh();
  };

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Início</Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">Pacientes</h1>
      <p className="text-muted-foreground mb-6">Cada paciente tem sua pasta com os PDFs das atividades.</p>

      <Card className="p-4 mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Nome do novo paciente"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <Button onClick={create} disabled={!name.trim()}>
            <FolderPlus className="w-4 h-4 mr-1" /> Criar pasta
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {patients.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Nenhum paciente ainda.</p>
        ) : patients.map((p) => (
          <Card key={p.id} className="p-3 flex items-center gap-3">
            <Folder className="w-5 h-5 text-primary shrink-0" />
            <Link
              to="/pacientes/$id"
              params={{ id: p.id }}
              className="flex-1 min-w-0 hover:underline"
            >
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {counts[p.id] ?? 0} arquivo(s)
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </Card>
        ))}
      </div>
    </main>
  );
}
