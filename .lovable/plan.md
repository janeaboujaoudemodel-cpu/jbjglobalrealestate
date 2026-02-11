

# Critical Finding: Founder Name Spelling Violation Across Entire Codebase

## The Problem

The project memory `identity/owner-name-spelling-lock-v2-lowercase-b` explicitly mandates:

> The Owner's name locked to **"Jane bou Jaoude"** (lowercase 'b').

However, the name is incorrectly spelled as **"Jane Bou Jaoude"** (uppercase "B") in approximately **100+ files** across the codebase. Only ~10 files use the correct "Jane bou Jaoude" form.

---

## Scope of the Fix

### 1. Central Constants (Root Cause)
The central source of truth propagates the wrong spelling:

- `src/constants/stats.ts` -- lines 64-66: `founder: 'Jane Bou Jaoude'`, `founderBilingual: 'Jane Bou Jaoude (...)'`
- `src/config/master-lock.ts` -- lines 20-29: `FOUNDER_NAME`, `FOUNDER_NAME_BILINGUAL`, `FOUNDER_FULL_TITLE`

### 2. Translation Files (14 files)
All translation files have `'founder.name': 'Jane Bou Jaoude'`:
- `src/translations/de.ts`
- `src/translations/fr.ts`
- `src/translations/ru.ts`
- `src/translations/ja.ts`
- `src/translations/zh.ts`
- `src/translations/nl.ts`
- `src/translations/he.ts`
- `src/translations/tr.ts`
- `src/translations/pl.ts`
- `src/translations/ar.ts`
- `src/translations/hi.ts`
- `src/translations/pt.ts`
- `src/translations/es.ts`
- `src/translations/en.ts`

Each translation file contains multiple instances (founder.name, founder.description2, report.description, report.createdBy, etc.)

### 3. Component Files (16+ files)
Hardcoded instances in UI components:
- `src/components/SEOHead.tsx` -- pagesSEO entries (home, properties, founder, about, contact, awards, team)
- `src/components/Footer.tsx` -- copyright and ownership text
- `src/components/GlobalSEO.tsx` -- structured data/schema.org
- `src/components/Book3D.tsx`
- `src/components/FounderPhilosophySection.tsx`
- `src/components/broker/MarketReportCTAModal.tsx`
- `src/components/executive/ExecutiveChatPanel.tsx`
- `src/components/BrandMonogram.tsx` (if applicable)
- And others

### 4. Page Files (25+ files)
Hardcoded instances in pages:
- `src/pages/Founder.tsx`
- `src/pages/PressKit.tsx`
- `src/pages/MeetTheTeam.tsx`
- `src/pages/CRM.tsx`
- `src/pages/DigitalCard.tsx`
- `src/pages/AIFinancialAdvisor.tsx`
- `src/pages/Compare.tsx`
- `src/pages/services/BrokerCertification.tsx`
- `src/pages/market-intelligence/QuarterlyMarketReview.tsx`
- `src/pages/market-intelligence/AnnualMarketSummary.tsx`
- `src/pages/executive/ExecutiveOverview.tsx`
- `src/pages/executive/ExecutiveMarketSignals.tsx`
- `src/pages/executive/ExecutivePerformance.tsx`
- And others

### 5. Config Files (12 files)
- `src/config/master-lock.ts`
- `src/config/team-members.ts`
- `src/config/globalSearchIndex.ts`
- `src/config/company-communication-groups.ts`
- `src/config/ai-comprehensive-training.ts`
- `src/config/listing-approval-workflow.ts`
- `src/config/assistant-brain-updates.ts`
- And others

### 6. Edge Functions (9 files)
- `supabase/functions/_shared/ai-utils.ts`
- `supabase/functions/submit-support-ticket/index.ts`
- `supabase/functions/send-welcome-email/index.ts`
- `supabase/functions/vapi-webhook/index.ts`
- `supabase/functions/owner-ai-reply/index.ts`
- `supabase/functions/auto-translate/index.ts`
- `supabase/functions/ai-chat-support/index.ts`
- `supabase/functions/ai-email-generator/index.ts`
- `supabase/functions/executive-assistant/index.ts`

---

## Execution Plan

### Phase 1: Fix Central Constants (highest priority)
1. Fix `src/constants/stats.ts` -- change `founder`, `founderBilingual`
2. Fix `src/config/master-lock.ts` -- change `FOUNDER_NAME`, `FOUNDER_NAME_BILINGUAL`, `FOUNDER_FULL_TITLE`

### Phase 2: Fix All Translation Files (14 files)
Change every `'Jane Bou Jaoude'` to `'Jane bou Jaoude'` across all translation files. Each file has ~4-6 instances.

### Phase 3: Fix Component Files (16+ files)
Update all hardcoded instances in component files.

### Phase 4: Fix Page Files (25+ files)
Update all hardcoded instances in page files.

### Phase 5: Fix Config Files (12 files)
Update all hardcoded instances in config files.

### Phase 6: Fix Edge Functions (9 files)
Update all hardcoded instances in edge function files and redeploy.

---

## Technical Notes

- The fix is a straightforward find-and-replace: `Jane Bou Jaoude` to `Jane bou Jaoude`
- Case-sensitive replacement only -- must NOT change `JANE BOU JAOUDE` (all-caps is a different format)
- The Arabic name "جاين بو جودة" remains unchanged
- Files that already use "Jane bou Jaoude" (lowercase b) are correct and should not be touched
- Edge functions will need redeployment after changes
- Estimated total: ~100 files, ~300+ individual replacements

