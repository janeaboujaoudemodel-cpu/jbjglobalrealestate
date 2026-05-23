## Diagnosis

The system was not fully reversed, but the gate is too weak and one approval path is unsafe:

- Current live-site protection only blocks listings with no photo. Listings with a photo but missing description, location, documents, floor plans, or other details can still be published.
- The bulk approval function currently defaults to publishing and allows `minImages = 0`, so incomplete imports can become live too early.
- The admin queue labels many records as pending/needs work because they are genuinely incomplete: current backend counts show pending imports still missing images, documents, descriptions, developer names, or locations.
- The single approval path inserts the project as published before attaching gallery images, which can fail or behave inconsistently unless a cover image is already set.

## Implementation plan

1. **Create one strict “ready to publish” rule**
   - Require every listing to pass before publishing:
     - valid cover or gallery image
     - developer name
     - description
     - price
     - location or area
     - core unit data where available: bedrooms, size, property type/unit types
     - brochure/document or floor plan when source provides it
   - Store the failure reasons so admin UI can show exactly why a listing is blocked.

2. **Fix auto-publish and approval behavior**
   - Change bulk approval so it no longer publishes incomplete imports.
   - It will enrich/import records, mark incomplete ones as pending verification, and only set `is_published=true` after the strict rule passes.
   - Fix the single approval path to set `cover_image_url` from the first valid image before publishing.
   - Add a final publish check after image/document insertion, not before.

3. **Repair existing live broken listings**
   - Audit currently published projects for missing description, location, documents, floor plans, developer details, and invalid/empty media.
   - Temporarily unpublish any live listing that fails the strict rule.
   - Send those listings through the repair/enrichment pipeline.
   - Republish automatically only when the listing passes the full checklist.

4. **Improve scraping/enrichment pipeline**
   - Strengthen the existing enrichment functions to fill:
     - photos/gallery
     - brochures and documents
     - floor plans
     - unit types / bedroom types / sizes
     - location and coordinates where available
     - developer attribution
     - payment plan and handover details
   - Route source-specific records correctly:
     - Reelly records through Reelly enrichment/asset recovery
     - Provident records through Provident page-data + scrape extraction
     - manual/broken records through the generic repair path

5. **Fix the admin approval UX**
   - Replace vague “Pending” labels with explicit states: Needs Photos, Needs Documents, Needs Location, Needs Details, Ready to Publish, Published.
   - Hide or disable “Approve All” unless it means “Approve all ready listings only.”
   - Add a “Fix broken listings” action that runs enrichment first, then publishes only passing records.

6. **Validate end-to-end**
   - Run backend audit counts before and after.
   - Test the enrichment functions on a small batch first.
   - Verify no published listing fails the strict checklist.
   - Verify `/properties` only loads published, complete listings and broken cards no longer appear.
   - Test admin queue counts so Pending/Needs Work/Published match the real data.