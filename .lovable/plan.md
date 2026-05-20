## Goal

Upgrade the "Add broker" form (and matching edit dialog) so Languages, Nationality, and Phone are real searchable dropdowns with country flags — instead of plain text inputs. Multiple languages can be selected. All dropdowns include a search bar.

## Where the change happens

Two surfaces in the CRM brokers section:

1. **`src/pages/owner/crm/BrokersRegistry.tsx`** — the "Add broker" dialog (Field rows for `phone`, `nationality`, `languages`).
2. **`src/components/crm/IndividualBrokersTab.tsx`** — the edit dialog for an existing broker (same three fields).

Nothing else is touched: no RLS, no schema, no sessions, no picker logic, no API contracts. Data still saves to the same columns (`phone_e164`, `nationality`, `languages[]`).

## New shared components

Three small, reusable pickers under `src/components/crm/pickers/`, all matching the champagne/cream theme and using the same searchable popover pattern already used by `BrokerCombobox`:

```text
NationalityPicker        single-select  → flag + country name, search by name/code
LanguageMultiPicker      multi-select   → flag + language name, chip display, search
PhoneInputWithCountry    phone input    → country flag + dial code selector + number field
```

All three:
- Built on shadcn `Popover` + `Command` (search, keyboard nav, focus rings already correct).
- Render the country flag as a Unicode emoji (no extra asset bundle, no network calls).
- Champagne surface `#F7F2EA`, ink text `#1A1A1A`, gold hairline `#B89555/40` — no blue focus rings.
- Mobile-friendly: full-width trigger, popover `max-h-72 overflow-y-auto`, 44px tap targets.

## Data sources (bundled, no new deps)

- **Countries (for Nationality + phone dial code):** small static list in `src/data/countries.ts` — `{ code: "AE", name: "United Arab Emirates", nationality: "Emirati", dial: "+971", flag: "🇦🇪" }` for the ~250 ISO countries.
- **Languages:** small static list in `src/data/languages.ts` — `{ code: "en", name: "English", flag: "🇬🇧" }` for ~80 common languages (flag = a representative country flag).

Both files are plain TS arrays — no npm package needed, keeps bundle clean.

## Form wiring

In `BrokersRegistry.tsx` add-broker dialog (around lines 705–725) replace the three `<Field />` lines:

```text
Before:                              After:
<Field k="phone" .../>          →    <PhoneInputWithCountry value={form.phone} onChange={...} />
<Field k="nationality" .../>    →    <NationalityPicker value={form.nationality} onChange={...} />
<Field k="languages" .../>      →    <LanguageMultiPicker value={form.languages} onChange={...} />
```

`form.languages` becomes `string[]` directly (drop the comma-split parsing at line 646). Phone returns the full E.164 string (`+971xxxxxxxxx`) so existing save logic at line 653 (`phone_e164: form.phone.trim()`) is unchanged.

In `IndividualBrokersTab.tsx` edit dialog (lines 450, 456, 470) apply the same swap. `editing.languages` is already `string[]`, so the multi-picker plugs in directly.

## Visual / UX

- Trigger button shows current selection: `🇦🇪 Emirati`, `🇬🇧 English ×  🇸🇦 Arabic ×`, `🇦🇪 +971 50 123 4567`.
- Empty state: muted placeholder `Select nationality` / `Add languages` / `Phone number`.
- Search input at top of popover, autofocus on open, instant filter on name + ISO code + dial code.
- Multi-language: selected items become removable chips above the popover trigger; checkbox in popover list shows selection state.
- All popovers respect the existing champagne autofill rule and the gold focus ring.

## Out of scope (explicitly not touched)

RLS · grants · broker identity · sessions · invitations · password policy · unified picker default · column types · edge functions · other CRM forms (leads, brokerages, employees) — those stay on plain inputs until the user asks.

## Files changed

```text
new   src/data/countries.ts
new   src/data/languages.ts
new   src/components/crm/pickers/NationalityPicker.tsx
new   src/components/crm/pickers/LanguageMultiPicker.tsx
new   src/components/crm/pickers/PhoneInputWithCountry.tsx
edit  src/pages/owner/crm/BrokersRegistry.tsx     (3 field swaps in add-broker dialog)
edit  src/components/crm/IndividualBrokersTab.tsx (3 field swaps in edit dialog)
```

No migrations. No dependency installs.
