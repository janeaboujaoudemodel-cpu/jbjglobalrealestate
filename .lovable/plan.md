## Footer Dark-Mode Preview Toggle — Plan

Add an internal QA route that renders the live `<Footer />` against a swatch of common dark backgrounds, with a toggle to cycle through them. This makes hairline + divider visibility easy to verify without touching production surfaces.

### 1. New route — `/dev/footer-preview`

- Create `src/pages/dev/FooterPreviewPage.tsx`.
- Register in `src/routes/StandaloneRoutes.tsx` (no MainLayout chrome — full-bleed canvas).
- Owner-only access: wrap with the existing `OwnerGuard` used by other `/dev/*` routes (will inspect that file to match exact pattern).
- Add a `<Helmet>` `noindex,nofollow` so it never gets surfaced publicly.

### 2. Background swatch presets

Hardcoded list of representative dark canvases (extensible array at top of file):

| Key | Background | Use case |
|---|---|---|
| `obsidian` | `#0A0908` | Current footer base — sanity baseline |
| `ink` | `#000000` | Pure black — worst case for hairlines |
| `charcoal` | `#1A1714` | Slightly warmer dark surface |
| `midnight` | `#0B1020` | Cool blue-black (e.g. landing hero) |
| `espresso` | `#15110D` | Warm brown-black |
| `gradient-radial` | radial champagne wash on `#0A0908` | Footer's actual ambient overlay |
| `gradient-linear` | top-to-bottom black → `#0A0908` | Above-fold transition |
| `noise` | `#0A0908` + SVG grain | Stress-test grain interaction |

Each preset stored as `{ key, label, style: React.CSSProperties }`.

### 3. Page UI

```text
┌──────────────────────────────────────────────────────┐
│  Footer Preview · Dark Surface QA       [×] close    │
│  ┌──────────────────────────────────────────────┐    │
│  │ Background: [Obsidian ▾]  Hairline overlay:  │    │
│  │             [< prev] [next >]    [□ ruler]   │    │
│  │             Width: [Desktop / Tablet / Mobile]│   │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ <swatch background>                          │    │
│  │   <Footer />  rendered live                  │    │
│  │                                              │    │
│  │   (1px ruler grid overlay if toggled)        │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

Controls:
- **Background dropdown** — pick one preset, or click `[< prev] [next >]` to cycle (also bound to `←` / `→` arrow keys).
- **Width selector** — 3 buttons that set the wrapper width to `1280 / 768 / 390` so you can verify the hairlines and chip wrapping at all breakpoints in one screen.
- **Ruler overlay** — toggle a 1px CSS grid (`background-image: linear-gradient(...)`) on top of the footer to make sure hairlines align to the pixel grid.
- **Diff helper** — small floating swatch in the corner showing the current bg color hex + computed hairline RGB so you can verify contrast at a glance.
- Persist current preset/width/ruler in `localStorage` (`jbj_footer_preview_state`) so reloads keep state.

### 4. Implementation notes

- Reuse the existing `<Footer />` component as-is — no fork. The page just wraps it in a div whose style comes from the selected preset.
- Footer must render correctly outside MainLayout — it already does (it's used in `MainLayout.tsx` directly), but I'll verify by reading the imports it needs (no router-only hooks beyond `useLocation`, which works fine inside the standalone route).
- Use `framer-motion` only if it adds value (probably not — keep it static).
- Keyboard shortcuts wired with a simple `useEffect` + `keydown` listener on `window`.

### 5. Files

**Create**
- `src/pages/dev/FooterPreviewPage.tsx`

**Edit**
- `src/routes/StandaloneRoutes.tsx` — add the route under the existing `/dev/*` group with `OwnerGuard`.

### 6. Out of scope

- No changes to `<Footer />` itself.
- No changes to existing tests/CI — this is a manual QA tool, not an automated check.
- No screenshot export button (the user asked for a toggle/preview; can add later if useful).

### 7. Open questions

None blocking — defaults are reasonable. If you'd like screenshot export (download the current swatch as PNG via `html2canvas`), say the word and I'll add it.