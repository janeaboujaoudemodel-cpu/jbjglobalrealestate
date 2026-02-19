
# Fix: 7 Issues — Stamp Generator Navigation, Padding, AI Extraction Quality & Form Data Handling

## Issues Identified & Root Causes

### Issue 1 — "Back to Project" goes to homepage instead of the project
**Root Cause:** In `StampGeneratorPage.tsx` (line 375), the "Projects" back button calls `navigate('/toolkit/stamp-generator')` which is the **landing/marketing page**, not the user's actual projects list. The correct route is `/toolkit/stamp-generator/projects`. The button label also says "Projects" when it should say "Back to Project" to navigate back to the current project's generation page (from the export screen).

**Fix:** Change the navigate target:
- In `StampGeneratorPage.tsx`: button already points to `/toolkit/stamp-generator` — change to `/toolkit/stamp-generator/projects`
- In `StampExportPage.tsx`: the "Back to Designs" button (`navigate('/toolkit/stamp-generator/${projectId}/generate')`) is correct already — no change needed there

---

### Issue 2 — Navigation arrows (Up/Down/Back) disappear on stamp generator pages
**Root Cause:** The `PageNavigation` component uses `window.scrollY` and `document.documentElement.scrollHeight` to detect scroll position. On the stamp generator pages (`/generate`, `/export/:id`), the entire page layout uses internal scroll containers (the left panel, right grid), not `window` scroll. So `window.scrollY` is always 0, causing `showScrollTop` to stay `false` and `showScrollBottom` also to compute incorrectly.

Additionally, `stack` in `PageNavigation` starts from `sessionStorage`. If the user arrives directly at `/toolkit/stamp-generator/new` (fresh tab or hard refresh), the stack only has 1 entry, so `hasPrevious` is `null` — the back button logic works but its visual state is correct. The real issue is the **scroll arrows** being invisible because `window.scrollY` is always 0 on non-window-scrolling pages.

**Fix:** On stamp generator routes, force `showScrollTop = false` and `showScrollBottom = false` (hide both scroll arrows since they don't apply to non-window-scroll pages). Only the Back button should show. This is cleaner than the current logic.

```tsx
// In PageNavigation.tsx
const isStampGenerator = location.pathname.includes('/stamp-generator/');
// Force hide scroll arrows on stamp generator (uses internal scroll, not window)
const effectiveShowScrollTop = isStampGenerator ? false : showScrollTop;
const effectiveShowScrollBottom = isStampGenerator ? false : showScrollBottom;
```

---

### Issue 3 — Stamp generator page header touches the global header ("sticky top-0" clash)
**Root Cause:** The global `GlobalHeader` is `fixed` with `h-24 sm:h-28 lg:h-32`. The `MainLayout` adds `pt-16 sm:pt-20 md:pt-24 lg:pt-28` spacing to non-hero pages. However, the stamp generator pages render their own inner `sticky top-0` sub-header (in `StampGeneratorPage.tsx`, `StampProjectWizard.tsx`, `StampProjectsDashboard.tsx`, `StampExportPage.tsx`). These inner headers use `sticky top-0` which means they stick at 0px from the top — right behind the global header — rather than below it.

**Fix:** Change `sticky top-0` to `sticky top-24 sm:top-28 lg:top-32` (matching the GlobalHeader height) in all four stamp generator sub-headers. This ensures the inner sticky header starts exactly where the global header ends.

Files to update:
- `src/components/stamp-generator/StampGeneratorPage.tsx` (line 372)
- `src/components/stamp-generator/StampProjectWizard.tsx` (line 131)
- `src/components/stamp-generator/StampProjectsDashboard.tsx` (line 88)
- `src/components/stamp-generator/StampExportPage.tsx` (line 441)

---

### Issue 4 — AI extracts wrong country ("Lebanon" instead of "UAE")
**Root Cause:** The AI extraction prompt says "Country (in English)" without any grounding context. For UAE trade licenses, the AI sometimes picks up Arabic text like "لبنان" (Lebanon) that may be part of the owner's nationality or address section, not the company's registered country. The country field needs specific instructions with UAE context and validation.

**Fix (two-part):**

**Part A — Edge function prompt hardening** (`supabase/functions/ai-stamp-extract/index.ts`):
Add explicit rules to the prompt:
- "The country refers to where the company is REGISTERED, not the nationality of the owner or director."
- "For UAE documents, common country values are: United Arab Emirates, UAE. Common cities are: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain."
- "Do NOT extract nationality of a person as the country field."
- Add output normalization: if the extracted country is any of `["Lebanon", "Egypt", "India", "Pakistan", "Jordan", "Syria"]` (common nationality countries) AND a city like "Dubai"/"Abu Dhabi" is found, override country to "United Arab Emirates".

**Part B — Client-side fallback in `StampProjectWizard.tsx`**:
After auto-fill from extraction, add a smart override:
```tsx
const uaeCities = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'];
const nonUaeCountries = ['Lebanon', 'Egypt', 'India', 'Pakistan', 'Jordan', 'Syria', 'Philippines'];

let country = data.country || '';
if (
  nonUaeCountries.some(c => country.toLowerCase().includes(c.toLowerCase())) &&
  uaeCities.some(c => (data.city || '').toLowerCase().includes(c.toLowerCase()))
) {
  country = 'United Arab Emirates';
}
set('country_optional', country || 'UAE');
```

---

### Issue 5 — Page refresh takes user to homepage instead of staying on the current page
**Root Cause:** This is a client-side routing issue. React Router uses browser history (HTML5 pushState). When the user is on `/toolkit/stamp-generator/new` and refreshes, the browser sends a GET request to the server for that exact URL. Since this is a SPA (Vite dev/preview), the server may not be configured to serve `index.html` for all routes, causing a 404 fallback to `/` or the root page.

However, in the **Lovable Cloud preview environment**, this should be handled by the preview server. The real cause is that **the stamp generator pages don't persist their state**. When the page refreshes, the wizard starts fresh from step 0 with empty state. For the `/new` wizard, this is expected (blank form). For the `/generate` page with a `projectId`, it fetches from the database on mount — so refresh should be fine there.

The fix for the `/new` page specifically: **save wizard form state to `sessionStorage`** so that if the user refreshes mid-wizard, the form data is preserved and the step is restored.

```tsx
// In StampProjectWizard.tsx — persist form state
useEffect(() => {
  sessionStorage.setItem('stamp-wizard-form', JSON.stringify(form));
}, [form]);

useEffect(() => {
  sessionStorage.setItem('stamp-wizard-step', String(step));
}, [step]);

// On mount — restore
const [form, setForm] = useState<FormState>(() => {
  try {
    const saved = sessionStorage.getItem('stamp-wizard-form');
    return saved ? JSON.parse(saved) : defaultForm;
  } catch { return defaultForm; }
});
const [step, setStep] = useState(() => {
  try { return Number(sessionStorage.getItem('stamp-wizard-step')) || 0; } catch { return 0; }
});
```

Clear sessionStorage on successful project creation so the wizard starts fresh next time.

---

### Issue 6 — Phone number: wrong formatting (dashes added, missing `+` prefix)
**Root Cause:** The AI extracts phone numbers in whatever format they appear in the document (e.g., `971-4-123-4567` or `04-123-4567`). There is no normalization.

**Fix — Edge function prompt** (`ai-stamp-extract/index.ts`):
Add phone formatting rules to the prompt:
- "Format phone numbers with international prefix: always start with + followed by the country code (e.g., +971 for UAE)."
- "Remove all dashes between digits. Use spaces as separators: +971 4 123 4567 format."
- "If the number starts with 04 or 05, convert to UAE international format: 04 → +971 4, 05 → +971 5."

**Fix — Client-side normalizer in `StampProjectWizard.tsx`**:
Add a utility function that normalizes the phone before setting it:
```tsx
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  // If starts with 00971 → +971
  if (digits.startsWith('00971')) return '+' + digits.slice(2);
  // If starts with 971 (no +) → +971
  if (digits.startsWith('971') && !raw.startsWith('+')) return '+' + digits;
  // If starts with 04 or 05 (UAE local) → +971 4... or +971 5...
  if (/^0[45]/.test(digits)) return '+971 ' + digits.slice(1);
  // Otherwise keep as-is but ensure + prefix if looks like international
  return raw.startsWith('+') ? raw : raw;
}
```

---

### Issue 7 — Email should default to UPPERCASE; field should show lowercase/uppercase toggle
**Root Cause:** The wizard's email input has no text transformation. The AI extracts emails in whatever case they appear (usually lowercase). The user wants the standard to be uppercase (or at minimum, have the option).

**Fix:** 
- Apply `className="uppercase"` to the email `<Input>` in the wizard so it visually shows as uppercase
- Store it as uppercase in state: `onChange={e => set('email_optional', e.target.value.toUpperCase())}`
- Add a small toggle button next to the email field: "ABC / abc" that switches between `uppercase` and `lowercase` display
- When the AI extracts an email, apply `.toUpperCase()` before setting it in state

---

## Files to Change

| File | Changes |
|---|---|
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Fix "Back" button target from `/toolkit/stamp-generator` → `/toolkit/stamp-generator/projects`; fix inner sticky header `top-0` → `top-24 sm:top-28 lg:top-32` |
| `src/components/stamp-generator/StampExportPage.tsx` | Fix inner sticky header `top-0` → `top-24 sm:top-28 lg:top-32` |
| `src/components/stamp-generator/StampProjectWizard.tsx` | Fix inner sticky header; add sessionStorage persistence for form + step; add `normalizePhone` utility; add country smart-override after AI extraction; add email uppercase logic + toggle |
| `src/components/stamp-generator/StampProjectsDashboard.tsx` | Fix inner sticky header `top-0` → `top-24 sm:top-28 lg:top-32` |
| `src/components/PageNavigation.tsx` | On stamp-generator routes, hide both scroll arrows (not applicable to internal-scroll pages); show only the Back button |
| `supabase/functions/ai-stamp-extract/index.ts` | Harden prompt with UAE context, country-vs-nationality disambiguation, phone formatting rules; deploy |

## What Does NOT Change
- Stamp template SVG code, color wheel, text editor
- Export engine (StampExportPage rasterization logic)
- Auth, database schema, RLS policies
- Any other toolkit pages
- Global layout, GlobalHeader, MainLayout
