

# Plan: Fix AI Cons Globally, Brochure Cover Photo Bug, and AI Analyzer Monogram

## 3 Issues to Fix

### 1. Remove AMRA-Specific Cons Rule → Make It Global
**Problem**: Line 92 in `ai-property-analyzer/index.ts` has a hardcoded rule mentioning "AMRA by AHS Properties" — the user never asked for AHS-specific rules. The real requirement is: **globally, for ALL projects, AI must never fabricate cons or pros**.

**File**: `supabase/functions/ai-property-analyzer/index.ts` (line 92)
- Remove the AMRA/AHS-specific instruction entirely
- Replace with a universal rule: "NEVER list false, fabricated, or speculative cons or pros for ANY project. Only state cons that are verifiable market facts. Do not fabricate developer track record claims. If you are unsure about a con, omit it rather than guess."

### 2. Brochure Card Shows Wrong Photo (Generic Downtown Fallback)
**Problem**: `PremiumBrochureCard.tsx` line 7 has `BROCHURE_BG_URL` pointing to a generic Khaleej Times Dubai skyline image. When `projectImageUrl` is null/undefined (project has no images array), every brochure shows the same downtown photo.

**File**: `src/components/project-detail/PremiumBrochureCard.tsx`
- Line 128: `url(${projectImageUrl || BROCHURE_BG_URL})` — the fallback is the bug
- Fix: When `projectImageUrl` is missing, use the project's `cover_image_url` instead (already passed from ProjectDetailLayout). Also pass `cover_image_url` as a prop.
- Additionally update `ProjectDetailLayout.tsx` line 1094 to try `project.cover_image_url` before `project.images?.[0]?.url`

**File**: `src/components/project-detail/ProjectDetailLayout.tsx` (line 1094)
- Change: `projectImageUrl={project.cover_image_url || project.images?.[0]?.url || undefined}`

### 3. AI Analyzer Monogram — Remove 3D Glow Effect
**Problem**: The loading state in `ProjectAIAnalyzer.tsx` (lines 262-274) shows the JBJ monogram with a large `blur-2xl` golden glow circle behind it and `drop-shadow` filter, creating a 3D bordered appearance.

**File**: `src/components/project-detail/ProjectAIAnalyzer.tsx` (lines 262-296)
- Remove the `<div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl animate-pulse scale-[1.8]" />` glow div
- Remove the `drop-shadow` filter from the img style
- Keep the `jbj-breathe` animation (subtle scale pulse) for loading indication
- Keep the shimmer progress bar below
- Result: flat monogram with gentle breathing animation, no 3D borders or glow

## Files to Modify
1. `supabase/functions/ai-property-analyzer/index.ts` — global no-false-cons rule
2. `src/components/project-detail/PremiumBrochureCard.tsx` — remove generic fallback image
3. `src/components/project-detail/ProjectDetailLayout.tsx` — pass cover_image_url to brochure card
4. `src/components/project-detail/ProjectAIAnalyzer.tsx` — flatten monogram loading state

