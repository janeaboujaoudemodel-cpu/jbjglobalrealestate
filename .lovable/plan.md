# Fix: Remove the heavy "cream box + gold frame" around every form field

## What's broken (from screenshot)
On the Register Interest form (and every other lead form using the same recipe), each field — Developer, Select Emirate, Location, Select timeline, Select time, Preferred contact method, Additional Notes, etc. — is rendered inside a **cream-filled rectangle with a thick `border-2 border-[#B89555]/50` gold frame**. That makes each field look like a boxed card. The user wants the boxed look removed so fields read as clean inputs with a single soft-gold hairline (the global rule already added in `index.css`).

The only places a wrapper is still wanted are the **multi-select pill groups** (Bedrooms, Preferred Size sqft) — but right now the group's border hugs the pills with zero padding, so the gold frame visually touches "Any / < 800 / 2,500+ sqft". That needs breathing room.

## Scope (all lead-capture / consultation surfaces)
1. `src/components/ConsultationRequestForm.tsx` — primary offender. Drop the `bg-[#FDFBF7] border-2 border-[#B89555]/50` recipe on `inputClass`, `selectTriggerClass`, and the textarea/popover triggers (nationality/language Comboboxes). Replace with a minimal `h-12 rounded-lg` className and let the global soft-gold hairline rule in `src/index.css` paint the border at rest/hover/focus. The phone trigger already follows the new static-metallic rule and is left alone.
2. `src/components/project-detail/ProjectInquiryForm.tsx` — same recipe (`border-2 border-[#B89555]/50 bg-gradient-to-br from-[#FDFBF7]…`) on every SelectTrigger and Popover trigger. Strip the gradient + 2px border; rely on the global hairline.
3. `src/components/project-detail/LeadCaptureModal.tsx` — same gradient+thick-border on the inner Card and field triggers. Keep the modal panel, but the inner field controls drop the boxed look.
4. `src/components/forms/LeadFormModule.tsx` — `bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-xl border-2 border-[#B89555]/30 p-6 md:p-8` outer panel can stay (panel ≠ per-field box), but its inner field classes follow the new rule too.
5. Wrap the **Bedrooms pill group** and **Preferred Size pill group** (only — these are the multi-selects) in a `rounded-xl border border-[#B89555]/35 p-4 md:p-5` container so the gold hairline sits with ≥16px of padding from the pill row and never touches a pill or label. Group label sits above the box. No other field gets a wrapper.

## Global rule lock
Add a short note + memory update so future edits don't re-introduce the boxed look:
- Update `.lovable/memory/ui-ux/visual-standards/global-dropdown-and-cta-lock.md` (or add a sibling `form-field-no-boxed-frame.md`) with: "Form fields render as clean inputs with the global 1px gold hairline. Never wrap a single field in `bg-[#FDFBF7] border-2 border-[#B89555]/…`. Only multi-select pill groups may carry a wrapper, and it must keep ≥16px inner padding."

## Validation (visual only, per user)
- `browser--view_preview` to `/project/vindera-emaar-properties-the-valley` at desktop (1440) and mobile (390) widths.
- Screenshot the Register Interest form section, confirm:
  - No field shows a cream-filled rectangle / thick gold frame; each input is clean with a single soft-gold hairline.
  - Bedrooms + Preferred Size pill groups sit inside one padded wrapper with no border touching the pills or "2,500+ sqft" text.
  - Open the Timeline and Contact Method selects and confirm the popover surface (champagne gradient + gold hairline) is unchanged from the previous fix.
- Cross-check one other surface (`ProjectInquiryForm` modal trigger or `LeadCaptureModal`) to confirm the recipe change propagated.

No backend / functional changes.