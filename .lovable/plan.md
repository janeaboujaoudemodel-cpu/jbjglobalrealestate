

## Fix: jbj.ae redirects to /contact instead of homepage

### Root cause
`src/components/RouteResume.tsx` auto-redirects `/` → last visited route from `localStorage["last-route"]`. If the user last viewed `/contact` on mobile, every fresh visit to jbj.ae bounces them to `/contact`. This is unwanted behavior — visiting the root domain should always show the homepage.

### Fix

**`src/components/RouteResume.tsx`** — remove the generic last-route auto-redirect. Keep only:
- The Interior Design AI in-progress resume (sessionStorage-based, intentional UX for an unfinished tool)
- The recent-pages tracking (used by the account dropdown)

Specifically:
1. Delete the block (lines ~92-96) that calls `navigate(lastRoute, { replace: true })` based on `localStorage["last-route"]`.
2. Stop writing `last-route` to localStorage (lines ~33, 43) since nothing else consumes it. Keep the `jj_recent_pages` tracking intact.
3. Add a one-time cleanup: `localStorage.removeItem("last-route")` so existing users with a stale value stop being redirected on their next visit.

### Why not keep it gated to certain routes?
Root domain visits should be deterministic. "Resume where I left off" belongs behind an explicit user action (e.g. a "Continue browsing" card on the homepage, which the recent-pages list already powers), not a silent redirect that hijacks `/`.

### Files touched
- `src/components/RouteResume.tsx`

### Deliverable
- Visiting jbj.ae (mobile or desktop) always lands on the homepage `/`.
- Recent-pages tracking for the account dropdown still works.
- Interior Design AI resume flow still works.
- Live mobile screenshot at 390×844 of jbj.ae loading the actual homepage hero, not /contact.

