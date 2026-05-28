import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * LGPD — Direito de eliminação (art. 18, VI).
 * Permite que o próprio usuário autenticado exclua sua conta e todos os
 * dados pessoais vinculados (profile, roles). A exclusão do usuário em
 * auth.users dispara ON DELETE CASCADE nas tabelas relacionadas.
 */
export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;

    // Apaga dados de aplicação primeiro (defesa em profundidade — não
    // depende apenas do CASCADE do auth).
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
