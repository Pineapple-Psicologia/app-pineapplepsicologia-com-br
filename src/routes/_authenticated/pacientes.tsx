import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pacientes")({
  component: PatientsPage,
});

type Patient = {
  id: string;
  name: string;
  age: number | null;
  created_at: string;
};

const patientSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  age: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 0 && Number(v) <= 120), {
      message: "Idade inválida",
    }),
});

function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("id, name, age, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar pacientes");
    else setPatients(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = patientSchema.safeParse({
      name: fd.get("name"),
      age: fd.get("age"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("patients").insert({
      psychologist_id: user.id,
      name: parsed.data.name,
      age: parsed.data.age ? Number(parsed.data.age) : null,
    });
    setBusy(false);
    if (error) {
      toast.error("Erro ao cadastrar paciente");
      return;
    }
    toast.success("Paciente cadastrado");
    setOpen(false);
    load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir este paciente?")) return;
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Paciente excluído");
      setPatients((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus pacientes em atendimento.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo paciente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo paciente</DialogTitle>
            </DialogHeader>
            <form onSubmit={onCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required maxLength={120} />
              </div>
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input id="age" name="age" type="number" min={0} max={120} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={busy}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : patients.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">Nenhum paciente cadastrado ainda.</p>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Cadastrar primeiro paciente</Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {patients.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
              <Link
                to="/pacientes/$patientId"
                params={{ patientId: p.id }}
                className="flex-1"
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.age != null ? `${p.age} anos` : "Idade não informada"}
                </p>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)} aria-label="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
