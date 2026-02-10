

# Phase 3 & 4: Interior Design Overhaul, New Hubs, and Listing Portal

This continues the approved plan with all remaining tasks.

---

## Task 1: Interior Design AI -- Complete Overhaul (Camera-First + Inline Chat)

**What changes:**

The current multi-step flow (Mode Selection -> Project Setup -> Form -> Processing -> Results) will be replaced with a single-screen experience:

**New Layout:**
- **Top:** Hero section (kept, slightly reduced padding)
- **Left panel (60%):** Camera/Upload area + generated image preview + 3D viewer
- **Right panel (40%):** Inline AI Chat + optional style/palette selectors as collapsible sections
- **Bottom:** Mode chips (Concept/Redesign/Staging) as secondary filters, not primary navigation

**Key changes to `InteriorDesignAI.tsx`:**
- Remove the multi-step `Step` state machine ('mode' | 'project' | 'form' | 'processing' | 'results')
- Replace with a single view: upload area on the left, chat + options on the right
- The camera/upload zone shows a large dropzone when empty, and the generated/uploaded image when populated
- Below the image: "Redesign" and "Regenerate" buttons
- The AI chat (currently `DesignChatAssistant`) is embedded inline on the right side
- Style presets appear as collapsible chips above the chat: Corporate, Premium, Luxury, Minimalist, Bohemian, etc.
- Color palette selector appears as a collapsible row of swatches
- Project name becomes a simple inline input at the top (not a separate step)
- `DesignModeSelector` becomes small horizontal chips instead of large tab triggers
- Remove separate `DesignProjectHeader` step -- merge into inline fields

**Files modified:**
- `src/pages/InteriorDesignAI.tsx` -- Complete rewrite of layout
- `src/components/interior-design/DesignChatAssistant.tsx` -- Remove standalone header, make it embeddable
- `src/components/interior-design/DesignModeSelector.tsx` -- Convert to small inline chips

**Files no longer used as standalone (functionality merged inline):**
- `ConceptRenderForm.tsx`, `PhotoRedesignForm.tsx`, `VirtualStagingForm.tsx` -- Their style/palette/options data arrays will be imported but the forms themselves are replaced by the unified layout

---

## Task 2: 3D Panoramic Viewer

**New file: `src/components/interior-design/Design3DViewer.tsx`**
- CSS 3D perspective transform wrapper around the generated image
- Mouse drag / touch drag rotates the image on X and Y axes using `transform: perspective(1000px) rotateY(Xdeg) rotateX(Ydeg)`
- Constrained to +/-30 degrees rotation for a realistic "look around" feel
- "Download 3D View" button saves the current image
- Toggle between flat view and 3D view
- Integrated into the left panel of the redesigned Interior Design page

---

## Task 3: Purple Theme Consistency (Task 16)

All interior design components will use consistent `border-fuchsia-500/30` borders, `text-fuchsia-400` icons, and `bg-fuchsia-500/20` active states as the primary accent. Mode-specific colors (blue for redesign, emerald for staging) will only appear on the mode chips, not on the main layout.

---

## Task 4: Investor Hub Page (Task 17)

**New file: `src/pages/InvestorHub.tsx`**
**Route: `/investor-hub`**

Premium dark-themed hub page with:
- Welcome section with user name and tier badge
- Quick access cards: Dashboard, Favorites, Shortlisted Properties, Profile
- AI Tool shortcuts: Property Analyzer, ROI Calculator, Mortgage Calculator, Home Finder
- Market Intelligence quick links
- Education section: Books, Guides, Market Reports
- Recent activity feed

---

## Task 5: Broker Hub Page (Task 18)

**New file: `src/pages/BrokerHub.tsx`**
**Route: `/broker-hub`**

Premium dark-themed hub page with:
- Welcome section with broker verification status
- Quick access: CRM, Lead Management, Dashboard, Profile
- Broker tools: AI Email Generator, Business Card Scanner, Client Matcher
- Training and certification shortcuts
- Performance metrics cards
- Team and referral program links

---

## Task 6: Public Listing Portal (Task 19)

This is the largest new feature -- a Dubizzle/Bayut-style portal.

### Database Tables (migration):

**`portal_listings`** table:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL) -- the broker/seller who created it
- `listing_type` (text) -- 'sale', 'yearly_rent', 'short_term_rental', 'holiday_home'
- `title` (text, NOT NULL)
- `description` (text)
- `location` (text)
- `emirate` (text)
- `area` (text)
- `price` (numeric)
- `currency` (text, default 'AED')
- `bedrooms` (int)
- `bathrooms` (int)
- `area_sqft` (numeric)
- `property_type` (text) -- apartment, villa, townhouse, etc.
- `furnishing` (text) -- furnished, unfurnished, semi-furnished
- `rent_frequency` (text) -- yearly, monthly, weekly, daily (for rentals)
- `cheques` (int) -- number of cheques for rent
- `images` (jsonb, default '[]')
- `title_deed_url` (text)
- `passport_copy_url` (text)
- `status` (text, default 'pending') -- pending, approved, rejected, expired
- `is_featured` (boolean, default false)
- `featured_until` (timestamptz)
- `use_company_contact` (boolean, default true) -- free if true; paid if false
- `contact_name` (text)
- `contact_phone` (text)
- `contact_email` (text)
- `admin_notes` (text)
- `created_at`, `updated_at` (timestamptz)

**`broker_verifications`** table:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL, UNIQUE)
- `rera_number` (text)
- `rera_card_url` (text)
- `id_document_url` (text)
- `company_name` (text)
- `status` (text, default 'pending') -- pending, verified, rejected
- `verified_at` (timestamptz)
- `admin_notes` (text)
- `created_at` (timestamptz)

**`portal_points`** table:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `points` (int, default 0)
- `total_listings` (int, default 0)
- `free_listings_remaining` (int, default 3) -- free tier starts with 3
- `tier` (text, default 'starter') -- starter, professional, premium
- `created_at`, `updated_at` (timestamptz)

**`listing_tiers`** table:
- `id` (uuid, PK)
- `name` (text) -- 'standard', 'featured_10', 'featured_15', 'premium_30'
- `label` (text) -- display name
- `duration_days` (int)
- `price_aed` (numeric)
- `is_featured` (boolean)
- `description` (text)

RLS policies:
- Users can read their own listings, admins can read all
- Users can insert/update their own listings
- Users can read their own broker verification
- Portal points: user can read own, system updates

### Frontend Pages:

**`src/pages/ListingPortal.tsx`** -- Main portal landing
- Browse approved public listings
- Search/filter by type (sale/rent), location, price range
- "Submit Your Listing" CTA

**`src/pages/ListingPortalSubmit.tsx`** -- Multi-step submission form
- Step 1: Listing type (Sale / Yearly Rent / Short-term / Holiday Home)
- Step 2: Property details (title, description, location, beds, baths, sqft, price, cheques)
- Step 3: Photos upload (up to 10 images)
- Step 4: Documents (title deed, passport copy) -- stored in Supabase Storage
- Step 5: Contact preference (use JBJ contact = free, own contact = paid tier)
- Step 6: Review and submit
- Shows "Pending Approval" status after submission

**`src/pages/ListingPortalMyListings.tsx`** -- User's listing dashboard
- View all submitted listings with status badges (Pending/Approved/Rejected)
- Edit any listing
- Points balance and tier info
- Broker verification status and upload form

**Routes:** `/listing-portal`, `/listing-portal/submit`, `/listing-portal/my-listings`

### Listing Tiers (seeded data):
| Tier | Duration | Price (AED) | Featured |
|------|----------|-------------|----------|
| Standard | 30 days | Free (first 3/month) | No |
| Featured 10 | 10 days top | 99 | Yes |
| Featured 15 | 15 days top | 149 | Yes |
| Premium 30 | 30 days top | 249 | Yes |

### Points System:
- 10 points per approved listing
- 50 points = 1 free featured listing (10 days)
- 100 points = tier upgrade discount
- Verified brokers get 2x points

---

## Technical Notes

- The edge function `interior-design-generate` is already functional. No changes needed to the backend -- only the frontend UX is being overhauled.
- The 3D viewer is a CSS transform-based simulation, not WebGL. This keeps it lightweight and compatible with all devices.
- The listing portal requires authentication. Users must sign in to submit listings.
- Stripe integration for paid listing tiers is deferred -- prices are displayed but payment buttons will show "Coming Soon" until Stripe is connected.
- All new database tables will have RLS policies ensuring users can only access their own data.
- Storage bucket `portal-documents` will be created for title deeds and passport copies (private bucket, not public).

---

## Implementation Order

1. Interior Design overhaul (Tasks 1, 2, 3) -- single unified page with 3D viewer
2. Investor Hub and Broker Hub pages (Tasks 4, 5) -- new pages with routes
3. Listing Portal database migration (Task 6 -- tables + RLS + seed data)
4. Listing Portal frontend (Task 6 -- pages + components)

