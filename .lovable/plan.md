## Goal

Take the four rules that currently only fire on `/careers` and `/careers/intake/:token` and apply them to every **public lead-capture form** (anything an anonymous visitor can submit). Owner / CRM / admin / staff forms keep their existing champagne look — no change.

The four rules being generalised:

1. **Field colour rule** — identity fields get a 2px navy `#102540` border; preference fields get a 2px gold `#B89555` border.
2. **White title on navy** — section headers / "Open positions"-style cards stay white text on navy `#102540`, no champagne flip on hover.
3. **Premium "Questions / Contact us" block** — the 3-channel glass card (Email · Phone · Chat with Jessica) replaces every "Questions? Email us at…" plain-text line.
4. **Gold-tick checkbox** — every checkbox renders as a white box with a 1.5px gold hairline and a gold `✓` when checked (no blue ticks anywhere).

## Field colour rule — applied consistently

| Class | Fields it goes on |
|---|---|
| `.jbj-blue-field` (navy 2px) | First name, Last name, Full name, Email, Phone (+ country trigger) |
| `.jbj-gold-field` (gold 2px)  | City, Country, Nationality, Languages, Interests, Budget, Property type, Notes / Message, anything qualitative |

Phone country-code combobox always inherits navy to match the tel input.

## Public lead-capture forms in scope

Audited and confirmed as the entire public surface:

```text
src/components/InquiryFormModal.tsx              property / project enquiry modal
src/components/chat/ChatLeadForm.tsx             chat widget gate
src/components/chat/ChatConversationalCollect.tsx  conversational lead capture
src/components/chat/ChatCVSubmission.tsx         CV submission inside chat
src/components/concierge/ConciergeGate.tsx       concierge name+phone gate
src/components/home/AIConcierge.tsx              homepage concierge inline form
src/components/video-meet/PreJoinForm.tsx        video-meet pre-join
src/components/SupportTicketBox.tsx              support ticket form
src/pages/JoinApplication.tsx                    careers apply (already done — verify)
src/pages/CareersIntake.tsx                     candidate intake (already done — verify)
src/pages/Index.tsx — public "Book a free consultation" + footer inquiry
```

Anything under `src/pages/owner/**`, `src/pages/admin/**`, `src/components/crm/**`, `src/components/hr/**`, `src/components/owner-dashboard/**`, `src/components/employee-management/**` is **explicitly out of scope**.

## Implementation

### 1 · Promote the tokens to global

In `src/styles/theme-tokens.css`:

- Duplicate every `[data-careers-page] .careers-blue-field` block into a `[data-jbj-form] .jbj-blue-field` block (and the corresponding `.jbj-gold-field`, `.jbj-card-navy`, `.jbj-open-badge`).
- Keep the original `careers-*` selectors as aliases so the two careers pages keep working unchanged.
- Update the existing global `:is(input,textarea,select)` champagne reset in `src/index.css` (lines 3536 + 3572) to also exclude `.jbj-blue-field` and `.jbj-gold-field` so they don't get re-skinned.

### 2 · Gold-tick checkbox (global override)

In `src/index.css`, add a single rule targeting the shadcn checkbox primitive — `[role="checkbox"]` / `button[data-state][data-radix-checkbox]`:

- Idle: white background, 1.5px solid `#B89555`, rounded-md.
- Checked: still white background, gold `✓` indicator (`color: #B89555`), gold border stays 1.5px.
- Focus: 2px gold ring `rgba(184,149,85,.35)`.
- No opt-out by default — every checkbox on the site flips to gold ticks. Documented in memory as a global rule.

### 3 · `<JBJContactBlock />` primitive

Create `src/components/forms/JBJContactBlock.tsx` — a generalised copy of `CareersContactBlock` where the three channels (icon · label · value · href · tag) are props with sensible JBJ defaults. `CareersContactBlock` becomes a thin wrapper that passes the careers-specific channels (`careers@JBJ.ae`, `Chat with Jessica`, `/hr-agent`).

### 4 · `<JBJOpenCard />` primitive (white-on-navy)

Extract the navy "Open positions" card pattern into `src/components/forms/JBJOpenCard.tsx` (`.jbj-card-navy` + sheen). Used by JoinApplication today; available for any future form header that needs the same treatment. No mandatory retrofit — only adopted where the form already has an "Open …" or "Active …" card.

### 5 · Retrofit pass — one PR-shaped change per file

For each file in the scope list:

- Add `data-jbj-form` to the form root (so the scoped tokens activate).
- Replace each `<Input />` / `<input />` className with `jbj-blue-field` or `jbj-gold-field` per the table above.
- For combobox-style country pickers, mirror the `careers-phone-tel` pattern: navy combobox + navy phone input.
- Replace any inline "Questions? Contact us at …" / "Need help? Email …" line with `<JBJContactBlock />`.
- Leave labels, copy, layout, validation, submit handlers, RLS, edge-function calls, and accessibility attributes **completely untouched** — pure presentation swap.

### 6 · Memory + CI

- Add `mem://ui-ux/visual-standards/jbj-form-standard.md` describing the new `[data-jbj-form]` scope, the blue-vs-gold field map, the global gold-tick rule, and the contact block primitive.
- Update `mem://index.md` Core (one line) so future work auto-applies the standard to any new public form.
- No new CI scripts — the existing white-on-light + contrast guards already cover the navy / gold combinations.

## Out of scope

- No backend / edge-function / RLS / schema changes.
- No relayout of any form; only borders, ticks, and the contact footer change.
- No change to owner / CRM / admin forms.
- No change to the existing `<Button variant="gold">` or any non-input control.
- No change to mobile/desktop breakpoints — the careers divider hidden-on-mobile rule already shipped and is unaffected.

## QA after build

- Manual pass on `/`, `/careers`, `/careers/intake/:token`, `/book`, `/contact`, any property page that opens `InquiryFormModal`, the chat launcher, the homepage Concierge, and a video-meet pre-join URL — confirm: navy borders on name/email/phone, gold borders on city/preferences/notes, gold ticks on every checkbox, premium contact block at the bottom of every form, no champagne / black flip on hover anywhere.
- Verify owner CRM (`/owner/crm`) and admin (`/admin/*`) screens are visually unchanged.
