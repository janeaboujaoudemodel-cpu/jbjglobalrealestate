# Site-Wide Audit — Results & Remaining Hardening

## ✅ What I verified is already fixed

I ran the three static contrast guards plus targeted greps across every page and component:

| Check | Result |
|---|---|
| `check-white-on-light` (white text on bright bg) | **PASS** — 0 violations |
| `check-black-on-dark` (ink text on dark bg) | **PASS** — 0 violations |
| `Properties.tsx` black gaps | **GONE** — champagne `#FDFBF7` / `#F7F2EA` only |
| Filter pills contrast | **OK** — ink + gold border on inactive, ink-on-white on active |
| `ProjectCard` text | **OK** — ink-black names, high-opacity ink metadata |
| Public listing hooks (`useProjects`) | **OK** — every public query filters `is_published = true` |
| "Media Pending Verification" string | **GONE** from `src/` (0 hits) |
| Database — projects without cover image | **UNPUBLISHED** by the migration we ran |
| Need-help card on Index | **REMOVED** |

## ⚠️ Gaps the audit found

### 1. One residual dark tile on the homepage
`src/pages/Index.tsx:266` — the 3-pillar grid still uses `bg-[#0A0A0A]` with white text. The CSS guard allows this (white-on-dark is fine), but it's the only black box left on `/` and likely the "black gap" feel on the homepage you mentioned. Should be flipped to champagne (`#F7F2EA`) with ink text + gold accents to match the rest of the page.

### 2. Same-tone alpha-tinted badges (cosmetic, low risk)
The same-tone guard reported 14 spots like `bg-[#1A1A1A]/5 text-[#1A1A1A]` and `bg-[#1A1A1A]/10 text-[#1A1A1A]`. These are translucent badge backgrounds — the actual rendered contrast is fine because the bg is 5–10% alpha over champagne. They are NOT readability bugs. The static regex doesn't understand `/NN` opacity. **No change needed**, but I'll add these to the guard's allowlist so CI stops warning.

Files affected (informational only):
- GlobalSearchModal, DirectContactCTA, AdminLeads, BookCard, CRMRelationships, SentHistoryView, MortgageCalculator, SearchModule, EnvelopeDetail, mega-menu-primitives, FAQTableOfContents, FAQFloatingSidebar, AreaGuides

### 3. Re-publication safety net (data layer)
The SQL migration unpublished current cover-less projects, but **nothing prevents a new upload without a cover from going public**. I'll add a DB-level guard so this can't regress:

```sql
-- Trigger: block is_published=true when cover is missing
CREATE OR REPLACE FUNCTION enforce_cover_before_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND (NEW.cover_image_url IS NULL OR NEW.cover_image_url = '') THEN
    RAISE EXCEPTION 'Cannot publish project without a cover image';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_cover_before_publish
BEFORE INSERT OR UPDATE OF is_published, cover_image_url ON public.projects
FOR EACH ROW EXECUTE FUNCTION enforce_cover_before_publish();
```

Admins will see a clear error in the listing-admin UI instead of silently publishing a broken card.

## 🛠 Proposed changes (3 small, scoped edits)

1. **`src/pages/Index.tsx`** — convert the 3-pillar grid (lines 263–290) from black tiles to champagne tiles with ink text and gold icons, matching the rest of the homepage's monochrome-on-champagne palette. Border becomes gold hairline; remove the heavy black drop-shadow.

2. **`scripts/contrast/check-same-tone.mjs`** — tighten the regex so `bg-[#1A1A1A]/5` (alpha) is no longer flagged as same-tone. Pure cleanup — no UI impact.

3. **New migration** — add the `enforce_cover_before_publish` trigger so the "media pending → public" leak cannot reappear.

## What this does NOT change

- No removal of any feature, page, route, or content (per the No-Removal policy).
- No styling changes outside the one homepage pillar grid.
- No changes to Properties, ProjectCard, FilterShortcutBar, or any page already verified clean.

Approve and I'll apply the three edits in one pass and confirm with the contrast scripts re-running green.
