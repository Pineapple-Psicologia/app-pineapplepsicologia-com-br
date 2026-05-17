import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Nova senha — Lúdico Clínico" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (password.length < 8) {
      toast.error("Senha deve ter no mínimo 8 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Senha atualizada");
      navigate({ to: "/" });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-2">Definir nova senha</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Escolha uma nova senha para sua conta.
        </p>
        <form onSubmit={onSubmit} method="post" className="space-y-4">
          <div>
            <Label htmlFor="rp-password">Nova senha</Label>
            <Input id="rp-password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div>
            <Label htmlFor="rp-confirm">Confirmar senha</Label>
            <Input id="rp-confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Salvando…" : "Salvar nova senha"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/auth" className="underline">Voltar ao login</Link>
          </p>
        </form>
      </Card>
    </main>
  );
}
