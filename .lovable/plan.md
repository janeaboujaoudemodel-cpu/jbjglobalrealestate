Six bundled changes, all UI/template/config only.

## 1. Departments — rename + add "Property Consultant" + premium "Other…"
File: `src/hooks/useHRJobOffers.ts` (DEPARTMENTS array) and `src/components/document-studio/DocumentStudio.tsx` (department picker).

- Rename `Leadership & Legal` → `Legal`.
- Insert `Property Consultant` as the first option (premium label that is treated everywhere as broker; everything broker-related in the doc/contract output continues to flow through this department).
- Replace the existing "+ Add custom department" plain prompt with a premium inline "Other…" item in the `<Select>`. Choosing "Other…" opens a champagne inline input directly under the select (no browser prompt) where the user types the exact title; on confirm the value becomes the active department, is appended to `customDepartments`, and is rendered verbatim into the contract body (the same `department` string is already what reaches `standardBody.ts` / `buildAi`, so the contract will restructure around whatever title is typed).
- Keep existing rename/delete affordances for custom entries.

## 2. Job Offer template — real UAE clauses instead of "shall apply in accordance with UAE…"
File: `src/templates/composers/standardBody.ts` (job offer block ~line 51).

Replace the single fallback sentence with five explicit, plain-English clauses written to match standard Dubai real-estate company practice under UAE Federal Decree-Law No. 33 of 2021:

- **Probation** — up to 6 months from the start date; either party may terminate with 14 days' written notice during probation; no end-of-service gratuity accrues during this period.
- **Working hours** — 48 hours per week, Monday to Friday 9:00–18:00 with a 1-hour break, plus a half-day Saturday rotation as agreed; reduced hours during Ramadan in line with UAE law.
- **Annual leave** — 30 calendar days of paid annual leave per completed year (2.5 days per month after probation), in addition to UAE public holidays.
- **End-of-service gratuity** — calculated on last basic salary: 21 days' basic pay per year for the first 5 years and 30 days per year thereafter, capped at 2 years' total pay, payable on lawful termination after 1 year of continuous service.
- **Notice period** — 30 calendar days' written notice by either party after probation (60 days for senior/managerial roles), with handover of all company property, leads, and confidential material as a condition of final settlement.

Wording remains overridable by `f.notes`. No schema or business-logic changes.

## 3. Signature & Stamp dialog — fix "stuck" + add Draw + AI polish + AI generate
Files: `src/components/document-studio/assets/AssetLibraryDialog.tsx`, `SignatureCapture.tsx`, plus one new edge function.

- Investigate the "stuck on open" symptom: the dialog already mounts `<SignatureCapture>` / `<StampUpload>` behind tabs. The most common stuck-state is the trigger button being intercepted by the toolbar. Verify in build mode by clicking; if `assetDialog` state isn't flipping, hoist the buttons out of any pointer-events:none parent and ensure `setAssetDialog("signature")` runs before any other handler.
- `SignatureCapture` already exposes Draw / Type / Upload tabs — make **Draw** the default (it already is) and surface two extra actions in the Draw tab footer once the user has drawn at least one stroke:
  1. **Polish with AI** — sends the drawn PNG to a new edge function `signature-polish` which calls Lovable AI (`google/gemini-3.1-flash-image-preview`, image edit) with prompt: "Refine this handwritten signature into a clean premium founder-style signature. Preserve the exact shape, slant, letterforms and proportions. Smooth the strokes, even line weight, remove paper noise. Transparent background." Returns transparent PNG, replaces canvas content; user can Save or Polish again.
  2. **Generate with AI** — requires a "Full name" input (added below the canvas, defaults to the user's profile name). Sends the drawn PNG + name to `signature-generate` edge function which calls the same image model with prompt: "Using this handwritten sample as a style reference, generate 4 premium founder/CEO signature variants for the name '{fullName}'. Single-stroke, confident, elegant, transparent background, 1024x256." Returns 4 transparent PNGs displayed in a 2×2 chooser; clicking one drops it back into the canvas so the user can Save.
- New edge function files: `supabase/functions/signature-polish/index.ts` and `supabase/functions/signature-generate/index.ts`, both auth-gated via `requireOwnerAuth` and using `LOVABLE_API_KEY`. Update `supabase/config.toml` with their blocks.
- Stamp dialog stays upload-only as today; no functional changes.

## 4. Header — bigger monogram + larger, gap-filling wordmark
File: `src/components/GlobalHeader.tsx` (lines ~667–700).

- Increase monogram size: `w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 xl:w-32 xl:h-32` → `w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 xl:w-[160px] xl:h-[160px]` (still capped by the 88 px header rule via internal scale, kept inside `overflow-hidden` parent).
- Wordmark: bump from `text-xs sm:text-sm xl:text-base` to `text-sm sm:text-base xl:text-2xl 2xl:text-[28px]`, keep tracking, drop `truncate` on the xl+ breakpoints so the full string can extend toward the right.
- Wordmark text becomes `JBJ Global Real Estate L.L.C S.O.C.` so the legal suffix sits inline next to the company name (eliminates the empty space on the right).
- Tagline ("Excellence in Real Estate") size bumped to `text-[10px] sm:text-[11px] xl:text-[13px]`.
- Allow the left brand block to grow: change parent from `min-w-0 flex-1` to `min-w-0 flex-[2]` so wordmark wins more of the row before nav.

## 5. Footer contact strip — capitalized + clickable + tighter address + phone added
File: `src/components/Footer.tsx` (lines ~605–635), `src/constants/stats.ts`.

- `CONTACT_INFO.address`: `Downtown Dubai, UAE` → keep (already abbreviated). Confirm no remaining `United Arab Emirates` string in Footer.
- Add `websiteCapitalized: 'WWW.JBJ.AE'` to `CONTACT_INFO` and a helper `getWebsiteUrl = () => 'https://jbj.ae'`.
- In the contact strip, render four equally-spaced chips in this order, each `inline-flex` clickable anchor with comfortable `gap-3`:
  1. **Location** — `<MapPin>` `Dubai, UAE` (label only, plain `<span>`).
  2. **Phone** — `<a href={getCallUrl()}>` showing `+971 54 716 7107` (already capitalized format).
  3. **WhatsApp** — `<a href={getWhatsAppUrl()} target="_blank">` showing `WHATSAPP`.
  4. **Email** — `<a href={getEmailUrl()}>` showing `CONTACT@JBJ.AE` (already uppercase via `emailCapitalized`).
  5. **Website** — new `<a href={getWebsiteUrl()} target="_blank">` showing `WWW.JBJ.AE`.
- All labels uppercased via `uppercase tracking-[0.12em]` class on the text span; chips keep current champagne/ink styling, just widen `gap-x-3` → `gap-x-4` on the row so the items breathe.

## 6. Verification
After build:
- Open Document Studio → confirm "Legal" appears (not "Leadership & Legal"), "Property Consultant" is first, and selecting "Other…" reveals an inline input that writes back into the contract preview.
- Open Job Offer template → confirm the 5 clauses render verbatim instead of the old sentence.
- Click Signature → dialog opens; Draw → stroke → Polish/Generate buttons appear and produce transparent PNGs.
- Stamp button opens dialog with upload tab.
- Header monogram is visibly larger and the wordmark including `L.L.C S.O.C.` fills toward the nav.
- Footer chips: phone/whatsapp/email/website all click through, all uppercase, address reads `Dubai, UAE`.

## Out of scope
- No DB schema changes.
- No changes to Form I layout (already locked in prior turns).
- No changes to CV builder borders (already gold from previous turn).
