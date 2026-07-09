## Scope

Two work streams on `/access`:

**A. Certificate + Broker section (visual only)**
**B. Featured Properties system rebuild (backend + gate strap + owner manager)**

---

### A. Certificate & "Become a JBJ-Certified Broker" section — `src/pages/PublicAccess.tsx`

Certificate mockup (right column):
- Remove the rounded outer radius — make it a **sharp-cornered horizontal certificate** (wider aspect, e.g. `max-w-[640px]`, `rounded-none` or `rounded-sm`, inner border also sharp).
- Reduce inner padding / border thickness so the print area is wider and closer to the edge (more real-certificate proportions).
- Replace the "Sealed / Official" pill with a **circular 3D gold wax stamp** on the bottom-right, layered over the signature line:
  - Circular SVG stamp, radial gold gradient (`#E8C674 → #B8892E → #7A5518`), embossed ring text "JBJ GLOBAL REAL ESTATE · OFFICIAL", and the JBJ monogram (pulled from the existing brand asset used in the hero) centered inside — this is the "official stamp saved in the database" (uses the same monogram asset already in the repo, no new upload needed).
  - 3D effect via layered drop-shadow + inner highlight + slight `rotate(-8deg)`.
- Signature block: change "Principal" label → **"Founder & CEO"** and italic script line above it reading "Jane B. Jaber" (founder signature style).
- Date block: auto-render **today's date** using `new Intl.DateTimeFormat("en-GB", { day:"2-digit", month:"long", year:"numeric" }).format(new Date())` — recomputed on every mount so every visitor sees a fresh date. Locked as a rule.
- Keep everything else (headline copy, list bullets, CTA button) untouched per user.

"Become a JBJ-Certified Broker" section rebuild:
- Rebuild layout: dark emerald backdrop kept, but restructure into a **two-column premium hero** — left: heading + underline + copy + CTAs; right: a **new "Our Broker Services" card** — a single premium card listing services (Off-plan brokerage, Secondary sales, Leasing desk, Investor advisory, Developer partnerships, Legal & mortgage concierge) each with a champagne icon tile + one-line description, so users understand what JBJ offers.
- Refine benefit grid below into 3 tighter cards (not 6 loose ones), with clearer typography hierarchy and a champagne top-hairline per card.
- Keep the two CTAs (Enroll / Speak to broker desk) with existing contrast lock.

---

### B. Featured Properties system rebuild

**B1. Database migration** (`home_featured_projects` upgrade)
Add columns:
- `surface text not null default 'home'` — one of `'home'` | `'gate'` | `'website'` (drops the `device` split for gate; gate uses a single strap).
- `auto_mode text` — `null` = manual, else `'newest'`.
- `auto_count int` — e.g. 6 or 10 (only when auto_mode is set).
- `refresh_interval_days int` — `null` = lifetime, else 15 / 30 / 60.
- `last_auto_refresh_at timestamptz`.
- Update the unique index to `(project_id, surface)` so the same project can appear on multiple surfaces.
- Add DB function `refresh_auto_featured(surface text)` that, when the interval elapsed, replaces auto-mode rows for that surface with the newest N approved projects.
- Add scheduled trigger (pg_cron if available, else client-side "refresh on read" fallback in the hook).

**B2. Owner manager rebuild** — `src/pages/owner/HomeFeaturedProjectsManager.tsx`
- Add a **surface tab switcher**: `Homepage` | `Gate (/access)` | `Website`.
- Per surface: mode toggle **Manual** vs **Auto (newest N)**.
  - Auto mode: number input (last N projects), refresh dropdown (Lifetime / 15 days / 30 days / 60 days), "Refresh now" button.
  - Manual mode: ordered list with `Add more` button + project search-picker (uses `useLocalProjectSearch`), drag/up-down reorder, remove, per-slot visibility toggle.
- Save writes to `home_featured_projects` with the appropriate `surface`.

**B3. Gate strap** — `src/pages/PublicAccess.tsx` → `PropertyMarquee`
- Replace the empty state "New inventory is being verified" with the real strap.
- New hook `useGateFeaturedProjects()` that reads `home_featured_projects` where `surface='gate'`, resolves auto-mode if due, joins to `projects`, returns approved projects only.
- Render a horizontally scrolling marquee (same walking-strap pattern as the book library / `DeveloperPartnersMarquee`), duplicated track for seamless loop, pausing on hover. Each card: project image, name, developer, starting price, "View" chip (locked → opens signup).
- If truly nothing is configured on the gate surface, hide the section entirely rather than showing the "verified" empty card.

---

## Technical notes

- Migration file will follow the standard `CREATE`/`GRANT`/`RLS`/`POLICY` order for any new helper table; existing RLS on `home_featured_projects` already covers new columns.
- Auto-refresh implemented as a security-definer SQL function invoked on read (idempotent, cheap) — no external scheduler required.
- Certificate stamp is an inline SVG component (no image upload); monogram uses the existing `@/assets/jbj-monogram-nobuffer.png`.
- Date auto-refresh: computed in-render, not memoized to a build-time constant.

---

## Files touched

- `src/pages/PublicAccess.tsx` — certificate + broker section + gate strap wiring
- `src/pages/owner/HomeFeaturedProjectsManager.tsx` — surface tabs + auto/manual modes
- `src/hooks/useHandpickedProjects.ts` — respect `surface` column
- New `src/hooks/useGateFeaturedProjects.ts`
- New `src/components/access/GatePropertyMarquee.tsx` (optional extraction)
- One Supabase migration adding columns + `refresh_auto_featured` function
