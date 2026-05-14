-- Restore the originally-intended emails for the Desk/Support signatures
UPDATE public.email_signature_presets
SET email = 'frontdesk@jbj.ae'
WHERE is_system = true AND name = 'JBJ Front Desk';

UPDATE public.email_signature_presets
SET email = 'helpdesk@jbj.ae'
WHERE is_system = true AND name = 'JBJ Help Desk';

UPDATE public.email_signature_presets
SET email = 'support@jbj.ae'
WHERE is_system = true AND name = 'JBJ Support';

-- Deduplicate: keep the OLDEST row per (is_system=true, name); delete the rest.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) AS rn
  FROM public.email_signature_presets
  WHERE is_system = true
)
DELETE FROM public.email_signature_presets p
USING ranked r
WHERE p.id = r.id AND r.rn > 1;

-- Prevent duplicate system rows in the future
CREATE UNIQUE INDEX IF NOT EXISTS email_signature_presets_system_name_uniq
  ON public.email_signature_presets (name)
  WHERE is_system = true;