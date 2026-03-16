

## Plan: Remove Duplications & Clarify Save/Favorites Buttons

### Duplications Found

| Feature | HorizontalUtilityBar | FilterShortcutBar | FilterToolbar |
|---------|---------------------|-------------------|---------------|
| Currency Switcher | Yes | Yes (ConnectedCurrencyButton) | No |
| Advanced Filter button | Yes | Yes | No |
| Favorites (Heart → /favorites) | Yes | No | Yes |
| Saved Filters (Heart icon!) | No | Yes (confusing icon) | Yes (Save popover) |
| Map link | No | Yes | Yes |
| Shortlist | No | No | Yes |

### Changes

**1. Remove duplicated controls from `FilterShortcutBar`** — Since the `HorizontalUtilityBar` already has Currency and Filter buttons globally, remove `ConnectedCurrencyButton` and the Filter button from `FilterShortcutBar`'s Row 1. This avoids showing Currency and Filter twice on every page.

**2. Fix the confusing "Saved" button icon in `FilterShortcutBar`** — Currently uses a filled black Heart (`<Heart fill-black>`) which looks identical to "Favorites." Change it to a `Bookmark` icon (or `Save` icon from Lucide) and rename the label from "Saved" to "Saved Filters" to clearly distinguish it from favorite properties.

**3. Clarify the Favorites button in `HorizontalUtilityBar`** — The Heart icon at line 183 links to `/favorites` but has no label. Add a hidden xl label "My Properties" or keep the tooltip but ensure it says "Favorite Properties" to distinguish from saved filters.

**4. Delete `FilterToolbar` component** — It is imported in `Properties.tsx` but never rendered (dead code). Its functionality (Save Filter, Favorites link, Shortlist link, Map link) is fully covered by `FilterShortcutBar` + `HorizontalUtilityBar`. Remove the import from `Properties.tsx` and delete the file.

**5. Remove `ConnectedModeButton` from `FilterShortcutBar`** — The `HorizontalUtilityBar` already has `ModeSwitcher` in the right rail. Having a mode toggle in both bars is redundant.

### Files to edit

- **`src/components/filters/FilterShortcutBar.tsx`** — Remove `ConnectedCurrencyButton`, Filter button, and `ConnectedModeButton` from Row 1. Change `ConnectedSavedButton` icon from `Heart` to `Bookmark` and label to "Saved Filters."
- **`src/components/navigation/HorizontalUtilityBar.tsx`** — Update Favorites tooltip to say "Favorite Properties" for clarity.
- **`src/pages/Properties.tsx`** — Remove unused `FilterToolbar` import.
- **`src/components/filters/FilterToolbar.tsx`** — Delete file (dead code, fully replaced by FilterShortcutBar + HorizontalUtilityBar).

