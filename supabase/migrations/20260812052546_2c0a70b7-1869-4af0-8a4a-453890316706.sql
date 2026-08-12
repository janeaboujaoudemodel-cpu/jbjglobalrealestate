ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS rent_frequency text;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_rent_frequency_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_rent_frequency_check
  CHECK (rent_frequency IS NULL OR rent_frequency IN ('yearly', 'monthly', 'weekly', 'daily'));

CREATE INDEX IF NOT EXISTS idx_projects_published_listing_kind_rent_frequency
  ON public.projects (is_published, listing_kind, rent_frequency)
  WHERE deleted_at IS NULL;

GRANT INSERT ON public.chat_conversations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisory_desk_requests TO authenticated;
GRANT ALL ON public.advisory_desk_requests TO service_role;