

# Consolidation Plan: 3 Pages Into 3 Distinct Portals

## Current Problem
There are 3 overlapping pages with duplicated content:
1. **AI Hub** (`/ai-hub`) - 1440 lines, has AI tools + broker preview + referral program + support/operations
2. **Broker Toolkit** (`/broker-toolkit`) - Broker-focused tools, education, CRM, support, growth
3. **Investor Hub** (`/investor-hub`) - Small page with quick access cards, AI tools, resources

Many tools and sections are repeated across these pages. The user wants them consolidated into 3 clear, distinct portals.

---

## New Architecture

### 1. AI Tools Hub (`/ai-hub`) - The Master Tools Page
**Purpose:** Central hub for ALL AI tools, creative suites, and productivity tools.

**What stays:**
- Hero section with video background
- Quick benefits strip
- "All Tools" searchable/filterable grid (property, corporate, productivity, design, marketing)
- Category sections with colored cards (purple, blue, teal, pink, amber)
- Creative Suite shortcut button

**What gets added (from Broker Toolkit):**
- Broker-only tools section (HR, Graphic Designer, Video Producer, Photographer, Digital Marketing, Social Workshop) -- these already exist in AI Hub as "Unlock More with JBJ Broker Hub"
- Support & Operations cards (already exist in AI Hub)

**What gets removed:**
- "Make Money" / Referral Program section (moves to Broker Hub)
- "Join" CTA bottom section (simplified to just "Explore All Tools" CTA)
- The champagne-gold styled tools page is eliminated (its tools already exist here)

**Padding/Divider fixes:**
- Standardize all category sections to `py-8 md:py-10` (consistent spacing)
- Ensure dividers are centered between sections with equal gaps above and below
- Add Suite card buttons (link to `/studio`, `/business-suite/broker`, etc.) in the "All Tools" section

---

### 2. JBJ Broker Hub (`/broker-toolkit`) - The Broker Portal
**Purpose:** Everything a broker needs -- listings, guides, books, training, modules, CRM, operations, team, growth/rewards.

**What stays:**
- Hero section (broker-focused)
- Stats bar
- Navigation tabs
- Tools section (broker tools grid)
- Support team (Personal Success Team - pink)
- Media & Marketing Team (teal)
- Education (24 Training Modules - blue)
- Academy (Professional Development - sky blue)
- Free Books (emerald)
- Operations Support (indigo)
- CRM section (amber/gold)
- Growth & Rewards (champagne)
- CTA section

**What gets added (from AI Hub):**
- "Make Money" section (JBJ Academy, Employment Hub, Referral Program) -- moved here from AI Hub
- Referral program details with commission tiers

**What gets removed:**
- Nothing significant -- this page is already comprehensive for brokers

---

### 3. JBJ Investor Hub (`/investor-hub`) - The Investor Portal
**Purpose:** Dedicated portal for investors with their portfolio, points, tiers, documents, and investor-specific tools, plus an "Explore All Tools" link.

**What stays:**
- Hero section with personalized welcome
- Quick Access cards (Dashboard, Favorites, Shortlisted, Profile)
- AI Investment Tools grid
- Education & Guides section

**What gets enhanced:**
- Add Points & Tier display (showing user's current tier from the point system)
- Add "My Listings" shortcut (link to listing portal)
- Add "My Documents" shortcut (link to documents)
- Add "Explore All Tools" CTA button linking to `/ai-hub`
- Keep the "Ready to Find Your Next Investment?" CTA

---

## Technical Changes

### Files to modify:
1. **`src/pages/AIHub.tsx`** (~1440 lines)
   - Remove the "Make Money" section (lines 1097-1325) -- move to Broker Hub
   - Remove the bottom "Join" CTA section (lines 1330-1434) -- replace with simple CTA
   - Fix padding: standardize all `py-16 md:py-20` to `py-8 md:py-10` for category sections
   - Fix divider alignment: ensure equal spacing above/below each `SectionDivider`
   - Add Suite buttons (Creative Suite, Broker Suite, etc.) as prominent cards in the "All Tools" section

2. **`src/pages/BrokerToolkit.tsx`**
   - Add the "Make Money" section from AI Hub (referral program, JBJ Academy, Employment Hub)
   - Import and render a new `BrokerToolkitReferral` component

3. **`src/components/broker-toolkit/BrokerToolkitReferral.tsx`** (new file)
   - Extract the referral/earn section from AI Hub into a standalone component

4. **`src/pages/InvestorHub.tsx`**
   - Add Points & Tier section (fetch from `user_points_ledger`)
   - Add "My Listings" and "My Documents" shortcuts
   - Add "Explore All Tools" CTA linking to `/ai-hub`
   - Keep existing structure but enhance with more investor-specific content

5. **`src/App.tsx`** - No route changes needed (all 3 routes already exist)

### Padding & Divider Standardization (AI Hub):
- All category sections: change from `py-16 md:py-20` or mixed values to a consistent `py-6 md:py-8`
- All wrapper `<section>` containers: use the same vertical padding
- `SectionDivider` components: ensure they sit in a `py-4` wrapper so spacing is equal above and below
- The "All Tools" section and each category section will have identical top/bottom spacing

### Suite Cards Addition (AI Hub):
- Below the search/filter bar in the "All Tools" section, add prominent suite shortcut cards:
  - Creative Suite (`/studio`)
  - Broker Intelligence Suite (`/business-suite/broker`)
  - Productivity Suite (`/business-suite/productivity`)
  - Corporate Suite (already shown as category)
  - Each rendered as a horizontal card with the suite's accent color

