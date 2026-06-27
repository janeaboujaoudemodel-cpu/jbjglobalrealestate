
CREATE OR REPLACE FUNCTION public.purge_deleted_candidate_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_path text;
BEGIN
  -- Remove storage objects for attachments deleted > 30 days ago
  FOR v_path IN
    SELECT file_path FROM public.crm_document_attachments
    WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days'
  LOOP
    DELETE FROM storage.objects WHERE bucket_id = 'candidate-documents' AND name = v_path;
  END LOOP;

  DELETE FROM public.crm_document_attachments
  WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';

  DELETE FROM public.crm_documents
  WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
END;
$$;

-- Schedule daily at 03:15 UTC (idempotent unschedule + reschedule)
DO $$
BEGIN
  PERFORM cron.unschedule('purge_deleted_candidate_data_daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_deleted_candidate_data_daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'purge_deleted_candidate_data_daily',
  '15 3 * * *',
  $$SELECT public.purge_deleted_candidate_data();$$
);
