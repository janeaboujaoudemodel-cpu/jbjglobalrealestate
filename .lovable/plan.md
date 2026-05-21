## Goal

Two surgical UI passes, no backend/routing changes:

1. **Horizontal header** (`src/components/navigation/HorizontalUtilityBar.tsx`) — keep only Search, Filter, Sq ft/Sq m, Currency (AED + flag, no $ icon), Mode selector, and a new round **User Avatar** that opens a dropdown holding everything else.
2. **Homepage hero** (`src/pages/Index.tsx`) — match the layout of `https://jbj-global.replit.app/` for everything above the three pillar cards. The three pillar cards stay exactly as they are; the small "Explore ↓" indicator under them is removed.

---

## 1. Horizontal Header

### Keep (in this left→right order)
- **Left cluster:** Search button (with ⌘K kbd) only — opens `GlobalSearchModal`.
- **Right cluster (in order):**
  1. Filter icon button (opens `AdvancedFilterPanel`).
  2. Sq ft / Sq m toggle (existing segmented pill).
  3. **Currency chip** — AED only label with the 🇦🇪 flag; clicking it opens the existing `CurrencySwitcher` dropdown (full currency list inside). Remove the standalone `DollarSign` icon button. Trigger style: flag + `AED` + tiny chevron, gold hairline border, champagne hover. The dropdown itself (the menu content) is untouched — only the trigger changes.
  4. `ModeSwitcher` (Investor / Broker / Developer chip).
  5. **NEW: `UserAvatarMenu`** (see spec below). When signed-out, this slot shows the existing `Sign in` pill instead.

### Remove from header (move into avatar dropdown when signed-in)
- `GlobalBackButton`
- Browse (Compass) popover
- Saved / Favorites
- Activity (Bell) popover
- CRM shortcut
- Dashboard shortcut (if present)
- Tasks / Inbox / Notes / Alerts shortcuts
- The standalone `DollarSign` currency icon

### New component: `src/components/navigation/UserAvatarMenu.tsx`

Round 36px button positioned at the far-right of the header (after `ModeSwitcher`).

**Visual spec (mother-of-pearl + gold):**
- Outer ring: 1.5px solid `hsl(var(--gold))` with soft glow `0 0 0 1px rgba(184,149,85,0.35), 0 4px 14px -4px rgba(184,149,85,0.45)`.
- Inner fill: radial mother-of-pearl gradient
  `radial-gradient(120% 120% at 30% 25%, #FFFDF8 0%, #F5ECDC 38%, #E8D8B8 70%, #D9C291 100%)`
  with a subtle conic shimmer overlay at 8% opacity.
- Initials: bold Inter, `#1A1A1A`, 12px, tracking -0.01em, centered. Two letters max, derived from `displayName` (e.g. "Jane B." → "JB"). Reuse the `getInitials` helper from `UserAvatarPremium.tsx`. Photo from `crm_users_profile.photo_url` is **not** used here — initials only, per founder spec.

**Dropdown (Radix `DropdownMenu`), aligned end, 280px wide, champagne surface:**
- Header row: initials avatar (40px) + display name + email muted.
- Sections (each with a small uppercase label):
  - **Workspace:** Dashboard, CRM (only if `showCRM`), Inbox, Tasks, Notes, Alerts (with the existing `activityCount` badge).
  - **Browse:** Browse Properties, Saved, Filters (re-open the panel).
  - **Account:** Settings, Change password (links to `/settings#security` — no new logic, just navigation), Email preferences.
  - **Sign out** at bottom in muted ink.
- Each row: 36px tall, `lucide` icon + label, ink text, hover `#F7F2EA`.

No new routes, no auth changes — every entry links to a route that already exists in `src/App.tsx`/`StandaloneRoutes`. Items that need a route the project doesn't have are skipped silently.

### Currency trigger change in `CurrencySwitcher.tsx`
Add a new `variant="flag"` that renders the trigger as: 🇦🇪 + `AED` + `ChevronDown`. Used by the header. Existing `default` / `mobile` / `icon-only` variants stay untouched so no other surface regresses. The dropdown content (full currency list) is unchanged.

---

## 2. Homepage Hero — match replit reference

Reference (from screenshot of `https://jbj-global.replit.app/`):

```text
                DUBAI'S TRUSTED REAL ESTATE ECOSYSTEM        ← eyebrow
                Your Gateway to Dubai's
                Finest Real Estate                            ← H1, two lines
        I'm a…  [Investor]  [Broker]  [Developer]            ← inline pills
   [Browse Properties] [AI Home Finder] [Sell Your Property]
   [Explore AI Tools]  [Market Intelligence] [News]          ← action pills (single wrap row)

   ┌─ For Investors ─┬─ For Brokers ─┬─ For Developers ─┐    ← 3 pillar cards (UNTOUCHED)
   │ 2,400+ Off-Plan │ AI Tools,     │ Submit Projects   │
   └─────────────────┴───────────────┴───────────────────┘

            [ Book a Free Consultation  ↗ ]                  ← single CTA, replaces "Explore ↓"
```

### Changes in `src/pages/Index.tsx` (hero block ~lines 240–386)

- **Eyebrow + H1** — already match the reference, keep.
- **I'm a… pills + auto-rotating spotlight** — keep as-is.
- **Action pills row** — trim from 8 to the 6 shown in the reference: `Browse Properties`, `AI Home Finder`, `Sell Your Property`, `Explore AI Tools`, `Market Intelligence`, `News`. Drop `Create Your CV` and `Submit Complaint` (those stay reachable elsewhere on the page).
- **Three pillar cards** — completely untouched (markup, styling, dividers, icons, copy).
- **Remove the "Explore ↓" scroll indicator** (the `motion.div` at ~lines 376–384).
- **Add a single CTA below the three cards**: a centered "Book a Free Consultation" pill button (reuse `PremiumHeroButton` already imported) that opens the existing `InquiryFormModal` via `setIsInquiryOpen(true)`. Same chip styling as the reference (champagne fill on dark, gold hairline, ink text, small `ArrowUpRight` icon).

Nothing below the hero (`CategorySelectorSection`, `DeveloperPartnersMarquee`, `FeaturedListings`, etc.) is touched.

---

## Files touched

- `src/components/navigation/HorizontalUtilityBar.tsx` — strip clusters, swap currency trigger, mount `UserAvatarMenu`.
- `src/components/navigation/UserAvatarMenu.tsx` — **new** file (avatar circle + dropdown).
- `src/components/CurrencySwitcher.tsx` — add `variant="flag"` trigger only.
- `src/pages/Index.tsx` — trim action pills, remove Explore indicator, add Book-a-Consultation CTA.

## Out of scope

- No changes to vertical sidebar, mobile bottom nav, or any other route.
- No backend, RLS, or auth changes — avatar uses existing `useAuth` + `crm_users_profile`.
- No restyle of the three pillar cards or anything below the hero.