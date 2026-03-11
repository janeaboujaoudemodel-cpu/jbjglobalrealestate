
-- Create user_color_palettes table for per-user personalization
CREATE TABLE public.user_color_palettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Custom Palette',
  palette jsonb NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS: users CRUD their own palettes only
ALTER TABLE public.user_color_palettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own palettes"
  ON public.user_color_palettes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own palettes"
  ON public.user_color_palettes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own palettes"
  ON public.user_color_palettes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own palettes"
  ON public.user_color_palettes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Ensure only one active palette per user
CREATE UNIQUE INDEX idx_user_active_palette ON public.user_color_palettes (user_id) WHERE is_active = true;
