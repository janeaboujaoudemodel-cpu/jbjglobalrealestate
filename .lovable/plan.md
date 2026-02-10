
# Comprehensive Fixes: Footer Hubs, Search, Education Page, and FAQ Pages

## Overview

This plan addresses 10+ distinct issues across the footer navigation, header search, broker education page, and FAQ content. Changes are organized by priority.

---

## Part 1: Footer Restructure -- Add Broker Hub and Investor Hub as Separate Cards

**Current state:** The footer has an "Education Hub" card (Card 6) that contains both Education Hub links AND Investor Hub links. Broker Tools appear in Row 3 only when broker mode is active. Market Intelligence is also in Row 3.

**What changes:**
- Split Card 6 into separate concerns
- Create 3 new footer cards in Row 2/3 area:
  1. **Broker Hub** (mode-conditional: visible only in broker/combined mode) -- contains: Broker Toolkit, Broker Education, Broker Resources, Training Portal
  2. **Investor Hub** (mode-conditional: visible only in investor/combined mode) -- contains: Investor Education, Investor FAQs, Investor Tools, My Dashboard
  3. **Market Intelligence** (always visible) -- contains the existing market intel links
- Education Hub card remains but without the Investor Hub section embedded in it
- Remove the old Row 3 broker tools / market intelligence cards since they are now in the main grid

**Mode visibility rules (applied globally):**
- Investor mode: sees Investor Hub, hides Broker Hub
- Broker mode: sees Broker Hub, hides Investor Hub (but can still access guides/books)
- Combined mode: sees both hubs

**File: `src/components/Footer.tsx`**

---

## Part 2: Remove MegaMenuSearch Dropdown -- Use GlobalSearchModal Directly

**Problem:** When hovering the search icon, a "Search & Shortcuts" mega menu dropdown opens first. The user must then click "Search" inside it, which opens the actual GlobalSearchModal. The user wants ONLY the GlobalSearchModal.

**Changes in `src/components/GlobalHeader.tsx`:**
- Change the search icon behavior: On hover, open the GlobalSearchModal directly (set `searchOpen = true`) instead of opening `MegaMenuSearch`
- On click, also open GlobalSearchModal and keep it open (pinned)
- On click outside or pressing X or clicking search icon again, close it
- Remove `MegaMenuSearch` from rendering entirely in the utility mega menu panels
- The `MegaMenuSearch` component file can remain but will no longer be used

This makes the search a single-step interaction: hover or click the search icon opens the full search modal immediately.

---

## Part 3: Fix White Text in Language Dropdown (Force Override)

**Problem:** The user reports the language dropdown text is still white. The `BookLanguageFilter.tsx` code already has `text-black` and `bg-white`, but the Radix `DropdownMenuItem` base styles may be overriding with focus/hover classes.

**Fix in `src/components/broker-education/BookLanguageFilter.tsx`:**
- Add `!text-black` (important) to non-selected items to force override any base Radix styles
- Add explicit `focus:text-black focus:bg-gold/10` to prevent focus state from reverting to white text

---

## Part 4: Standardize Book Card Heights (Already h-[400px], Needs Refinement)

**Current state:** `Book3DCard.tsx` already has `h-[400px]` on the book cover container, but books with different title/description lengths can still appear visually different.

**Fix in `src/components/broker-education/Book3DCard.tsx`:**
- Change the outer container to have a fixed total height (e.g., `h-[440px]`) to include the shadow area
- Add `min-h-[400px] max-h-[400px]` to lock the book cover height absolutely
- Ensure `line-clamp-2` on title and `line-clamp-2` on description are enforced
- Add `overflow-hidden` to the entire card to prevent content overflow on any screen size

---

## Part 5: Fix Certification Section -- Remaining White Text Issues

**Current state:** The `CertificationSection.tsx` and `PhaseCard.tsx` were converted to champagne theme in the last edit. But checking the code, the section header says `text-black` which is correct. The user reports "Complete all phases" and progress labels are not readable.

**Fix in `src/components/certification/CertificationSection.tsx`:**
- Verify all text uses `text-black` or `text-black/70` -- the current code already does this
- The `Progress` component may have white text on the progress bar label -- check and fix
- Ensure the progress percentage text (`{Math.round(overallProgress.percent)}%`) is `text-black/60` (currently is)

**Fix in `src/components/certification/PhaseCard.tsx`:**
- The "Continue Learning" button text may be too subtle -- make it more visible with stronger gold contrast
- Ensure locked state text `text-black/40` is readable against champagne background (it should be, but increase to `text-black/50` if needed)
- Fix card content overflow: add `overflow-hidden` and ensure description uses `line-clamp-3`

---

## Part 6: Add More JBJ Employee Benefits

**Current state:** The "What JBJ Brokers Receive" section has 4 cards: 24/7 Support, Continuous Education, Events and Networking, AI Tools Access.

**Add more benefit cards in `src/pages/BrokerEducation.tsx`:**
- Expand to 8 cards (2 rows of 4):
  1. 24/7 Support (existing)
  2. Continuous Education (existing)
  3. Events and Networking (existing)
  4. AI Tools Access (existing)
  5. Admin Support -- Personal assistant for each broker
  6. Operations Support -- CRM support and listing management
  7. Marketing Team -- Dedicated marketing support
  8. Personal Admin -- Manage listings and operations

---

## Part 7: Reduce Section Spacing on Broker Education Page

**Problem:** Too much vertical space between sections (Progress and Recognition, Benefits, Certification, CTA).

**Fix in `src/pages/BrokerEducation.tsx`:**
- Change section padding from `py-12 md:py-16` to `py-8 md:py-10` for internal sections
- Keep the hero section full height
- Keep the CTA section with slightly more padding (`py-12 md:py-16`)

---

## Part 8: CTA Button -- "Continue Reading" for Previously Opened Books

**Fix in `src/components/broker-education/Book3DCard.tsx`:**
- Check `progress?.status`: if `in_progress`, show "Continue Reading" instead of "Open Book"
- If `completed`, show "Read Again" or "Review"
- Make the button more premium: stronger gold background on hover, larger text

---

## Part 9: Delete AI-Generated FAQ Content -- Replace with Dummy Placeholders

**Problem:** The user explicitly stated they create FAQ content themselves. The 4 FAQ pages (BuyerFAQ, SellerFAQ, LandlordFAQ, TenantFAQ) were created with AI-generated Q&A content, which is not allowed.

**Fix:** Replace the content in all 4 FAQ pages with dummy placeholder content:
- Keep the page structure (hero, accordion, navigation)
- Replace all Q&A content with placeholder text like "Question coming soon" / "Answer will be added by the content team"
- Keep 2-3 placeholder categories with 2-3 placeholder questions each

**Files:** `src/pages/BuyerFAQ.tsx`, `src/pages/SellerFAQ.tsx`, `src/pages/LandlordFAQ.tsx`, `src/pages/TenantFAQ.tsx`

**Global rule to lock:** Never generate actual FAQ content. Always use placeholder/dummy text for FAQ pages. Only the user creates real content.

---

## Part 10: Content Overflow Fix -- Global Card Compatibility

**Problem:** Card content overflows when the screen is resized. "Continue Learning" button text can exceed the card boundary.

**Fix approach:**
- In `PhaseCard.tsx`: Add `overflow-hidden` to the card, use `truncate` or `line-clamp` on description text, ensure buttons use `whitespace-nowrap` and `text-sm` sizing
- In `Book3DCard.tsx`: Already has `line-clamp-2`, add `overflow-hidden` to the outer card
- These are responsive-safe patterns that work across all devices

---

## Files to Modify

| File | Change |
|---|---|
| `src/components/Footer.tsx` | Restructure to separate Broker Hub, Investor Hub, Market Intelligence cards with mode visibility |
| `src/components/GlobalHeader.tsx` | Change search icon to open GlobalSearchModal directly, remove MegaMenuSearch usage |
| `src/components/broker-education/BookLanguageFilter.tsx` | Force text-black with important overrides |
| `src/components/broker-education/Book3DCard.tsx` | Lock card height, fix CTA labels (Continue Reading / Review), overflow protection |
| `src/pages/BrokerEducation.tsx` | Add more benefit cards, reduce section spacing |
| `src/components/certification/CertificationSection.tsx` | Ensure all text is black/readable on champagne |
| `src/components/certification/PhaseCard.tsx` | Fix content overflow, ensure readability |
| `src/pages/BuyerFAQ.tsx` | Replace AI-generated content with dummy placeholders |
| `src/pages/SellerFAQ.tsx` | Replace AI-generated content with dummy placeholders |
| `src/pages/LandlordFAQ.tsx` | Replace AI-generated content with dummy placeholders |
| `src/pages/TenantFAQ.tsx` | Replace AI-generated content with dummy placeholders |

## Execution Order

1. Fix search (remove MegaMenuSearch, open GlobalSearchModal directly)
2. Fix BookLanguageFilter text color override
3. Fix Book3DCard height lock + CTA labels + overflow
4. Fix PhaseCard and CertificationSection readability + overflow
5. Reduce section spacing in BrokerEducation
6. Add more JBJ employee benefits
7. Restructure Footer with Broker Hub + Investor Hub + Market Intelligence
8. Replace FAQ page content with dummy placeholders
