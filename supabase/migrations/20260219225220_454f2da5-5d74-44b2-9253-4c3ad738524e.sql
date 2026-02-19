
CREATE TABLE IF NOT EXISTS public.voice_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  script TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  tone TEXT NOT NULL DEFAULT 'professional',
  project_name TEXT,
  voice_name TEXT,
  word_count INTEGER GENERATED ALWAYS AS (array_length(string_to_array(trim(script), ' '), 1)) STORED,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scripts"
  ON public.voice_scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scripts"
  ON public.voice_scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
  ON public.voice_scripts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
  ON public.voice_scripts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_voice_scripts_user_id ON public.voice_scripts(user_id);
CREATE INDEX idx_voice_scripts_created_at ON public.voice_scripts(created_at DESC);

CREATE OR REPLACE FUNCTION public.update_voice_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_voice_scripts_updated_at
  BEFORE UPDATE ON public.voice_scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_voice_scripts_updated_at();
