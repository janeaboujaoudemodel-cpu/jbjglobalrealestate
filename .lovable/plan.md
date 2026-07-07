## Priority fix plan

### Phase 1 — Correct the items that were marked done but are visibly not done
1. **Payment plan timeline**
   - Make the visible strap/summary explicitly show: `Post-Handover (36 months) · Due by 2031-12-01` for Amra.
   - Keep handover as `2028-12-01`, but treat the final 30% as post-handover payable until `2031-12-01`.
   - Fix both the premium summary cards and the visual timeline labels so no final 30% label reads like it is due on handover.

2. **Brochure card branding**
   - Restore the JBJ monogram + company wordmark on the brochure cover.
   - Keep no circle/border frame around the monogram.
   - Enlarge the branding area so it is visible above the Amra title panel.

3. **Generate Presentation card branding**
   - Increase the JBJ monogram to roughly 200% of the current size.
   - Add/support the company wordmark where it reads clearly on the emerald card.

4. **Document viewer root bug**
   - Replace the slow “render every PDF page immediately” behavior with a faster viewer strategy:
     - open the modal instantly,
     - load/render the first pages first,
     - progressively render the rest only after the viewer is open,
     - cancel PDF loading/rendering when the modal closes.
   - Keep all project documents expanded by default, owner documents collapsed by default.
   - Ensure all document previews are scrollable and close quickly.

5. **Document thumbnails and labels**
   - Use project/fact-sheet cover imagery where available instead of unrelated bathroom/toilet thumbnails.
   - Fix catalogue labels like `SPA Draft` so brochure/catalogue documents display as `Brochure` where appropriate.
   - Reduce/center small card labels so they do not crop.

6. **Fact sheet and City Buddy visuals**
   - Add the project photo/master-plan photo to the Amra fact-sheet area.
   - Add the City Buddy robot photo as a wide visual, plus a concise descriptive card explaining the concierge service.

7. **Developer Landscape correction**
   - Make Developer Landscape about City Developers only: who they are, what they built, and their profile.
   - Remove Sobha/other-developer promotion from this section.
   - Move Sobha Siniyah, Sobha Town / Umm Al Quwain, Aria by DR, Marjan/casino/Siniyah references into the map/other-options context, not the City Developers profile.

### Phase 2 — Media, amenities, standards, location content
8. **Uploaded videos gallery**
   - Surface uploaded video documents/media after the photo gallery, not only the single `video_url` field.

9. **Amenities extraction and Amra amenity highlights**
   - Extract/normalize amenities from brochure/fact-sheet content into the amenities grid with photo/title cards.
   - Explicitly surface helipad / air-taxi landing and 165+ amenities.
   - Add standards: `fully furnished`, `fully serviced`, `full sea view`.

10. **Fact-sheet distances and location USPs**
   - Extract/clean distances such as airport, Downtown, casino/Marjan, Siniyah Island into location USP cards.

### Phase 3 — Map bug batch
11. **Nearby map tabs**
   - Fix cropped tab buttons and disabled/not-allowed cursor behavior when a tab has data.

12. **Map interaction/layout**
   - Fix split/gray expanded map behavior.
   - Keep smooth page scroll with click/drag map interaction.
   - Fix `Open in Google Maps` wrapping/stacking at responsive widths.
   - Fix `Here` marker contrast and remove unwanted marker navigation arrow.

13. **Two-view Project Location**
   - Add Close View and Far View modes.
   - Far View should show wider Umm Al Quwain context with Siniyah Island, Marjan Island, casino/major attractions highlighted.

### Phase 4 — Data integrity and investment modules
14. **Who is buying here**
   - Remove fake project-specific UAE-wide DLD nationality claims.
   - Only show Amra/area-specific data if present; otherwise clearly avoid the project-specific claim.

15. **Phase 1 / Phase 2 payment support**
   - Add structured support for multiple payment phases, selector UI, and split timeline rendering.

16. **Other projects rebuild**
   - Replace the empty/dark box with real three-tab cards.

17. **Price/sqft value-justification module**
   - Compare Amra against relevant same-emirate/area alternatives with clear “why better / why cheaper” reasoning.

18. **Airbnb / property-management facts**
   - Surface Airbnb/PM facts where available and avoid unsupported claims where data is missing.

### Phase 5 — Automation and generation backlog
19. **Developer profile PDF upload pipeline**
   - Company profile PDF upload → AI extraction → editable paragraph → populate developer page.

20. **Reelly-style presentation generator**
   - Build a real PDF generation/export path, not only a UI placeholder.

21. **Auto-flip handover status**
   - Add backend scheduled logic to flip ready/off-plan based on handover date.

22. **Cross-project stale-stat sweep**
   - Audit stale values across project cards/details and fix mismatches.

23. **Amra promotion pop-up**
   - Add promotion pop-up behavior for anonymous and logged-in users with appropriate frequency controls.

## Validation plan
- For every phase, run a visual Playwright check on the Amra project page.
- Capture screenshots for the exact sections changed: payment strap/timeline, brochure card, presentation card, document modal open/scroll/close, fact sheet, City Buddy, Developer Landscape, media gallery, amenities, maps, and comparison modules.
- Only mark a task completed after the screenshot/DOM proof confirms the user-visible behavior.