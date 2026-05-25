## Goal

Reverse the recent "navy border + champagne fill" treatment on form inputs. All form fields should blend with the card/page background (transparent fill) and use the soft beige/gold border standard. No fields removed — visual styling only.

## Fields explicitly in scope on `/join`

1. Search bar — "Search position by title, department, or location"
2. First Name
3. Last Name
4. Email
5. Phone Number (the text input next to the country-code pill)

Plus the same treatment applied globally to every other form on the site via the existing `[data-jbj-form]` standard.

## Visual rules (locked into the global standard)

- Background: `transparent` (inherits card/page champagne — no white, no champagne fill that contrasts the card)
- Border: `1px solid var(--t-gold-soft)` (≈ `rgba(184,149,85,0.40)`) — soft champagne/gold hairline, not navy
- Focus border: `1px solid var(--t-gold)` + `ring` `var(--t-gold-ring)`
- Text: `var(--t-ink)` `#1A1A1A`
- Placeholder: `var(--t-ink-soft)` (ink @ 70%)
- Label: ink, semibold, consistent size/spacing
- Height: `h-12` (3rem) across all inputs/selects/search
- Radius: `rounded-lg` (consistent with `<SearchableSelect />` / nationality picker)
- Width: full-width inside form column, responsive grid unchanged

## Country-code pill (phone input)

Keep the pill itself as the existing navy `#102540` with white flag/code/arrow icons (user previously locked this). Only the **adjacent phone number input** changes to the transparent + gold-hairline treatment.

## Files to update

1. `src/styles/theme-tokens.css`
   - Rewrite the `[data-jbj-form]` block: swap `background:#F7F2EA` → `background:transparent`, swap `border:2px solid #102540` → `border:1px solid var(--t-gold-soft)`, update focus to gold ring. Same rule covers labels, inputs, selects, textareas, and the careers search bar.
   - Remove the `[data-careers-page] .careers-phone-input input` navy overrides (border-left/box-shadow inset) so the phone input inherits the new transparent + gold rule.

2. `src/components/ui/phone-input.tsx`
   - In the `isCareersPhoneInput` branch, drop the inline `border`, `borderLeft`, `boxShadow`, `backgroundColor:#F7F2EA` styles. Let it inherit from `[data-jbj-form]`. Keep the country-code pill navy as-is.

3. `src/pages/JoinApplication.tsx`
   - Ensure the form root carries `data-jbj-form` (already present from the last pass; verify).
   - Remove any per-field inline styles still hard-coding navy borders or champagne fills on First/Last/Email/Phone/Search inputs so the global rule wins.
   - Search bar input ("Search position by title…") gets the same global classes — no bespoke white fill.

4. Spot-check other forms already using `[data-jbj-form]` (Design Studio, Scan & Sign, contact/CRM forms). No per-form edits expected — they inherit automatically. Any form NOT yet tagged that uses raw `<Input />` should be left alone in this pass (no functional changes), but the new global rule is non-destructive for them.

## Verification

- Take screenshots on `/join` at desktop (1043px) and mobile (390px) viewports confirming:
  - 5 highlighted fields are transparent with soft gold borders
  - Country-code pill remains navy with white icons
  - Nationality / City / Country pickers visually match (same height, radius, border tone)
  - Labels, spacing, and rounded corners consistent
- Quick visual pass on `/design-studio` and `/scan-sign-documents` to confirm no regressions.

## Out of scope

- No field removals, no relabeling, no logic changes.
- Country-code pill colour stays navy (locked previously).
- No changes to button colours, card backgrounds, or non-form UI.
