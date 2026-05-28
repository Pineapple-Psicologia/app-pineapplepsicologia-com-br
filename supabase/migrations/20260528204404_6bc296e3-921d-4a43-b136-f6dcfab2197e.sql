-- Hardening: bloqueia explicitamente INSERT/UPDATE/DELETE em user_roles
-- por qualquer um que não seja admin. RESTRICTIVE é aplicada com AND sobre
-- as demais policies; combinada com a PERMISSIVE "Admins manage roles",
-- isso garante que somente admins (e funções SECURITY DEFINER como
-- handle_new_user) consigam modificar a tabela.

CREATE POLICY "Only admins can insert roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));