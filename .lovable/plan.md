

## Plan: Homepage Dividers, Support Section, Horizontal Header, Vertical Nav, Footer, and Listing Portal

This is a large multi-area request. I'll break it into focused tasks.

---

### 1. Homepage Divider Alignment

**Problem:** WhyChooseUs is wrapped in `bg-black > jj-layer-2` (champagne card with margins), but `SectionDivider` uses `bg-black py-4`. The dividers between WhyChooseUs and AreasWeCover look misaligned because the champagne layer has side margins (`mx-1 sm:mx-2 md:mx-3 lg:mx-4`) but the divider spans full width.

**Fix in `Index.tsx`:**
- Use `<SectionDivider fullWidth />` consistently for all dividers between sections that use `jj-layer-2` (WhyChooseUs, AreasWeCover, etc.)
- Audit all `<SectionDivider />` calls (lines 260, 269, 281, 289, 296, 303, 310, 322, 405, 446, 456, 463, 473, 480, 488, 496, 504) and standardize padding/fullWidth usage

### 2. Premium Headset SVG Icon

**Current state:** `SupportTicketBox.tsx` already has an inline SVG headset icon (lines 439-468). The user wants a cleaner premium SVG.

**Changes:**
- Create a new premium headset SVG component (`PremiumHeadsetIcon.tsx`) — a clean, bold AirPods Max-style headset
- Replace the inline SVG in `SupportTicketBox.tsx` (homepage, contact page, customer happiness center all use the same component)
- Update `public/email-icons/headphones.svg` and `headphones-white.svg` with the new premium design
- Apply to all email templates that reference the headset icon

### 3. Listing Portal (Sell Your Property) — Testing & Email

**Changes:**
- Verify the full listing submission flow: form → file upload → extraction → draft listing creation → email notification
- Ensure the `submit-support-ticket` edge function (or listing-specific function) sends a confirmation email to the user
- Test with a real submission to verify extraction and draft creation work end-to-end
- This requires browser testing — will verify after implementation

### 4. Support Ticket Section Improvements

**File: `SupportTicketBox.tsx`**
- **Ticket number on one line:** Update the ticket number display (line 617-618) to show ticket number, Arabic label, and copy icon all on one horizontal line
- **Green theme for inquiries:** The "For inquiries about your ticket" / contact email section → green color scheme
- **Red theme for ticket creation:** The "Need Help" / "Submit a Ticket" CTA → red/premium theme (like the current red-500 but stronger)
- **Headset SVG:** Replace with new premium SVG component
- **"Recommended for You" section:** Remove white/black backgrounds behind the AI Tools, Guides, Properties icons in the "Explore While You Wait" grid (lines 750-763)

### 5. Footer Social Media Icons

**File: `SocialLinks.tsx`**
- Make icons larger: Change the default `iconClassName` sizes and the footer call at line 673 of Footer.tsx from `w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7` to `w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9`
- Improve YouTube icon: Replace lucide's `Youtube` with a custom inline SVG that better matches YouTube's actual logo

### 6. Horizontal Utility Bar Improvements

**File: `HorizontalUtilityBar.tsx`**
- **Extend to full right edge:** Already extends right — verify gap filling
- **Settings dropdown:** When clicking Settings, open a connected card (no black borders, flush edges) with profile/dashboard links
- **Sqft/Sqm toggle:** Make larger and more visible — increase from `text-[10px]` to `text-xs`, add better contrast
- **Remove minimizer:** Remove the minimize button and `ChevronUp` entirely. The horizontal bar is always visible
- **Advanced Search fix:** Change from `<Link to="/properties">` to an `onClick` handler that opens a full-screen advanced search overlay or navigates with search params
- **Search tooltip fix:** The tooltip appears clipped under the vertical header — change tooltip `side` from "bottom" to "bottom" with proper `sideOffset` and ensure z-index is above sidebar
- **Language tooltip:** Change from just showing language name to "Select your language. Current: English"
- **Currency tooltip:** Change from "Currency" to "Select your currency. Current: AED"
- **Right side:** Fill with mode selector, settings, dashboard — add `justify-between` layout so right-side items push to the edge
- **Remove old gold yellow:** Replace any `text-gold` that renders as old yellow with champagne-appropriate gold

### 7. Vertical Header Section Hover Borders

**File: `GlobalVerticalNav.tsx`**
- **Section hover borders:** Add premium border styling when hovering on section headers — similar to MY ACCOUNT style: `border border-gold/20 hover:border-gold/40 rounded-lg` for each section item
- **Icon/text color inversion rule:** Gold icons with black text when inactive; black icons with gold text when active (already partially done, verify consistency)
- **Contact Support & Create Ticket:** Make these bottom-pinned items more premium — increase height from `py-3` to `py-4`, add borders, gold styling instead of compressed look
- **Divider between support items:** Add `<hr>` divider between Contact Support and Create Ticket
- **New SUPPORT hub section:** Add a dedicated "SUPPORT" accordion section with: Contact Support, Create Ticket, Submit Complaint, Follow Up on Complaints. With headset icon
- **Minimizer move:** Move the collapse/expand button from the vertical header to the horizontal utility bar, next to the search icon. Increase monogram and wordmark size in the freed space

### 8. Email Template Updates

- Propagate the new premium headset SVG to all email templates (onboarding, inquiry confirmation, support ticket confirmation)
- Ensure consistent UI layout rules across all emails

---

### Files to Create/Edit

| File | Changes |
|------|---------|
| `src/components/icons/PremiumHeadsetIcon.tsx` | New premium headset SVG component |
| `src/components/SupportTicketBox.tsx` | Ticket # one line, green/red theming, headset icon, remove card backgrounds |
| `src/components/navigation/GlobalVerticalNav.tsx` | Section hover borders, SUPPORT hub, minimizer relocation, premium bottom section |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Remove minimizer, fix search tooltip, fix advanced search, improve tooltips, larger sqft/sqm, settings panel |
| `src/components/marketing/SocialLinks.tsx` | Larger icons, improved YouTube SVG |
| `src/pages/Index.tsx` | Fix divider alignment with fullWidth prop |
| `src/index.css` | Any needed utility classes |
| `public/email-icons/headphones.svg` | New premium headset SVG |
| `public/email-icons/headphones-white.svg` | New premium headset SVG (white variant) |

