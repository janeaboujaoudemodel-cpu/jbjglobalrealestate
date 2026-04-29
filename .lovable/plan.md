## Site-Wide Contrast Verification & Remediation

### Audit Findings

A repository-wide scan reveals the same faded patterns Market Intelligence had still live across the rest of the site:

| Pattern | Files affected | Severity |
|---|---|---|
| `text-gold/30` … `text-gold/70` (low-opacity gold text on white/light) | **99 files** (~194 occurrences) | High — fails WCAG AA |
| `text-white/30` … `text-white/70` (faded white on dark) | **238 files** | Medium — borderline AA |
| `bg-black` parent + `text-black` child (inverted contrast bug like Market Intel) | ~20 files | Critical — invisible text |
| Faded gold on non-button decorative icons (`text-gold/30`, `/50`, `/60`) | High concentration in services/, toolkit/, support/ | Medium |

The `jj-card-inner` class itself is **not** the culprit — its definition in `index.css` resolves to `background:#FFFFFF` with a gray border. The bug is content placed *outside* the card on a `bg-black` section, plus widespread faded `text-gold/XX` and `text-white/XX` decorative labels.

### Fix Strategy (Three Tiers)

```text
TIER 1 — Critical contrast bugs (invisible/illegible text)
   └─ bg-black sections containing text-black headings
   └─ Same Market Intel pattern repeated in services/, FAQ, Founder, Awards, Guides

TIER 2 — Faded gold decorative text (fails WCAG AA)
   └─ Replace text-gold/30…/70 with high-contrast tokens
   └─ Heading eyebrows → text-muted-foreground or solid #6B7280
   └─ Empty-state icons → text-gold (full) or text-muted

TIER 3 — Faded white over dark (borderline)
   └─ text-white/30…/60 → text-white/85 or text-white (full)
   └─ Trust-badge / metadata rows on hero sections
```

### Implementation Plan

**Step 1 — Fix the critical inverted-contrast pages (Tier 1, ~20 files)**

Apply the same hardening pattern proven on Market Intelligence:
- Convert `bg-black` section wrappers to `bg-white`/`bg-gray-50` where headings are black
- Where dark hero is intentional, force headings to `style={{ color: '#FFFFFF' }}`
- Replace `text-white/60` trust-row metadata with solid white + medium font weight

Targets: `Awards.tsx`, `Founder.tsx`, `FAQ.tsx`, `Guides.tsx`, `SellerGuide.tsx`, `Services.tsx`, plus `services/{LawFirm,SellingAdvisory,RentalAdvisory,CustomerHappinessCenter,CurrencyExchange,BuyingAdvisory,FitOut,Testimonials}.tsx`, `market-intelligence/AreaDetail.tsx`, `JBJBrokerAdmin.tsx`, `components/project-detail/MasterPlanSection.tsx`, `components/jbj-broker/BrokerCapacityPanel.tsx`, `components/home/JBJPodcastSection.tsx`, `components/DocumentDownloads.tsx`.

**Step 2 — Codemod faded gold across all 99 files (Tier 2)**

Run a scripted, reviewable replacement:
```text
text-gold/30  → text-gray-400        (decorative low-emphasis)
text-gold/50  → text-gray-500        (decorative medium)
text-gold/60  → text-gray-600        (eyebrow labels)
text-gold/70  → text-gray-700        (subheadings)
text-gold/80  → text-gray-800        (active text)
text-gold/90  → text-gray-900        (heading accents)
```

Exception: keep gold-tinted opacity ONLY where it overlays a fully dark hero video and the gold is brand-mandated (logos, watermarks). Audit flagged occurrences manually:
- `JBJMeetRoom.tsx:219` — JBJ wordmark watermark on dark video → keep
- `MeetingAIAssistant.tsx:238` — empty-state Sparkles → switch to `text-gray-400`

**Step 3 — Tighten faded white-on-dark (Tier 3, top 20 hot files)**

Focus on the highest-density offenders revealed by audit:
- `PropertyEvaluator.tsx` (66 hits), `AdminTrainingGuide.tsx` (39), `VideoResizePack.tsx` (37), `VoiceSuite.tsx` (33), `VideoMeeting.tsx` (31), `PropertyMeasurement.tsx` (29), executive dashboards, `OwnerDashboard.tsx`, etc.

Replace:
```text
text-white/30 → text-white/70  (or solid white if metadata)
text-white/40 → text-white/80
text-white/50 → text-white/85
text-white/60 → text-white/90
text-white/70 → text-white     (or text-white/95 if intentional fade)
```

**Step 4 — Add a static contrast guard**

Extend `scripts/contrast/check-white-on-light.mjs` (already present in repo) with a sibling rule that fails CI on:
- Any `text-gold/[1-7][0-9]?` outside an allowlist
- Any `bg-black` ancestor with a `text-black` descendant in the same JSX file

This prevents regression after the sweep.

### Technical Details

- **Why not just edit the global `text-gold` token?** The `text-gold` token is correctly used in many high-contrast contexts (gold over solid black). Only the `/XX` opacity variants degrade contrast. Surgical replacement is required.
- **Approach for codemod**: a Node script using `ripgrep` + `sed` per-file with a pre-written allowlist (logos, watermarks, intentional video overlays). Each file is reviewed before commit.
- **Inter font + black-on-white** is the standard per memory `Monochrome Design` and `Typography Monochrome` — fixes align with existing core memory.
- **No feature removal** — purely color/contrast token swaps. Honors the strict "No Removal" policy.
- **Testing**: After implementation, run `node scripts/contrast/check-rendered.mjs` and the new gold guard against the dev server to verify zero AA failures.

### Estimated Output

- **~99 component/page files** edited (gold opacity sweep)
- **~20 critical pages** restructured (Tier 1 inversion bug)
- **~20 high-density dark pages** tightened (Tier 3)
- **1 new CI guard script** added to `scripts/contrast/`

### Out of Scope

- Visual redesign of any page (colors only, no layout changes)
- Refactoring the `jj-card-inner` class itself (it is correct)
- Touching brand-locked elements: monogram, footer corporate hairline, AI-purple theme, price-orange tokens

Approving this plan switches Lovable to default mode and the sweep executes in a single batched implementation.
