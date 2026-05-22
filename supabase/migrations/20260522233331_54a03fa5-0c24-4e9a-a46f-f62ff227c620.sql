
-- Audit log for merges (rollback path)
CREATE TABLE IF NOT EXISTS public.developer_merge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  keep_id uuid NOT NULL,
  duplicate_id uuid NOT NULL,
  duplicate_slug text,
  duplicate_snapshot jsonb NOT NULL,
  projects_repointed int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_merge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read merge log"
  ON public.developer_merge_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- One-shot merge of current duplicates
DO $$
DECLARE
  grp RECORD;
  keep uuid;
  dup uuid;
  repointed int;
  snap jsonb;
  dup_slug text;
BEGIN
  FOR grp IN
    SELECT LOWER(TRIM(name)) AS canonical,
           array_agg(id ORDER BY
             (logo_url IS NOT NULL)::int DESC,
             (description IS NOT NULL)::int DESC,
             (website_url IS NOT NULL)::int DESC,
             created_at ASC
           ) AS ids
    FROM public.developers
    WHERE is_hidden IS NOT TRUE
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
  LOOP
    keep := grp.ids[1];
    FOREACH dup IN ARRAY grp.ids[2:array_length(grp.ids,1)] LOOP
      SELECT to_jsonb(d.*), d.slug INTO snap, dup_slug
      FROM public.developers d WHERE d.id = dup;

      UPDATE public.projects
         SET developer_id = keep
       WHERE developer_id = dup;
      GET DIAGNOSTICS repointed = ROW_COUNT;

      UPDATE public.developers
         SET is_hidden = true,
             notes = COALESCE(notes,'') || E'\n[merged into ' || keep::text || ' at ' || now()::text || ']'
       WHERE id = dup;

      INSERT INTO public.developer_merge_log
        (canonical_name, keep_id, duplicate_id, duplicate_slug, duplicate_snapshot, projects_repointed)
      VALUES
        (grp.canonical, keep, dup, dup_slug, snap, repointed);
    END LOOP;
  END LOOP;
END $$;
