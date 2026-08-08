# Complete Developer Identity and Cover Audit

## Goal
Make every public developer surface use a readable official logo and a real developer/project master-plan image, then provide complete visual proof rather than a small sample.

## Verified current state
- The database contains **630 non-hidden developer records**.
- **171** currently have no database `logo_url`.
- **192** currently have no database `feature_image_url`.
- **254** are missing at least one of those two assets.
- Logo workflow status currently includes **236 missing**, **194 unavailable**, **198 approved**, and **2 pending review** records.
- The directory renders 24 cards per page and applies client-side brand deduplication, so the final public page count must be measured from the rendered directory rather than inferred from the raw 630 rows.
- The present curated flagship-media registry covers only a small number of brands; developer detail pages otherwise use project cover/card/gallery media.

## Implementation

### 1. Build the authoritative public inventory
- Export the exact deduplicated developer set shown by `/developers`, including route slug, logo source, cover source, project count, and asset status.
- Treat every blank emerald logo plate, typed/initial identity, failed image, non-development image, and duplicate brand as a blocking failure.
- Keep all owner-uploaded project photos, documents, and details immutable; recovery may fill missing developer-level assets but must never overwrite owner-selected project media.

### 2. Resolve every logo and cover
- Preserve already approved official assets that pass visual checks.
- For missing or broken identities, source the official logo from the developer’s own website or approved existing project data; store a stable copy and record its source.
- For missing covers, use a real master development, community, or published project image belonging to that developer. Reject logos, people, offices, phones, generic stock imagery, placeholders, and synthetic fallback art.
- Normalize logo artwork for the existing emerald plate without redrawing, cropping, typing, or fabricating a brand mark.
- Keep records out of the public directory until both required assets pass verification rather than displaying an empty or fake fallback.

### 3. Enforce one global rendering standard
- Route all developer identities through the canonical `DeveloperLogo` component on the directory, homepage/recommendations, developer detail, and project detail developer section.
- Use semantic plate sizes for full cards, compact recommendations, and detail identities while preserving the same internal safe area, `object-contain`, centering, white knockout, and emerald gradient.
- Keep consistent spacing between the plate, project/developer title, stats, description, and CTA.
- Remove any remaining raw developer-logo image rendering and any text/initial fallback path.
- Make failed logo or cover loads explicit audit failures; never silently replace them with fake content.

### 4. Add automated asset validation
- Validate every logo and cover URL for successful response, image MIME type, non-zero dimensions, and sane aspect ratio.
- In the rendered browser, require every visible card logo and cover to load with non-zero dimensions and no unresolved identity marker.
- Add regression coverage for clipping-safe containment, consistent plate dimensions, no typed fallback, no white slab, and no raw logo rendering outside the shared component.

### 5. Exhaustive visual proof
- Bypass the welcome gate only inside the audit script; do not alter the user-facing gate behavior.
- Capture every rendered `/developers` directory page at desktop width after all images finish decoding.
- Capture every public developer detail route, including its hero cover and identity section; split proof into numbered contact sheets so every developer remains readable.
- Capture the other applicable public surfaces—homepage/recommendations and project-detail developer modules—to prove the same global component is used.
- Produce a downloadable audit manifest listing every rendered developer, route, source URLs, response/dimension checks, directory screenshot/page, detail screenshot, and final pass/fail status.
- Deliver proof only when the manifest has **zero unresolved logos, zero missing/broken covers, zero typed fallbacks, and zero clipping failures**. Any unresolved record remains a blocker and is reported instead of being presented as successful proof.

## Technical details
- Asset discovery will use the existing developer website fields and approved recovery functions, with official-site provenance recorded in the database.
- Screenshot automation will wait on query completion and `HTMLImageElement.decode()` before capture, then inspect image geometry and the app’s developer-logo data markers.
- Directory totals, page totals, and detail-route totals will be generated from the final rendered inventory so the proof count matches exactly what users can access.
- Final artifacts will include the machine-readable audit report plus paginated visual contact sheets for practical review.