

## Plan: Fix Layout Cropping + Add All Pages to Footer

### Problem 1: Content Cropped Behind Headers

The main content area on desktop has `lg:pt-[40px]` but the HorizontalUtilityBar is 48px tall (`h-[48px]`). Content renders 8px behind the bar. Additionally, the `pl-[200px]` / `pl-[48px]` uses body-class-driven selectors which can be unreliable on initial load.

**Fix in `src/components/MainLayout.tsx` (line 263):**
- Change `lg:pt-[40px]` to `lg:pt-[52px]` (48px bar + 4px breathing room)
- Ensure mobile `pt-24 sm:pt-28` remains for GlobalHeader
- Add `transition-all duration-300` to the `<main>` for smooth sidebar toggles
- Apply same fix to the footer/contact wrapper on line 274

### Problem 2: Footer Missing Many Pages

The footer currently has ~10 cards covering Properties, Services, Guides, About, Sell, Education, Legal, Business Suites, AI Tools, Creative Suites, Market Intel, and conditional Broker/Investor hubs. But it's missing:

**Pages to add to existing footer cards:**
- **Properties card**: Add Communities, Resale Properties, Map, Property Evaluator, Rental Index, Property Measurement
- **Services card**: Add Architecture, Interior Design, Fit-Out, Design & Build, Law Firm, Snagging, Broker Certification, Complaint Procedures, Testimonials, Referral Partner, Signature Collection
- **About & Careers card**: Add Our Brokers, Company Profile, Partner Governance
- **Guides card**: Add Broker FAQ, Investor FAQ, Broker Education, Books Library
- **Legal card**: Add Trust & Compliance, Risk Disclosure (already present — verify)

**New footer cards to create:**
- **Partners**: Partners Hub, Mortgage, Legal, Company Setup, Visa Services
- **Investor Hub**: Always visible (not just investor mode) — Investor Hub, Investor Services, Join Investor List, Investor Education, Investor FAQ
- **Broker & Academy**: Broker Portal, JBJ Academy, Academy Graduates, Broker Education, Broker Toolkit, Broker Resources
- **Productivity**: Spreadsheet, Documents, QR Generator, Video Meeting, Presentations, E-Signature, Meeting Center
- **Professional Tools card**: Expand with Whiteboard, Mind Map, Form Builder, Kanban, Digital Card, Business Card Scanner

### Problem 3: Device Compatibility

- Add `safe-area-inset` padding to the main content area for notched devices
- Ensure footer grid is `grid-cols-1` on mobile, `sm:grid-cols-2` on tablet, `lg:grid-cols-3` on desktop for better readability with 15+ cards

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/MainLayout.tsx` | Fix `pt-[40px]` → `pt-[52px]`, add safe-area-inset support |
| `src/components/Footer.tsx` | Add ~6 new FooterCard sections, expand existing cards with missing pages, update grid to 3-col on desktop |

### Estimated scope
- MainLayout: ~5 lines changed
- Footer: ~80 lines added (new link arrays + new FooterCard instances)

