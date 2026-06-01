## Plan — JBJ Academy, Guides Strip, Sidebar, Certification Anti-Cheat

This is a large, multi-surface change. I'll do it in 4 sequenced phases. Phase 1 finishes the rent-guide work from last turn. Phases 2–4 are the new asks. I'll validate visually at the end of each phase.

### Phase 1 — Finish rent-guide / guide pages (carryover 1–7)

1. Wire `GuideBookSection` to open the new `GuideBookReader` modal (real paginated book, not anchor-jump).
2. Swap brown page root → `bg-page` + `data-marketing-page` on `RentGuide` and sibling guide/FAQ pages (Buyer/Seller/Landlord/Tenant/Investor guides + FAQs).
3. Rebuild `GuideHero` → full-viewport (`100dvh`), white title with gold underline, readable scrim, two CTA primitives (`.jj-cta-champagne` + `.jj-cta-outline`).
4. `GuideCTA` → champagne band, WhatsApp/Phone → `.jj-cta-dark` w/ white icons, primary → `.jj-cta-champagne`, broker-mode wording fixed.
5. `FounderPhilosophySection` CTA → `.jj-cta-champagne` (no gold fill).
6. Tighten section spacing `py-16 md:py-24` → `py-12 md:py-16`; remove brown stripes.
7. Repeat across all sibling guide pages.

### Phase 2 — Premium book system unified across the app

8. Promote `PremiumBook3D` to the single source of truth for any book visual. Add hover-only 3D tilt + lift (kept the same everywhere it appears).
9. **Home "Explore Our Guides & Reports" walking strap** → replace flat covers with `PremiumBook3D`; horizontal scroll enabled (drag + wheel + touch); arrow controls; 3D tilt on hover.
10. **GuideBookSection (left column on every guide page)** → render `PremiumBook3D` instead of generic `BookCard`, same hover-3D.
11. **`/jbj-academy` shelf** → use `PremiumBook3D`; enforce **3 books per row** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), title centered, scrollable.
12. **BrokerToolkit Academy section** → same `PremiumBook3D`, 3 per row, and **include internal JBJ-only modules** (company-private playbooks) alongside public books, clearly tagged "JBJ Internal".

### Phase 3 — BrokerToolkit visual fixes

13. "Manage Leads Like a Pro" section → restore the previous **vibrant dark-orange/brown gradient** styling (revert to pre-restyle look) while keeping current copy.
14. "Ready to Join the JBJ Broker Circle" CTA band → wider full-bleed, larger padding, richer gradient + gold hairline frame, premium typography, prominent dual CTA.

### Phase 4 — Sidebar dividers + Certification anti-cheat

15. **Vertical sidebar dividers**: add a 1px gold hairline (`rgba(184,149,85,.55)`) directly under the JBJ wordmark — aligned with the horizontal header's bottom hairline. Add a second gold hairline **above the Contact Us icon** when sidebar is collapsed, anchored to bottom so it sits flush with the footer line. Both use `[data-gold-hairline]` scoped to divider primitives (per memory rule).
16. **Mark Complete ↔ Mark Not Complete toggle** on every module/lesson: a module can be un-completed at any time; progress, book status, and `your_training` % recompute live; certification eligibility recomputes accordingly.
17. **Certification eligibility pipeline** (replaces direct "Complete Certification → Download"):
    - Step 1 — Modules: user must complete every module of every required book. Each module records `time_spent_seconds`, `scroll_depth_pct`, `idle_events`. Server-side validator rejects books where avg reading time < a min threshold per content length or scroll depth < 70%.
    - Step 2 — Submission: "Request Certification" button visible only when all modules show complete AND validator passes. User uploads a short written reflection (proof of study) + checks an honesty attestation.
    - Step 3 — Owner approval: submission lands in owner dashboard queue; approve → system auto-generates a quiz; reject → user sees "Contact Support" + certificate locked.
    - Step 4 — Quiz: AI-generated from the books the user actually read; timed; tab-blur, copy/paste, devtools-open, and abnormal answer-speed detection; one attempt per approval; pass ≥ 80%.
    - Step 5 — Certificate: only issued on quiz pass; otherwise locked with "Contact Support" CTA. All anti-cheat signals stored in `broker_certification_audit`.

### Validation

After each phase: capture `/`, `/jbj-academy`, `/broker-toolkit`, `/rent-guide`, `/buyer-guide` at 1280×720 and 375×812; verify no brown stripes, books render in 3D and tilt on hover, strap scrolls, sidebar gold hairlines align with header/footer, certification button is gated.

### Files (high-level)

- `src/components/books/GuideBookSection.tsx`, new wiring to `GuideBookReader`
- `src/components/books/PremiumBook3D` (promoted from broker-education) + `BookCard` swap on home strap, academy, guide pages, toolkit
- `src/components/home/*` walking strap → scrollable
- `src/pages/JbjAcademy.tsx` → 3-col grid + premium books
- `src/components/broker-toolkit/BrokerToolkitAcademy.tsx` → premium books + internal modules
- `src/components/broker-toolkit/*ManageLeads*` → restore vibrant theme
- `src/components/broker-toolkit/BrokerToolkitCTA.tsx` → wider premium band
- `src/components/navigation/GlobalVerticalNav.tsx` → 2 gold hairlines
- `src/components/broker-education/*` + new `BrokerCertificationGate.tsx` + new edge function `broker-cert-submit` / `broker-cert-quiz-generate` / `broker-cert-quiz-grade`
- New DB tables: `broker_education_module_reads`, `broker_certification_submissions`, `broker_certification_quizzes`, `broker_certification_audit` (with GRANTs + RLS)
- Rent guide / sibling guide pages: hero, CTA, founder, page roots

### Open questions before I start

1. **Quiz storage / generation** — OK to use the existing Lovable AI Gateway (no extra key) with `google/gemini-2.5-pro` to generate quizzes from the book content?
2. **Min reading-time threshold** — should I use ~60% of each module's `estimated_minutes` as the floor, or a flat number you pick?
3. **Owner approval queue** — drop it into the existing owner dashboard under `/owner/crm?section=academy`, or its own `/owner/academy-approvals` page?
4. **"Internal JBJ modules"** in BrokerToolkit Academy — do those already exist as DB rows, or should I scaffold a new `broker_internal_modules` table and seed 3–4 placeholders for now?
