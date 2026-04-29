# Fix: Tasks Popup → 404, Broken 404 Page, Black Edges, and Task Removal

## What's broken (root causes)

1. **Tasks popup leads to 404.** `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx` navigates to `/owner/dashboard#tasks`, but no such route exists. The owner index route is `/owner` (with `OwnerDashboardOverview` as `index`). Result: 404 on every click.

2. **404 page is broken.**
   - Outer wrapper uses `bg-black` + `jj-hero-fullscreen` → produces the black band you see at the edges around the card.
   - It collides with the "Ready to get started" footer because `pt-28 sm:pt-32 lg:pt-24` doesn't match the live header height (88px) and the card sits centered with no proper bottom safe-area against the next section.
   - Buttons are unreadable: gold→gold gradients with `text-black` on champagne backgrounds for outline buttons, plus low-contrast `text-black/40` "Attempted path" line.
   - The "Attempted path: /owner/dashboard" leak exposes internals to end users.

3. **"Black edges" on every page.** This is `MainLayout`'s outer `div` using `bg-background md:bg-[#ECE2D2]` while child pages (like `NotFound` and several hero sections) declare their own dark background only inside a centered card. The page background between sidebar edge and the card shows through. The fix is for full-bleed pages to fill the entire content area (sidebar-edge → right-edge) rather than centering a card on a contrasting backdrop.

4. **Task popup gets dismissed on every cancel/close.** `handleDismiss()` writes to `sessionStorage` so the popup never re-appears that day — including when the user simply taps "Later" or X. Per your rule "the task should never be removed," dismissal must not suppress the alert; only completing all tasks should.

## Changes

### 1. `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx`
- **Fix link**: navigate to `/owner#tasks` (valid index route). Add a fallback safety: also accept `/owner/tasks` if a real subroute exists; otherwise `/owner`.
- **Stop auto-suppressing the alert**:
  - Remove `sessionStorage` write on "Later" / X close. Keep it for the session only via in-memory state, so it returns next session/refresh until tasks reach 0.
  - Add a separate "Don't show again today" small link if you want opt-out, off by default.
- **Readable buttons**: replace gold gradient with `text-white` on dark `bg-foreground` for primary; outline button uses `text-foreground` (per CTA System Standard, no gold text in buttons).
- Keep modal styling otherwise; ensure aria-label on close.

### 2. `src/pages/NotFound.tsx` — full rebuild for institutional 404
- Replace `bg-black` + `jj-hero-fullscreen` with a full-bleed light surface that fills the content area edge-to-edge:
  ```tsx
  <div className="min-h-[calc(100dvh-88px)] w-full bg-background flex items-center justify-center px-4 sm:px-6 lg:px-10 py-12">
  ```
- Remove the framing `jj-layer-2 / jj-card-inner` so there is no contrasting black band around it. Card itself becomes a soft elevated surface (`bg-card border border-border shadow-sm rounded-2xl`) centered with `max-w-3xl`.
- Header spacing already provided by `MainLayout` (`md:pt-[88px]`). Remove the page's own `pt-28` to avoid double-offset and the collision with the "Ready to get started" section.
- Add a clear bottom margin (`mb-12`) so the footer/CTA banner does not visually touch the card.
- **Buttons**: use `<Button variant="primary">` and `variant="secondary"` defaults from the design system (high contrast, no gold text). Keep WhatsApp / Call / Email as ghost-style chips with `text-foreground`.
- **Remove the "Attempted path: …" debug line from production UI**. Keep `console.error` for observability only.
- Keep popular destinations grid, search, and Need Assistance section. Nothing is removed.

### 3. Global "edge-to-edge" page rendering — `src/components/MainLayout.tsx` + page wrappers
- The visible black/dark edges come from pages declaring their own dark hero inside a centered max-width container while the body shows the layout's pearl/`#ECE2D2` background. Two-line fix:
  - In `MainLayout`, the `<main>` already has `w-full max-w-full`. Add `bg-background` to it so the content lane is one consistent surface from the sidebar edge to the right viewport edge (no body color showing through gaps).
  - For routes that intentionally use a dark hero (Home, About, BrokerEducation, etc.), the hero already spans `w-full`. We do not change those. We only ensure the *page surrounding* the hero is full-bleed.
- For `NotFound` specifically, the page now spans the full content lane (no centered black card on champagne background).

### 4. Route safety net
- In `src/routes/PublicRoutes.tsx` add an alias:
  ```tsx
  <Route path="/owner/dashboard" element={<Navigate to="/owner" replace />} />
  ```
  This permanently catches any other place still pointing at the old path so users never see a 404 from an internal link again.

### 5. Quick audit pass
- Grep the codebase for any other `/owner/dashboard` or `/owner-dashboard` links and normalise them to `/owner`. Found candidates so far:
  - `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx` (fixed in #1)
  - `src/pages/Dashboard.tsx` (comment only — no functional impact, but I'll align the comment).
- Ensure no other component links to a non-existent owner subroute.

## Files to edit

- `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx`
- `src/pages/NotFound.tsx`
- `src/components/MainLayout.tsx` (one-line `bg-background` on `<main>`)
- `src/routes/PublicRoutes.tsx` (add `/owner/dashboard` redirect alias)
- `src/pages/Dashboard.tsx` (comment cleanup only)

## Out of scope / preserved

- L-shaped 88px frame, sidebar, header, footer — unchanged.
- Hero pages with intentional dark backgrounds — unchanged.
- All existing 404 features (search, popular destinations, Need Assistance, back/home buttons) — preserved.
- No data, no routes, no features removed (per "No Removal" policy).

## Verification

- Click the Pending Tasks popup → lands on `/owner` overview with `#tasks` anchor; no 404.
- Visit a non-existent route (e.g., `/foo`) → see clean institutional 404, full-bleed light surface from sidebar edge to right edge, readable primary/secondary buttons, no black band, no "Attempted path" leak, comfortable gap above the "Ready to get started" CTA.
- Dismiss popup with "Later" → re-appears on next session/refresh (no silent suppression).
- Sample a few normal pages (Properties, About) at desktop and mobile to confirm no black edges.
