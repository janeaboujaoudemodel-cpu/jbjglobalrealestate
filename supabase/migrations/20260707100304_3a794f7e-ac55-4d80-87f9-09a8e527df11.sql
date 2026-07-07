
UPDATE public.projects
SET sale_status = 'off_plan'
WHERE (slug ILIKE 'amra%' OR name ILIKE 'Amra%')
  AND (sale_status IS NULL OR sale_status <> 'off_plan');
