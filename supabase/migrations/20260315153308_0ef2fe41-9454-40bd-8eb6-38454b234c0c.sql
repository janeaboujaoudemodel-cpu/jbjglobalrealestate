
-- Create stamp_presets table for owner-only preset storage
CREATE TABLE public.stamp_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  svg_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stamp_presets ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view presets
CREATE POLICY "Authenticated users can view stamp presets"
  ON public.stamp_presets FOR SELECT
  TO authenticated
  USING (true);

-- Only owner/admin can insert
CREATE POLICY "Owner can insert stamp presets"
  ON public.stamp_presets FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.has_role(auth.uid(), 'owner')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Only owner/admin can update their own
CREATE POLICY "Owner can update stamp presets"
  ON public.stamp_presets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND (
      public.has_role(auth.uid(), 'owner')
      OR public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.has_role(auth.uid(), 'owner')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Only owner/admin can delete their own
CREATE POLICY "Owner can delete stamp presets"
  ON public.stamp_presets FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND (
      public.has_role(auth.uid(), 'owner')
      OR public.has_role(auth.uid(), 'admin')
    )
  );
