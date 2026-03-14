

# Bulk AI Tools Upgrade: UI, Edge Functions, Model Software & Video Script Merge

## Summary

Upgrade all AI tools to match the premium dark-glass aesthetic already established by Property Analyzer and Price Predictor. Upgrade edge function models from `gemini-2.5-flash` to `gemini-3-flash-preview`. Merge Video Tour Script into the Video Studio. Fix damaged UIs while preserving tools that already have correct styling.

---

## Part 1: Edge Function Model Upgrades

The shared `callLovableAI` in `_shared/ai-utils.ts` already defaults to `google/gemini-3-flash-preview`. However, **13+ edge functions** override this with older `gemini-2.5-flash` or `gemini-2.0-flash`. These need updating:

| Edge Function | Current Model | Upgrade To |
|---|---|---|
| `ai-property-analyzer` | gemini-2.5-flash | gemini-3-flash-preview |
| `ai-price-predictor` | gemini-2.5-flash | gemini-3-flash-preview |
| `ai-neighborhood-insights` | (uses shared default) | Already correct |
| `ai-roi-calculator` | (uses shared default) | Already correct |
| `ai-competitor-analysis` | (uses shared default) | Already correct |
| `ai-lead-qualification` | gemini-2.5-flash | gemini-3-flash-preview |
| `ai-followup-scheduler` | (uses shared default) | Already correct |
| `ai-objection-handler` | (uses shared default) | Already correct |
| `ai-call-summarizer` | (check) | gemini-3-flash-preview |
| `ai-contract-reviewer` | (uses shared default) | Already correct |
| `ai-document-generator` | (uses shared default) | Already correct |
| `ai-meeting-summarizer` | (uses shared default) | Already correct |
| `ai-translation-hub` | (uses shared default) | Already correct |
| `ai-social-media` | (uses shared default) | Already correct |
| `ai-developer-analyzer` | gemini-2.5-flash-lite | gemini-3-flash-preview |
| `ai-background-remove` | gemini-2.5-flash | gemini-3-flash-preview |
| `document-ocr` | gemini-2.5-flash | gemini-3-flash-preview |
| `document-extractor` | gemini-2.5-flash | gemini-3-flash-preview |

**Action**: Update all `model:` overrides from `gemini-2.5-flash` / `gemini-2.0-flash` / `gemini-2.5-flash-lite` to `google/gemini-3-flash-preview` in the edge function files. Also update the tracking `model:` strings in usage records to match.

---

## Part 2: UI Status Audit — Keep vs Fix

**KEEP (already premium, correct layout/colors):**
- Property Analyzer (emerald theme, `AIToolPremiumLayout`, accordion results)
- Price Predictor (blue theme, progress bars, trend icons)
- ROI Calculator (emerald theme, investment cards)
- Neighborhood Insights (teal theme, amenity icons, progress scores)
- Lead Qualification (purple theme, score badges)
- Follow-up Scheduler (indigo theme, timeline cards)
- Objection Handler (rose theme, response cards)
- Competitor Analysis (orange theme, SWOT cards)
- Market Report (blue theme, chart sections)
- Contract Reviewer (violet theme, risk badges)
- Document Generator (indigo theme, 780-line feature-rich component)
- Meeting Summarizer (1146-line component, fully featured)
- Translation Hub (cyan theme, RTL support)

**FIX (using basic `Card`/`SelectTrigger` instead of dark variants, inconsistent styling):**
- **Call Summarizer** — Does NOT use `AIToolPremiumLayout`. Has a custom bare layout with `min-h-screen bg-black`. Needs migration to the shared layout system.
- **Description Writer** — Uses standard `SelectTrigger`/`SelectContent` instead of dark variants (`SelectTriggerDark`/`SelectContentDark`). Dropdown backgrounds appear white-on-white.
- **Social Media** — Same issue: standard `Select` components instead of dark variants.

**Action for damaged tools:**
1. **AICallSummarizerPremium.tsx** — Refactor to use `AIToolPremiumLayout` with `accentColor="orange"`. Keep the audio recording and file upload features but wrap in the standard layout.
2. **AIDescriptionWriterPage.tsx** — Replace `SelectTrigger`/`SelectContent` with `SelectTriggerDark`/`SelectContentDark`/`SelectItemDark`.
3. **AISocialMediaPage.tsx** — Same dark select component migration.

---

## Part 3: Feature Enhancements Across All Tools

Add these features to tools that are missing them (many premium tools already have some):

**Universal additions (where missing):**
- **Download Report** button (text file export) — add to: Neighborhood Insights, Competitor Analysis, Objection Handler, Call Summarizer, Social Media, Description Writer
- **Copy to Clipboard** — already present in most, verify Call Summarizer
- **AIToolGuide** component — add to tools missing it: Lead Qualification, Call Summarizer, ROI Calculator
- **Loading animation** — ensure all tools use `Loader2` with `animate-spin` during processing

**Tool-specific enhancements:**
- **Translation Hub**: Add bulk translation (paste multiple paragraphs), add "Swap Languages" button animation
- **ROI Calculator**: Add comparison mode (compare 2 properties side-by-side)
- **Competitor Analysis**: Add "Generate PDF Report" CTA linking to document generator
- **Social Media**: Add character count per platform, preview mockup (Instagram post frame)
- **Description Writer**: Add "Generate for Multiple Portals" (Bayut, Property Finder, Dubizzle formatting)
- **Call Summarizer**: Add CRM lead linking (search `crm_leads` and attach summary)

---

## Part 4: Video Tour Script → Video Studio Merge

**Current state**: `AIVideoTourScriptPremium` is a standalone tool at `/ai-video-tour-script` generating text scripts.

**Action**:
1. Create a new panel `VideoScriptPanel.tsx` inside `src/components/ai-video-studio/features/` that contains the script generation form (property name, details, audience, tone, duration) and results display
2. Add "Script" tab to the Video Studio's `IntegratedToolsPanel.tsx` alongside Captions, Voice, Beauty, Resize
3. Update the route: `/ai-video-tour-script` → redirect to `/toolkit/video-studio` (add `Navigate` in `AIToolRoutes.tsx`)
4. Remove the standalone page import from `AIToolRoutes.tsx`
5. Keep the edge function `ai-video-tour-script` as-is — just call it from the new panel

---

## Part 5: Responsive & Device Compatibility

- Audit all tools for mobile breakpoints: ensure form grids use `grid-cols-1 sm:grid-cols-2` instead of fixed `grid-cols-2`
- Add `max-w-4xl mx-auto` container to tools that lack it
- Ensure all `Textarea` components have minimum height on mobile (`min-h-[120px]`)
- Test that `SelectContentDark` dropdowns don't overflow on small screens

---

## Implementation Order

1. Edge function model upgrades (all 13+ files) — bulk find-replace
2. Call Summarizer → AIToolPremiumLayout migration
3. Description Writer + Social Media → dark select components
4. Video Script → Video Studio merge
5. Feature additions (download, guide, enhancements)
6. Responsive audit pass

---

## Technical Notes

- All tools using `useAITool` hook go through `supabase.functions.invoke()` which auto-deploys
- The shared `_shared/ai-utils.ts` already has `gemini-3-flash-preview` as default — only explicit overrides need changing
- No database migrations needed
- Color themes are LOCKED per tool — only fixing damaged/inconsistent UIs, not changing working themes
- Property Evaluator blue theme remains untouched (locked per prior instruction)

