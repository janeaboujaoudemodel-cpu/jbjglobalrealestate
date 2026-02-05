
# Implementation Plan: Points/Rewards, Books/Certification, UI Fixes

## Executive Summary
This plan addresses 13 tasks spanning points rebalancing, dual reward systems, certification flow, multi-language books, and UI consistency improvements. All changes will maintain the approved UI system (black base + champagne layer + gold borders).

---

## Section A: Points, Rewards, Deal Bonuses

### Task 1: Rebalance Points (Deals vs Website Activity)

**Current State:**
- `points_config` table has deal_closed = 500 points (too low)
- Site check-ins = 30 pts (monthly cap 15 = 450 pts/month)
- Training = 50 pts (monthly cap 20 = 1000 pts/month potential)

**Changes Required:**

1. **Database Migration - Update `points_config` table:**
   - `deal_closed`: 500 → 3,000 base points
   - `deal_closed_premium`: 750 → 5,000 points (>5M AED)
   - Add new deal tiers:

| Tier | Transaction Value (AED) | Base Points |
|------|------------------------|-------------|
| Standard | Up to 1,000,000 | 3,000 |
| Premium | 1,000,001 - 5,000,000 | 5,000 |
| Ultra Premium | 5,000,001 - 15,000,000 | 8,000 |
| Elite | 15,000,001+ | 12,000 |

2. **Rebalance activity points with caps:**
   - Daily login: 5 pts (daily cap: 1, monthly cap: 20) = 100 pts/month max
   - Check-ins: 30 pts (daily cap: 2, monthly cap: 15) = 450 pts/month max
   - Training: 50 pts (daily cap: 3, monthly cap: 10) = 500 pts/month max
   - Total non-deal max: ~1,050 pts/month (far below single deal minimum of 3,000)

3. **Add new columns to `points_config`:**
   - `max_weekly` (integer, nullable)
   - `deal_value_min` (numeric, for deal tier thresholds)
   - `deal_value_max` (numeric, for deal tier thresholds)

4. **Files to Modify:**
   - `src/hooks/useTierProgress.ts` - Add deal value tier logic
   - `src/components/tier/PointsActivity.tsx` - Show category badges

---

### Task 2: Redeem Packages + Bonuses (Deal-Only)

**New Tables Required:**

1. **`deal_bonus_thresholds` table:**
```sql
CREATE TABLE deal_bonus_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_name TEXT NOT NULL,
  required_deal_points INTEGER NOT NULL,
  bonus_type TEXT NOT NULL, -- 'cash' | 'hardware'
  bonus_value_aed NUMERIC,
  bonus_description TEXT,
  hardware_item TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);
```
Example rows:
- Bronze: 10,000 deal pts → AED 2,000
- Silver: 25,000 deal pts → AED 3,000
- Gold: 50,000 deal pts → AED 5,000
- Platinum: 100,000 deal pts → AED 10,000 OR iPhone
- Diamond: 200,000 deal pts → Laptop

2. **`broker_bonus_claims` table:**
```sql
CREATE TABLE broker_bonus_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  threshold_id UUID REFERENCES deal_bonus_thresholds,
  deal_points_at_claim INTEGER NOT NULL,
  bonus_status TEXT DEFAULT 'pending', -- pending | approved | paid | rejected
  rejection_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

3. **New Components:**
   - `src/components/rewards/DealBonusCard.tsx` - Show eligible bonuses
   - `src/components/rewards/BonusClaimForm.tsx` - Claim bonus
   - `src/components/admin/DealBonusManager.tsx` - Admin approval view

---

### Task 3: Giveaways + Monthly Draw (Points-Based)

**New Tables Required:**

1. **`monthly_draws` table:**
```sql
CREATE TABLE monthly_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_month INTEGER NOT NULL,
  draw_year INTEGER NOT NULL,
  prize_description TEXT NOT NULL,
  min_activity_points INTEGER DEFAULT 100,
  status TEXT DEFAULT 'open', -- open | closed | completed
  winner_user_id UUID,
  drawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

2. **`draw_entries` table:**
```sql
CREATE TABLE draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID REFERENCES monthly_draws NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  entry_source TEXT NOT NULL, -- 'auto_qualify' | 'manual' | 'bonus_entry'
  activity_points_at_entry INTEGER NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(draw_id, user_id)
);
```

3. **New Components:**
   - `src/components/rewards/MonthlyDrawCard.tsx` - Current draw + entry status
   - `src/components/rewards/GiveawayGrid.tsx` - Available giveaways
   - `src/components/admin/DrawManager.tsx` - Admin draw management

---

### Task 4: Global Front-End / Back-End Synchronization

**Enhance `points_ledger` table with new columns:**
```sql
ALTER TABLE points_ledger ADD COLUMN IF NOT EXISTS
  role TEXT, -- 'broker' | 'client'
  user_mode TEXT, -- 'broker_mode' | 'client_mode'
  category TEXT, -- 'deal' | 'training' | 'check_in' | 'referral' | 'activity' | 'other'
  source_name TEXT, -- module name / deal ID reference
  running_total INTEGER,
  notes TEXT;
```

**Files to Modify:**
- `src/hooks/useTierProgress.ts` - Add category filtering, running totals
- Create `src/hooks/usePointsLedger.ts` - Full ledger hook with filters

---

## Section B: Books + Certification

### Task 5: Book Access Rules (Clarify Restricted)

**Current State:**
- `is_restricted` boolean on `broker_education_books`
- "Advanced (Restricted)" path has no clear unlock logic

**Changes Required:**

1. **Add unlock criteria to `broker_education_books`:**
```sql
ALTER TABLE broker_education_books ADD COLUMN IF NOT EXISTS
  unlock_requirements JSONB DEFAULT '{}';
-- Example: {"requires_books": [1,2,3], "requires_first_deal": true, "requires_tests_passed": true}
```

2. **Create unlock check function:**
```sql
CREATE OR REPLACE FUNCTION check_book_unlock(p_user_id UUID, p_book_id UUID)
RETURNS BOOLEAN AS $$
  -- Check if user has completed prerequisite books
  -- Check if user has passed required tests
  -- Check first deal for partners
$$;
```

3. **Update `src/components/broker-education/Book3DCard.tsx`:**
   - Show unlock requirements on restricted books
   - Display progress toward unlock

---

### Task 6: Certification Section After Books

**New Tables Required:**

1. **`certification_phases` table:**
```sql
CREATE TABLE certification_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_book_ids UUID[],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);
```

2. **`user_certification_progress` table:**
```sql
CREATE TABLE user_certification_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  phase_id UUID REFERENCES certification_phases NOT NULL,
  status TEXT DEFAULT 'locked', -- locked | in_progress | test_pending | completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, phase_id)
);
```

**New Components:**
- `src/components/certification/CertificationSection.tsx` - Main section
- `src/components/certification/PhaseCard.tsx` - Individual phase display
- `src/components/certification/CertificatePreview.tsx` - Final certificate

---

### Task 7: Tests Per Module (Scoring, Retakes, Anti-Cheat)

**New Tables Required:**

1. **`module_questions` table:**
```sql
CREATE TABLE module_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES broker_education_modules NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- ["Option A", "Option B", "Option C", "Option D"]
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  is_active BOOLEAN DEFAULT true
);
```

2. **`test_attempts` table:**
```sql
CREATE TABLE test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  module_id UUID REFERENCES broker_education_modules NOT NULL,
  attempt_number INTEGER NOT NULL,
  questions_shown UUID[], -- Track which questions were used
  answers_given JSONB, -- {question_id: selected_index}
  score_percent NUMERIC,
  passed BOOLEAN,
  show_answers BOOLEAN DEFAULT false, -- True after 3rd failure
  completed_at TIMESTAMPTZ DEFAULT now()
);
```

**Test Logic:**
- 70% pass threshold
- Random question selection (10 from pool per attempt)
- After 3 failures: `show_answers = true`, display message
- Questions must differ between attempts

**New Components:**
- `src/components/tests/ModuleTest.tsx` - Test interface
- `src/components/tests/TestResults.tsx` - Results + mistakes view
- `src/components/tests/FailedAttemptsMessage.tsx` - 3-fail message

---

### Task 8: Multi-Language for Books

**New Tables/Columns:**

1. **`user_preferences` enhancement:**
```sql
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS
  preferred_books_language TEXT DEFAULT 'en';
```

2. **`broker_education_books_translations` table:**
```sql
CREATE TABLE broker_education_books_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES broker_education_books NOT NULL,
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  learning_objective TEXT,
  UNIQUE(book_id, language_code)
);
```

**New Components:**
- `src/components/broker-education/BookLanguageFilter.tsx` - Language selector
- Update `useBrokerEducation.ts` to fetch translations

---

### Task 9: Book Visual Consistency

**Changes Required:**

1. **Update `Book3DCard.tsx`:**
   - Standardize card dimensions: width 280px, height 400px
   - Add cover image support (new `cover_image_url` column exists)
   - Replace number display with actual image background

2. **Add `broker_education_books.cover_image_url` content:**
   - Generate/assign premium cover images per book

3. **Add Certificate Preview at end of flow:**
   - `src/components/certification/FinalCertificatePreview.tsx`

---

## Section C: Page Missing Sections + Footer + UI

### Task 10: Add Missing Contact Details Section

**Affected Page:** `src/pages/BrokerEducation.tsx`

**Changes:**
- The `DirectContactCTA` component is now rendered globally via `MainLayout.tsx`
- Verify it appears after "Ready to Get Started" section
- If page has custom layout, ensure proper ordering

---

### Task 11: Footer Menu Background Layer + Alignment

**File:** `src/components/Footer.tsx`

**Changes Required:**

1. **Add champagne background layer behind navigation menus** (lines ~450-700)
   - Wrap menu grid in styled card matching "Stay in the Loop" styling

2. **Fix alignment:**
   - Services | Broker Hub | Market Intelligence | Careers on same row
   - All divider lines must align horizontally
   - Use CSS grid with explicit column sizing

---

### Task 12: Broker Tools Section Styling

**File:** `src/components/Footer.tsx` (Professional Tools section ~line 716)

**Option Chosen:** Add background card matching "Stay in the Loop" system

**Changes:**
- Wrap "Professional Tools" buttons in champagne card
- Update button styling to match active color scheme

---

## Section D: Admin Backend Views

### Task 13: Admin Backend Views

**New Admin Components:**

1. **`src/components/admin/PointsLedgerAdmin.tsx`:**
   - Full ledger view with filters (user, month, category)
   - Export functionality
   - Deal points vs Activity points totals

2. **`src/components/admin/DrawEntriesAdmin.tsx`:**
   - Monthly draw entries list
   - Past draws history
   - Winner selection interface

3. **`src/components/admin/DealVerificationAdmin.tsx`:**
   - Deals pending verification
   - Approve/reject with reason
   - Points auto-award on verification

4. **`src/components/admin/CertificationProgressAdmin.tsx`:**
   - User certification status
   - Test attempts and scores
   - Manual overrides

---

## Database Migrations Summary

### Migration 1: Points System Rebalance
- Update `points_config` values
- Add new columns: `max_weekly`, `deal_value_min`, `deal_value_max`
- Insert deal tier rows

### Migration 2: Deal Bonuses
- Create `deal_bonus_thresholds` table
- Create `broker_bonus_claims` table
- Insert default thresholds

### Migration 3: Monthly Draws
- Create `monthly_draws` table
- Create `draw_entries` table
- Add RLS policies

### Migration 4: Certification
- Create `certification_phases` table
- Create `user_certification_progress` table
- Insert initial phases

### Migration 5: Module Tests
- Create `module_questions` table
- Create `test_attempts` table
- Add question pool (10+ per module minimum)

### Migration 6: Book Translations
- Add `preferred_books_language` to user_preferences
- Create `broker_education_books_translations` table
- Add `unlock_requirements` to books

### Migration 7: Points Ledger Enhancement
- Add new columns to `points_ledger`

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/usePointsLedger.ts` | Full ledger with filters |
| `src/hooks/useDealBonuses.ts` | Deal bonus eligibility |
| `src/hooks/useMonthlyDraw.ts` | Draw entries and status |
| `src/hooks/useCertification.ts` | Certification progress |
| `src/hooks/useModuleTests.ts` | Test logic and history |
| `src/components/rewards/DealBonusCard.tsx` | Bonus display |
| `src/components/rewards/MonthlyDrawCard.tsx` | Draw entry UI |
| `src/components/certification/CertificationSection.tsx` | Cert flow |
| `src/components/certification/PhaseCard.tsx` | Phase display |
| `src/components/tests/ModuleTest.tsx` | Test interface |
| `src/components/tests/TestResults.tsx` | Results view |
| `src/components/broker-education/BookLanguageFilter.tsx` | Lang selector |
| `src/components/admin/PointsLedgerAdmin.tsx` | Admin ledger |
| `src/components/admin/DrawEntriesAdmin.tsx` | Admin draws |
| `src/components/admin/DealBonusManager.tsx` | Admin bonuses |
| `src/components/admin/CertificationProgressAdmin.tsx` | Admin certs |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/tier/PointsActivity.tsx` | Category badges, improved display |
| `src/hooks/useTierProgress.ts` | Deal tier logic, category separation |
| `src/components/broker-education/Book3DCard.tsx` | Consistent sizing, cover images |
| `src/components/broker-education/BookDetailModal.tsx` | Language filter, test link |
| `src/pages/BrokerEducation.tsx` | Add Certification section |
| `src/hooks/useBrokerEducation.ts` | Translation support |
| `src/components/Footer.tsx` | Menu background layer, alignment |

---

## UI Compliance Checklist

All new components will follow:
- Black base background
- Champagne/gold active layer (`jj-layer-2`)
- Pearl cards (`jj-card-inner`)
- Gold borders for inputs and key elements
- No white active states
- Primary buttons for main CTAs

---

## Implementation Order

1. **Phase 1:** Database migrations (all 7)
2. **Phase 2:** Tasks 1-4 (Points/Rewards system)
3. **Phase 3:** Tasks 5-9 (Books/Certification)
4. **Phase 4:** Tasks 10-12 (UI/Footer fixes)
5. **Phase 5:** Task 13 (Admin views)

Each task will include screenshot proof upon completion.
