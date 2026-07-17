INSERT INTO public.ai_tool_visibility (tool_id, is_public, visibility)
VALUES 
  ('cv-resume', false, 'hidden'),
  ('esign', false, 'hidden'),
  ('virtual-staging-ai', false, 'hidden')
ON CONFLICT (tool_id) DO UPDATE SET is_public = false, visibility = 'hidden';