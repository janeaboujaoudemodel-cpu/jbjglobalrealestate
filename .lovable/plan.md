# Final Contrast Cleanup — One Source of Truth

## Why the "Featured" pill is black on navy
The pill background is `bg-[#102540]` (navy own surface → must render white per Rule A). It currently renders ink because **broad substring CSS guards** in `src/index.css` repaint `text-white` to ink whenever the class contains a string starting with `bg-[#1`, plus a separate `:where(.bg-black, .bg-gray-900, …) [class*="text-[#1A1A1A]"]` rule remaps anything ink-ish on dark to gold. That same family of broad selectors is the root cause of the remaining site-wide contrast conflicts.

## The Final Two-Rule Contract (locked, unchanged)
- **Rule A** — Own background navy/ink/dark → white text + white icons.
- **Rule B** — Own background champagne / cream / gold / page / white → ink (`#1A1A1A`) text + ink icons.

Everything else in `index.css` must either *serve* these two rules or be removed.

## What gets cleaned in `src/index.css`

### 1. Replace all broad-substring background selectors with whole-token matches
- `[class*="bg-black"]` → `[class~="bg-black"]` (kills accidental matches on `hover:bg-black/5`, `bg-black/10`, etc.).
- `[class*="bg-[#0"]` → enumerated dark tokens only (`bg-[#0D0D0D]`, `bg-[#0A0908]`). This currently catches every sky/emerald/teal/blue hex starting with `0`.
- `[class*="bg-[#1"]` is the direct cause of the Featured-pill bug — restrict to actual ink tokens (`bg-[#1A1A1A]`, `bg-[#102540]`, `bg-[#1a3d63]`).
- Same treatment for the gray-neutraliser block at lines 5552–5554 where `:not()` is currently attached to the descendant combinator (so the opt-outs apply to descendants, not the gray element).

### 2. Delete the "ink-text → gold on dark" remap
Lines 3080–3090 and 3169–3181 force `text-[#1A1A1A]` to `#B89555` on any dark surface. This produces gold body text on navy (low-AA) and is also what flips white→non-white in some chains. Replace with Rule A: white (`#FFFFFF` / `rgba(255,255,255,.92)`).

### 3. Collapse the triple `[data-surface="gold"]` definitions
Lines 854, 5041, 6024 all redefine gold. The first one still sets `--surface-fg: white`, contradicting Rule B. Keep a single canonical block with `--surface-fg: ink`.

### 4. Scope the unscoped muted-foreground overrides
Lines 508–517 force `.text-gray-500/600/700` and `.text-muted-foreground` to `hsl(0 0% 20–30%)` with `!important`, no surface guard → invisible on any dark surface that isn't tagged `[data-surface="dark"]`. Scope these to light surfaces only.

### 5. Close the `bg-[#1A1A1A]/<opacity>` guard gap
Extend the dark-surface guard to match opacity variants (`bg-[#1A1A1A]/40`, `/60`, `/80`) so translucent dark tiles still render white text.

### 6. Retire legacy `@layer components` classes that hardcode white on champagne cards
Inside `index.css` lines ~1700–2400, rewrite these to use `text-foreground` (which resolves to ink on light, white on dark via the existing token system) or guard them with `[data-surface="dark"] .class { … }`:
- `.jj-property-card-detail`, `.jj-user-card-role`, `.jj-crm-card-status`
- `.jj-inactive-item` (+ `:hover`, `-icon`, `-number`)
- `.jj-tab-inactive` (+ `:hover`), `.jj-sort-inactive` (+ `:hover`)
- `.jj-role`, `.jj-label`, `.jj-section-label`
- `.jj-profile-card .jj-profile-role`
- `.jj-gold-accent` (currently `text-white` — misnamed)

### 7. Remove dead/duplicate code
- Typo block at lines 4136–4138 (`buttonbuttonbutton`, `aa` selectors — never match).
- Any leftover `GLOBAL MONOCHROME OVERRIDE` / `URGENT CONTRAST RESCUE` fragments that still duplicate the final contract.

## Component fixes (handful, surgical)

- **`AIHub.tsx:894`** — `placeholder:text-[#1A1A1A]/70` on dark input → `placeholder:text-white/60`.
- **`toolkit/ToolkitLanding.tsx:81`**, **`Founder.tsx:127`**, **`video-meet/MeetingAIAssistant.tsx:248`** — swap dark `text-[#1A1A1A]` to white on their dark backgrounds.
- **`CommunitySearchModal.tsx`**, **`DeveloperSearchModal.tsx`**, **`OTPVerificationModal.tsx`** — replace root `text-white` on `bg-[#FDFBF7]` champagne dialogs with `text-foreground`.
- **AI tool pages** (`AIEmailGeneratorPage`, `AIDescriptionWriterPage`, `AIClientMatcherPage`, `AISocialMediaPage`, `AIInvestmentReportPage`) — remove `text-white` from `bg-[#F7F2EA]` form fields (let token system render ink).
- **Gold CTAs with white text** (`PublicSignDocument.tsx:19`, `ESignatureDashboard.tsx:328,646`, `ListingsApproval.tsx:188`, `StampGeneratorPage.tsx:82,187`, `SentimentIndicator.tsx:174`) — switch to `text-[#1A1A1A]` per Rule B (gold = light surface).
- **`ProjectCard.tsx`, `ModeSwitcher.tsx`** — deduplicate nested `data-no-contrast-guard` (keep only the outermost).

## What is explicitly NOT touched (locked)
Hero CTA, Favorite button, Photo overlays, Sidebar ink/gold, Sign-out red, Phone trigger, `<PricePill>`, `<DeveloperLink>`, `<IconTile>`, navy CTA primitives (`.jj-cta-dark`/`-champagne`/`-outline`), `.jj-pill-active`, mode-color identity, no-gray rules, no-photo-no-publish, listing-card layout, full-bleed band system, document-studio signature blocks.

## Validation
1. `rg` sweep confirming zero `[class*="bg-black"]`, `[class*="bg-[#0"]`, `[class*="bg-[#1"]` substring guards remain in `index.css`.
2. CSS parses (PostCSS) cleanly.
3. Live screenshots at viewport 1178×891 on: `/careers` (Featured pill white-on-navy), `/join` (navy banner white text), `/`, `/projects`, `/ai-hub`, `/toolkit`, `/founder`, owner CRM, presentation flow, e-signature, stamp generator, modal dialogs (Community/Developer/OTP), all five AI tool pages.
4. DOM contrast probe: 0 white-on-light, 0 ink-on-dark, 0 gold-on-dark for body text.
5. Confirm previously-fixed surfaces (sidebar ink, hero white, photo overlays, sign-out red) are unchanged.

## Files touched
- `src/index.css` (main cleanup — selector narrowing, legacy class rewrites, dead-code removal, single-source gold token)
- ~12 component files listed above (surgical class swaps only)
- No changes to tokens, configs, design system contracts, or business logic.
