

## Plan: Navigation/Chat Positioning, Stamp SVG Fixes, Mobile Menu Completeness

### Issue Summary

1. **PageNavigation arrows** hidden behind sidebar — need to reposition to right side, above chat button, visible only when chat is closed
2. **Both PageNavigation and Chat button** need drag-to-move with edge clamping (cannot exit viewport)
3. **Stamp SVG** still showing company name twice in English on top — Arabic must be on top, English on bottom, never duplicated
4. **Stamp wizard** should ask bilingual/language choice FIRST before anything else; add trade license toggle alongside location toggle
5. **Mobile hamburger** missing ~90% of AI tools — the `mobileToolkitLinks` array only has 9 items vs the full toolkit
6. **Mobile hamburger** has duplicate Sign Out (line 992 and line 1045) and monogram at bottom (line 1061-1067) — remove duplicates, remove monogram
7. **PageNavigation** currently at `left-4` which overlaps with sidebar on desktop

---

### Implementation

#### 1. PageNavigation — Reposition & Chat-Aware Visibility

**File: `src/components/PageNavigation.tsx`**
- Move from `left-4` to `right-6` (same side as chat)
- Position at `bottom-36` (above the chat button at `bottom-20`)
- Accept a new prop `isChatOpen: boolean` — hide arrows when chat is open
- Add drag-to-move (same pointer capture pattern as `CollapsedChatButton`)
- Clamp drag offset so the button cannot exit the viewport edges (check against `window.innerWidth/innerHeight` on pointer up)

**File: `src/components/MainLayout.tsx`**
- Pass `isChatOpen={!effectiveCollapsed}` to `PageNavigation`

#### 2. CollapsedChatButton — Edge Clamping on Drag

**File: `src/components/chat/CollapsedChatButton.tsx`**
- In `onPointerUp`, after calculating final `dragOffset`, clamp to ensure the button stays within viewport bounds (20px margin from edges)
- Already has drag — just add the edge clamping logic

#### 3. Stamp SVG — Fix Duplicate English / Arabic Rendering

**File: `src/lib/stampOfficialTemplate.ts`**

Current code (line 201-204):
```
const topText = config.companyNameAr;
const bottomText = config.companyNameEn.toUpperCase();
const topIsArabic = true;
const bottomIsArabic = false;
```

This looks correct — Arabic on top, English on bottom. The bug is likely in the edge function's `buildSVG` or the `LiveStampPreview` component which may be rendering differently.

**File: `src/components/stamp-generator/LiveStampPreview.tsx`**
- Audit the rendering logic — ensure it respects `languageReversed` correctly and doesn't duplicate the English text on both arcs
- When `languageMode === 'BILINGUAL'` and `languageReversed === true`: Arabic top, English bottom (default)

**File: `supabase/functions/ai-stamp-generator/index.ts`**
- Audit `bilingualCircularStamp` to ensure the same — Arabic top arc, English bottom arc, no duplication

#### 4. Stamp Wizard — Language Choice First + Trade License Toggle

**File: `src/components/stamp-generator/StampProjectWizard.tsx`**
- Move the "Language Mode" selector to appear FIRST in the Details tab, before company name fields
- Show the trade license toggle always (not just when `registration_number_optional` is filled) — label it "Show Trade License Number" with an input field that appears when toggled on
- Add "Skip extraction" option next to the trade license upload button

#### 5. Mobile Hamburger — Complete Tool List

**File: `src/components/GlobalHeader.tsx`**
- Expand `mobileToolkitLinks` to include ALL toolkit tools: Stamp Generator, Design Studio, Video Builder, Social Workshop, Document Scanner, Spreadsheet, Business Card Scanner, Executive Assistant, Property Coach, Mortgage Calculator, Property Evaluator, HR Manager, Video Meeting, etc.
- Organize into sub-categories within the Tools collapsible (Creative, Documents, Communication, AI Assistants)
- Remove duplicate Sign Out at line 1043-1049 (keep only the one at line 991-996)
- Remove the monogram image at lines 1060-1067
- End the menu content at the divider after Sign Out

#### 6. Edge Function — Redeploy with SVG audit

**File: `supabase/functions/ai-stamp-generator/index.ts`**
- Verify `bilingualCircularStamp` function renders Arabic on top arc and English on bottom arc without duplication
- Ensure `bottomArcTextChars` produces correct left-to-right English reading

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/PageNavigation.tsx` | Move to right-6, add `isChatOpen` prop, add drag-to-move with edge clamping |
| `src/components/MainLayout.tsx` | Pass `isChatOpen` to PageNavigation |
| `src/components/chat/CollapsedChatButton.tsx` | Add viewport edge clamping to drag |
| `src/lib/stampOfficialTemplate.ts` | Verify Arabic top / English bottom (already correct, audit for edge cases) |
| `src/components/stamp-generator/LiveStampPreview.tsx` | Fix duplicate English text rendering |
| `src/components/stamp-generator/StampProjectWizard.tsx` | Language mode first, always-visible trade license toggle |
| `src/components/GlobalHeader.tsx` | Complete mobile tool list, remove duplicate sign-out & monogram |
| `supabase/functions/ai-stamp-generator/index.ts` | Audit bilingual rendering |

