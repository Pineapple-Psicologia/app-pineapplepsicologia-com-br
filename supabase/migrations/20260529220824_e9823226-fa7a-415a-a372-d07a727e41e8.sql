
-- Tabela de pacientes
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own patients" ON public.patients
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert own patients" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own patients" ON public.patients
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own patients" ON public.patients
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_patients_updated
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_patients_user_id ON public.patients(user_id);

-- Tabela de arquivos por paciente
CREATE TABLE public.patient_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  game TEXT,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_files TO authenticated;
GRANT ALL ON public.patient_files TO service_role;

ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own files" ON public.patient_files
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert own files" ON public.patient_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own files" ON public.patient_files
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own files" ON public.patient_files
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_patient_files_patient_id ON public.patient_files(patient_id);
CREATE INDEX idx_patient_files_user_id ON public.patient_files(user_id);

-- Bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-files', 'patient-files', false);

-- Storage policies: usuário só acessa arquivos dentro de sua pasta {user_id}/...
CREATE POLICY "Users read own patient files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own patient files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patient-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own patient files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'patient-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own patient files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'patient-files' AND auth.uid()::text = (storage.foldername(name))[1]);
