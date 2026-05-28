-- LGPD: minimização de dados. As tabelas patients e sessions não estão sendo usadas
-- pelo aplicativo e armazenavam potencialmente dados clínicos sensíveis
-- (transcript, prontuario, nome de paciente). Remover reduz drasticamente
-- a superfície de risco e o escopo LGPD.
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.patients;