## What is actually broken

- The public catalogue is showing **17 properties** because the backend publish gate currently allows only records that already pass every required field check. This protected the public site from blank cards, but it also exposed how many rows still need enrichment before they can be safely public again.
- `Al Hamra Village` has a real database photo in `card_image_url`, but the card still tries the older `cover_image_url` path in some places and can render the wrong/broken image first.
- `Burj Azizi` is linked to an `Azizi Development` row that has a logo URL, but the UI also has an override that can force Azizi into a text nameplate, causing the visible `AD` plate instead of the real logo.
- Many unpublished rows already have partial data, but they must not be bulk-published again unless they have real photos, real descriptions, price, handover, payment plan, size/unit data, and a valid developer logo.

## Plan

1. **Fix card image priority so real verified photos always win**
   - Update `ProjectCard` image resolution so `card_image_url` / `gallery_start_image_url` win before older cover URLs.
   - Keep fact sheets, flags, favicons, logos, icons, and placeholders blocked from property-photo slots.
   - Add a hard verified media override for `Al Hamra Village` and any currently published card where the stored cover is known to be weaker than the verified card photo.

2. **Fix Azizi and developer logo rendering**
   - Remove the forced text-nameplate behavior for Azizi when a valid `developers.logo_url` exists.
   - Keep the ban on fake globe/favicons and property photos as logos.
   - Keep nameplates only as a last-resort “logo pending” marker for owner/backend review, not as a replacement for available real logos.

3. **Restore catalogue quantity safely, not by bypassing quality**
   - Query draft rows in batches and classify them by exact blocker: missing photo, missing logo, missing price, missing handover, missing payment plan, missing size/unit data, or bad placeholder media.
   - Republish only rows that pass the quality gate already or can be repaired from existing trusted project data (`project_images`, `pending_project_imports`, and developer logo records).
   - Keep incomplete rows as drafts for owner approval/enrichment instead of showing blank or fake public cards.

4. **Add owner-visible diagnostics instead of guessing**
   - Add a backend/owner-facing “publish blockers” view or card state that shows exactly why a draft project is not public.
   - This lets you see whether a project needs photo, logo, price, payment plan, handover, or size before approving it.

5. **Validate visually before claiming it is fixed**
   - Use Playwright screenshots for `/properties` after the changes.
   - Verify the first visible cards show: real project photo, real developer logo, description, price, handover/status, payment plan, and white text on emerald controls.
   - Specifically screenshot `Al Hamra Village` and `Burj Azizi` if visible, or filter/search them and capture those cards.

## Technical notes

- I will not delete project records.
- I will not bulk-publish incomplete rows.
- I will not use fake logo sources, globe favicons, phone-brand icons, flags, fact sheets, or project photos as developer logos.
- Any database schema/policy change will be done through a migration; data checks can be read directly first.