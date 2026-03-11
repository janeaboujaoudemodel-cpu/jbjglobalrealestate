

## Plan: Global Layout Fix, Footer Sync, Chat Fix, Navigation Expansion & AI Tools Upgrade

This is a large-scope request covering 8 areas. Here is the plan broken into clear batches.

---

### BATCH 1: Layout Fix — Content Behind Headers + Black Gap

**Problem**: Content on pages like the Landing Page Builder and Education Library renders behind the vertical sidebar and under the horizontal header. A black gap appears between the horizontal bar and content because `bg-black` on the root container bleeds through when padding doesn't fully cover the header height.

**Fix in `src/components/MainLayout.tsx`**:
- The `<main>` element currently has conditional padding `lg:pt-[52px]`. For pages with `needsHeaderSpacing=false`, it falls back to `lg:pt-[52px] pt-0` — but the horizontal utility bar is 48px, so content starts correctly. The black gap is from the root `bg-black` on line 227. Change the root `bg-black` to `bg-white` (or the champagne background) so there's no black bleed-through between header and content.
- Remove `style={{ paddingLeft: 'env(safe-area-inset-left)' }}` from the `<main>` since it **overrides** the sidebar padding classes (`lg:pl-[200px]` / `lg:pl-[48px]`). Instead, apply safe-area-inset via CSS that doesn't conflict.
- Ensure all content starts flush to the right edge of the sidebar (edge-to-edge within the content area).

**Files**: `src/components/MainLayout.tsx`

---

### BATCH 2: Chat Support Widget — Not Overlapping Navigation Arrow

**Problem**: The collapsed chat button at `fixed bottom-6 right-4 z-[10050]` can overlap with navigation arrows or scroll indicators on the right edge.

**Fix in `src/components/chat/CollapsedChatButton.tsx`**:
- Increase `bottom-6` to `bottom-20` to clear any bottom navigation arrows.
- On desktop with sidebar active, shift the chat button further right or add a `lg:right-6` to ensure it doesn't touch the sidebar collapse arrow.

**Files**: `src/components/chat/CollapsedChatButton.tsx`

---

### BATCH 3: Footer — Wire ALL Pages from Vertical Nav

**Problem**: The footer is missing many pages that exist in the vertical nav, including several under BROKER & ACADEMY, PRODUCTIVITY, BUSINESS SUITES, and ADMIN sections.

**Fix in `src/components/Footer.tsx`**:
- Add missing links from vertical nav sections that aren't in the footer:
  - **Properties**: Add "All Projects" (`/properties`), "Property Measurement" (`/property-measurement`)
  - **Tools**: Add Landing Page Builder, CV Builder, Cover Letter, Company Profile Builder, PDF Editor, Brand Palette, Voice Studio Pro
  - **AI Tools**: Add AI Personal Shopper, AI Calendar, AI Budget Planner, AI Investment Report, AI Call Summarizer, AI Client Matcher, AI Description Writer, Virtual Staging AI, AI History
  - **Broker & Academy**: Add Broker Training, Broker Hub, Broker Dashboard, AI Broker Workspace
  - **Investor**: Add Investor Dashboard, Portfolio Views
  - **Productivity**: Add Contract Forms, Pricing, Onboarding, Client Portal
  - **Business Suites**: Add Suites Hub card
  - **Professional Tools**: Add E-Signature Suite, Whiteboard, Mind Map, Form Builder, Kanban Board, Digital Card, Email Client, Team Chat

**Files**: `src/components/Footer.tsx`

---

### BATCH 4: Vertical Nav — All Sections Expand with Sub-Items + Mega-Menu Popup

**Problem**: User wants every section in the vertical nav to expand inline AND show a popup/mega-menu panel when clicked (like the Properties section already does).

**Fix in `src/components/navigation/GlobalVerticalNav.tsx`**:
- Currently only some sections have `megaMenu` keys (buy, sell, services, company, legal, guides, ai-tools, creative). Add mega-menu keys for ALL remaining sections:
  - `PARTNERS` → new mega menu key `partners`
  - `BROKER & ACADEMY` → new mega menu key `broker`
  - `INVESTOR` → new mega menu key `investor`
  - `PRODUCTIVITY` → new mega menu key `productivity`
  - `MY ACCOUNT` → new mega menu key `account`
  - `BUSINESS SUITES` → new mega menu key `suites`
- Add corresponding link arrays in `MEGA_MENU_LINKS` for each new key
- Add "Projects" entry under the PROPERTIES section (it's currently "Buy / Off-Plan" → add an explicit "All Projects" link)

**Files**: `src/components/navigation/GlobalVerticalNav.tsx`

---

### BATCH 5: Name Fix — "Jane Abou Jaoude" → "Jane Bou Jaoude"

**Status**: Already correct. Search for "Abou Jaoude" (case-insensitive) returned **zero matches**. All 95 files already use "Jane Bou Jaoude". No changes needed.

---

### BATCH 6: AI Tools — Edge Function Model Upgrade + Analytics Persistence

**Problem**: AI tools need model upgrades, edge function deployment, and usage analytics.

**Changes**:
1. **Model Upgrade**: Update the default model in `supabase/functions/lovable-ai/index.ts` from `google/gemini-3-flash-preview` to `google/gemini-3-flash-preview` (already current per the useful context — verify and confirm).
2. **AI Usage Analytics**: Create a database migration for an `ai_tool_usage` table to track which tool, which user, timestamps, and response quality. Add an RLS policy for authenticated users to insert their own records and owners to read all.
3. **Frontend Tracking**: Create a `useAIToolTracking` hook that logs each AI tool invocation to the `ai_tool_usage` table. Wire it into all AI tool premium components.
4. **Admin Dashboard**: Add an "AI Tools Analytics" section in the Owner Command Center showing top tools by usage, usage over time, and per-user activity.

**Files**: New migration, new hook `src/hooks/useAIToolTracking.ts`, update AI tool components, update owner dashboard.

---

### BATCH 7: Subscription System for All Tools

**Problem**: Create yearly/monthly memberships and per-tool packages.

**Changes**:
1. Create a `subscription_plans` table with plan tiers (Monthly All-Access, Yearly All-Access, Per-Tool Monthly).
2. Update `SubscriptionGate` to check against the new plans.
3. Add a `/pricing` page showing all plans with comparison matrix.
4. Prepare Stripe integration hooks (ready for API key connection).

**Files**: New migration, update `src/components/subscription/`, create/update `src/pages/PricingPage.tsx`

---

### BATCH 8: Landing Page Builder Layout Fix + Color Wheel + Domain Instructions

**Problem**: The Landing Page Builder needs layout fixes, full color picker, and premium domain connection guide.

**Changes**:
1. Fix the Landing Page Builder's content area to respect sidebar padding.
2. Add a full HSL color wheel picker component replacing any basic color inputs.
3. Add accessibility features (color blind mode toggle).
4. Add a "Connect Your Domain" section with step-by-step DNS instructions.
5. Gate behind membership.

**Files**: Landing page builder components under `src/components/toolkit/`

---

### Estimated Scope

| Batch | Files Changed | Priority |
|-------|--------------|----------|
| 1. Layout Fix | 1 file | Critical |
| 2. Chat Position | 1 file | Critical |
| 3. Footer Sync | 1 file | High |
| 4. Nav Expansion | 1 file | High |
| 5. Name Fix | 0 files | Done |
| 6. AI Analytics | 4-5 files + migration | Medium |
| 7. Subscriptions | 3-4 files + migration | Medium |
| 8. Landing Page Builder | 2-3 files | Medium |

I will implement Batches 1-4 first (layout, chat, footer, nav) as they are the most visible and critical, then proceed with Batches 6-8.

