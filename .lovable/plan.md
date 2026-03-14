

## Citi Developers Data Extraction & Staged Approval Plan

### What Was Discovered

**Developer: Citi Developers** — 18 projects, 3 countries, 350K+ homes, 500K+ customers, 1,000M+ sq ft developed. Logo: `https://citideveloper.com/images/logo/amra-logo.svg` (AMRA brand logo) and Citi logo at `https://citideveloper.com/_next/image?url=%2Fimages%2Flogo%2Fciti-logo.svg`.

**4 Projects Found (3 accessible, 1 returned 404):**

1. **ARYA Residences** — Dubai Islands, Neo luxury apartments
   - Config: Ground + 2 Podiums + 10 Residential Floors + Roof
   - Units: Studio, 1BR, 2BR, 3BR, 4BR Duplex, 5BR Penthouse
   - Starting: AED 1.9M, Payment: 60/40
   - 14 project-specific images, 13 amenity images (lobby, cigar lounge, roman bath, spa, hammams, sauna, lap pool, fitness, game room, cinema, infinity pool, cabanas, sunken pool bar)
   - Amenities: The Galore (Ground), The Under Canvas (Mezzanine), The Forte (First Floor), The Eleventh Sky (Rooftop)
   - Premium: IoT-enabled, Personal Robot, Fully Furnished, Sky Pools, Miele Appliances, Villeroy & Boch
   - Proximity: 1min Marina, 2min Beach, 3min Retail Boulevard, 10min Airport, 15min Downtown

2. **AGUA Residences** — Dubai Islands, Island luxury apartments
   - Config: Ground + 2 Podiums + 8 Residential Floors + Roof
   - Units: 1BR, 2BR, 2BR Duplex, 3BR, 4BR — Total 122 apartments
   - Starting: AED 1.75M, Payment: 10% Booking / 14% Down / 1% Monthly / 50% Handover
   - 10 project images, 10 amenity images (lobby, business center, cigar lounge, roman bath, spa, lap pool, yoga, fitness, infinity deck, floating loungers, cabanas)
   - Amenities: The Base (Ground), The One (Level 1), Cloud 9 (Rooftop)
   - Premium: IoT-enabled, Personal Robot, Fully Furnished, Sky Pools, SMEG Appliances, Villeroy & Boch, Park Facing
   - Proximity: 2min Mall, 5min Marina, 5min Beach, 10min Airport

3. **AVELINE Residences** — JVC (Jumeirah Village Circle)
   - Config: Ground + 3 Podiums + 17 Residential Floors + Roof
   - Units: Studio, 1BR, 2BR, 3BR — Total 263 apartments
   - Starting: AED 595,000, Handover Q2 2026
   - 8 project images, 10 amenity images (lobby, beach pool, cinema, gym, game room, spa, yoga, padel court, lap pool)
   - Amenities: Ground Floor, 11th Floor, 13th Floor
   - Proximity: 2min Circle Mall, 9min Dubai Hills Mall, 10min Sufouh Beach, 15min Mall of Emirates, 15min Dubai Marina, 25min Downtown

4. **ALLURA** — 404 (page not found, no data available)

5. **AMRA Integrative Wellness Resort** — Umm Al Quwain, Blue Carbon Zone
   - World's first integrative wellness resort
   - Units: Studio, 1BR, 2BR, 3BR, 4BR — Fully serviced & furnished
   - 50+ images extracted (10 per bedroom type + amenity zones)
   - 7 Pillars of Wellness philosophy
   - 11 Resort Experience zones: First Light, The Gathering, New Moon, Celestial Cycle, Full Moon, Sunrise, Sunset, Crescent Garden, Horizon, Solar Flare, Lunar Living
   - Features: Sea View, Private Balcony, SMEG Appliances, IoT-enabled, Personal Robot, Complete Operational Support
   - Location: Blue Carbon Zone, Mangrove access, Yacht Clubs, Marinas

---

### Implementation Approach

The existing `pending_project_imports` table and `ProjectApprovalQueue` workflow will be used. Projects will be inserted as **pending** imports so you can review, approve, or reject each one individually. Similarly, developer data will go to `pending_developer_imports`.

### Step 1 — Create Edge Function: `extract-citi-developer`

A new edge function that inserts the scraped data into the existing approval pipeline:

**Developer record** → `pending_developer_imports` table:
- Name: "Citi Developers"
- Description: From the homepage "about" text
- Logo URL from their website
- Status: `pending` (awaits your approval)

**4 Project records** → `pending_project_imports` table (one per project):
- Each with its own images array (only photos from THAT project's page)
- Each with its own amenities list and amenity images
- Each with description, payment plan, unit types, location data, proximity distances
- All with `source: 'manual'`, `source_url` pointing to the Citi Developer page
- All with `status: 'pending'` and `is_new_project: true`
- Developer linked via `developer_name: 'Citi Developers'`

**Image segregation rules:**
- ARYA images: Only from `/images/arya/` paths
- AGUA images: Only from `/images/agua/` paths  
- AVELINE images: Only from `/images/aveline/` paths
- AMRA images: Only from `/images/residences/`, `/images/shared/`, `/images/apartment/` paths on `amraresorts.com`
- No cross-contamination between projects

### Step 2 — Area Draft Preparation

For each project's area, store area context in the pending import's metadata so you can review how it would appear on the area page:
- **Dubai Islands** (for ARYA + AGUA) — description from their location section
- **JVC / Jumeirah Village Circle** (for AVELINE) — description from their location section  
- **Umm Al Quwain** (for AMRA) — Blue Carbon Zone coastal sanctuary description

### Step 3 — Your Approval Workflow

After the edge function runs and populates the queues:

1. **Developer Approval** — Go to Listing Admin → Approvals → Developer tab → Review "Citi Developers" with logo, description → Approve/Reject
2. **Project Approval** — Go to Listing Admin → Approvals → Each project appears as a pending card with full preview (images, amenities, pricing, payment plan) → Approve individually
3. **Area Updates** — After project approval, area pages auto-link. The area descriptions from the scraped data will be shown for your review in the pending import notes

Nothing publishes automatically. Every item requires your explicit approval.

### Step 4 — Where to See Them

After the edge function runs:
- **Listing Admin** (`/listing-admin`) → **Approvals** tab → All 4 projects appear in the pending queue
- **Developer Approvals** tab → "Citi Developers" appears for review
- Each pending project has a **Preview** button that opens the full `PendingImportPreview` page showing exactly how it will look when published

### Technical Details

**Edge function `extract-citi-developer/index.ts`:**
- Hardcodes the extracted data (no live scraping needed — all data already captured above)
- Inserts developer into `pending_developer_imports`
- Inserts 4 projects into `pending_project_imports` with correctly matched images
- Each project's `images` JSON array only contains URLs from that project's domain path
- Each project's `amenities` array and `amenity_images` JSON map amenity names to their specific photos
- Sets `review_notes` with area draft text for your review
- Returns summary of what was inserted

**No changes to locked baseline systems.** Only creates a new edge function and inserts data into existing tables.

