I’ll fix the mode selector so it is not hidden for users who have not selected a mode yet.

Plan:
1. Update the shared `ModeSwitcher` behavior so `showForUnselected` means: render the badge even when no mode has been selected, with the closed label showing `Select your mode` instead of pretending the user is already in Investor mode.
2. Restore the footer usage to always pass `showForUnselected={true}` so the footer badge remains visible and clickable before selection.
3. Remove the extra footer conditional that currently hides the switcher until `hasMadeInitialSelection` or a role exists.
4. Update the account menu placement so the mode selector card can also show the dropdown before selection, if it is rendered there.
5. Keep the dropdown options as Investor, Broker, Investor + Broker, and Developer, with the existing selection saving logic unchanged.
6. Preserve the login-first behavior: selecting a mode will still use the existing `setMode` flow and backend sync; I will not re-enable the forced popup that appears immediately on website entry.

Technical notes:
- The problem is from the previous change in `src/components/Footer.tsx`, where `ModeSwitcher` was wrapped in `showModeSwitcher` and no longer received `showForUnselected`.
- `src/components/ModeSwitcher.tsx` already supports `showForUnselected`, but its trigger still derives the label from the default `mode` value. I’ll make the unselected trigger explicitly read `Select your mode`.
- No database or backend changes are needed.