
-- 1. Cookie consents audit table
CREATE TABLE public.cookie_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  consent_status TEXT NOT NULL CHECK (consent_status IN ('all', 'essential', 'custom')),
  preferences JSONB NOT NULL DEFAULT '{}',
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (visitors aren't authenticated)
CREATE POLICY "Anyone can insert cookie consent" 
  ON public.cookie_consents FOR INSERT 
  WITH CHECK (true);

-- Only service role can read (admin audit)
CREATE POLICY "Service role can read consents" 
  ON public.cookie_consents FOR SELECT 
  USING (false);

-- 2. Clean area descriptions: remove markdown image tags and brand references
UPDATE public.areas 
SET description = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(description, '!\[.*?\]\(.*?\)', '', 'g'),
      'Provident Estate', '', 'gi'
    ),
    'Provident', '', 'gi'
  ),
  'Reelly', '', 'gi'
)
WHERE description IS NOT NULL 
  AND (description ILIKE '%provident%' OR description ILIKE '%reelly%' OR description LIKE '%![%');

-- Also clean provident_url references in areas (set to null)
UPDATE public.areas SET provident_url = NULL WHERE provident_url IS NOT NULL;
