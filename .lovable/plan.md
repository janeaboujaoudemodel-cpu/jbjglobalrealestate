## Issue confirmed

Reproduced by clicking "My Shortcuts" — the flyout panel renders all groups (My Tasks, Quick Access, CRM, AI & Tools, …) but content past CRM (AI & Tools onward) is clipped at the viewport bottom and **cannot be scrolled**. The inner scrollbar never engages.

### Root cause

In `src/components/navigation/GlobalVerticalNav.tsx` (lines 860–879), the shortcuts flyout card looks like this:

```
<div className="… overflow-hidden … max-h-[calc(100vh-100px)]">   ← outer card
  <div className="… header …" />                                   ← header row
  <div className="overflow-y-auto … p-3 pb-6 space-y-3">          ← scroll list
    {groups…}
  </div>
</div>
```

The outer card has `max-h-[calc(100vh-100px)]` and `overflow-hidden`, but it is **not a flex column**. The inner scroll list has `overflow-y-auto` but no height constraint, so it grows to its natural content height. When that natural height exceeds the card's `max-h`, the outer `overflow-hidden` simply clips the bottom — and because the scroll container itself was never bounded, its internal scrollbar never activates. Result: everything below CRM is invisible and unreachable, exactly as the user reports.

The other flyouts (developers / areas) work because they're shorter than 100vh on a 1080px display, so they coincidentally never hit the cap.

## Fix

Single-file change in `src/components/navigation/GlobalVerticalNav.tsx`, shortcuts flyout (lines 860–879):

1. Add `flex flex-col` to the outer card so children stack and respect the `max-h` cap.
2. Add `flex-shrink-0` to the header row so it never gets squeezed.
3. Add `flex-1 min-h-0` to the scroll list — `min-h-0` is the crucial bit that lets a flex child shrink below its content height and allows `overflow-y-auto` to actually engage.

After the fix:

```
<div className="… flex flex-col … overflow-hidden … max-h-[calc(100vh-100px)]">
  <div className="flex-shrink-0 … header …" />
  <div className="flex-1 min-h-0 overflow-y-auto … p-3 pb-6 space-y-3">
    {groups…}                                      ← scrolls inside the card
  </div>
</div>
```

No other flyout needs to change — they already fit. No design tokens, no other files affected.

## Verification

After the change:
1. Open `/` (or any page).
2. Click **My Shortcuts** in the sidebar.
3. Confirm the panel scrolls: CRM, AI & Tools, and all subsequent groups become reachable via the inner gold scrollbar.
4. Click outside / X to close — confirm no layout regression.

## Files to edit

- `src/components/navigation/GlobalVerticalNav.tsx` — wrap the shortcuts flyout card as a proper flex column with a bounded scroll body.