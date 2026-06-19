## Ordered task list recovered from the earlier prompt

1. **Project gallery duplicate photos**
   - Remove duplicate project photos globally on project pages.
   - If the same image exists as low-quality/zoomed/cropped and high-quality/full version, keep only the high-quality/full version.
   - Ensure this works for every project, not only the currently viewed one.

2. **`+14` / `+N` gallery experience**
   - Clicking `+N` must open a single full-screen gallery, not a small cropped black dialog.
   - Gallery must show photos fully with `object-contain`, not cropped.
   - The background project carousel must not change when opening or navigating the full-screen gallery.
   - Only the front/full-screen image changes.
   - Controls must have correct contrast at rest and hover.
   - Mobile/tablet friendly: large tap targets, swipe left/right, keyboard arrows, and two-finger/trackpad scroll advances faster through photos.

3. **Developer “More projects” section**
   - Verify why it is not visible in preview.
   - Fix rendering/wiring/query conditions so it appears when the project has same-developer inventory.
   - Keep inline expansion on the same page.
   - Include filters: Area, Price, Handover, Status, Property type.
   - Do not navigate away when pressing “View more”; it expands inline.

4. **Nearby projects map**
   - Verify map shows the selected project plus surrounding/related projects.
   - Current project = red pin.
   - Other projects = clearly distinct pins.
   - Include filters: All / Same developer / Same area.
   - Validate marker popup and click-through behavior.

5. **Brochure and document readability**
   - Re-check the project brochure wordmark/project name and document labels visually.
   - Fix any remaining low-contrast text or unreadable labels.

6. **Mortgage calculator parity**
   - Verify the new advanced mortgage panel is actually visible in the project page mortgage section.
   - Confirm residency/LTV, affordability/DBR, fees, bank comparison, and amortization work.
   - Fix any broken contrast or mobile layout problems.

7. **Dubai Market Intelligence upgrade**
   - Upgrade the existing `DLDMarketWidget` premium styling:
     - Cash vs Mortgage in black/gold without unreadable gold fills.
     - Fix broken-looking row highlight bars in Top 10 Areas / Top 10 Buyers.
     - Improve “Notice something incorrect?” and Expert Consultation areas if present on the page/component.
     - Make yearly volume and daily transaction data more visible.
   - Check whether the daily-update pipeline already exists; if it does not, plan the backend update separately with proper database grants/RLS.

8. **Behavior-driven recommendations**
   - Unify recommendation logic so recommendations follow user behavior:
     - Developer searches/views → same developer projects.
     - Area searches/views → same area projects.
     - Price searches → nearby price band.
   - Apply the same ranking to recommended projects, homepage handpicked projects, and the recommendation popup where applicable.
   - Keep popup behavior from memory: minimize to chip, hide for session, re-open from header.

## Implementation plan

### Phase 1 — Fix the currently broken gallery first
- Update `src/components/ImageCarousel.tsx` so it uses separate state for:
  - page carousel image index
  - full-screen gallery image index
- Rebuild the fullscreen dialog as a true viewport overlay:
  - `100dvw × 100dvh`
  - no small centered modal sizing
  - image `object-contain`
  - fixed top control bar and bottom thumbnail filmstrip
  - no background carousel updates while fullscreen is open
- Add proper controls:
  - close
  - previous/next
  - counter
  - download current image
  - swipe gestures
  - arrow keys
  - wheel/trackpad acceleration
- Strengthen gallery de-duplication:
  - normalize CDN transforms/query strings
  - prefer original/highest-resolution URLs
  - remove small/thumb/preview variants
  - add fallback fingerprinting by normalized filename/path tokens so zoomed low-res duplicates collapse even when URLs differ slightly

### Phase 2 — Fix developer “More projects” visibility
- Audit the query and project data passed from `ProjectDetailLayout`.
- Make the section resilient when `developer.id` is missing but `developer_name` exists.
- Query by `developer_id` first, then fallback to `developer_name`.
- Keep inline expansion and filters visible when enough results exist.
- Add an empty/debug-safe state only for owner/admin if needed; public users should see a clean section or no section.

### Phase 3 — Validate and repair claimed prior work
- Nearby map: verify render, data results, filters, pins, popups, and mobile height.
- Mortgage panel: verify it appears in both compact/full usage and remains readable.
- Brochure/document labels: visually inspect and patch remaining contrast issues.

### Phase 4 — Complete remaining old tasks
- Upgrade `DLDMarketWidget` UI where it exists now.
- Create or adjust the daily-update backend only after confirming existing tables/functions; any new public table migration will include required `GRANT`s and RLS policies.
- Consolidate recommendation ranking into a shared helper/hook so homepage, project recommendations, and popup use the same behavior signals.

## Validation gates and proof I will provide

After each phase, I will validate before saying it is complete:

1. **Gallery proof**
   - Desktop screenshot of full-screen gallery after clicking `+N`.
   - Mobile screenshot of full-screen gallery.
   - Screenshot or extracted count showing duplicate low-quality photo removed.
   - Confirm background image does not change while navigating fullscreen.

2. **Developer section proof**
   - Desktop screenshot showing “More projects by {Developer}”.
   - Screenshot after clicking “View more” showing inline expansion and filters.
   - Mobile screenshot showing the section remains usable.

3. **Map proof**
   - Screenshot showing red current-project pin and other project pins.
   - Screenshot with Same developer / Same area filter selected.

4. **Mortgage proof**
   - Screenshot of advanced mortgage panel on desktop.
   - Mobile screenshot showing controls and values fit.

5. **Market Intelligence proof**
   - Screenshot of upgraded cash/mortgage and Top 10 areas/buyers sections.
   - Confirmation whether daily update is already wired or needs backend migration.

6. **Recommendations proof**
   - Demonstrate area/developer/price behavior by navigating/searching and showing the resulting recommended projects/popup.

## Important working rule

I will not write “shipped”, “fixed”, or “complete” for any item until it has been visually validated in the preview with screenshots on desktop and mobile/tablet where relevant.