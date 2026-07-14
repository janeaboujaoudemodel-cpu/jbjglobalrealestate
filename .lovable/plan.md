# Sign-up + Auth Premium Upgrade

## What I found in the current form

- **Mobile / WhatsApp number**: rendered as a single field with a dial-code selector _inside_ the same rounded border → looks like one broken field with an internal seam.
- **Country / Nationality / Preferred Language / Preferred Contact Method / Preferred Contact Time**: plain `<select>` or short lists — no flags, no search, no proper premium dropdown.
- **Blue focus/hover** leaking through — most likely Chrome's autofill blue on `input`s + shadcn's default focus ring `--ring` on this route.
- **Password field**: single input, no strength meter, no show/hide, "Generate strong password" is a plain text button.
- **Services chips**: all rendering as emerald-filled — the default state is wrong; only the _selected_ one should be emerald-filled-white.
- **Layout**: page is very tall because every field is stacked full-width instead of using the existing two-column grid tightly.

## Fix plan — Account step (`PublicAccess.tsx` account step block)

1. **Phone / WhatsApp input**
   - Split into two visually distinct controls with a small gap: a flag-dial-code picker (searchable, showing country flag + name + `+xxx`) and a plain phone-number input.
   - Remove the shared bordered wrapper. Each control gets its own champagne border, focus = emerald hairline (no blue).
   - Default dial code: UAE (+971), matches current preview.

2. **Country / Nationality**
   - Replace with a searchable Command/Popover dropdown listing all ~250 countries with SVG flag + English name.
   - Same primitive reused for both fields.

3. **Preferred Language**
   - Searchable dropdown with the full language list from `src/data/languages.ts`, each row showing the language name + native script.

4. **Preferred Contact Method / Preferred Contact Time**
   - Same premium dropdown primitive, static option lists (Method: Call / WhatsApp / Email / SMS; Time: Morning / Afternoon / Evening / Anytime).

5. **Kill blue**
   - Scope override on the sign-up page root: `input, [role="combobox"], [data-slot="trigger"] { --ring: 6 78 59; }` and `input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #F7F2EA inset !important; -webkit-text-fill-color: #1A1A1A !important; caret-color: #1A1A1A; }`. Removes both the focus ring blue and Chrome autofill blue.

6. **Password**
   - Show/hide eye toggle inside the field.
   - Live strength meter (4 emerald segments) with label (Weak → Strong) based on length + character classes.
   - "Generate strong password" becomes a compact champagne pill with a spark icon that fills the field and reveals it.
   - Minimum 8, but real feedback via meter.

7. **Services chips**
   - Default: champagne background `#F7F2EA`, gold border `#B89555`, ink text.
   - Hover: subtle champagne raise, gold ring.
   - Active: emerald `#064E3B` fill, pure white text, white check icon.
   - Never blue at any state.

8. **Layout tightening**
   - Two-column grid on desktop, single column ≤640px. Password stays full-width. Reduces vertical length by ~35%.

## OAuth branded consent screen ("Continue to …")

- The text on Google's consent screen is driven by the app name registered on Google's side, not by our code. On Lovable's **managed** Google OAuth (what this project uses today), the displayed app name is fixed by the shared broker and cannot be changed to "JBJ Global Real Estate" without switching to your own Google Cloud OAuth client. I will:
  - Set the project's public site metadata (title, description, support email) so anything Supabase controls (magic-link emails, auth callback page) reads "JBJ Global Real Estate · support: contact@jbj.ae".
  - Ship a **branded in-app auth callback page** at `/auth/callback` that shows the JBJ crest, "Continuing to JBJ Global Real Estate", support email, and a spinner while the session settles — this is what the user actually sees inside our app after Google bounces back.
  - Note in the reply that to change the Google-side "Continue to jbj.ae" wording you must provide your own Google OAuth client ID/secret and I'll wire them in.

## Welcome email

- Verify email infra is set up (`setup_email_infra` + `scaffold_transactional_email`). If not, run those first.
- Add a `welcome-signup.tsx` template: JBJ crest, greeting by first name, what happens next (verification, access, contact CTA), signature block with contact@jbj.ae. React Email inline styles, white body, emerald accents.
- Trigger `send-transactional-email` on successful signup from the account step submit handler, with `idempotencyKey: welcome-${user.id}`.
- Send a real test to **infoo.jane@gmail.com** as part of validation.

## Validation (E2E, with proof)

Playwright script `/tmp/browser/signup-e2e/run.py`:
1. Open `/access`, step through Category → Profile → Account.
2. Screenshot: full form default state (proof of chip colors, dial-code split, dropdowns).
3. Open each dropdown (country, nationality, language, contact method, contact time) → screenshot each open state.
4. Focus phone, password, name → screenshot to prove no blue focus ring.
5. Type into password → screenshot strength meter transitions Weak → Medium → Strong.
6. Click a service chip → screenshot showing emerald-filled active + others still champagne.
7. Fill form with a throwaway email, submit → screenshot success state, then verify welcome email in the send-transactional-email logs.
8. Attach all screenshots in the reply so you can see the fix, not just take my word for it.

## Technical notes (for the record)

- New primitives added under `src/components/access/`:
  - `PhoneField.tsx` (flag dial-code + number)
  - `SearchableCountrySelect.tsx`
  - `SearchableLanguageSelect.tsx`
  - `SearchableOptionSelect.tsx` (reused for method/time)
  - `PasswordField.tsx` (meter + toggle + generator)
  - `ServiceChip.tsx`
- Country list source: reuse existing dial-code / country data if present under `src/data/`; otherwise add a single `src/data/countries.ts` (name, ISO2, dial code, emoji flag).
- No changes to other pages' focus/blue behavior — scoped override lives on the sign-up route root only.

## Out of scope (explicitly not touched)

- Category and Profile steps' internals (only visually consistent chip/dropdown styling if they use the same primitives).
- Any other page's dropdowns or password fields.
- Any other email template.

---

**Please confirm** before I start:
- OK to add the `/auth/callback` branded page and note that the "Continue to jbj.ae" wording on Google's own screen requires your own Google OAuth client to change?
- OK to send the E2E welcome-email test to **infoo.jane@gmail.com**?
