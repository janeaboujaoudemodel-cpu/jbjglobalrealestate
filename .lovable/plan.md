## Scope
Pure CSS/markup fixes on `/careers` (`src/pages/JoinApplication.tsx` + `src/styles/theme-tokens.css`). No logic, no backend.

## 1. "Open Positions" header — white text, no beige flip
`Card#open-positions` is using `careers-card-strong` which on hover/active was switching surface to champagne (the beige flip you saw).

- Force the card surface to **navy `#102540`** in idle AND hover (no beige) and keep all foreground text white.
- Repaint inside that card scope:
  - `CardTitle` "Open Positions" → `text-white`
  - `CardDescription` paragraph → `text-white/80`
  - The "Live Roles" eyebrow chip → white text + white hairline border + transparent fill (currently navy text on cream)
  - The `<strong>Apply</strong>` inside description → white
- Add a one-shot hover sheen: a pseudo-element on the card with a 1.2s diagonal `linear-gradient(115deg, transparent 0%, rgba(255,255,255,.14) 50%, transparent 100%)` translateX sweep on `:hover`. Pure CSS, no JS.

## 2. "21 open" badge — white in every state
`careers-open-badge` rules in `theme-tokens.css` currently get overridden on hover (becomes black-on-cream).

- Lock the badge: `background:#102540 !important`, `color:#FFFFFF !important`, `border:1px solid #B89555 !important` for `:hover`, `:focus`, `:focus-visible`, `:active`, `[data-state]` — and force the inner `<span>` (`{filteredPositions.length} open`) to inherit white.
- Keep the pulsing emerald dot unchanged.

## 3. Field borders — blue for personal block, gold for city
Step 0 (Personal) inputs already carry `careers-blue-field` (First Name, Last Name, Email) and the phone uses `careers-phone-input`. Audit shows:

- ✅ First Name / Last Name / Email — already wired to `careers-blue-field` (blue border via theme-tokens). Will tighten the rule to a solid **2px navy `#102540`** border in idle + hover + focus so the blue is unmistakable (not the faint version you saw).
- ✅ Phone — confirm `careers-phone-input` outer wrapper paints the same 2px navy border around the country-code trigger AND the tel input as one unified control.
- 🆕 **City** (line 914, `SearchableSelect`) — add `className="careers-gold-field"` and create the matching rule in `theme-tokens.css`: 2px gold `#B89555` border, champagne `#FDFBF7` surface, ink text, gold focus ring. (Mirrors `careers-blue-field` but in gold.)

## 4. "Questions? Contact us at contact@JBJ.ae" footer line
Currently a bare `<p>` with a plain link — out of place vs. the rest of the careers theme.

Wrap it in a small premium contact strip directly under the form card:

- Rounded-2xl champagne surface, 1px gold hairline, soft navy glow shadow.
- Left: small navy icon tile (Mail icon) + "Questions?" eyebrow (navy uppercase tracked) on top of "Contact us at **contact@JBJ.ae**" (ink, email in navy semibold with gold underline on hover).
- Right: a secondary "Chat with Jessica" pill (navy text, gold hairline) linking to `/hr-agent`.
- Mobile: stacks vertically, centered.

All text uses already-defined careers tokens — no new colours.

## Files touched
- `src/pages/JoinApplication.tsx` — open-positions card colour classes, "21 open" wrapper, city field className, new contact strip JSX.
- `src/styles/theme-tokens.css` — strengthen `careers-open-badge` + `careers-blue-field` rules, add `.careers-gold-field`, add `.careers-card-navy` (replaces `careers-card-strong` only on this card) with hover-sheen keyframes.

## Out of scope
No changes to form submission, validation, schema, or any other page. No removal of existing features.
