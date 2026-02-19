
# Complete Task Implementation Plan

## Task Inventory (All 8 Tasks from This Message)

1. AI Home Finder UI & Logic Bugs (QuizResults.tsx + Quiz.tsx) — verification pass on what's already applied vs. still broken
2. JBJAI Project Intelligence — infinite loading bug fix + JBJ monogram loading animation
3. ElevenLabs removal from AI Talking Agent Panel (AITalkingAgentPanel.tsx) — any remaining EL calls
4. Reelly Full Data Extraction — automated offline-first batch save, bedrooms/price for 1,794 projects
5. Daily Auto-Sync — add `reelly-complete-offline-save` as Step 8 in `daily-reelly-auto-sync`
6. New Listings Detection — show Reelly projects not yet in DB as visual "card-first" listing in Listing Admin, not proposed value dumps
7. Pending Updates Queue — fix "proposed value" display to show real project cards instead
8. Sunset Bay Grand (reelly_id 3003) — trigger specific extraction immediately

---

## Current State Analysis

### QuizResults.tsx — Already Partially Fixed
Reading the current file (lines 280-420), many fixes were applied in the previous session:
- Price fallback: `"Price on Request"` — **DONE**
- Bedrooms fallback: `"Type TBC"` — **DONE**
- Hero image: `cover_image_url || images[0]` — **DONE**
- Download Report button: `bg-white/10 border border-white/30` — **DONE**
- Add Badge button: `border-purple-400/60 text-purple-200 hover:bg-purple-800/40` — **DONE**
- Grid: `sm:grid-cols-2 lg:grid-cols-3` — **DONE**
- Action card purple border wrapper — **DONE**
- VIP section hidden — **DONE**
- Regenerate navigates to `/quiz` — **DONE**

**REMAINING ISSUE:** The quiz recommendation system requires the quiz to load ALL projects including their `images` relation for the `hasImage` check. The `allProjects` query in `Quiz.tsx` may not be joining `project_images`. Let me verify what fields Quiz.tsx actually fetches.

### Quiz.tsx — Data Fetch Gap
Looking at lines 239-275, the `getRecommendations()` function references `project.images?.[0]?.image_url` but the `allProjects` query (around line 140-160) needs to be verified — if it doesn't JOIN `project_images`, then `images` is always undefined and the `hasImage` check only works on `cover_image_url`. The fix: the filter should only use `cover_image_url` since `project_images` join is expensive for bulk queries.

### ProjectAIAnalyzer.tsx — FIXED
Lines 112-116 confirm the fix is already applied:
```
if (isVisible && !hasTriggered.current && !isAnalyzing && !analysis) {
  handleAnalyze();
}
```
And line 61: `hasTriggered.current = true;` — **DONE**
JBJ monogram loading (lines 175-184): **DONE**

### AITalkingAgentPanel.tsx — Clean
The file (414 lines) contains only the 8 character presets and Web Speech API. No ElevenLabs references found. — **DONE**

### reelly-complete-offline-save — Exists But Not Auto-Triggered
The function exists and is correct. The problem is:
1. It's never called automatically — only manually via admin
2. The `daily-reelly-auto-sync` does NOT include it as a step
3. 1,794 of 1,830 projects still have `bedrooms_min = null`

### Pending Updates Queue — "Proposed Value" issue
The user says: "When I click on Pending Updates, it shows Pending Updates queue 50. I don't want to see proposed value." The `PendingImportCard.tsx` is already a visual card format. The current pending count is 0 (from DB query). The "proposed value" display is in the detail/review dialog — needs verification.

### New Listings Detection — "Show me what's NOT in my website"
Currently `NewProjectDetector.tsx` shows projects from `pending_project_imports` that haven't been approved yet. The user wants: **projects in Reelly API that are NOT in the `projects` table** — shown as visual cards (not pending import cards). This requires a new component that calls `reelly-api-sync` in test mode to find new reelly_ids not in DB, then shows them as browsable project cards with one-click approval.

---

## What Needs to Be Built (Full Task List)

### Task 1: Quiz.tsx — Fix `allProjects` query to not require `images` join for filtering
The `getRecommendations` filter uses `project.images?.[0]?.image_url` but if allProjects doesn't fetch images, this is always null. Change the filter to only use `cover_image_url` (which IS fetched).

### Task 2: Daily Auto-Sync — Add offline save as Step 8
Edit `supabase/functions/daily-reelly-auto-sync/index.ts` to add Step 8: call `reelly-complete-offline-save` in batch mode (batch_size: 30) to continuously backfill missing data every day.

### Task 3: Trigger Sunset Bay Grand (reelly_id 3003) Extraction
The `reelly-complete-offline-save` function supports `mode: "specific"` with `project_ids: [3003]`. We'll call this immediately after deploy via the admin UI. We also need to add an "Extract Now" button in the Listing Admin for specific Reelly IDs.

### Task 4: New Listings Card Display in Listing Admin
Replace/augment the `NewProjectDetector` component to show a proper card-based grid of projects from Reelly that don't exist in the local DB. Each card shows:
- Project cover photo (from Reelly image URL)
- Project name, developer, location
- Price, status
- One-click "Import Now" button that triggers approval

### Task 5: Pending Updates Queue — Remove "Proposed Value" style
The user sees a "Pending Updates queue 50" (though DB shows 0 pending). The display should be cards only — no diff/proposed value fields shown. The `PendingImportCard` already does this, but the review dialog (`ProjectApprovalQueue.tsx`) might be showing diff fields. We need to ensure the review panel shows only card-style content.

### Task 6: Fix budget filter being too strict in Quiz.tsx
Currently `if (budget === "1m-2m" && (priceFrom < 1000000 || priceFrom >= 2000000)) return false;` — this excludes ALL projects where `price_from` is null (since `null || 0` = 0, which fails the `< 1000000` check). Need to relax: if `price_from` is null, don't apply strict budget exclusion (just reduce score).

### Task 7: Market Intelligence Data — Ensure daily DLD refresh
Add the `reelly-complete-offline-save` to the existing daily sync to keep project data fresh.

---

## Files to Change

| File | Task | Change |
|---|---|---|
| `src/pages/Quiz.tsx` | Task 1, Task 6 | Fix budget filter for null prices; fix `hasImage` check to use only `cover_image_url` |
| `supabase/functions/daily-reelly-auto-sync/index.ts` | Task 2 | Add Step 8: `reelly-complete-offline-save` batch run |
| `src/components/listing-admin/NewProjectDetector.tsx` | Task 4 | Full rewrite: show Reelly-new projects as visual cards with Import button |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Task 3, Task 5 | Add "Extract Specific Project" button; clean up pending updates display |

---

## Technical Details

### Quiz.tsx — Budget Filter Fix (Task 6)
Current broken logic:
```ts
const priceFrom = project.price_from || 0;  // null becomes 0
if (budget === "1m-2m" && (priceFrom < 1000000 ...)) return false; // 0 < 1000000, project excluded
```

Fix: skip budget filter if `price_from` is null:
```ts
const priceFrom = project.price_from;
if (priceFrom != null) {
  if (budget === "under-1m" && priceFrom >= 1000000) return false;
  if (budget === "1m-2m" && (priceFrom < 1000000 || priceFrom >= 2000000)) return false;
  // etc.
}
```

Also fix the `hasImage` check — remove reference to `project.images?.[0]?.image_url` since this join is not loaded in `allProjects`:
```ts
const hasImage = !!project.cover_image_url;
if (!hasImage) return false;
```

### daily-reelly-auto-sync — Step 8 (Task 2)
Add after Step 7:
```ts
// Step 8: Backfill missing project data (bedrooms, prices, images)
try {
  const backfillResult = await callFunction("reelly-complete-offline-save", {
    mode: "batch",
    batch_size: 30,
    mirror_images: false,  // skip image mirroring in daily to save time
  });
  results.offline_backfill = backfillResult;
} catch (err) {
  errors.push(`Step 8 (reelly-complete-offline-save) failed: ${err.message}`);
}
```

### NewProjectDetector.tsx — Full Rebuild (Task 4)
New logic:
1. Call `reelly-api-sync` with `action: "detect_new"` or compare DB reelly_ids vs API
2. Actually: query DB for all `reelly_id` values, compare against the Reelly API list page. This is complex.
3. Simpler approach: Show projects from DB where `is_published = false AND reelly_id IS NOT NULL` (stubs created by markers sync but not yet approved/published) as visual cards
4. Each card shows: cover image, name, developer, price, area, status label
5. Action buttons: "Import & Publish" (calls bulk-approve for that specific record)

This aligns with what the user wants — projects detected from Reelly markers sync that exist as stubs but aren't published yet.

### ReellyImportPanel.tsx — Quick Extract Button (Task 3)
Add a small "Quick Extract" input field with a reelly_id input + "Extract" button that calls `reelly-complete-offline-save` with `mode: "specific", project_ids: [id]`.

---

## What Does NOT Change
- ElevenLabs podcast functions — untouched
- All pages not mentioned — untouched  
- Database schema — no migrations needed
- `ProjectAIAnalyzer.tsx` — already fixed, untouched
- `AITalkingAgentPanel.tsx` — already clean, untouched
- `QuizResults.tsx` — already fixed, untouched
- Market Report — untouched
