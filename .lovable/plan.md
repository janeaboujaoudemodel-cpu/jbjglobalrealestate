# Emerald System Hardening + Global Consistency Pass

## 1. Lock the rule (CSS, non-negotiable)
Add a permanent CSS guard in `src/index.css` (PASS 10):
- ANY element whose own background is emerald (`#047857`, `#064E3B`, `#0F8B6A`, `var(--emerald-ink)`, `var(--emerald-ink-soft)`, `var(--gradient-ink)`, `var(--gradient-ink-hover)`, `.jj-cta-dark`, `[data-cta="dark"]`, `[data-ink-emerald]`, `.jj-pill-emerald:hover`) MUST render text + icons + SVG strokes WHITE at idle, hover, focus, active, disabled. No exceptions, no opt-outs.
- Remove the regression from last turn that flipped Services / Tool / Hero white labels to black. Restore white on dark.
- Save this as `mem://constraints/white-on-emerald-lock` and add to Core.

## 2. Hover contrast — Email / Call / Chat pills
`src/components/ProjectCard.tsx` + `.jj-pill-emerald` in `index.css`:
- Idle: champagne fill, emerald border, emerald icon + label.
- Hover: emerald gradient fill, WHITE icon + WHITE label (locked via PASS 10).

## 3. JBJ Royal Tools Hub + Explore Our Services headers
`src/components/tools/RoyalToolsHub.tsx`, `src/pages/JBJDesignStudio.tsx`, `src/components/home/ExploreServicesExpander.tsx`, `src/components/home/ToolkitShowcaseCard.tsx`:
- Title + subtitle (Property Evaluator, Mortgage Calculator, tool names + subtitles) render WHITE on the dark/emerald panel.
- Remove ALL gold borders/hairlines on these two section headers only. Replace gold divider with emerald hairline `rgba(4,120,87,.55)`.
- Scope is strictly these two sections — gold hairline standard preserved elsewhere.

## 4. Premium 3D hover for primary CTAs
New utility `.jj-cta-float` in `index.css`:
- Idle: emerald gradient, white text, soft emerald shadow.
- Hover: `translateY(-2px) scale(1.01)`, deeper layered shadow (`0 14px 32px -10px rgba(4,120,87,.45), 0 4px 12px rgba(0,0,0,.15)`), brighter gradient.
- Apply to: `View All Projects`, `Mortgage Calculator` CTA, `Explore Now`, `Get Evaluation`, `Open Investor Portal`, `Get Verified`, footer primary buttons.

## 5. Emerald promotion (consistent, restrained)
- Footer (`src/components/Footer.tsx`): section titles emerald, icons emerald, primary links hover emerald. No gold accent on footer divider — emerald hairline.
- Contact cards (WhatsApp / Call Us / Email in `CombinedContactNewsletter.tsx`): stronger emerald — filled emerald icon tile + emerald label, hover floats with shadow.
- Mode picker (`src/components/auth/ModePickerDialog.tsx` or equivalent): emerald accents on selected pill, emerald primary CTA.
- Contact Us screen / `/contact`: emerald headline, emerald CTAs, emerald icon tiles.
- Vertical sidebar (`src/components/layout/VerticalSidebar.tsx`): section group titles in emerald (AI Home Finder / Tools & Workspace / Properties / etc.). Item labels stay ink; active item = emerald hairline + emerald icon.

## 6. Sidebar: add Billing & Subscriptions
- New sidebar entry under MY ACCOUNT → "Billing & Subscriptions" linking to `/account/billing` (new route, reuses existing billing components if present; otherwise stub page with sections: Current Plan, Payment Method, Invoices, Usage). Owner/broker/developer/investor all see it.

## 7. My Account → Brand Update card (above dashboard)
`src/pages/MyAccount.tsx` (or owner/broker/developer dashboards):
- New `<BrandPresentationCard />` above dashboard for `owner`, `broker`, `developer` modes ONLY (hidden for `investor`).
- Lets user upload/update: agent photo OR company/agency logo, display name, title, phone, email used in generated presentations.
- Saves to existing profile/company table; presentation generator reads from there.

## 8. Mobile Contact Us launcher
`src/components/support/ContactUsLauncher.tsx` (right-edge tab):
- On `< md` breakpoint: render icon-only (phone icon), 44×44 circular emerald pill, no "Contact Us" vertical label.
- Desktop/tablet unchanged.

## 9. Kill white-pearl back layers globally
Identify the duplicated outer wrapper (likely `PremiumSectionCard` rendering both an outer band + inner card, or `.jj-band` + nested card).
- Rule: a section is EITHER a full-bleed band OR a single rounded card — never both stacked.
- Fix JBJ Royal Tools Hub, Top Areas in Dubai, AI Property Comparison, and any other section showing a squared pearl strip behind a rounded card.
- Pattern to keep: Mortgage Calculator (one rounded champagne card, inner sub-cards). Pattern to remove: outer square pearl + inner rounded card.
- Audit `src/components/home/*` and `src/pages/Index.tsx` for `PremiumSectionCard` + nested `Card` duplication.

## 10. Responsive + E2E QA
For each change, verify via browser at 4 viewports: 1920 desktop, 1024 tablet, 768 iPad, 390 mobile.
Capture screenshots as proof for:
- Homepage hero / Explore Services / Royal Tools Hub header
- Featured Listings card hover (Email/Call/Chat)
- View All Projects button hover
- Footer
- Contact Us screen + mobile launcher
- Mode picker
- Sidebar with new Billing entry
- My Account with Brand card (per role)
- Sections after pearl-layer removal

Reply with screenshot proof per item before moving to next.

## 11. Memory updates
- New: `mem://constraints/white-on-emerald-lock` (Core).
- Update: `mem://style/color-palette/ink-emerald-gradient-standard` — add hover-white rule, gold-removal scope for tool/service headers, `.jj-cta-float` premium hover.
- New: `mem://ui-ux/visual-standards/no-double-wrapper-rule` — sections are band OR card, never both.

## Out of scope
- No backend schema changes beyond a single `brand_presentation` profile columns set (photo_url, company_logo_url, display_title) if not already present.
- No new tools, no copy rewrites, no route renames.
- Existing gold hairline standard preserved everywhere except the two named section headers.
