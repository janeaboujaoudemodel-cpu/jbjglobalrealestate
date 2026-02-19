
# AI Home Finder + JBJAI Intelligence + ElevenLabs + Data Completeness — Full Fix Plan

This plan addresses every complaint in the message, grouped into 6 distinct workstreams.

---

## Issues Identified & Root Causes

### 1. AI Home Finder (QuizResults.tsx) — Multiple UI & Logic Bugs

**Problems found:**
- **Faded buttons** — "Download Report" uses `variant="outline"` with `border-purple-500/50 text-white` on a purple background — the text is white on near-white purple, making it invisible
- **"Your AI Selected Properties" label** — too generic; user wants it removed/replaced
- **#1 Best Match hero card** — photo broken because `projects[0].images?.[0]?.image_url` but the query selects `images:project_images(id, image_url, alt_text, display_order)` — projects may have no `project_images` rows, and `cover_image_url` is never checked as fallback
- **Price shows "0.0M"** — when `price_from` is null, `((null || 0) / 1000000).toFixed(1)` = `"0.0"` — must show "Price on Request" or "Contact for Price" instead
- **Bedrooms blank** — `bedrooms_min` and `bedrooms_max` are null in many Reelly-sourced projects (Arabian Hills Estate confirmed: `bedrooms_min: null`). Must show "To be announced" fallback
- **Sold-out projects recommended** — Quiz.tsx `getRecommendations()` does NOT filter out sold-out projects. Arabian Ranches 3 has no `cover_image_url` and shows "Media pending verification"
- **"More Great Options" grid** — 4 cards in one row on `lg:grid-cols-4` produces uneven cards at different sizes because `ProjectCard` has variable internal heights
- **"Add Badge" button** — uses `border-purple-500/30 text-white` with zero bg on dark purple background — invisible
- **"Want More AI Power" VIP section** — shows "$100/year" upgrade prompt which user wants hidden (keep structure, hide it)
- **AI Comparison, Property Consultant, "Want More AI Power" action cards** — no outer border container grouping them; user wants a single purple border around all cards
- **Regenerate VIP button** — faded because non-members see gold styling on dark bg — fix to be clearly clickable
- **Arabian Hills Estate**: `price_from: null`, `bedrooms_min/max: null`, `amenities: []` — quiz recommends it with zero data

### 2. JBJAI Project Intelligence (ProjectAIAnalyzer.tsx) — Loading Forever Bug

**Root cause:** The `useEffect` at line 110 uses `!hasTriggered` (a ref, not state) but reads it as a value — `hasTriggered` is a `useRef(false)` so `!hasTriggered` is always `false` (object is truthy). This means the condition `!hasTriggered` never blocks, and `handleAnalyze()` is called on every render while `isVisible` is true. However, the trigger ref is set `hasTriggered.current = false` but never set to `true` after first run — so it may loop or the 15-second timeout fires and shows "Analysis is taking longer than expected" without ever resolving.

**Fix:** Change the effect condition from `!hasTriggered` to `!hasTriggered.current`, and set `hasTriggered.current = true` immediately at the start of `handleAnalyze()` to prevent re-triggering.

**Loading spinner:** Currently shows `Loader2` spinner. User wants the JBJ monogram (light version for light backgrounds, dark version for dark) with a gold fill animation — use the existing `BrandedLoader` component but adapt it for inline (non-full-screen) use with appropriate monogram variant.

### 3. ElevenLabs in AI Talking Agent Panel (AITalkingAgentPanel.tsx) — Unauthorized Usage

The `voice-studio-clone` edge function uses ElevenLabs for: `clone_voice`, `tts_with_clone`, `delete_clone`, `list_voices`. The `AITalkingAgentPanel.tsx` calls this function for the "My Voice" cloning tab.

**Fix:** Remove the "My Voice" cloning tab entirely from `AITalkingAgentPanel.tsx` (the voice cloning feature is unauthorized per the memory constraint `constraints/zero-auto-paid-api-credits`). The Web Speech API preview (already implemented for other characters) is the only permitted voice preview method.

ElevenLabs functions that MUST remain (podcast only): `elevenlabs-podcast-tts`, `elevenlabs-podcast-segment-tts`, `elevenlabs-podcast-music`, `elevenlabs-sfx`, `owner-voice-generate`, `clone-jane-voice`.

ElevenLabs functions to neutralize in UI: `voice-studio-clone` calls from `AITalkingAgentPanel.tsx`.

### 4. "Media Pending Verification" Label — Branded Fix

In `src/components/ui/verified-media.tsx` the placeholder label defaults to `"Media pending"` and both `ProjectCard.tsx` and `ReellyProjectCard.tsx` pass `placeholderLabel="Media pending verification"`.

**Fix:** Change the placeholder from showing text to showing the JBJ monogram (small, elegant) as the placeholder — no "Media pending verification" text shown to end users in QuizResults. For quiz results specifically, projects without any image (no `cover_image_url`, no `project_images`) should be filtered from recommendations.

### 5. Quiz Recommendation Logic — Accuracy Fixes

**Problems:**
- Does not filter sold-out projects (`is_sold_out = true` or `sale_status = 'Sold Out'`)
- Does not filter projects with no price and no image (Arabian Ranches 3 = no cover, no price)
- Scoring is weak — does not weight by data completeness

**Fixes in `Quiz.tsx` `getRecommendations()`:**
1. Add pre-filter: exclude `is_sold_out === true`
2. Add pre-filter: exclude projects where `sale_status?.toLowerCase().includes('sold')`
3. Add pre-filter: exclude projects with no `cover_image_url` AND no images in `project_images`
4. Add pre-filter: exclude projects where `price_from` is null AND `price_to` is null (no price data at all)
5. Add scoring bonus for data completeness (has price +10, has bedrooms data +5, has image +5)

### 6. Reelly Full Data Extraction — Offline-First Strategy

User is clear: **the API key will be disconnected soon — this is the last chance to extract everything.**

The database already has the `reelly-api-sync` and `reelly-backfill-details` functions. The key gap is that many fields are not being saved:
- `bedrooms_min/max` for Arabian Hills Estate = null despite Reelly having unit data
- `price_from` for Arabian Hills Estate = null
- `unit_types` for many projects = null
- `amenities` empty arrays for many projects

**Fix:** Create a new edge function `reelly-complete-offline-save` that:
1. Calls the Reelly API for every project (by reelly_id) in batches of 20
2. Extracts: `unit_types`, `bedrooms_min`, `bedrooms_max`, `price_from`, `price_to`, `amenities`, `floor_plan_types`, `highlights`, `faqs`, `payment_breakdown`, `video_url`, `video_urls`
3. Mirrors all image URLs to Supabase Storage (`project-media` bucket) for permanent offline storage
4. Updates the `projects` table with all extracted data
5. Also updates `cover_image_url` from the first gallery image if currently missing

For **Sunset Bay Grand** specifically — the DB shows: `bedrooms_min: null`, `bedrooms_max: null`, `unit_types: null` but `amenities` has 16 items. Need to extract unit types from Reelly ID 3003 to populate `bedrooms_min/max`.

---

## Files to Change

| File | Change |
|---|---|
| `src/pages/QuizResults.tsx` | Fix button visibility, price/bedroom fallbacks, hide VIP section, add purple border around action cards, filter sold-out from display, fix hero image fallback |
| `src/pages/Quiz.tsx` | Filter sold-out, no-image, no-price projects from recommendations |
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Fix `hasTriggered.current` bug, replace spinner with JBJ monogram loader |
| `src/components/ai-video-studio/features/AITalkingAgentPanel.tsx` | Remove "My Voice" ElevenLabs cloning tab entirely |
| `supabase/functions/reelly-complete-offline-save/index.ts` | NEW: Full data extraction + image mirroring for all Reelly projects |

---

## Detailed Implementation

### QuizResults.tsx Changes

1. **Download Report button** — change from `variant="outline"` with faded styling to solid visible styling: `bg-white/10 border border-white/30 text-white hover:bg-white/20`
2. **Hero image fallback** — change `src={projects[0].images?.[0]?.image_url || "/placeholder.svg"}` to `src={projects[0].cover_image_url || projects[0].images?.[0]?.image_url || "/placeholder.svg"}`
3. **Price display** — change `AED ${((projects[0].price_from || 0) / 1000000).toFixed(1)}M` to: if null, show `"Price on Request"`
4. **Bedrooms display** — if both null, show `"Type to be confirmed"` instead of `"null - null BR"`
5. **Action cards border** — wrap all three action cards (AI Comparison, Property Consultant, Want More AI Power) in a single `div` with `border border-purple-500/40 rounded-2xl p-6 bg-purple-950/20`
6. **Hide VIP upgrade** — wrap the "Want More AI Power" `$100/year` section in `{false && (...)}` to hide it but keep structure
7. **Regenerate button** — non-member path: change to navigate directly to `/quiz` for free retry, remove VIP gate: `onClick={() => navigate("/quiz")}` with styling `border-purple-400 text-white bg-purple-900/40 hover:bg-purple-800/40`
8. **Add Badge button** — change `border-purple-500/30 text-white` to `border-purple-400/60 text-purple-200 hover:bg-purple-800/40` for visibility
9. **"More Great Options" cards** — change grid from `lg:grid-cols-4` to `sm:grid-cols-2 lg:grid-cols-3` for better consistency

### Quiz.tsx Changes

In `getRecommendations()`:
```
const filteredProjects = allProjects.filter((project) => {
  // Exclude sold-out projects — NEVER recommend sold-out
  if (project.is_sold_out) return false;
  const saleStatusLower = (project.sale_status || '').toLowerCase();
  if (saleStatusLower.includes('sold') || saleStatusLower.includes('out_of_stock')) return false;
  
  // Exclude projects with no visual content
  const hasImage = project.cover_image_url || project.images?.[0]?.image_url;
  if (!hasImage) return false;
  
  // ... existing budget/bedroom filters
});
```

### ProjectAIAnalyzer.tsx Changes

Line 111: `if (isVisible && !hasTriggered && ...)` → `if (isVisible && !hasTriggered.current && !isAnalyzing && !analysis)`

Inside `handleAnalyze()` at line 59: Add `hasTriggered.current = true;` at the very start.

Loading state (lines 173-177): Replace `Loader2` spinner with JBJ monogram:
```jsx
<div className="flex flex-col items-center gap-4 py-8">
  <img src={jbjMonogramTransparent} alt="Analyzing..." 
       className="w-16 h-16 object-contain animate-pulse"
       style={{ filter: "drop-shadow(0 0 12px rgba(200,167,102,0.5))" }} />
  <p className="text-zinc-500 text-sm">JBJ AI is analyzing {projectName}...</p>
  <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />
</div>
```

### AITalkingAgentPanel.tsx Changes

Remove the "My Voice" tab (all code related to `clonedVoiceId`, `clonedVoiceName`, recording state, MediaRecorder, upload to `voice-studio-clone`) — strip it down to only the 8 character presets + Web Speech API preview. This eliminates all ElevenLabs calls from this file.

### New Edge Function: reelly-complete-offline-save

This function will:
1. Accept `{ mode: "batch" | "specific", batch_size: number, project_ids?: number[] }`
2. For each project with a `reelly_id`, call the Reelly detail API endpoint `${REELLY_API_BASE}/${reelly_id}`
3. Extract all enrichment data (unit_types → bedrooms_min/max, amenities, highlights, faqs, payment details)
4. For each image URL in the response, fetch it and upload to Supabase Storage `project-media` bucket using path `projects/{reelly_id}/{filename}` — store the public Supabase URL
5. Update `cover_image_url` if currently null or pointing to `api.reelly.io` domain
6. Update `bedrooms_min`, `bedrooms_max` computed from unit_types array
7. This provides **full offline resilience** — all assets stored in Supabase Storage, not dependent on Reelly CDN

---

## What Does NOT Change

- Podcast ElevenLabs functions (`elevenlabs-podcast-tts`, etc.) — untouched
- Owner voice features (`owner-voice-generate`, `clone-jane-voice`) — untouched  
- All other AI tools not mentioned — untouched
- Database schema — no migrations needed (existing columns cover all required data)
- Market Report page — untouched
- All other pages and components — untouched
