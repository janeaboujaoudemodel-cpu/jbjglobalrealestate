
## Goal (what will change)
You asked for global, non-regressing fixes across:
1) Header “Insights” dropdown layout + fit (desktop + iPad)  
2) Header Search modal: never cropped, mobile/iPad-safe, and it must deep-link to any tool/page (CRM, Graphic Designer, etc.) with role-based visibility  
3) “Ready to Get Started / Connect With Our Team” duplication + contact-card border color rules (green/blue/gold) globally  
4) AI Design Studio missing/unclickable CTAs and routes (must open the working tool)  
5) Tool theme consistency: accent color must control borders consistently inside tools (Property Measurement already looks great, but borders must match the tool color everywhere)  
6) Owner shortcuts in Account mega menu must never “disappear again” (stability guard against owner-verification timing)

No partial work; everything below is designed as one cohesive pass.

---

## A) Header “Insights” dropdown: 2 sections (4 up / 4 down) + fit + no cropping

### Current state (found)
- `src/components/header/MegaMenuInsights.tsx` renders **7 columns** (`lg:grid-cols-7`), which is dense and prone to cropping.
- It already has an internal scroll wrapper: `max-h-[calc(100vh-160px)] overflow-y-auto`, but the layout is not your requested “4 + 4” grid.

### Implementation approach
1) Refactor `MegaMenuInsights.tsx` into **8 uniform blocks** laid out as:
   - Desktop: `lg:grid-cols-4` with 2 rows (4 top / 4 bottom)
   - Tablet/iPad widths: `md:grid-cols-2` or `md:grid-cols-3` depending on space
   - Mobile: `grid-cols-1` (stacked), with clean dividers and safe scrolling

2) Convert the old 7-column model into 8 consistent sections (proposed mapping that preserves your content, but fits your layout rule):
   1. News & Updates  
   2. Market Intelligence  
   3. Guides  
   4. Services  
   5. Business Suites  
   6. Toolkit & AI (All Tools + key tool hubs)  
   7. For You (mode-conditional Investor/Broker/Both)  
   8. Company + Careers + Legal (still separated internally with gold dividers)

3) Each block becomes a “mini card” (same padding, same title height, same divider, same internal link spacing), so the grid looks premium and aligned.

4) Fit/cropping improvements:
   - Keep the scroll wrapper, but ensure it wraps the entire content and uses:
     - `max-h-[calc(100dvh-var(--header-height,128px)-24px)]`
     - `overflow-y-auto`
   - Ensure the menu never spills off-screen on iPad by keeping consistent horizontal padding and max-width.

### Files touched
- `src/components/header/MegaMenuInsights.tsx`

### Acceptance checks
- Hover/click “Insights” shows **8 blocks** in a 4+4 grid (desktop).
- No cropping on shorter screens: scroll activates smoothly.
- iPad/Tablet: blocks wrap cleanly; nothing is cut off.

---

## B) Search modal: keep the UI exactly the same, but make it never-cropped + “type anything → deep link” + role/mode aware

### Current state (found)
- The header search icon opens `GlobalSearchModal` directly (`src/components/GlobalHeader.tsx`).
- `src/components/GlobalSearchModal.tsx` uses a static `SEARCHABLE_ITEMS` list mostly for public pages; it does **not** include:
  - CRM
  - Owner routes (/owner, /admin, /listing-admin, /studio)
  - Tools registry (Graphic Designer → `/jbj-design-studio`, etc.)
- The modal is positioned `fixed top-20 ... max-w-xl`, which can crop on mobile/iPad.

### Implementation approach

#### B1) Make the modal un-croppable on mobile/iPad (no design change)
In `GlobalSearchModal.tsx`:
- Keep the exact card look and gradients.
- Change the modal positioning strategy:
  - Use `top-4` on small screens (instead of `top-20`)
  - Use `max-height: calc(100dvh - 2rem)` and ensure the results container scrolls
  - Ensure the modal container uses safe spacing on iOS (dvh + padding)

Result: same UI, but always fully visible.

#### B2) Replace static search list with a single global registry-backed index
Create a central, maintainable search index that can include:
- Public pages (Home, Properties, Guides, etc.)
- All tools from `src/config/royalToolsRegistry.ts` (`allTools`)
- Owner/admin/back-office destinations (Owner Command Center, Listing Admin, Studio, Admin Panel, CRM)

New file:
- `src/config/globalSearchIndex.ts`

It will export:
- `type SearchItem = { id; label; route; keywords; description?; access; modeVisibility? }`
- `buildSearchIndex()` combining:
  - Existing public shortcuts
  - `allTools.map(tool => …)` so “Graphic Designer”, “Video Producer”, “CRM”, “Property Measurement” etc. all become searchable
  - Admin/owner routes as explicit items

#### B3) Role-based + mode-based filtering (Owner sees everything)
In `GlobalSearchModal.tsx`, when modal is open:
- Use `useAuth()` to get `user`, `isOwner`, `ownerLoading`
- If user is logged in, fetch lightweight access flags (reusing patterns already in code):
  - `hasCRMAccess` via `crm_users_profile` (same as header/account menu)
  - `hasListingAdminAccess` via `has_role` + `listing_admins` (same as MegaMenuAccount)
- Filter search items by:
  - Owner: show all (including /owner, /admin, /studio, /listing-admin, /crm, /jbj-design-studio)
  - Broker mode: show broker destinations + CRM only if allowed
  - Investor mode: hide broker-only destinations
  - Logged-out: show only public + public tools

Important: This only affects *visibility*, not authorization. Actual pages remain protected by route guards.

#### B4) Ranking so “CRM” becomes first when you type CRM
Implement a scoring function:
- Exact label match > starts-with > keyword match > substring
- Add keyword synonyms:
  - “crm”, “leads”, “pipeline” → CRM
  - “graphic designer”, “brochure”, “marketing pack” → `/jbj-design-studio`
  - “design studio”, “ai interior”, “interior design” → `/interior-design-ai`
- If user isOwner, allow admin results to rank high.
- Return top N results (e.g., 10), not just 5.

#### B5) “Click anything → go directly”
- Ensure every result button always calls `navigate(route)` and closes modal.
- If route equals current route, force a “soft refresh” behavior (scroll-to-top + close modal) so it still feels responsive.

### Files touched/added
- Edit: `src/components/GlobalSearchModal.tsx`
- Add: `src/config/globalSearchIndex.ts`
- (Optional small update): `src/components/GlobalHeader.tsx` only if we need to pass user/mode context explicitly (likely not; modal can read it itself)

### Acceptance checks
- Mobile/iPad: search modal is never cropped.
- Typing “CRM” shows CRM as first result (for Owner; for brokers only if they have access).
- Typing “graphic designer” deep-links to the Graphic Designer tool (`/jbj-design-studio`) instantly (Owner).
- Suggestions cover both frontend + backend destinations depending on access.

---

## C) Remove duplicate “Connect With Our Team” sections; keep only the bottom global section

### Current state (found)
- `MainLayout.tsx` always renders `CombinedContactNewsletter` globally for public pages.
- Some pages still render `DirectContactCTA` explicitly:
  - `src/pages/services/Architecture.tsx`
  - `src/pages/RentGuide.tsx`
  - `src/pages/services/DesignBuild.tsx`
This creates the “two sections” effect you described.

### Implementation approach
1) Remove per-page `<DirectContactCTA />` from those pages, relying solely on the global `CombinedContactNewsletter` at the bottom.
2) Keep the hero style “Creating Exceptional Spaces” unchanged (your “lock it” request is satisfied by leaving it intact).

### Files touched
- `src/pages/services/Architecture.tsx`
- `src/pages/RentGuide.tsx`
- `src/pages/services/DesignBuild.tsx`

### Acceptance checks
- You see only one contact CTA area (the bottom global one), not two.

---

## D) Contact cards: border color rules (WhatsApp green, Call blue, Email gold) globally

### Current state (found)
- `CombinedContactNewsletter.tsx` has gold borders for cards (`border border-gold/30`).
- `DirectContactCTA.tsx` also uses gold borders for all three cards.

### Implementation approach
Apply consistent border rules in both components (even if DirectContactCTA becomes less used, it should still obey the global standard):
- WhatsApp card: `border-2 border-emerald-500/40 hover:border-emerald-500`
- Call card: `border-2 border-blue-500/40 hover:border-blue-500`
- Email card: `border-2 border-gold/40 hover:border-gold`

Also update hover shadows to match the card’s border color subtly (emerald glow / blue glow / gold glow) while keeping the same premium palette.

### Files touched
- `src/components/CombinedContactNewsletter.tsx`
- `src/components/DirectContactCTA.tsx`

### Acceptance checks
- In the “Ready to Get Started” section, each card border matches its icon color rule.
- Same behavior anywhere else these cards appear.

---

## E) AI Design Studio CTA + “missing tool” confusion: make it unmistakably clickable and route-correct

### Current state (found)
- DesignBuild page AI tools array links “AI Interior Designer” to `/interior-design-studio`, which redirects to `/interior-design-ai`. This works, but it’s indirect and can feel broken.
- In `InteriorDesignAI.tsx`, the “AI Design Studio” path is started by `setShowComparison(false)`; it works but can feel like “not opening a tool” because you remain on the same page.

### Implementation approach
1) In `src/pages/services/DesignBuild.tsx`
   - Change the AI Interior tool link to **directly** `/interior-design-ai` (no redirect chain).
   - Add explicit CTA copy on the card button:
     - “Start designing with our AI Design Studio”
     - “Professional designer — connect with our licensed partner”
   - Ensure both are clearly actionable and consistent.

2) In `src/pages/InteriorDesignAI.tsx`
   - Make the entire “AI Design Studio” card clickable (not only the button), so it never feels dead.
   - Keep your current UI, but make the action explicit:
     - Button remains, but copy becomes your requested CTA language.
   - When clicked, it should:
     - Hide the comparison section
     - Scroll smoothly to the tool form section so it feels like “opening the tool”

### Files touched
- `src/pages/services/DesignBuild.tsx`
- `src/pages/InteriorDesignAI.tsx`

### Acceptance checks
- “AI Design Studio” is always clearly clickable.
- The tool experience starts immediately and visibly (no confusion).

---

## F) Tool theme border consistency (Property Measurement: keep style, fix borders to match accent) + global pattern

### Current state (found)
- `PropertyMeasurement.tsx` uses teal accents in many places, but the main step cards are still `border-zinc-800`, and some key panels don’t consistently reflect the teal theme.
- `AIToolPremiumLayout.tsx` back button uses `variant="ghost"` with `className="text-white ..."`, but `Button` sanitization strips `text-white` and border color classes for non `ai-*` variants. This is a primary cause of “faded/unreadable” back buttons in tools.

### Implementation approach

#### F1) Fix Property Measurement borders (without changing its look)
In `src/pages/PropertyMeasurement.tsx`:
- Keep the color scheme exactly as-is
- Update the “main card” borders per step to use teal accent borders, e.g.:
  - Main step card: `border-teal-500/20` (or `border-teal-500/30`) instead of zinc
  - Inner step panels and selected states keep teal
- Ensure “Step 1: Property Information” card border matches the teal theme (your explicit request)

#### F2) Fix the “faded back button” problem at the root (AIToolPremiumLayout)
In `src/components/ai-tools/AIToolPremiumLayout.tsx`:
- Replace the back button styling so it does not rely on sanitized `text-white` / border color overrides.
- Use `variant="dark"` (which is already a locked, readable style) and only apply safe layout classes.
- If we still want accent, add a small accent indicator element (not via Button className that gets sanitized).

#### F3) Global audit pass (targeted, not guesswork)
Search for other places using:
- `variant="ghost"` + `text-white` on Buttons
- tool pages using `border-zinc-800` while clearly themed (teal/purple/emerald/etc.)

Then standardize:
- Back buttons: always readable
- “Main card” borders: match the tool’s accent color

### Files touched
- `src/pages/PropertyMeasurement.tsx`
- `src/components/ai-tools/AIToolPremiumLayout.tsx`
- Additional tool pages found by audit search (we will keep the changes minimal and consistent)

### Acceptance checks
- Property Measurement tool: borders match teal theme everywhere you expect.
- Tool back buttons are readable across all themed tools (no fading).

---

## G) Account menu: restore and “lock” Owner shortcuts so they don’t disappear again

### Current state (found)
- `MegaMenuAccount.tsx` still contains Owner Dashboard (gold), Admin Panel (purple), Ticket Support Hub (emerald).
- If you’re not seeing them, the most likely cause is timing/state:
  - `isOwner` is server-verified and initially false until `verify-owner` resolves
  - While that resolves, the “Owner Shortcuts” column can be hidden

### Implementation approach
1) In `src/components/header/MegaMenuAccount.tsx`
   - Add a **stable reserved Owner Shortcuts block** for the owner verification window:
     - If `ownerLoading === true`, show a premium “Verifying owner access…” placeholder area
     - Once verified, render the actual shortcut links
   - Add explicit “LOCK: do not remove owner shortcuts” comments around the three shortcuts.
2) In `src/components/GlobalHeader.tsx`
   - When opening account mega menu, trigger `refreshOwnerVerification()` (already available in AuthContext) to reduce the chance of stale owner state when the menu opens.

Security note: This does not grant access; it only stabilizes UI so owner shortcuts don’t flicker/disappear.

### Files touched
- `src/components/header/MegaMenuAccount.tsx`
- `src/components/GlobalHeader.tsx`
- (Only if needed): `src/contexts/AuthContext.tsx` (to ensure refresh function is exposed/used consistently; current API already includes it)

### Acceptance checks
- Owner shortcuts never “vanish” due to loading; at worst you see “Verifying…” for a moment, then the real shortcuts.
- Non-owners do not gain access; protected routes remain protected.

---

## Testing checklist (desktop + phone + iPad)
1) Desktop:
   - Hover “Insights”: 4 up / 4 down layout, no cropping, scroll works.
   - Click Search: modal opens perfectly centered, no cut-off.
   - Type “CRM”: CRM is first result (Owner), clicking navigates instantly.

2) Phone (iPhone/Android):
   - Search modal fits fully (no cropping), results scroll.
   - Tap any result: navigates and closes modal.

3) iPad:
   - Insights mega menu fits; no right/left clipping.
   - Search modal fits; no top/bottom cropping.

4) Design Build / Interior Design:
   - AI Design Studio is clearly clickable and launches the actual workflow.
   - Only one bottom contact section exists.

5) Property Measurement:
   - Step 1 main card border matches teal theme; same for other major themed cards.
   - Back buttons in AI tools are readable (no fading).

---

## Work items summary (files)
### Header + Search
- Edit: `src/components/header/MegaMenuInsights.tsx`
- Edit: `src/components/GlobalSearchModal.tsx`
- Add: `src/config/globalSearchIndex.ts`
- Edit (small): `src/components/GlobalHeader.tsx`

### CTA sections
- Edit: `src/components/CombinedContactNewsletter.tsx`
- Edit: `src/components/DirectContactCTA.tsx`
- Edit: `src/pages/services/Architecture.tsx` (remove duplicate DirectContactCTA)
- Edit: `src/pages/RentGuide.tsx` (remove duplicate DirectContactCTA)
- Edit: `src/pages/services/DesignBuild.tsx` (remove duplicate DirectContactCTA + CTA copy/link fixes)

### AI Design Studio clarity
- Edit: `src/pages/InteriorDesignAI.tsx`

### Tool theme consistency
- Edit: `src/pages/PropertyMeasurement.tsx`
- Edit: `src/components/ai-tools/AIToolPremiumLayout.tsx`
- Additional small edits to other tool pages discovered by audit (readability + accent-border consistency)

### Account shortcuts stability
- Edit: `src/components/header/MegaMenuAccount.tsx`

