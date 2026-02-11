

## Fix Sunset Bay Grand: Data Enrichment, Duplicate Images, Brochure Location, and Form Improvements

### Issues Identified

1. **Duplicate images** -- Both images in `project_images` have the exact same URL (`f339a09c345c47ada758ccb8f6c00944.webp`). The second was added as "Cover" but is identical. Need to remove the duplicate.

2. **Missing enriched data** -- The project has minimal data from Reelly only:
   - `amenities: []` (empty)
   - `unit_types: null`
   - `payment_plan: null`
   - `payment_breakdown: null`
   - `floor_plan_types: []`
   - `highlights: null`
   - `short_description: null`
   - `usp_headline: null`, `usp_bullets: []`
   - `total_units: 27` (likely inventory, not project scale)
   - No brochure uploaded (0 documents)
   - Only 1 unique image

3. **Brochure location text** -- `PremiumBrochureCard.tsx` line 183-185 hardcodes "Dubai - UAE" instead of showing the project's area name. Should show "Dubai Islands, Dubai" (area_name then city).

4. **Register Interest form too narrow** -- Currently `max-w-xl` (~576px). Needs to be wider for a more premium feel.

5. **Nationalities and languages completeness** -- Need to verify `getCountryList()` and `getLanguageList()` cover all countries/languages comprehensively. Current implementation uses `Intl.supportedValuesOf("region")` which provides 200+ countries -- this is already comprehensive. Languages list has 100+ entries -- also comprehensive.

---

### Changes

#### 1. Remove duplicate image (Database)
- Delete the duplicate `project_images` row where `id = 'cf989546-2b91-45aa-aaab-15cc62b7d82e'` (the "Cover" copy with same URL)

#### 2. Enrich Sunset Bay Grand project data (Database)
Update the project record with enriched content extracted from the brochure and description the user previously provided:
- **amenities**: Populate with the full amenities list from the brochure (rooftop sky pool, family cabanas, open-air cinema, clubhouse, children's play zones, smart home technology, etc.)
- **short_description**: A concise 1-2 sentence summary
- **usp_headline** and **usp_bullets**: Key selling points
- **highlights**: Key project highlights array
- **property_type_label**: "Apartments"

#### 3. Fix brochure location text -- `PremiumBrochureCard.tsx`
- Accept a new `location` prop (optional string)
- Replace hardcoded "Dubai - UAE" with dynamic display: `{area_name} - Dubai` or fallback to "Dubai - UAE"
- In `ProjectDetailLayout.tsx`, pass `project.area_name` or `project.location` to the brochure card

#### 4. Widen the Register Interest form -- `ConsultationRequestForm.tsx`
- Change `max-w-xl` to `max-w-2xl` (~672px) on both the form container (line 198) and success state (line 178)
- This gives a slight stretch from the edges without making it too wide

#### 5. Verify nationality/language completeness
- `getCountryList()` already uses `Intl.supportedValuesOf("region")` which returns all 200+ UN-recognized countries with flags -- already comprehensive
- `getLanguageList()` already has 100+ languages -- already comprehensive
- No code changes needed for this item

---

### Technical Details

**Files to modify:**
- `src/components/project-detail/PremiumBrochureCard.tsx` -- Add `location` prop, replace hardcoded "Dubai - UAE"
- `src/components/project-detail/ProjectDetailLayout.tsx` -- Pass location to PremiumBrochureCard
- `src/components/ConsultationRequestForm.tsx` -- Change `max-w-xl` to `max-w-2xl` on lines 178 and 198

**Database operations (using insert/update tool):**
- DELETE duplicate image from `project_images`
- UPDATE `projects` row for Sunset Bay Grand with enriched amenities, short_description, usp_headline, usp_bullets, highlights, property_type_label

