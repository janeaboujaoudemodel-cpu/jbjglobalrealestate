

# Plan: Premium Vertical Nav Upgrade, Resale Properties Section, Popup Fix

## 1. Upgrade Global Vertical Nav to Match PropertiesVerticalNav Quality

**Problem:** `GlobalVerticalNav` uses tiny 11px text, collapsible accordion sections — looks cheap compared to `PropertiesVerticalNav` which has 13px text, mega-menu flyout panels, and a more polished feel.

**Solution:** Rebuild `GlobalVerticalNav` using the same architectural pattern as `PropertiesVerticalNav`:
- **Mega-menu flyout approach** instead of inline collapsible sections — hovering/clicking a nav item with children opens a floating panel to the right of the sidebar (same as `renderMegaMenu()` in PropertiesVerticalNav).
- **13px font size**, same padding/spacing, same hover states with gold gradients.
- **All pages listed** as flat nav items (not buried in collapsibles). Group headers only as visual labels, not toggleable.
- **"My Shortcuts" section** — a dedicated nav item near the top. On hover, it opens a mega-menu flyout panel containing all the shortcuts from `MegaMenuAccount.tsx`: AI Tools, Dashboards, CRM, Customer Happiness Center, CVs, Tasks, Alerts, Owner Command Center, Admin Panel, Listing Admin, etc. This replicates the My Account dropdown experience.
- **Highlighted hubs** (AI Tools, Listing Portal, Careers, Buy Properties) always visible with gold accents and sparkle icons.
- **Mobile compatibility**: On mobile, render a full-screen slide-out drawer (hamburger trigger) containing the same nav structure. Currently mobile falls back to `GlobalHeader` — will keep that but ensure the vertical nav items are accessible from the mobile hamburger menu too.

**Files:**
- Rewrite `src/components/navigation/GlobalVerticalNav.tsx` — adopt PropertiesVerticalNav's mega-menu pattern with expanded nav items and My Shortcuts flyout.
- Remove per-page `PropertiesVerticalNav` imports from Properties, PropertiesReelly, AreaDetail, AreaGuides (the global one covers them).

## 2. Resale / Investor Properties Section

**Problem:** No dedicated section for investor resale properties (properties owned by JBJ investors who want to resell).

**Solution:**
- Create a new database table `resale_listings` to store investor resale properties (property name, investor contact, price, area, description, images, status).
- Create a new page `/resale-properties` showing all active resale listings with filtering.
- Add a "Resale Properties" card/section on the homepage and properties page.
- Wire resale listings into the recommendation engine so they occasionally appear in "Recommended Projects" when relevant to the user's browsing context (same area/budget logic).
- Add "Resale Properties" to the vertical nav under PROPERTIES section.

**Database migration:**
```sql
CREATE TABLE public.resale_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  area_name TEXT,
  emirate TEXT DEFAULT 'Dubai',
  property_type TEXT, -- apartment, villa, townhouse, etc.
  bedrooms INTEGER,
  size_sqft NUMERIC,
  asking_price NUMERIC,
  currency TEXT DEFAULT 'AED',
  original_purchase_price NUMERIC,
  developer_name TEXT,
  project_name TEXT,
  handover_status TEXT, -- ready, under_construction
  images TEXT[], -- array of image URLs
  investor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  investor_name TEXT,
  investor_phone TEXT,
  investor_email TEXT,
  status TEXT DEFAULT 'active', -- active, sold, withdrawn
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Anyone can view active resale listings"
  ON public.resale_listings FOR SELECT
  USING (status = 'active');

-- Authenticated users can insert their own
CREATE POLICY "Users can create own resale listings"
  ON public.resale_listings FOR INSERT
  TO authenticated
  WITH CHECK (investor_user_id = auth.uid());

-- Users can update their own
CREATE POLICY "Users can update own resale listings"
  ON public.resale_listings FOR UPDATE
  TO authenticated
  USING (investor_user_id = auth.uid());
```

**Files:**
- Create `src/pages/ResaleProperties.tsx` — listing page with grid cards and filters.
- Create `src/components/home/ResalePropertiesSection.tsx` — homepage section showing top 3-6 resale listings.
- Update `src/App.tsx` — add `/resale-properties` route.
- Update `RecommendedProjects.tsx` — occasionally mix in resale listings when matching user context.

## 3. Fix Lead Capture Popup Timing

**Problem:** The popup takes too long to show. On the homepage, it waits for 50% scroll + 3.5s delay. On other pages, it requires 5+ page views. For logged-in users, it may never show because the gate checks don't account for session state properly.

**Solution in `useSmartPopupStrategy.ts`:**
- **Reduce delays:** `FIRST_VISIT_DELAY_MS` from 8000 → 3000ms. `SESSION_PAGE_THRESHOLD` from 5 → 3. `PROPERTY_PAGE_THRESHOLD` from 3 → 2.
- **Homepage scroll trigger:** Reduce from 50% scroll (`SCROLL_THRESHOLD` 0.7) to 30% scroll (0.3).
- **For logged-in users:** Skip the popup entirely (they already registered). Currently there's no auth check — add one.
- **For non-logged-in visitors:** Show faster on high-intent pages (property detail, developer pages).

**Files:**
- Edit `src/hooks/useSmartPopupStrategy.ts` — reduce thresholds and add auth-awareness.
- Edit `src/components/MainLayout.tsx` — reduce `SCROLL_DELAY_MS` from 3500 → 1500 for popup readiness on homepage.

## Implementation Order
1. Vertical nav upgrade (biggest visual impact)
2. Popup timing fix (quick config change)
3. Resale properties section (new feature with DB migration)

