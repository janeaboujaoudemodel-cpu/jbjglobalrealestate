
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS admin_position text;

UPDATE public.developers
   SET admin_position = 'Business Development Manager'
 WHERE slug = 'citi-developers'
   AND (admin_position IS NULL OR admin_position = '');
