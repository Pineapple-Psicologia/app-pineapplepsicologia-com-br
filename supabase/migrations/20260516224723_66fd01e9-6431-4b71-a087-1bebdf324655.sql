CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  transcript TEXT,
  prontuario TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psy view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = psychologist_id);
CREATE POLICY "Psy insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = psychologist_id);
CREATE POLICY "Psy update own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = psychologist_id);
CREATE POLICY "Psy delete own sessions" ON public.sessions FOR DELETE USING (auth.uid() = psychologist_id);

CREATE INDEX idx_sessions_patient ON public.sessions(patient_id);
CREATE INDEX idx_sessions_psy ON public.sessions(psychologist_id);

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();