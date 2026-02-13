
# Fix All Area Images -- Full Audit and Repair

## Current State Audit

### GOOD images (13 areas) -- AI-generated, stored in project storage, keep as-is:
- Downtown Dubai, Dubai South, Majan, Damac Hills, Dubai International City, Al Saadiyat Island, Dubai Creek Harbour, Jebel Ali Freezone, Town Square, Maritime City, Siniya Island, Emaar South, Azizi Riviera at Meydan One

### BAD images (16 areas) -- must be NULLed immediately:
| Area | Problem |
|------|---------|
| Business Bay | dreamstime.com watermarked stock |
| Dubai Islands | dreamstime.com -- shows Burj Al Arab beach, wrong area |
| Al Marjan Island | dreamstime.com watermarked stock |
| Dubai Hills | dreamstime.com watermarked stock |
| Jebel Ali Village | dreamstime.com watermarked stock |
| Palm Jumeirah | ftcdn.net stock photo |
| Al Furjan | ftcdn.net -- SAME photo as Palm Jumeirah |
| Abu Dhabi | istockphoto.com watermarked |
| Yas Island | istockphoto.com watermarked |
| Meydan (Nad Al Sheba 1) | propjunction.ae loader.webp -- not even a photo |
| Dubai Production City | goyzer.com random interior photo |
| Dubailand Residence Complex | tanamiproperties.com project thumbnail |
| JVT | tanamiproperties.com project thumbnail |
| Arjan | homevy.com blog photo |
| JVC | cdn.prod.website-files.com blog image |
| Damac Hills 2 | 1newhomes.ae single project render |

### MISSING images (~100+ areas) -- need generation

## Plan

### Step 1: NULL all 16 bad images
Run a single SQL update to clear the watermarked/stock/wrong images from the 16 areas listed above.

### Step 2: Expand the blocked domains list
Update `enrich-area-images` to permanently block these additional stock photo domains so they never get pulled again:
- dreamstime.com
- ftcdn.net
- istockphoto.com
- goyzer.com
- propjunction.ae
- tanamiproperties.com
- 1newhomes.ae
- homevy.com
- cdn.prod.website-files.com

### Step 3: Generate AI images for ALL areas missing photos
Use the existing `generate-area-images` backend function (which uses Gemini to create aerial panoramic views and stores them in project storage). Run it in large batches to cover all ~116 areas that are missing images. This produces high-quality, watermark-free, community-appropriate aerial views stored in our own storage.

### Step 4: Verify results
After generation completes, verify the database to confirm coverage.

---

## Technical Details

### Database cleanup (Step 1)
```sql
UPDATE areas 
SET image_url = NULL, hero_image_url = NULL, updated_at = now()
WHERE image_url LIKE '%dreamstime.com%'
   OR image_url LIKE '%ftcdn.net%'
   OR image_url LIKE '%istockphoto.com%'
   OR image_url LIKE '%goyzer.com%'
   OR image_url LIKE '%propjunction.ae%'
   OR image_url LIKE '%tanamiproperties.com%'
   OR image_url LIKE '%1newhomes.ae%'
   OR image_url LIKE '%homevy.com%'
   OR image_url LIKE '%cdn.prod.website-files.com%';
```

### Edge function update (`enrich-area-images/index.ts`)
Add 9 new domains to the `BLOCKED_DOMAINS` array to prevent future contamination.

### Image generation
Call `generate-area-images` with `{ "process_all": true }` to process all ~116 areas with NULL images. Each area gets a unique AI-generated aerial panoramic view uploaded to project storage (`area-images` bucket).

### No UI changes needed
The current fallback (champagne gradient with subtle monogram) will display for any areas still awaiting generation, which is acceptable as a temporary state while images are being created.
