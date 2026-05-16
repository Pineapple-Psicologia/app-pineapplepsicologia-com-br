import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Recuperar senha — Lúdico Clínico" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = z.string().trim().email("Email inválido").safeParse(fd.get("email"));
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await resetPassword(parsed.data);
    setBusy(false);
    if (error) toast.error(error);
    else {
      setSent(true);
      toast.success("Email de recuperação enviado");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <Link to="/auth" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
        <h1 className="text-2xl font-semibold mb-2">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Informe seu email e enviaremos um link para criar uma nova senha.
        </p>
        {sent ? (
          <p className="text-sm">
            Pronto! Verifique sua caixa de entrada e clique no link recebido para definir uma nova senha.
          </p>
        ) : (
          <form onSubmit={onSubmit} method="post" className="space-y-4">
            <div>
              <Label htmlFor="fp-email">Email</Label>
              <Input id="fp-email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Enviando…" : "Enviar link de recuperação"}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
