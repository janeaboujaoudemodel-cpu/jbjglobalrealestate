-- Fix corrupted floor_plan_types that contain location distance data
-- This removes entries that look like location distances, images, or headings

UPDATE pending_project_imports 
SET floor_plan_types = (
  SELECT COALESCE(
    jsonb_agg(item ORDER BY (item->>'label')),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(floor_plan_types) AS item
  WHERE 
    -- Keep only valid floor plan labels
    NOT (item->>'label') ~* '^\d+\s*(minute|min)'
    AND NOT (item->>'label') ~* '^!\['
    AND NOT (item->>'label') ~* '^###?\s*'
    AND NOT (item->>'label') ~* '^(Location|Get more|Download|View All|Find out)'
    AND NOT (item->>'label') ~* '[–—-]\s*(Dubai|Airport|Mall|Beach|Marina|School|Hospital)'
    AND (item->>'label') IS NOT NULL
    AND length(item->>'label') > 2
    AND length(item->>'label') < 80
),
updated_at = now()
WHERE 
  floor_plan_types IS NOT NULL 
  AND floor_plan_types != '[]'::jsonb
  AND jsonb_array_length(floor_plan_types) > 0;