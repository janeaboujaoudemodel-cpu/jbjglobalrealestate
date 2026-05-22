## Problem

On `/broker-dashboard` (and a few other routes like `/admin/*`, `/listing-admin`), the L-shaped frame disappears on desktop — no left sidebar, no top utility bar. Only the bare page content renders.

## Root cause

`src/config/mainLayoutRoutes.ts` classifies these as "back-office" routes:

```text
BACK_OFFICE_PREFIXES = ["/admin", "/listing-admin", "/broker-dashboard"]
```

Then `src/components/MainLayout.tsx` wraps the sidebar + utility-bar in `!isBackOfficeRoute && (...)`:

```text
{!isBackOfficeRoute && (
  <>
    <div data-chrome="sidebar"> <GlobalVerticalNav /> </div>
    <div data-chrome="utility-bar"> <HorizontalUtilityBar /> </div>
  </>
)}
```

On desktop the only "header" is the utility bar (the mobile `<GlobalHeader>` is `sm:hidden`). So those routes end up with zero chrome on desktop.

The owner back-office at `/owner/*` and the developer hub at `/developer-portal/*` are different — they live in their own dedicated route shells (`OwnerRoutes`, `DeveloperHubRoutes`) outside `MainLayoutWrapper` and bring their own chrome. The user wants those left as-is ("back end shows as it is currently").

## Fix

Make the L-shaped frame (vertical sidebar + horizontal utility bar) unconditional for every route mounted under `MainLayoutWrapper`. No more "back-office" exception for chrome.

### Edits

**`src/components/MainLayout.tsx`**
1. Remove the `!isBackOfficeRoute && (...)` wrapper around the sidebar + utility-bar blocks. Always render `<GlobalVerticalNav />` and `<HorizontalUtilityBar />`.
2. In the `<main>` padding-left classes, drop the `!isBackOfficeRoute ? ... : ""` ternary and always apply the `[body.jj-vertical-nav-active_&]:sm:pl-[200px] [body.jj-vertical-nav-collapsed_&]:sm:pl-[48px]` padding so content never slides under the sidebar.
3. Same change for the footer wrapper's padding-left.
4. Leave the existing "hide footer on back-office routes" behaviour alone (user only asked about header + sidebar).

### Not touched

- `OwnerRoutes` / `DeveloperHubRoutes` keep their dedicated shells — user explicitly wants the back end "as it currently is".
- `BACK_OFFICE_PREFIXES` stays (still used for footer suppression and `needsHeaderSpacing` logic) — only its effect on chrome visibility is removed.
- Mobile header path (`sm:hidden`) is unchanged; it was already always rendered.
- `StandaloneRoutes` (auth, signing pages, digital card, etc.) stay shell-less by design — they're not under `MainLayoutWrapper` at all and the user's request scoped to "front end" pages with the L-frame.

## Verification

After the change, load `/broker-dashboard` on desktop — the gold-bordered vertical sidebar and top utility bar should both render, identical to `/properties` or `/`. Spot-check `/admin/*` and `/listing-admin` too.
