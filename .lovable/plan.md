

# Full Area Image Audit and Generation

## Current State
- **31 areas** have AI-generated images (stored in project storage -- these are clean)
- **155 areas** are still missing images and showing the champagne gradient fallback

## Plan

### Step 1: Improve the AI image generation prompt
The current prompt is generic. Upgrade it to produce higher-quality, more distinctive aerial community views:

**Current prompt:**
> "Professional aerial panoramic photograph of {name}, Dubai, UAE. Modern urban landscape showing buildings, roads, and community layout..."

**New prompt:**
> "Ultra-realistic drone aerial photograph of {name} community in Dubai, UAE. Bird's-eye view showing the full master-planned community layout with residential towers, villas, landscaped parks, swimming pools, roads, and surrounding desert or waterfront. Golden hour lighting, crystal clear sky, cinematic composition, 8K resolution, real estate marketing photography, no text or watermarks, no logos."

This produces more unique, community-specific views with better lighting and composition.

### Step 2: Run generation in large batches
Call `generate-area-images` repeatedly with `batch_size: 10` to cover all 155 missing areas. The function:
- Uses Gemini 3 Pro Image Preview (highest quality)
- Uploads each image to the `area-images` storage bucket
- Updates both `image_url` and `hero_image_url` in the database
- Includes a 3-second delay between generations to avoid rate limits

We will trigger multiple rounds until all areas are covered.

### Step 3: Verify completion
Query the database to confirm all 186 active areas have images.

---

## Technical Details

### Edge function change (`generate-area-images/index.ts`, line 57)
Update the prompt string to the improved version above for more distinctive, high-quality aerial views.

### Execution
Trigger the function in batches of 10, running multiple rounds. Each batch takes ~30-40 seconds (3s delay per area + generation time). Full coverage of 155 areas will require ~15-16 rounds.

### No UI changes needed
The area cards and detail pages already display `image_url` / `hero_image_url` correctly. Once the database is populated, images will appear automatically on both the listing cards and the detail hero sections.

