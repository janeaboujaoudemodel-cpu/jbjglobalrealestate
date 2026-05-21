
-- Three-state visibility: public | owner_only | hidden
ALTER TABLE public.ai_tool_visibility
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'owner_only', 'hidden'));

-- Backfill from existing is_public flag
UPDATE public.ai_tool_visibility
  SET visibility = CASE WHEN is_public = false THEN 'hidden' ELSE 'public' END
  WHERE visibility = 'public' AND is_public = false;

-- Keep is_public in sync via trigger so legacy readers still work
CREATE OR REPLACE FUNCTION public.sync_ai_tool_visibility_is_public()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_public := (NEW.visibility = 'public');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ai_tool_visibility_is_public ON public.ai_tool_visibility;
CREATE TRIGGER trg_sync_ai_tool_visibility_is_public
  BEFORE INSERT OR UPDATE ON public.ai_tool_visibility
  FOR EACH ROW EXECUTE FUNCTION public.sync_ai_tool_visibility_is_public();

-- Seed: hide every known tool EXCEPT the 5 keepers
INSERT INTO public.ai_tool_visibility (tool_id, visibility, is_public)
VALUES
  ('ai-property-analyzer','hidden',false),
  ('ai-price-predictor','hidden',false),
  ('ai-neighborhood-insights','hidden',false),
  ('property-measurement','hidden',false),
  ('ai-market-report','hidden',false),
  ('ai-competitor-analysis','hidden',false),
  ('ai-roi-calculator','hidden',false),
  ('ai-investment-report','hidden',false),
  ('content-tools','hidden',false),
  ('video-meeting','hidden',false),
  ('calendar','hidden',false),
  ('business-card-scanner','hidden',false),
  ('ai-meeting-summarizer','hidden',false),
  ('ai-translation-hub','hidden',false),
  ('ai-video-tour-script','hidden',false),
  ('ai-email-generator','hidden',false),
  ('ai-lead-qualification','hidden',false),
  ('property-coach','hidden',false),
  ('ai-followup-scheduler','hidden',false),
  ('ai-objection-handler','hidden',false),
  ('ai-client-matcher','hidden',false),
  ('ai-social-media','hidden',false),
  ('ai-description-writer','hidden',false),
  ('interior-design','hidden',false),
  ('ai-video-studio','hidden',false),
  ('video-resize-pack','hidden',false),
  ('voice-studio','hidden',false),
  ('pdf-from-photos','hidden',false),
  ('image-resize','hidden',false),
  ('captions-translate','hidden',false),
  ('background-ai','hidden',false),
  ('beauty-filters','hidden',false),
  ('virtual-staging-ai','hidden',false),
  ('stamp-generator','hidden',false),
  ('business-card','hidden',false),
  ('cv-resume','hidden',false),
  ('cover-letter','hidden',false),
  ('logo-creator','hidden',false),
  ('company-profile','hidden',false),
  ('presentation-tool','hidden',false),
  ('landing-page-builder','hidden',false),
  ('esign','hidden',false),
  ('scan-sign','hidden',false),
  ('spreadsheet-tool','hidden',false),
  ('documents-tool','hidden',false),
  ('ai-contract-reviewer','hidden',false),
  ('ai-document-generator','hidden',false),
  ('ai-home-finder','public',true),
  ('property-evaluator','public',true),
  ('property-comparison','public',true),
  ('mortgage-calculator','public',true),
  ('rental-index','public',true)
ON CONFLICT (tool_id) DO UPDATE SET
  visibility = EXCLUDED.visibility,
  is_public = EXCLUDED.is_public,
  updated_at = now();
