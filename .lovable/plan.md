## Goal
Match every CTA button on `/profile` (Profile, Security, Settings tabs) to the squarer border-radius used by the phone-number input + country-code picker (rounded-sm, ~4px), instead of the more pill-rounded default.

## Changes — `src/pages/UserProfile.tsx`

Add `rounded-sm` (and consistent `h-10`) to every button so they all share the same corner radius as the PhoneInput row:

1. **Remove Photo** (line 504) — add `rounded-sm`
2. **Change** (email edit, line 570) — add `rounded-sm`
3. **Save Changes** (Profile tab, line 599) — add `rounded-sm h-10`
4. **Change Password** (Security tab, line 654) — add `rounded-sm h-10`
5. **Deactivate / Delete Account / Sign Out** (Settings tab, lines 721/736/753) — already `rounded-sm h-10 w-[160px]` from previous turn; leave as-is (they already match).

No other files touched. No logic / variant changes — only the className radius/height tokens.

## Result
All CTAs across Profile / Security / Settings tabs render with the same square-ish 4px corners as the phone country-code button and phone input field, giving the page a unified, less-rounded button language.
