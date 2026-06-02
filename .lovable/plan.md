## Goal

Extend `/compare` (Property Comparison) with a second mode — **Unit Comparison** — that lets a broker (or me as owner) compare units inside a single project (e.g. 1BR vs 2BR vs 3BR in "Amara Wellness Resort by City Developer") side-by-side, with a smart payment-plan auto-builder and column/field toggling.

Visibility:
- Investor mode → tool hidden entirely (no entry in nav, route still works for direct hits but renders an upsell explaining it's a broker tool)
- Developer mode → tool hidden
- Broker mode → tool visible (Project Compare + Unit Compare both shown)
- Owner (real `owner`/`admin` role) → always sees everything

The existing Project Comparison stays exactly as it is — we only add a top-level toggle and the new Unit mode beneath it.

---

## 1. Mode visibility gate

- Wrap `/compare` (and `/compare-manual`) entry points + nav links in a `useUserMode()` + `useIsAppOwner()` check.
  - Show in nav/sidebar/account dropdown ONLY when `mode === 'broker'` OR `isOwner === true`.
  - Direct route load while in investor/developer mode → render a small "This tool is for brokers" gate card with a "Switch to Broker mode" CTA (keep the page reachable for owner without mode switch).
- Update Royal Tools Hub / `PropertySuite.tsx` to hide the Compare tab for investor & developer modes.

## 2. Top of `/compare` — segmented toggle

Inside the existing `CompareAIShell`, add a glass pill segmented control above the hero:

```
[ Compare Projects ]   [ Compare Units ]
```

- `Compare Projects` = current page behavior (untouched).
- `Compare Units` = new flow described below.
- State is URL-driven (`?mode=units`) so deep-links share cleanly.

## 3. Unit Comparison flow

### 3a. Project picker (single project)

- Single combobox: "Select project" → searches `projects` table (existing search infra). Shows cover thumb + developer name.
- Once a project is chosen, show a slim project header card: cover, name, developer, location, handover.
- "Change project" link resets the comparison.

### 3b. Add units

Three ways to add a unit to the comparison (max 4 units):

1. **From DB** — if the project has rows in `project_units` (or similar), list them and let broker tick which to add.
2. **Manual entry** — "Add unit manually" → dialog with fields:
   - Label (e.g. "1BR – Sea View")
   - Bedrooms (studio/1/2/3/4+)
   - Size (sqft)
   - Total price (AED)
   - View (sea / community / pool / skyline / city / garden — free text allowed)
   - Floor (optional)
   - Unit number (optional, owner-only field)
   - Payment plan: pick from saved plans on the project OR "Use shared plan" OR custom inline
3. **AI fill from PDF/link** — reuse existing `AddProjectDialog` AI extract pipeline, but in unit-mode it returns unit-level fields. Out of scope for this pass if too large — wire the button as "Coming next" placeholder.

### 3c. Smart Payment Plan engine (the key piece)

A new util `src/lib/payment-plan/buildSchedule.ts` that takes:

```ts
type PlanRule =
  | { kind: 'down_payment'; pct: number; offsetDays?: number }       // e.g. 10% at booking
  | { kind: 'milestone'; pct: number; offsetMonths: number }          // e.g. 10% after 1 month
  | { kind: 'monthly'; pct: number; startMonth: number; untilHandover: true }  // e.g. 1% monthly till handover
  | { kind: 'on_handover'; pct: number }
  | { kind: 'post_handover_monthly'; pct: number; months: number };   // e.g. 1% monthly × 24 post-handover

type PlanInput = {
  totalPriceAED: number;
  handoverDate: string;       // ISO
  startDate?: string;         // default today
  rules: PlanRule[];
};
```

Output: full month-by-month schedule with date, label, % and AED amount, plus totals validation (sum of % must equal 100; if not, surface a warning).

UI:
- "Shared plan" toggle — if ON, the broker defines one plan and the engine auto-applies it to each unit using that unit's own total price + handover date.
- If OFF, each unit can have its own plan.
- Plan editor: chip-based rule builder (`+ Down payment`, `+ Milestone`, `+ Monthly till handover`, `+ On handover`, `+ Post-handover`) with inline % and offset inputs.
- Live preview: a small accordion under each unit showing the generated schedule (first 6 rows + "show all 36 installments").
- Save reusable plans to `payment_plan_templates` table (broker/owner scoped) so they can be re-used across projects.

### 3d. Comparison table

Sticky-header table, 1 column per unit (up to 4). Rows = metrics. Each row toggleable via a "Columns" / "Fields" dropdown.

Default visible rows (grouped):

**Unit**
- Label, Bedrooms, Size (sqft), Price, Price / sqft, View, Floor, Unit #

**Location & Project**
- Project name, Developer, Location/Area, Community, Handover

**Payment Plan**
- Down payment %, Monthly installment (AED), # of installments, Total during construction, Total post-handover, First payment date, Last payment date

**Developer (collapsed by default)**
- Founded year, Founder, Delivered projects count, Active projects, On-time delivery rating

**Investor metrics (owner/broker analytical, optional)**
- Estimated ROI, Estimated rental yield, Service charges (AED/sqft/yr), DLD fee

A "Manage fields" popover lets the broker:
- Check/uncheck any field
- Reorder groups
- Save presets (e.g. "Quick investor pitch", "Full broker view") to `compare_field_presets` table

Best-value highlighting: cheapest price/sqft, lowest monthly, highest yield → soft gold ring on that cell.

Bottom of table:
- "Download PDF" (reuse existing report HTML generator, swap content for unit table)
- "Share WhatsApp" / "Share Email"
- "Save comparison" → persists to `unit_comparisons` table so the broker can reopen later

## 4. Backend (Lovable Cloud)

New tables (migration):

```text
payment_plan_templates
  id uuid pk, owner_user_id uuid, name text, rules jsonb, is_shared bool, created_at

compare_field_presets
  id uuid pk, owner_user_id uuid, scope text ('project'|'unit'),
  name text, visible_fields jsonb, field_order jsonb, created_at

unit_comparisons
  id uuid pk, owner_user_id uuid, project_id uuid, units jsonb,
  shared_plan jsonb, field_preset jsonb, created_at, updated_at
```

RLS:
- All three tables: SELECT/INSERT/UPDATE/DELETE where `owner_user_id = auth.uid()` OR `has_role(auth.uid(), 'owner')` OR `has_role(auth.uid(), 'admin')`.
- Plus the standard GRANTs (`authenticated`, `service_role`) per the public-schema grants rule.

No edge function needed for the payment-plan math — it's pure client-side TypeScript. The existing `smart-ai-analysis` function gets a new optional `unitsComparison` input shape for the AI verdict pass on units (handled in a follow-up if scope grows).

## 5. Files

New:
- `src/components/compare/CompareModeToggle.tsx`
- `src/components/compare/units/UnitCompareShell.tsx`
- `src/components/compare/units/ProjectPicker.tsx`
- `src/components/compare/units/UnitCard.tsx`
- `src/components/compare/units/AddUnitDialog.tsx`
- `src/components/compare/units/PaymentPlanEditor.tsx`
- `src/components/compare/units/PaymentScheduleTable.tsx`
- `src/components/compare/units/UnitComparisonTable.tsx`
- `src/components/compare/units/FieldManagerPopover.tsx`
- `src/components/compare/units/CompareAccessGate.tsx`
- `src/lib/payment-plan/buildSchedule.ts`
- `src/lib/payment-plan/buildSchedule.test.ts`
- `src/lib/compare/unitFieldsConfig.ts`
- `src/hooks/useCompareAccess.ts`

Edits:
- `src/pages/Compare.tsx` — mount `CompareModeToggle`, swap content based on `?mode=`
- `src/pages/toolkit/PropertySuite.tsx` — hide Compare tab for investor/developer
- Nav/header/account-dropdown — hide Compare link for non-broker/non-owner
- `.lovable/plan.md` — refresh

Memory:
- New: `mem://features/compare/unit-comparison-and-payment-plan-engine` capturing the role gating, schema, payment-plan rule grammar, and "always allowed for owner" rule.

## 6. End-to-end QA (mandatory before sign-off)

In broker mode at 1178×891 then 390×844:
1. `/compare` → toggle to "Compare Units" → pick "Amara Wellness Resort" (or any real project) → add 3 manual units (1BR, 2BR, 3BR) with prices.
2. Enable Shared Plan: 10% down, 10% after 1 month, 1% monthly till handover, 30% on handover → verify schedule auto-builds per unit using each unit's own price; totals = 100%.
3. Toggle fields off (hide Founder, Founded year) → table updates live; save preset → reload → preset persists.
4. Switch to investor mode → /compare entry hidden in nav + tool gate renders on direct hit. Switch to developer mode → same. Switch to owner → both modes visible regardless of mode pill.
5. Download PDF → unit table renders, payment schedules included.
6. Mobile 390px → cards stack, table horizontally scrolls.

## Out of scope this pass
- AI-extract from PDF for units (button stubbed, real extractor in follow-up)
- Editing the existing Project Comparison flow (it stays as-is)
- Multi-project unit cross-compare (only one project at a time for now)

Approve and I'll build.