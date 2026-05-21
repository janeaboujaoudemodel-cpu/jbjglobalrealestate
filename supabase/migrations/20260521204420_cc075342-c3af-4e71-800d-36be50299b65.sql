ALTER TABLE public.ai_tool_visibility
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'hidden';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_tool_visibility_visibility_check'
      AND conrelid = 'public.ai_tool_visibility'::regclass
  ) THEN
    ALTER TABLE public.ai_tool_visibility
      ADD CONSTRAINT ai_tool_visibility_visibility_check
      CHECK (visibility IN ('public', 'owner_only', 'hidden'));
  END IF;
END $$;

WITH registered_tools(tool_id) AS (
  VALUES
    ('ai-video-studio'),
    ('video-resize-pack'),
    ('voice-studio'),
    ('voice-studio-pro'),
    ('pdf-from-photos'),
    ('image-resize'),
    ('captions-translate'),
    ('background-ai'),
    ('beauty-filters'),
    ('creative-suite'),
    ('ai-home-finder'),
    ('property-comparison'),
    ('property-evaluator'),
    ('rental-index'),
    ('mortgage-calculator'),
    ('interior-design'),
    ('interior-design-ai'),
    ('virtual-staging-ai'),
    ('ai-lead-qualification'),
    ('ai-followup-scheduler'),
    ('ai-objection-handler'),
    ('ai-client-matcher'),
    ('ai-market-report'),
    ('ai-competitor-analysis'),
    ('ai-roi-calculator'),
    ('ai-investment-report'),
    ('ai-meeting-summarizer'),
    ('ai-call-summarizer'),
    ('ai-translation-hub'),
    ('ai-video-tour-script'),
    ('ai-email-generator'),
    ('ai-social-media'),
    ('ai-description-writer'),
    ('ai-contract-reviewer'),
    ('ai-document-generator'),
    ('stamp-generator'),
    ('scan-sign'),
    ('business-card'),
    ('business-card-scanner'),
    ('cv-resume'),
    ('cover-letter'),
    ('logo-creator'),
    ('company-profile'),
    ('presentation-tool'),
    ('landing-page-builder'),
    ('esign'),
    ('spreadsheet-tool'),
    ('documents-tool'),
    ('documents'),
    ('content-tools'),
    ('video-meeting'),
    ('calendar'),
    ('ai-calendar'),
    ('property-measurement'),
    ('property-coach')
), approved_public(tool_id) AS (
  VALUES
    ('ai-home-finder'),
    ('property-comparison'),
    ('property-evaluator'),
    ('rental-index'),
    ('mortgage-calculator')
)
INSERT INTO public.ai_tool_visibility (tool_id, is_public, visibility)
SELECT
  rt.tool_id,
  EXISTS (SELECT 1 FROM approved_public ap WHERE ap.tool_id = rt.tool_id),
  CASE WHEN EXISTS (SELECT 1 FROM approved_public ap WHERE ap.tool_id = rt.tool_id)
    THEN 'public'
    ELSE 'hidden'
  END
FROM registered_tools rt
ON CONFLICT (tool_id) DO UPDATE
SET
  is_public = EXCLUDED.is_public,
  visibility = EXCLUDED.visibility,
  updated_at = now();