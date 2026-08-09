# Complete Developer Logo and Cover Repair

## Verified current state

- The live directory source contains **630 visible developer records**.
- **171 developers** have neither `logo_url` nor `logo_url_processed` stored.
- **192 developers** have neither a stored `feature_image_url` nor project card media linked by developer ID.
- A fresh browser capture of page one rendered 24 cards, but **11 logo plates were unresolved** and several remote covers did not load, including Wellington, Majid Al Futtaim, Abou Eid, and AHS.
- The highlighted major-brand covers for Emaar, Omniyat, Nakheel, Meraas, Samana, and Sankari do exist in the current data or curated registry; the remaining work is to make those assets stable and locally served rather than relying on fragile remote hotlinks.
- `DeveloperLogo` deliberately renders an empty emerald plate when artwork is missing, rejected, or fails to load. The current artwork guard also rejects any raster that is more than 90% opaque, even when it contains a legitimate logo on a removable background. This accounts for empty plates and does not actually produce the required verified white artwork.
- The current resolver is fragmented across verified-logo, known-logo, override, database, and website-fallback paths. Only a small curated subset has preprocessed transparent white assets.

## Goal

Every public developer card must show:

1. The developer's verified official logo, converted to a transparent pure-white knockout without cropping, distortion, colored boxes, or typed/initial substitutes.
2. A stable real photograph or architectural render of that developer's project or master community.
3. The same emerald ombre plate, safe area, and visually balanced logo size on every card.

No card will be presented as complete until both assets pass automated checks and visual review.

## Implementation

### 1. Produce the authoritative 630-developer worklist

- Export every visible developer with immutable ID, name, aliases, website, logo fields, feature image, linked project covers, and current rendered source.
- Classify each logo as verified, missing, broken, wrong-brand, opaque slab, colored background, or cropped.
- Classify each cover as verified, missing, broken, blocked hotlink, non-property artwork, or too small.
- Include every card, not only the annotated examples, and prioritize the highlighted failures first.

### 2. Repair every official logo as a real asset

- Source each missing or defective mark from the developer's official website or an already verified canonical source.
- Preserve the exact official geometry; recolor only the logo ink to pure white and remove the background.
- Measure transparent bounds and add safe canvas padding so first and last letters can never be cropped.
- Reject favicons, project photos, screenshots, generic icons, another developer's mark, and typed initials.
- Store approved binary artwork through the project asset CDN and register it in one ID-first manifest with source and verification metadata.
- Cover all 171 currently missing database-logo records and reprocess every existing opaque/colored failure, including the highlighted A&H, Al Habtoor, Al Marina, Alhambra, Barco, DAMAC, Meraas, Nakheel, Omniyat, Wellington, and Majid Al Futtaim cards.

### 3. Repair every project/master-plan cover

- Prefer the developer's real linked project cover when valid; otherwise source an official flagship/master-community hero from the developer's own site.
- Download and serve approved covers from the project asset CDN so CORS, anti-hotlinking, expiring URLs, and slow third-party hosts cannot leave blank cards.
- Validate HTTP response, image bytes, dimensions, aspect ratio, and subject before acceptance.
- Never alter, replace, reorder, or delete owner-uploaded project covers, gallery media, details, or documents. Developer-card cover enrichment remains separate.
- Resolve all 192 records currently lacking stored developer/project card media, or mark a record as genuinely unsourceable with evidence rather than inventing an image.

### 4. Replace the fragmented runtime pipeline

- Resolve approved logo and cover assets by developer ID first, then verified aliases for duplicate legal/trading names.
- Make approved local/CDN assets outrank remote database hotlinks.
- Remove empty-plate-as-success behavior: an unresolved asset remains an explicit audit failure and cannot silently pass the public quality gate.
- Keep one canonical `DeveloperLogo` renderer with fixed semantic card dimensions, `object-contain`, measured safe-area scaling, emerald three-stop ombre, and pure-white artwork.
- Reveal image and plate atomically after decoding, without delaying or hiding valid cross-origin artwork.

### 5. Add hard regression checks

- Inventory test: every public developer ID resolves to an approved logo and approved cover, or appears in an explicit unsourceable report.
- Logo tests: transparent background, nonblank ink, pure-white output, safe bounds, correct brand mapping, minimum dimensions, and no opaque slab.
- Cover tests: valid image bytes, minimum dimensions, property/master-community subject, stable asset URL, and no logo/placeholder artwork.
- Runtime test: no unresolved plate, broken image, zero-size image, wrong source, or plate without visible artwork.

### 6. Validate all pages visually

- Capture every pagination page on desktop and mobile after waiting for image decode.
- Generate contact sheets covering all 630 cards and run automated detection for empty logo plates, white blocks, colored boxes, clipped ink, missing covers, and inconsistent visible logo size.
- Manually inspect every flagged card, correct it, and rerun the complete audit until the failing set is empty or explicitly documented as unsourceable.
- Deliver the final audit table with developer name, logo source, cover source, rendered dimensions, status, and screenshot reference.

## Guardrails

- No owner-uploaded project content is modified.
- No AI-generated or generic substitute imagery.
- No typed names, initials, building icons, or favicon fallbacks in logo plates.
- No card is hidden merely to make the audit pass.
- Official logos may be painted white and padded, but never redrawn, stretched, or cropped.
- Screenshot proof covers every directory page, not a four-page sample.

## Technical scope

- Developer asset inventory and verified manifests.
- Canonical logo and cover resolvers/renderers.
- CDN asset pointers for processed logos and stable covers.
- Developer directory quality gate and regression tests.
- Full desktop/mobile Playwright audit and final evidence report.