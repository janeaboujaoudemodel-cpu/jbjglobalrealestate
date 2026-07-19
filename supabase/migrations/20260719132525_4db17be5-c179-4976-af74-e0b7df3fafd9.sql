-- For each canonical key group, keep the row with the most projects (fallback: oldest created_at)
CREATE TEMP TABLE _dev_groups AS
SELECT
  d.id,
  public.jbj_developer_import_key(d.name) AS k,
  COALESCE((SELECT count(*) FROM public.projects p WHERE p.developer_id = d.id), 0) AS proj_count,
  d.created_at
FROM public.developers d;

CREATE TEMP TABLE _survivors AS
SELECT DISTINCT ON (k) id AS survivor_id, k
FROM _dev_groups
ORDER BY k, proj_count DESC NULLS LAST, created_at ASC NULLS LAST;

CREATE TEMP TABLE _merge_map AS
SELECT g.id AS dup_id, s.survivor_id
FROM _dev_groups g
JOIN _survivors s ON s.k = g.k
WHERE g.id <> s.survivor_id;

-- Repoint projects to survivor
UPDATE public.projects p
SET developer_id = m.survivor_id
FROM _merge_map m
WHERE p.developer_id = m.dup_id;

-- Delete duplicates (cascade will handle stray rows in child tables that lack repointing)
DELETE FROM public.developers WHERE id IN (SELECT dup_id FROM _merge_map);