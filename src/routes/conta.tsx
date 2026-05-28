import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { deleteOwnAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Mundo Pine" },
      {
        name: "description",
        content:
          "Gerencie sua conta e exerça seus direitos LGPD no Mundo Pine.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ContaPage,
});

function ContaPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const deleteFn = useServerFn(deleteOwnAccount);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-muted-foreground">
          Você precisa estar autenticado para acessar esta página.
        </p>
        <Button asChild>
          <Link to="/auth">Entrar</Link>
        </Button>
      </main>
    );
  }

  const handleDelete = async () => {
    if (confirmEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
      toast.error("Digite seu e-mail exatamente como cadastrado para confirmar.");
      return;
    }
    setBusy(true);
    try {
      await deleteFn();
      await supabase.auth.signOut();
      toast.success("Conta e dados excluídos com sucesso.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Não foi possível excluir a conta.",
      );
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Link>
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Minha conta
        </h1>
        <p className="text-muted-foreground mb-8">
          Conectada como <strong>{user.email}</strong>
        </p>

        <section className="rounded-2xl border border-border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Sessão</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Encerre sua sessão neste dispositivo. Você poderá entrar
            novamente a qualquer momento.
          </p>
          <Button variant="outline" onClick={() => signOut()}>
            Sair
          </Button>
        </section>

        <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-start gap-3 mb-3">
            <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-destructive">
                Excluir minha conta e meus dados
              </h2>
              <p className="text-sm text-foreground/80 mt-1">
                Em conformidade com o art. 18, VI da LGPD, você pode
                solicitar a eliminação imediata da sua conta e de todos os
                dados pessoais a ela vinculados (perfil, permissões e
                histórico de uso). Esta ação é permanente e não pode ser
                desfeita.
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-2">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir conta permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. Sua conta e dados pessoais
                  serão removidos imediatamente. Para confirmar, digite
                  seu e-mail: <strong>{user.email}</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="off"
              />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={busy}
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {busy ? "Excluindo…" : "Sim, excluir tudo"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </main>
  );
}
