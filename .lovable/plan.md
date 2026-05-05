## Goal

Stop showing any "mode" UI to a brand-new visitor before they have explicitly picked a category. The mode badge / selector should only appear *after* the user picks their role from the home "Tell us who you are" section (or from the in-app switcher once they have one). No forced modal, no placeholder "Investor" badge in the footer on first visit.

## Current behaviour (why it's wrong)

1. `src/components/Footer.tsx` (line 562) renders:
   ```tsx
   <ModeSwitcher variant="header" showForUnselected={true} side="top" />
   ```
   The `showForUnselected={true}` flag bypasses the guard inside `ModeSwitcher.tsx` (line 103) that normally hides the badge until the user has chosen. Result: every visitor immediately sees a coloured "Mode: Investor" chip in the footer even though they never picked anything.

2. `src/components/ModeSelectionModal.tsx` (lines 61-65) auto-opens a non-dismissable modal for any logged-in user who hasn't chosen a category yet. The user wants role selection to happen from the home `CategorySelectorSection` ("Tell us who you are"), not from a forced popup.

3. `MegaMenuAccount` already calls `<ModeSwitcher variant="header" />` without `showForUnselected`, so it correctly stays hidden until a mode exists — that one is fine.

## Changes

### 1. `src/components/Footer.tsx`
- Remove the `showForUnselected={true}` prop from the footer `ModeSwitcher` (line 562) so the badge — and its surrounding "|" divider — is hidden until the user has actually picked a category. Also conditionally render the adjacent `<span ... w-px ...>` divider so we don't leave an orphan separator when the switcher is hidden.

### 2. `src/components/ModeSelectionModal.tsx`
- Remove the auto-open `useEffect` (lines 61-65) and the `isForcedOpen` lockdown (lines 72-73, 111-119, 126-129). The modal stays available for components that explicitly call `requestToShow()` but no longer pops up by itself on login. Logged-in users without a selection are funnelled through the home page `CategorySelectorSection` instead.

### 3. `src/pages/Auth.tsx`
- The comment on line 258 ("ModeSelectionModal will force-open until they pick a category") becomes stale. Update the comment and, if Auth was relying on the forced modal to bounce a freshly-signed-in user into role selection, add an explicit `navigate('/?preselect=...')` (or `/welcome`) so newly-registered users land on the home category selector instead.

## What stays the same

- `CategorySelectorSection` on the home page is the canonical entry point for picking Investor / Broker / Developer.
- `ModeSwitcher` in the header (`MegaMenuAccount`) and the footer keeps working — it just won't render until `hasMadeInitialSelection === true`.
- `UserModeContext`, DB persistence, and `register-mode-lead` invocation are untouched.
- No DB / RLS / edge-function changes.

## Acceptance

- Anonymous visitor on `/` sees no mode badge in the footer or header. They can only set a mode by clicking a card in "Tell us who you are".
- Newly-registered logged-in user is NOT trapped behind a forced modal; they land on the home page (or `/welcome`) and pick from the category section.
- Once a mode is chosen, the footer mode chip + header switcher reappear and behave exactly as today.
