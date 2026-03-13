

## Plan: Toolkit Favorites & Shortlist System

Currently, favorites/shortlists only support real estate properties (`project_id` referencing `projects` table). This plan extends the system to support saving any toolkit creation (stamps, business cards, letterheads, CVs, logos, etc.) and displays them in categorized sections on the Favorites page.

---

### 1. New Database Table: `design_favorites`

Create a generic table that stores any toolkit item as a favorite or shortlist entry:

```sql
CREATE TABLE public.design_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,        -- 'stamp' | 'business_card' | 'letterhead' | 'cv' | 'logo' | 'cover_letter' | 'document'
  item_id text NOT NULL,          -- the ID of the saved design (stamp_design id, etc.)
  item_name text,                 -- display name: "My Company Stamp", "Business Card v2"
  thumbnail_svg text,             -- optional SVG snapshot for preview
  metadata jsonb DEFAULT '{}',    -- extra info (colors, template_key, etc.)
  list_type text NOT NULL DEFAULT 'favorite',  -- 'favorite' | 'shortlist'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id, list_type)
);
```

With RLS policies for user-own-data access only.

### 2. New Hook: `useDesignFavorites`

File: `src/hooks/useDesignFavorites.ts`

- `useDesignFavorites(itemType?)` — query all design favorites, optionally filtered by type
- `useDesignShortlist(itemType?)` — same for shortlist entries
- `useToggleDesignFavorite()` — mutation to add/remove
- `useToggleDesignShortlist()` — mutation to add/remove
- Guest fallback via localStorage (`jbj_design_favorites`, `jbj_design_shortlist`)

### 3. Add Save Buttons to Toolkit Pages

Add a heart/shortlist button to each toolkit output:

- **Stamp Generator** (`StampGeneratorPage.tsx`, `StampGalleryPage.tsx`): Save button on each stamp design card and the live preview. Captures `item_type: 'stamp'`, `item_id: design.id`, `thumbnail_svg: svgSource`.
- **Business Card Designer**: Save button on completed card designs.
- **Letterhead/Document Designer**: Save button on completed documents.
- **CV Builder**: Save button on completed CVs.
- **Logo Maker**: Save button on generated logos.

Each uses a shared `<DesignFavoriteButton />` component similar to `FavoriteButton.tsx` but for toolkit items.

### 4. Update Favorites Page with Categorized Sections

File: `src/pages/Favorites.tsx`

Add a third tab or expand existing tabs with category sections:

```
Tabs: [Properties] [My Designs] [Shortlist]
```

The **My Designs** tab shows categorized sections:
- **Stamps** — grid of saved stamp designs with SVG thumbnails
- **Business Cards** — saved card designs
- **Letterheads** — saved letterhead designs
- **CVs & Profiles** — saved CV/resume designs
- **Logos** — saved logo designs
- **Documents** — saved document templates

Each section is collapsible, shows item count, and links to the respective toolkit editor for that item. Empty sections are hidden.

### 5. Dashboard Cards Update

Update `FavoritesCard.tsx` and `ShortlistCard.tsx` to show a combined count (properties + designs) and preview both types.

---

### Files to Create
- `src/hooks/useDesignFavorites.ts` — hooks for design favorites CRUD
- `src/components/toolkit/DesignFavoriteButton.tsx` — reusable save/shortlist button for toolkit items

### Files to Modify
- `src/pages/Favorites.tsx` — add "My Designs" tab with categorized sections
- `src/components/dashboard/FavoritesCard.tsx` — show design favorites count
- `src/components/dashboard/ShortlistCard.tsx` — show design shortlist count
- `src/components/stamp-generator/StampGalleryPage.tsx` — add save-to-favorites button on stamp cards
- `src/components/stamp-generator/StampGeneratorPage.tsx` — add save button on live preview

### Database Migration
- Create `design_favorites` table with RLS policies

