CREATE TABLE public.design_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id text NOT NULL,
  item_name text,
  thumbnail_svg text,
  metadata jsonb DEFAULT '{}',
  list_type text NOT NULL DEFAULT 'favorite',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id, list_type)
);

ALTER TABLE public.design_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own design favorites"
  ON public.design_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own design favorites"
  ON public.design_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own design favorites"
  ON public.design_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);