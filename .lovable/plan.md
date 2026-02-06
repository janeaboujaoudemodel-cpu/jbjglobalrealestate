
<context>
Reported issues:
1) Mode Switcher inside the header “My Account” mega menu still closes the entire account dropdown immediately when you click a mode.
2) Email change flow: OTP email not arriving, and the email-change dialog/OTP step is visually broken/cropped on small screens.

Constraints:
- Fix must be stable on desktop + mobile.
- Keep dropdowns opaque with correct z-index.
</context>

<diagnosis>
A) Why the Mode Switcher still closes the account dropdown
- GlobalHeader adds a document-level “click outside” listener when a mega menu is pinned open:
  - It closes the mega menu if the click target is not inside headerViewportRef.
- Radix DropdownMenuContent renders in a Portal attached to document.body.
  - That Portal is NOT inside headerViewportRef.
  - So when you click an item in ModeSwitcher, the document click-outside handler interprets it as “outside” and closes the entire account mega menu.

This is a different closing path than the backdrop click / mouseleave logic we previously adjusted, which is why the issue persists.

B) Why “Switch Mode” shows a loading spinner in the account menu
- ModeSwitcher uses src/hooks/useUserMode.ts which sets isLoading=true on mount and does a DB sync.
- The account mega menu content mounts/unmounts when opened/closed, so ModeSwitcher remounts and briefly shows loading each time.
- There is already a global UserModeProvider (src/contexts/UserModeContext.tsx) mounted in App.tsx, but ModeSwitcher is not using it.

C) Why the email change dialog is cropped / “coming out of the screen”
- In UserProfile.tsx, DialogContent adds `overflow-visible`.
- The base DialogContent already enforces `max-h-[90vh] overflow-y-auto`.
- `overflow-visible` overrides that behavior, which can allow content/footer to overflow off-screen on small devices and appear “broken”.

D) Why OTP “not received”
- Backend function send-email-otp currently can succeed even if delivery fails, and the UI relies on a toast fallback when `dev_otp` is present.
- If toasts/dialogs are behind the mega menu layering (z-index), the user may never see the fallback code or status messages.
- Additionally, send-email-otp / verify-email-otp CORS allow-headers is minimal; to harden reliability across browsers, we should include the standard extra client headers.
</diagnosis>

<plan>
<step number="1" title="Stop the account mega menu from closing when interacting with Radix Portals (ModeSwitcher dropdown)">
Change: src/components/GlobalHeader.tsx
- Update the “click outside” handler (the document.addEventListener("click", handleClickOutside)) so it DOES NOT close the mega menu when the click originates inside a Radix portal.

Implementation detail:
- In handleClickOutside(e):
  - `const target = e.target as HTMLElement`
  - if `target.closest('[data-radix-portal]')` then return (do not close mega menu)
  - else keep existing “outside headerViewportRef” logic.

Why this works:
- ModeSwitcher’s dropdown content lives in a Radix portal. Treating portal clicks as “inside” prevents the immediate ejection.

Optional hardening (if needed after testing):
- Swap the listener from `"click"` to `"pointerdown"` (more consistent on mobile/touch + prevents intermediate focus changes).
- Also ignore elements with `[data-state="open"]` triggers if Radix uses them, but portal check should be sufficient.

</step>

<step number="2" title="Eliminate the Mode Switcher spinner/flicker by using the global UserModeProvider state">
Change: src/components/ModeSwitcher.tsx
Change: src/components/header/MegaMenuAccount.tsx
- Replace usage of `useUserMode()` (hook) with `useUserModeContext()` (context) so ModeSwitcher uses the already-mounted global state and doesn’t re-enter a loading phase on each mega menu open.

Implementation detail:
- ModeSwitcher:
  - `import { useUserModeContext } from "@/contexts/UserModeContext";`
  - Use `{ mode, isLoading, setMode }` from context.
  - Remove unused imports: `useNavigate`, and unused `role` variable from useUserRole.
- MegaMenuAccount:
  - Replace `const { mode } = useUserMode();` with context too (keeps labels stable).

Result:
- The “Switch Mode” label should no longer show the spinning loader every time you open the account menu, unless the app is genuinely initializing.

</step>

<step number="3" title="Fix email-change dialog cropping on mobile by restoring scroll constraints and safe sizing">
Change: src/pages/UserProfile.tsx
- Update the email change DialogContent classes:
  - Remove `overflow-visible`.
  - Explicitly enforce a mobile-safe max height and scrolling:
    - `max-h-[calc(100dvh-2rem)] overflow-y-auto`
  - Ensure padding is mobile-friendly:
    - `p-4 sm:p-6` (so content doesn’t push footer off-screen)
  - Keep width rule:
    - `w-full max-w-[calc(100vw-2rem)] sm:max-w-md`

Also adjust OTP section layout (only if needed after visual check):
- Ensure the OTP group cannot overflow horizontally:
  - Add `max-w-full` and keep `flex-wrap justify-center`.
- Keep slot sizing already present:
  - `w-10 h-12` on mobile, `sm:w-12 sm:h-14` on larger.

Expected outcome:
- “Verify & Change Email” button remains reachable on small screens via scrolling; no cropped footer.

</step>

<step number="4" title="Make dialogs and toasts always appear above the mega menu (z-index layering fix)">
Change: src/components/ui/dialog.tsx
Change: src/components/ui/sonner.tsx
- Dialog currently uses z-50; mega menu uses z-[9998]/z-[9999]. That can cause dialogs opened from within mega menus (or while a menu is open) to appear behind overlays.
- Raise Dialog overlay + content z-index to be above the mega menu:
  - Overlay: z-[10050]
  - Content: z-[10050]
- Raise Sonner toaster container z-index above mega menu:
  - Add a class or inline style to ensure it renders at e.g. z-[11000].

Expected outcome:
- OTP status toasts (and any fallback) are always visible.
- Any dialog opened while a mega menu is open will not be obscured.

</step>

<step number="5" title="Improve OTP email reliability and debugging without breaking security">
Change: supabase/functions/send-email-otp/index.ts
Change: supabase/functions/verify-email-otp/index.ts (CORS only)
- Expand CORS allow-headers to include common client headers (prevents browser-specific preflight failures):
  - authorization, x-client-info, apikey, content-type,
  - x-supabase-client-platform, x-supabase-client-platform-version,
  - x-supabase-client-runtime, x-supabase-client-runtime-version

- Adjust send-email-otp response behavior:
  - If Resend returns a non-OK response:
    - Return `{ error: "Email could not be delivered. Please try again." }` with an appropriate status (e.g., 502)
    - Log the response text for backend diagnostics.
  - Keep success messages accurate.

Important security note:
- Returning `dev_otp` to the frontend defeats “prove new email ownership”.
- If you still need a temporary fallback in Preview only, we will gate it behind an explicit backend flag (secret), and keep it disabled in production. (We will not expose OTP by default.)

</step>

<step number="6" title="Verification checklist (end-to-end)">
Desktop (header account mega menu):
1) Open account icon menu.
2) Open “Switch Mode” dropdown.
3) Select Investor / Broker / Investor+Broker.
4) Confirm:
   - The account mega menu stays open (no immediate close/eject).
   - A success toast shows.
   - Mode label updates correctly.
   - No persistent spinner on “Switch Mode”.

Mobile (email change dialog):
1) Go to /profile.
2) Tap Change next to email.
3) Confirm:
   - Dialog fits the viewport; content scrolls instead of cropping.
4) Tap Send Verification Code.
5) Confirm:
   - A visible success/error toast appears (not behind overlays).
6) Enter OTP and Verify & Change Email.

</step>

</plan>

<files-to-change>
- src/components/GlobalHeader.tsx
- src/components/ModeSwitcher.tsx
- src/components/header/MegaMenuAccount.tsx
- src/pages/UserProfile.tsx
- src/components/ui/dialog.tsx
- src/components/ui/sonner.tsx
- supabase/functions/send-email-otp/index.ts
- supabase/functions/verify-email-otp/index.ts
</files-to-change>

<risk-and-mitigation>
- Raising dialog/toast z-index affects all dialogs/toasts:
  - Mitigation: keep values only slightly above mega menu (10050/11000) and below any potential future system overlays if needed.
- Ignoring portal clicks in click-outside logic could keep menus open when clicking certain portal-based widgets:
  - Mitigation: we restrict the exception to `[data-radix-portal]` only; clicking elsewhere still closes normally.
- OTP security:
  - Mitigation: do not expose dev_otp in production; gate any debug behavior behind an explicit secret for Preview only.
</risk-and-rollback>
