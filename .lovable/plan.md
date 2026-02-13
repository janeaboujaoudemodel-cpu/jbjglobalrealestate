

## Regenerate All Area Photos with Real Community Masterplan Views

### Problem
All 185 active areas currently have images, but many are single-building renders pulled from project_images (Reelly API). The user wants each area photo to represent the **full community** -- aerial masterplan views showing the entire neighborhood layout, landmarks, parks, waterfront, roads, etc. For example, Dubai Creek Harbour should show the Creek Tower plus the full waterfront development, not just one tower.

### Solution

Update the `generate-area-images` edge function with two key changes:

1. **Force regeneration mode** -- Add a `force_regenerate: true` parameter that processes areas even if they already have images (currently it skips them)
2. **Area-specific community prompts** -- Build a mapping of top areas to tailored prompts that describe their unique community characteristics (creek, palm shape, lagoons, villas, marina, etc.), so the AI generates recognizable masterplan views rather than generic tower photos

### Technical Changes

**File: `supabase/functions/generate-area-images/index.ts`**

1. Add `force_regenerate` body parameter support -- when true, query areas regardless of existing `image_url`
2. Add a `COMMUNITY_DESCRIPTIONS` map for 30+ top areas with specific visual descriptions:
   - Dubai Creek Harbour: "Creek Tower landmark, waterfront promenade, marina, mixed-use towers along Dubai Creek"
   - Palm Jumeirah: "iconic palm-shaped island, Atlantis hotel at the crescent, beachfront villas on the fronds"
   - Downtown Dubai: "Burj Khalifa, Dubai Mall, Dubai Fountain, Boulevard"
   - Business Bay: "canal-side towers, waterfront promenade, modern skyline"
   - JVC: "circular road layout, low-rise apartments, community parks"
   - Dubai Marina: "marina waterway, JBR beach, cluster of supertall towers"
   - etc. for all major areas
3. Update the prompt template to incorporate these descriptions:
   - Primary prompt: "Ultra-realistic 8K drone aerial photograph of [Area Name] community in Dubai, UAE. Bird's-eye view showing [area-specific description]. Full master-planned community layout visible. Golden hour lighting, cinematic composition, no text, no watermarks, no logos."
   - Fallback prompt (generic): Keep existing generic prompt for areas without specific descriptions
4. Upload with `upsert: true` (already in place) to overwrite existing images in storage

**No other files need changes** -- the area cards and hero sections already read `image_url` from the database, so once the function regenerates the images and updates the DB records, the new community photos will appear automatically everywhere.

### Execution Plan

After deploying the updated function:
1. Call the function with `{ "force_regenerate": true, "batch_size": 10 }` for the top 10 areas first to verify quality
2. Then run subsequent batches to cover all 185 areas
3. Each image takes ~3-5 seconds to generate (with rate limit delays), so full regeneration will happen in batches

### Area-Specific Prompt Examples

| Area | Community Description in Prompt |
|------|-------------------------------|
| Dubai Creek Harbour | Creek Tower, waterfront marina, mixed-use district along Dubai Creek |
| Palm Jumeirah | Palm-shaped island, Atlantis at crescent tip, beachfront villas on fronds |
| Downtown Dubai | Burj Khalifa centerpiece, Dubai Mall, Boulevard, fountains |
| Dubai Marina | Marina waterway, yacht club, JBR beach, supertall tower cluster |
| JVC | Circular road layout, low-rise residential blocks, community parks |
| Dubai Hills | Golf course, Dubai Hills Mall, hillside villas, green parks |
| Business Bay | Canal-side towers, waterfront promenade, modern commercial skyline |
| Al Marjan Island | Island cluster in RAK, beachfront resorts, Wynn resort landmark |
| MBR City (District One) | Crystal Lagoon, luxury villas, landscaped parkland |
| Dubai South | Expo City, Al Maktoum Airport, residential clusters |

For areas not in the map, the function will use the existing generic prompt describing a master-planned UAE community.
