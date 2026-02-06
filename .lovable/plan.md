
# JBJ Global Real Estate | AI Tools Restructure, Audit & Completion

## Executive Summary

This plan addresses a comprehensive restructure of AI tools, dashboards, permissions, and backend synchronization across the platform. Based on my deep audit, the current state shows a solid foundation with scattered tool organization. This plan consolidates everything into the mandated structure.

---

## Current State Analysis

### AI Tools Distribution (Current)
| Location | Tools Count | Status |
|----------|-------------|--------|
| `/toolkit/*` (RoyalToolsHub) | 8 media tools | Active, working |
| `/ai-hub` (AIHub page) | 13 investor tools | Active, mixed categories |
| `src/components/ai-tools/` | 17 AI tool components | Some unused |
| `src/config/royalToolsRegistry.ts` | 37 tool definitions | Registry exists |

### Key Issues Identified
1. **Tools are scattered** across multiple pages instead of grouped by output type
2. **Internal ops tools appear in public AI sections** (Listing Admin Sarah, CRM Support)
3. **Mode switcher exists** but needs visibility improvements
4. **Dashboard is functional** but missing some sections (Stay in the Loop, Badges)
5. **Developer visits system exists** with GPS check-in but needs polish
6. **Points system exists** (`points_ledger` table) but tier logic needs verification

---

## TASK 1: AI Tools Restructure

### New Architecture (5 Master Suites)

```text
/toolkit
├── /video-suite          ← NEW master page with tabs
│   ├── Tab: Edit         → AI Video Studio
│   ├── Tab: Resize       → Video Resize + Smart Reframe  
│   ├── Tab: Captions     → Captions & Translation
│   ├── Tab: Export       → Export Presets (Reels, YouTube, Stories)
│   └── Tab: Templates    → Future-ready placeholder
│
├── /voice-suite          ← NEW master page with tabs
│   ├── Tab: Voice Studio → TTS, enhance, clone
│   ├── Tab: Voice-to-Text→ STT (Speech recognition)
│   ├── Tab: Audio Cleanup→ Noise removal, enhancement
│   └── Tab: Translation  → Audio translation
│
├── /photo-suite          ← NEW master page with tabs
│   ├── Tab: Background   → AI Background Remover
│   ├── Tab: Beauty       → Beauty Filters
│   ├── Tab: Resize       → Image Resize + Social Sizes
│   ├── Tab: Interior     → AI Interior Design
│   └── Tab: Staging      → AI Virtual Staging (future)
│
├── /pdf-suite            ← NEW master page with tabs
│   ├── Tab: Editor       → PDF Editor (merge, split, sign)
│   ├── Tab: Photo→PDF    → Photo to PDF Generator
│   ├── Tab: Scan & Sign  → Document scanning + signature
│   └── Tab: Brochures    → Brochure generators
│
└── /property-suite       ← NEW master page with tabs
    ├── Tab: Home Finder  → AI Home Finder Quiz
    ├── Tab: Evaluator    → Property Evaluator
    ├── Tab: Compare      → Property Comparison
    ├── Tab: Rental Index → Rental Index Evaluator
    └── Tab: Mortgage     → Mortgage Calculator
```

### Internal Ops (REMOVED from Public AI)

The following will be moved to Admin/Operations sections only:
- JBJ News Reporter → `/admin/news-automation`
- Listing Admin Sarah → `/listing-admin`
- CRM/Calendar utilities → `/crm`
- Provident/Reelly sync → `/listing-admin`

### Files to Create
- `src/pages/toolkit/VideoSuite.tsx` - Master video page with tabs
- `src/pages/toolkit/VoiceSuite.tsx` - Master voice/audio page with tabs
- `src/pages/toolkit/PhotoSuite.tsx` - Master photo/image page with tabs
- `src/pages/toolkit/PDFSuite.tsx` - Master PDF page with tabs
- `src/pages/toolkit/PropertySuite.tsx` - Master property intelligence page with tabs

### Files to Modify
- `src/config/royalToolsRegistry.ts` - Reorganize by output type
- `src/components/header/MegaMenuToolkit.tsx` - Update navigation
- `src/pages/toolkit/RoyalToolsHub.tsx` - Update to show 5 suites
- `src/App.tsx` - Add new routes

---

## TASK 2: Broker Mode / Client Mode Fix

### Current State
- ModeSwitcher exists at `src/components/ModeSwitcher.tsx`
- Uses `useUserMode` hook with localStorage + database sync
- Supports 3 modes: investor, broker, investor_broker

### Issues to Fix
1. Mode selector not prominently visible in header
2. Dropdown closes on selection (should stay for confirmation)

### Implementation
1. Add ModeSwitcher to main header next to account/language
2. Modify `ModeSwitcher.tsx` to use `onSelect` with `e.preventDefault()` pattern (already done)
3. Ensure mode persists across sessions (already working)
4. Mode controls:
   - Visible tools (filter by mode in RoyalToolsHub)
   - Dashboard sections (show broker-only sections)
   - Education access (books/certification)

### Files to Modify
- `src/components/header/Header.tsx` - Add ModeSwitcher visibility
- `src/pages/toolkit/RoyalToolsHub.tsx` - Filter tools by mode

---

## TASK 3: Broker Hub & Investor Hub UI Fixes

### Required Fixes
1. Cards use champagne gradients (already using `from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`)
2. Icons with transparent backgrounds, gold borders (no black fill)
3. AI Home Finder card: purple label, white title, glow effect

### Files to Modify
- `src/pages/AIHub.tsx` - Verify card styling matches spec
- `src/pages/BrokerDashboard.tsx` - Verify champagne card styling
- Ensure consistent spacing/padding

---

## TASK 4: Dashboard Completion

### Current Dashboard Sections (BrokerDashboard.tsx)
- Profile card with avatar and badges
- Quick Actions grid
- Performance Overview
- Tasks & Reminders
- Notifications
- Broker Hub Links

### Missing Elements to Add
- Favorites section
- Shortlisted properties
- Badges earned display
- Books progress summary
- Stay in the Loop section (newsletter inside page)

### Files to Create
- `src/components/dashboard/FavoritesPreview.tsx`
- `src/components/dashboard/BadgesDisplay.tsx`
- `src/components/dashboard/StayInTheLoop.tsx`

### Files to Modify
- `src/pages/BrokerDashboard.tsx` - Add missing sections
- `src/pages/UserProfile.tsx` - Ensure profile data syncs

---

## TASK 5: Books, Training & Certification

### Current State
- Books system exists via `useBrokerEducation` hook
- `Book3DCard` component for 3D covers
- `BookLanguageFilter` for language selection
- `CertificationSection` exists
- Training progress tracked in `broker_training_progress` table

### Required Enhancements
1. Sequential module unlock logic
2. Test system: 70% pass threshold, 3 failures reveal answers
3. New questions on retry (randomization)
4. Certificate auto-generation with name, date, signature

### Database Tables Already Exist
- `education_books` - Book metadata
- `education_book_chapters` - Chapter content
- `broker_training_progress` - Progress tracking
- `broker_certifications` - Issued certificates

### Files to Create
- `src/components/training/ModuleTest.tsx` - Test component with pass logic
- `src/components/training/QuestionRandomizer.tsx` - Random question selection

### Files to Modify
- `src/pages/BrokerEducation.tsx` - Add test integration
- `src/hooks/useBrokerEducation.ts` - Add test progress tracking

---

## TASK 6: Points, Tiers & Rewards

### Current State
- `points_ledger` table exists with event tracking
- `broker_points` table exists
- `useTierProgress` hook loads points
- Tiers: Starter → Advanced → Elite → Legend

### Points Logic (Per Requirements)
| Action | Points | Cap |
|--------|--------|-----|
| Deal Closed | ~3000+ (scaled) | None |
| Training Module | 50 | None |
| Site Visit | 30 | 15/month |
| Daily Login | 5 | 1/day |
| Referral Signup | 100 | None |

### Files to Modify
- `src/hooks/useTierProgress.ts` - Add scaling logic
- `src/components/tier/PointsActivity.tsx` - Verify display

### Files to Create
- `src/pages/broker/RewardsStore.tsx` - Rewards catalog page
- `src/components/tier/RewardsCatalog.tsx` - Display available rewards

---

## TASK 7: Developer Visits System

### Current State (Functional)
- `developer_visit_requests` table - Request workflow
- `developer_visit_checkins` table - GPS + selfie check-in
- Components exist in `src/components/developer-visits/`
- Components exist in `src/components/visits/`

### Existing Components
- `DeveloperList.tsx` - List of developers
- `VisitRequestForm.tsx` - Request submission
- `MyVisitRequests.tsx` - Request tracking
- `SiteCheckIn.tsx` - GPS + photo check-in
- `SalespersonContact.tsx` - Contact reveal after approval

### Files to Create
- `src/pages/broker/DeveloperVisits.tsx` - Master visits page
- Add calendar sync integration

### Files to Modify
- `src/App.tsx` - Add `/broker-dashboard/visits` route
- `src/pages/BrokerDashboard.tsx` - Add visits quick action

---

## TASK 8: API & Synchronization

### Current State
- Reelly API sync via `reelly-api-sync` edge function
- Provident extraction via `provident-process` edge function
- `pending_project_imports` table for approval queue
- `sync_jobs` table for persistent queue

### Issues to Verify
1. Counts must match source (no 1,804 ≠ 1,803 bugs)
2. Quick Sync must sync ALL visible items
3. Queue persists on refresh

### Files to Audit
- `supabase/functions/reelly-api-sync/index.ts`
- `supabase/functions/provident-process/index.ts`
- `src/hooks/useSyncJobs.ts`

---

## TASK 9: UI Consistency

### Checklist
- No white text on white backgrounds
- Gold borders only (border-gold/40)
- Readable dropdowns with proper theming
- Complete country selector
- Consistent card styling

### Files to Audit & Fix
- All toolkit pages for border consistency
- Form components for dropdown styling
- `PhoneInput` component for country selector

---

## TASK 10: Full Audit Reporting

### After Implementation, Deliver:
1. Screenshot proof of each suite working
2. Feature parity checklist
3. Backend schema summary
4. Permission model documentation
5. Release readiness status

---

## Implementation Order

### Phase 1: Tool Suites (Priority: HIGH)
1. Create 5 master suite pages with tabs
2. Update registry and navigation
3. Remove internal tools from public AI

### Phase 2: Mode & Dashboard (Priority: HIGH)
1. Fix mode switcher visibility
2. Complete dashboard sections
3. Fix card styling

### Phase 3: Education & Points (Priority: MEDIUM)
1. Implement test system
2. Verify points logic
3. Add rewards catalog

### Phase 4: Visits & Sync (Priority: MEDIUM)
1. Polish developer visits page
2. Verify sync counts
3. Test queue persistence

### Phase 5: UI Polish & Audit (Priority: LOW)
1. Fix UI inconsistencies
2. Generate screenshots
3. Create documentation

---

## Technical Summary

### New Routes to Add
```typescript
/toolkit/video-suite    → VideoSuite.tsx
/toolkit/voice-suite    → VoiceSuite.tsx
/toolkit/photo-suite    → PhotoSuite.tsx
/toolkit/pdf-suite      → PDFSuite.tsx
/toolkit/property-suite → PropertySuite.tsx
/broker-dashboard/visits → DeveloperVisits.tsx
/broker-dashboard/rewards → RewardsStore.tsx
```

### Files Count
- **Create:** ~12 new files
- **Modify:** ~15 existing files
- **Delete:** 0 (preserve backward compatibility)

### Design System
- Background: Black (`bg-black`) or slate-900
- Cards: Champagne gradient (`from-[#F5EBD7]`)
- Borders: Gold (`border-gold/40`, `border-2`)
- Icons: Transparent with gold borders
- Accents: JBJ Gold (`#C8A766`, `#D4AF37`)

