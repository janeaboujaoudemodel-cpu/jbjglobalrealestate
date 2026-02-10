

# Multi-Part Fix: Auto-Sync, DLD Removal, and Content Overlap

## Part 1: Daily Auto-Sync from Reelly (New Cron Jobs)

**Goal:** Automatically sync new projects, developers, areas, and logos from Reelly every day, and auto-approve them to go live without manual intervention.

**Current state:** Three cron jobs exist (news collection at 2AM, news enrichment at 2:30AM, Provident discovery at 3AM). There is NO cron job for Reelly sync or auto-approval.

**Changes:**

### New Edge Function: `daily-reelly-auto-sync`
**File:** `supabase/functions/daily-reelly-auto-sync/index.ts`

A new orchestrator function that runs the full pipeline in sequence:
1. Call `reelly-api-sync` with `action: "sync"` and `mode: "quick"` to fetch new/updated projects from the Reelly API
2. Call `reelly-developers-sync` to discover any new developers and their logos
3. Call `reelly-areas-sync` to discover any new areas
4. Call `bulk-approve-imports` to auto-approve ALL pending imports directly to the live projects table

Each step logs results. If any step fails, the function continues with the next step and reports partial results.

### Database Migration: Add Cron Jobs
Two new `pg_cron` jobs scheduled after the existing 3AM Provident job:
- **4:00 AM UAE:** `daily-reelly-auto-sync` -- full Reelly sync + auto-approve pipeline
- **5:00 AM UAE:** `reelly-backfill-projects` -- fetch missing details (floor plans, amenities, docs) for recently approved projects

---

## Part 2: Remove DLD Links from Market Overview

**File:** `src/pages/market-intelligence/MarketOverview.tsx`

**What:** Remove the two DLD links from the "Rent Benchmarking & Adjustments" section (lines 267-270):
- "Official DLD Rental Index"
- "DLD How-Do-I Guide"

Also remove the DLD reference from the section body text (line 273: "...through the official DLD Rental Index"). Replace with neutral language about RERA's rent calculator tool.

The `links` prop on that ContentSection will be removed entirely.

---

## Part 3: Fix Content Overlapping TOC Sidebar Navigation

**Problem:** On pages with a fixed right-side Table of Contents (TOC) navigator, some sections use `max-w-5xl mx-auto px-4` which does NOT reserve space for the TOC. The content goes underneath the TOC panel.

**Solution:** Replace ALL instances of `max-w-5xl mx-auto px-4` with `jj-guide-content` on pages that have the TOC sidebar. The `jj-guide-content` class already has `padding-right: 20rem` on `lg:` screens.

**Affected files (6 pages):**

| File | Sections using wrong container |
|------|------|
| `src/pages/TenantGuide.tsx` | Sections 2-10 + FAQ + JBJ Support (10 sections use `max-w-5xl mx-auto px-4` instead of `jj-guide-content`) |
| `src/pages/RentGuide.tsx` | Sections 2-7 (6 sections use `max-w-5xl mx-auto px-4`) |
| `src/pages/LandlordGuide.tsx` | Sections 2-10 (uses `max-w-5xl mx-auto px-4`) |
| `src/pages/SellerGuide.tsx` | All sections already use `jj-guide-content` -- VERIFY |
| `src/pages/market-intelligence/MarketOverview.tsx` | Section 10 "Property Performance" -- the number circle in the TOC appears cropped; increase `scroll-mt-24` to `scroll-mt-32` for this section specifically |

**Fix for section 10 "Property Performance" cropped in TOC navigation:**
The TOC item #10 text is cut off because the TOC nav panel has `max-h-[calc(100vh-200px)]` but with 11 items the list overflows. Add `overflow-y: auto` to the nav element inside both `MarketIntelligenceTableOfContents.tsx` and `GuideTableOfContents.tsx` to ensure all items are scrollable.

---

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/daily-reelly-auto-sync/index.ts` | NEW -- orchestrator for daily Reelly sync + auto-approve |
| Database migration | Add 2 new pg_cron jobs at 4AM and 5AM UAE time |
| `src/pages/market-intelligence/MarketOverview.tsx` | Remove DLD links from rent-benchmarking section; fix section text |
| `src/pages/TenantGuide.tsx` | Replace `max-w-5xl mx-auto px-4` with `jj-guide-content` in 10 sections |
| `src/pages/RentGuide.tsx` | Replace `max-w-5xl mx-auto px-4` with `jj-guide-content` in 6 sections |
| `src/pages/LandlordGuide.tsx` | Replace `max-w-5xl mx-auto px-4` with `jj-guide-content` in ~8 sections |
| `src/components/market-intelligence/MarketIntelligenceTableOfContents.tsx` | Add `overflow-y: auto` to nav content area |
| `src/components/guides/GuideTableOfContents.tsx` | Add `overflow-y: auto` to nav content area |
