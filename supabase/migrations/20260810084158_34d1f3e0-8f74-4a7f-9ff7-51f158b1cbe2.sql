WITH best AS (
  SELECT DISTINCT ON (m.developer_id) m.developer_id, m.url
  FROM public.developer_media m
  JOIN public.developers d ON d.id = m.developer_id
  WHERE m.kind = 'photo'
    AND m.is_public = true
    AND coalesce(d.feature_image_url, '') = ''
  ORDER BY m.developer_id,
    (CASE WHEN m.caption ILIKE '%master%' THEN 0
          WHEN m.caption ILIKE '%cover%' THEN 1
          WHEN m.caption ILIKE '%exterior%' THEN 2
          ELSE 3 END),
    m.display_order
)
UPDATE public.developers d
SET feature_image_url = best.url,
    updated_at = now()
FROM best
WHERE d.id = best.developer_id
  AND coalesce(d.feature_image_url, '') = '';