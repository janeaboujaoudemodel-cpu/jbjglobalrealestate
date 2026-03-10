

## Plan: Mobile Header Fixes and Navigation Overhaul

### Issues from Screenshots & User Feedback

1. **iPhone header text breaking** — "JBJ GLOBAL REAL ESTATE" letter E is cut off on small iPhones. The `whitespace-nowrap` + large text causes overflow.
2. **White space on zoom out** — iOS zoom-out reveals white edges around the viewport.
3. **Hamburger not showing** — `useIsTouchLayout` relies on `maxTouchPoints` which can fail on some iPhones; need a fallback.
4. **Mobile menu opens from the right** — User wants it to open **top-to-bottom** (full-screen slide-down), styled like the desktop vertical sidebar.
5. **Navigation style parity** — Gold section titles, black sub-items, gold icons must match between mobile and desktop sidebar.
6. **Bottom section ordering** — Sign in/out, App Navigation Guide, Sitemap, Favorites → then Contact Support & Create Ticket → gold divider → JBJ monogram at the very bottom.
7. **"My Shortcuts" must be present** on both mobile and desktop.
8. **Careers highlight** must be consistent (emerald/green).

---

### Changes

#### 1. Fix iPhone header text overflow — `GlobalHeader.tsx`
- Remove `whitespace-nowrap` from the "JBJ Global Real Estate" span (line 627).
- Add `text-xs sm:text-sm xl:text-base` sizing so it wraps gracefully on small phones.
- Add `overflow-hidden` on the header content wrapper to prevent the E from being cut off.

#### 2. Fix white space on zoom out — `index.css` or `App.css`
- Add `html { min-width: 100vw; overflow-x: hidden; }` to prevent iOS zoom-out white edges.

#### 3. Fix hamburger not showing — `use-touch-layout.ts`
- Add a fallback: if `window.innerWidth < 1024`, always treat as mobile regardless of `maxTouchPoints`. This ensures iPhones that misreport touch points still get the hamburger.
- Alternatively, in `GlobalHeader.tsx`, change `shouldUseMobileHeader` logic to also check `window.innerWidth < 1024` as a fallback, not just `isTouchLayout`.

#### 4. Mobile menu: slide from top, full-screen, sidebar-style — `GlobalHeader.tsx`
- Replace `<Sheet side="right">` with a **full-screen overlay** that slides down from the top (`animate-in slide-in-from-top`).
- Style it with the same champagne gradient as the desktop vertical sidebar (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`).
- Structure the menu content to match the desktop sidebar:
  - **My Shortcuts** section at top (same as desktop vertical nav's highlighted hubs)
  - **Collapsible accordion sections**: PROPERTIES, TOOLS, INSIGHTS, SERVICES, COMPANY, MY ACCOUNT — with gold section titles, gold icons, black sub-item text, gold tree-line indentation
  - **Careers & Join** highlighted in emerald green (same as desktop)
  - Sub-items open vertically underneath each section (same accordion behavior as desktop)

#### 5. Bottom section ordering — `GlobalHeader.tsx` mobile menu
- After all nav sections, add in this order:
  1. Sign In / Sign Out button
  2. App & Navigation Guide button
  3. Sitemap link
  4. Favorites link
  5. Gold divider
  6. Contact Support + Create Ticket links
  7. Gold divider
  8. JBJ monogram (centered, at the very bottom)

#### 6. Desktop vertical sidebar — `GlobalVerticalNav.tsx`
- No structural changes needed — just ensure "My Shortcuts" items match between mobile and desktop.
- Verify Careers highlight is emerald green (#10b981) in both.

---

### Files Modified
- `src/components/GlobalHeader.tsx` — Mobile menu overhaul (slide-from-top, sidebar-style sections, bottom ordering)
- `src/hooks/use-touch-layout.ts` — Add width fallback for hamburger detection
- `src/App.css` or `src/index.css` — iOS zoom-out white space fix

