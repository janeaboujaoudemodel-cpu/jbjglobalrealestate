

# UI Premium Upgrade — Corporate Suite, Property Suite, Compare, Video Suite

## Scope Assessment

This request covers 4 major areas. I will focus on the **actionable UI/UX fixes** that can be implemented now. Some requests (full video editing suite comparable to DaVinci/Lightroom, AI video generation with scene-by-scene prompts, automatic script generation from website data) are **feature-level projects** that require dedicated sessions — I will note those clearly.

---

## 1. Corporate Premium Suite (`CorporateSuite.tsx`)

**Issues identified:**
- Cards are not uniformly aligned (flex-col layout but descriptions vary in length, pushing CTAs to inconsistent positions)
- The gold accent `#B8943E` is correct champagne-gold but the star icon uses generic `Sparkles` — needs premium treatment
- Badge/CTA alignment inconsistent across cards

**Fixes:**
- Enforce `min-h` on description area so all CTAs align at the same bottom position
- Add `h-full` + `flex flex-col` + `flex-1` on description paragraph to push CTA to bottom consistently
- Ensure the accent bar, icon, badge, title, description, and CTA are all at consistent vertical positions across all 12 cards
- Rename to "Corporate Premium Suite" (already done in breadcrumb but verify title)

---

## 2. Property Intelligence Suite (`PropertySuite.tsx`)

**Issues identified:**
- Header shows gray/black tones — user wants champagne-gold premium header matching PropertyEvaluator style
- Each tool tab needs its own distinct color (already defined in `tabs` array but icons need colored backgrounds like PropertyEvaluator)
- Back link says `/toolkit` — should be `/ai-hub` per memory

**Fixes:**
- Update back link `href` from `/toolkit` to `/ai-hub`
- Add colored icon backgrounds in tab triggers (rounded icon containers with tool-specific tint)
- Each tab already has a color assigned: Finder=Purple, Evaluator=Blue, Compare=Red, Rental=Green, Mortgage=Amber — verify these render with colored icon containers in both active and inactive states
- Ensure header icon container uses champagne gradient (already does — verify border glow)

---

## 3. Compare Page (`Compare.tsx`)

**Issues identified:**
- Ratings show 5-star system + score bars — user wants scoring out of 10 for Location, Plan, Construction Quality, Amenities, Developer Quality, Handover
- Score bars exist (`renderScoreBar`) but need more categories
- Download report exists but doesn't offer merge with favorites/shortlisted
- No "share report with team" flow beyond WhatsApp/Email

**Fixes:**
- Add additional score categories: "Construction Quality", "Handover Timeline", "Payment Flexibility" alongside existing Location/Value/Amenities/Investment/Developer
- Enhance the download flow: Before download, show a modal asking "Include favorites & shortlisted properties?" with checkboxes showing which projects are in favorites vs just compared
- Add "Save Results" button that persists the comparison to DB (already has `evaluation_requests` table)
- Enhance the HTML report template to include the score bars (currently only shows stars)
- The rating cards already show score/10 — ensure all new categories are rendered symmetrically

---

## 4. Video Suite (`VideoSuite.tsx`)

**Issues identified:**
- Header not centered (already centered in code — verify rendering)
- Back link points to `/toolkit` — should be `/ai-hub`

**Fixes:**
- Update back link to `/ai-hub`
- The extensive feature requests (body/face filters, background remover, photo clips with timing, sound extraction, DaVinci-level editing, AI voice generation from project data, scene-by-scene prompts, location integration in video, chart overlays) are **NOT implementable in this session** — these are multi-sprint features requiring dedicated AI model integration, video processing pipelines, and audio extraction services

**What CAN be fixed now:**
- Back link correction
- Ensure tab styling matches the premium champagne standard consistently

---

## Files Modified

| File | Changes |
|------|---------|
| `CorporateSuite.tsx` | Fix card alignment (min-h on description, consistent CTA positioning) |
| `PropertySuite.tsx` | Fix back link to `/ai-hub`, enhance tab icon styling with colored backgrounds |
| `Compare.tsx` | Add more score categories, pre-download favorites merge modal, enhanced report HTML |
| `VideoSuite.tsx` | Fix back link to `/ai-hub` |

## NOT IMPLEMENTED (requires dedicated sessions)

1. **Full video editing suite** (DaVinci/Lightroom/Canva level) — requires dedicated multi-session build
2. **AI video generation from project data** — requires project integration pipeline + AI video model
3. **Sound extraction from video** — requires audio processing edge function
4. **AI voiceover with British accent on generated ads** — requires ElevenLabs integration (connector available but needs dedicated session)
5. **Scene-by-scene prompt control** — requires video AI model with frame-level control
6. **Background removal from video** — requires ML model integration
7. **Chart/insight overlays in video** — requires data visualization rendering pipeline
8. **Cross-tool sharing integration** — requires notification/sharing infrastructure

These are clearly stated as **NOT IMPLEMENTED** per the mandatory instruction rules.

