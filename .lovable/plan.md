

# Phase 3-6: Complete Founder Name Fix ("Jane Bou Jaoude" -> "Jane bou Jaoude")

65 files still contain the incorrect uppercase "B" spelling. Here is the complete remaining work:

---

## Translation File (1 file missed)
- `src/translations/it.ts` -- 5 instances (founder.name, founder.description2, report.description, report.createdBy)

---

## Component Files (15 files)

| File | Instances |
|------|-----------|
| `src/components/SEOHead.tsx` | ~15 (all pagesSEO entries) |
| `src/components/FounderPhilosophySection.tsx` | 2 |
| `src/components/FounderContent.tsx` | 3 (comments + render output) |
| `src/components/CEOLeadershipShowcase.tsx` | 4 (alt text, heading, quote attribution) |
| `src/components/MarketReportHeroBook.tsx` | 1 |
| `src/components/LegalDisclaimer.tsx` | 1 |
| `src/components/broker/MarketReportCTAModal.tsx` | 1 |
| `src/components/crm/CRMCommunicationPanel.tsx` | 2 |
| `src/components/signature/AISignatureGenerator.tsx` | 1 (placeholder) |
| `src/components/seo/MarketIntelligenceSchema.tsx` | 1 |
| `src/components/executive/ExecutiveChatPanel.tsx` | (needs verification) |
| `src/components/Footer.tsx` | (needs verification) |

---

## Page Files (25 files)

| File | Instances |
|------|-----------|
| `src/pages/Founder.tsx` | ~6 (name, alt text, bio paragraphs) |
| `src/pages/MarketReport.tsx` | ~6 (PDF HTML, alt text, heading) |
| `src/pages/AIFinancialAdvisor.tsx` | 1 |
| `src/pages/Quiz.tsx` | 2 |
| `src/pages/PropertyMeasurement.tsx` | 1 |
| `src/pages/PropertyEvaluator.tsx` | 1 |
| `src/pages/JBJDesignStudio.tsx` | 1 (placeholder) |
| `src/pages/Terms.tsx` | 1 |
| `src/pages/CRM.tsx` | 1 |
| `src/pages/DigitalCard.tsx` | 1 |
| `src/pages/Compare.tsx` | (needs verification) |
| `src/pages/PressKit.tsx` | (needs verification) |
| `src/pages/MeetTheTeam.tsx` | (needs verification) |
| `src/pages/market-intelligence/QuarterlyMarketReview.tsx` | 2 |
| `src/pages/market-intelligence/AnnualMarketSummary.tsx` | 2 |
| `src/pages/executive/ExecutiveOverview.tsx` | 1 |
| `src/pages/executive/ExecutiveMarketSignals.tsx` | (needs verification) |
| `src/pages/executive/ExecutivePerformance.tsx` | (needs verification) |
| `src/pages/services/BrokerCertification.tsx` | (needs verification) |

---

## Config Files (8 files)

| File | Instances |
|------|-----------|
| `src/config/ai-personalities.ts` | ~10 (founder object, Amanda systemPrompt, signatures) |
| `src/config/ai-brain-training.ts` | 2 |
| `src/config/ai-role-specific-training.ts` | 1 |
| `src/config/department-group-structure.ts` | 3 |
| `src/config/globalSearchIndex.ts` | 1 |
| `src/config/company-communication-groups.ts` | 5 |
| `src/config/listing-approval-workflow.ts` | 1 |
| `src/config/assistant-brain-updates.ts` | 4 |
| `src/config/team-members.ts` | 2 |

---

## Hook Files (2 files)

| File | Instances |
|------|-----------|
| `src/hooks/useAIReplyEngine.ts` | 1 |
| `src/hooks/useOwnerInbox.ts` | 1 |

---

## Edge Functions (7 files)

| File | Instances |
|------|-----------|
| `supabase/functions/_shared/ai-utils.ts` | 1 |
| `supabase/functions/ai-email-generator/index.ts` | 1 |
| `supabase/functions/executive-assistant/index.ts` | ~12 |
| `supabase/functions/submit-support-ticket/index.ts` | 1 |
| `supabase/functions/auto-translate/index.ts` | 1 |
| `supabase/functions/ai-chat-support/index.ts` | 1 |
| `supabase/functions/vapi-webhook/index.ts` | ~6 |

---

## Execution Strategy

All changes are a case-sensitive find-and-replace: `Jane Bou Jaoude` to `Jane bou Jaoude`.

**Batch 1** (this message): Translation file (it.ts) + all component files (15 files)
**Batch 2** (next message): All page files (15+ files)
**Batch 3** (next message): All config files (9 files) + hook files (2 files)
**Batch 4** (final): All edge function files (7 files) + redeploy

Total: ~65 files, ~100+ individual replacements remaining.

No wording, layout, or logic changes -- purely spelling correction per the locked identity standard.
