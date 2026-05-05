
-- 1. Master-developer evidence guard
CREATE OR REPLACE FUNCTION public.validate_master_developer_evidence()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.master_developer_status = 'Yes'::uae_master_developer_status
     AND (NEW.master_developer_evidence IS NULL OR length(trim(NEW.master_developer_evidence)) = 0) THEN
    RAISE EXCEPTION 'master_developer_evidence is required when master_developer_status is Yes';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_master_developer_evidence ON public.uae_dev_registry;
CREATE TRIGGER trg_validate_master_developer_evidence
  BEFORE INSERT OR UPDATE ON public.uae_dev_registry
  FOR EACH ROW EXECUTE FUNCTION public.validate_master_developer_evidence();

-- 2. Indexes for follow-up scheduler + reply matching
CREATE INDEX IF NOT EXISTS idx_uae_dev_followup_due
  ON public.uae_dev_registry (next_follow_up_date)
  WHERE outreach_status IN ('Test Sent','Contacted','Follow-up Needed');
CREATE INDEX IF NOT EXISTS idx_uae_brk_followup_due
  ON public.uae_brk_registry (next_follow_up_date)
  WHERE outreach_status IN ('Test Sent','Contacted','Follow-up Needed');
CREATE INDEX IF NOT EXISTS idx_uae_log_thread ON public.uae_registry_log (email_thread_id);
CREATE INDEX IF NOT EXISTS idx_uae_log_message ON public.uae_registry_log (email_message_id);

-- 3. Private storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('uae-registry-attachments', 'uae-registry-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owners read uae registry attachments" ON storage.objects;
CREATE POLICY "Owners read uae registry attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'uae-registry-attachments' AND public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Owners write uae registry attachments" ON storage.objects;
CREATE POLICY "Owners write uae registry attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uae-registry-attachments' AND public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Owners delete uae registry attachments" ON storage.objects;
CREATE POLICY "Owners delete uae registry attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'uae-registry-attachments' AND public.has_role(auth.uid(), 'owner'));
