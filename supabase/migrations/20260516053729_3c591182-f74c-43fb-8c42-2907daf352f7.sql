
-- Phase 1: CRM Source Database upload system

CREATE TABLE IF NOT EXISTS public.crm_source_databases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  original_filename text NOT NULL,
  mime_type text,
  file_storage_path text,
  file_size_bytes bigint,
  row_count integer NOT NULL DEFAULT 0,
  column_headers jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'separate' CHECK (status IN ('separate','merged','both')),
  notes text,
  list_id uuid REFERENCES public.crm_lead_lists(id) ON DELETE SET NULL,
  archived_at timestamptz,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_source_databases_owner
  ON public.crm_source_databases(owner_user_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_crm_source_databases_list
  ON public.crm_source_databases(list_id);

CREATE TABLE IF NOT EXISTS public.crm_source_database_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_database_id uuid NOT NULL REFERENCES public.crm_source_databases(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  raw jsonb NOT NULL,
  merged_lead_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_database_id, row_index)
);

CREATE INDEX IF NOT EXISTS idx_crm_source_database_rows_src
  ON public.crm_source_database_rows(source_database_id, row_index);

-- Extend crm_leads with permanent source linkage
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS source_database_id uuid REFERENCES public.crm_source_databases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_row_index integer;

CREATE INDEX IF NOT EXISTS idx_crm_leads_source_database
  ON public.crm_leads(source_database_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS crm_source_databases_updated_at ON public.crm_source_databases;
CREATE TRIGGER crm_source_databases_updated_at
  BEFORE UPDATE ON public.crm_source_databases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.crm_source_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_source_database_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "src_db_owner_select" ON public.crm_source_databases
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid()
         OR has_role(auth.uid(),'admin'::app_role)
         OR has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "src_db_owner_insert" ON public.crm_source_databases
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid()
              OR has_role(auth.uid(),'admin'::app_role)
              OR has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "src_db_owner_update" ON public.crm_source_databases
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid()
         OR has_role(auth.uid(),'admin'::app_role)
         OR has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "src_db_owner_delete" ON public.crm_source_databases
  FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid()
         OR has_role(auth.uid(),'admin'::app_role)
         OR has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "src_db_rows_owner_select" ON public.crm_source_database_rows
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.crm_source_databases sd
                 WHERE sd.id = source_database_id
                   AND (sd.owner_user_id = auth.uid()
                        OR has_role(auth.uid(),'admin'::app_role)
                        OR has_role(auth.uid(),'owner'::app_role))));

CREATE POLICY "src_db_rows_owner_insert" ON public.crm_source_database_rows
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.crm_source_databases sd
                      WHERE sd.id = source_database_id
                        AND (sd.owner_user_id = auth.uid()
                             OR has_role(auth.uid(),'admin'::app_role)
                             OR has_role(auth.uid(),'owner'::app_role))));

CREATE POLICY "src_db_rows_owner_update" ON public.crm_source_database_rows
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.crm_source_databases sd
                 WHERE sd.id = source_database_id
                   AND (sd.owner_user_id = auth.uid()
                        OR has_role(auth.uid(),'admin'::app_role)
                        OR has_role(auth.uid(),'owner'::app_role))));

CREATE POLICY "src_db_rows_owner_delete" ON public.crm_source_database_rows
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.crm_source_databases sd
                 WHERE sd.id = source_database_id
                   AND (sd.owner_user_id = auth.uid()
                        OR has_role(auth.uid(),'admin'::app_role)
                        OR has_role(auth.uid(),'owner'::app_role))));

-- Private storage bucket for original uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-source-databases','crm-source-databases', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "crm_src_db_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'crm-source-databases'
         AND (auth.uid()::text = (storage.foldername(name))[1]
              OR has_role(auth.uid(),'admin'::app_role)
              OR has_role(auth.uid(),'owner'::app_role)));

CREATE POLICY "crm_src_db_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-source-databases'
              AND (auth.uid()::text = (storage.foldername(name))[1]
                   OR has_role(auth.uid(),'admin'::app_role)
                   OR has_role(auth.uid(),'owner'::app_role)));

CREATE POLICY "crm_src_db_files_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'crm-source-databases'
         AND (auth.uid()::text = (storage.foldername(name))[1]
              OR has_role(auth.uid(),'admin'::app_role)
              OR has_role(auth.uid(),'owner'::app_role)));

CREATE POLICY "crm_src_db_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'crm-source-databases'
         AND (auth.uid()::text = (storage.foldername(name))[1]
              OR has_role(auth.uid(),'admin'::app_role)
              OR has_role(auth.uid(),'owner'::app_role)));
