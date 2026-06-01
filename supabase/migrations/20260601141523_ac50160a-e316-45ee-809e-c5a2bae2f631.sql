INSERT INTO public.ai_tool_visibility (tool_id, visibility, is_public) VALUES
  ('ai-home-finder', 'public', true),
  ('property-comparison', 'public', true),
  ('mortgage-calculator', 'public', true),
  ('property-evaluator', 'public', true),
  ('rental-index', 'public', true),
  ('property-measurement', 'public', true),
  ('list-property-sale', 'public', true),
  ('list-property-rent', 'public', true)
ON CONFLICT (tool_id) DO UPDATE
SET visibility = EXCLUDED.visibility,
    is_public = EXCLUDED.is_public,
    updated_at = now();