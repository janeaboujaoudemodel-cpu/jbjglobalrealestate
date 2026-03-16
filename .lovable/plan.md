

## Plan: Merge IntroHero into Video Hero + Toolkit Theme Colors + Multiple Fixes

### 7 Tasks

---

### 1. Merge IntroHeroSection INTO the Video Hero (Single Fullscreen Section)

**What**: Remove the separate `IntroHeroSection` component. Merge its content (gateway tagline, three pillars, quick-action CTAs) as an overlay ON TOP of the existing video hero section. The video stays as the main hero. The current "Buy · Sell · Rent" centered content gets replaced with a richer overlay that includes:
- Company tagline "Your Gateway to Dubai's Finest Real Estate"  
- Quick-action CTA pills: "Sell Your Property", "AI Home Finder", "Explore AI Tools", "Create Your CV", "Update Profile"
- Three compact pillar badges at bottom (Premium Marketplace, AI Tools, Brokerage)

**Also remove**: `VerificationBanner` from between IntroHero and video (it moves to after DeveloperPartnersMarquee or inside a modal trigger).

**Files**:
- Delete `src/components/home/IntroHeroSection.tsx` (content merged into Index)
- Edit `src/pages/Index.tsx` — replace lines 131-257 with single merged video hero containing the new overlay content. Remove IntroHeroSection lazy import and VerificationBanner placement (move VerificationBanner below DeveloperPartnersMarquee).

---

### 2. Force ModeSelectionModal for Users Without Category (Freeze Screen)

**What**: Currently `ModeSelectionModal` only shows for users who haven't made initial selection AND is dismissable. Change behavior:
- For logged-in users with NO mode selected: modal is NOT dismissable (remove `onOpenChange` close, remove X button)
- After signup, immediately show mode selection before anything else
- For existing users without category: check on mount, if `hasMadeInitialSelection` is false AND user is logged in, force the modal open with no escape

**Files**:
- Edit `src/components/ModeSelectionModal.tsx` — when `user` exists and `!hasMadeInitialSelection`, set `Dialog` to not closeable (remove dismiss on backdrop click)

---

### 3. Remove Double Divider Between "Handpicked" and "Starting Point"

**What**: Between FeaturedListings and StartingPoint, there are currently: ContinueSearching → SectionDivider → ResaleProperties → SectionDivider. Two dividers visible. Remove one.

**Fix** (`src/pages/Index.tsx`):
- Remove the `SectionDivider` between ContinueSearching and ResalePropertiesSection (line 294).

---

### 4. Remove Line Under Company Profile Book

**What**: In `CompanyProfileBrochure.tsx`, the text section below the book has "JBJ Global Real Estate" with a line appearing above it. This is the `pt-4` top padding creating a visual gap, and the shadow from the book's bottom creating a line appearance.

**Fix** (`src/components/books/CompanyProfileBrochure.tsx`):
- Remove the bottom shadow div (`absolute -bottom-3 left-3 right-3 h-6 bg-black/20 blur-xl`) that creates the line effect under the book above the "JBJ" text.

---

### 5. ToolkitShowcaseCard — Add "Explore All Tools" CTA + Per-Tool Theme Colors

**What**: Add a footer CTA button "Explore All Our Tools Now" linking to `/ai-hub`. Apply unique theme colors to each tool card matching their internal tool theme from `allToolsSuiteConfig.ts`.

Each tool gets its signature color:
- Property Evaluator → Blue (border-blue-500, icon text-blue-400)
- Property Comparison → Sky (border-sky-500)
- Mortgage Calculator → Amber (border-amber-500)
- AI Home Finder → Purple (border-purple-500)
- Rental Index → Emerald (border-emerald-500)
- Interior Design → Pink (border-pink-500)
- Video Studio → Red (border-red-500)
- Voice Studio → Violet (border-violet-500)

The card background stays champagne but the icon container border, icon color, and hover glow use the tool's theme color.

**Files**:
- Edit `src/components/home/ToolkitShowcaseCard.tsx` — add `color` property to each tool in the array, apply color to icon container border/bg and hover shadow, add CTA button at bottom.

---

### 6. AI Home Finder Section — More Premium 3D

**What**: The AI Home Finder section (lines 343-405 in Index.tsx) needs a more dramatic 3D card effect with perspective transforms, deeper shadows, and a floating/hovering animation.

**Fix** (`src/pages/Index.tsx`):
- Add `perspective` wrapper, `rotateX` subtle tilt on the card, stronger multi-layer gold glow, and a floating `animate-float` keyframe effect.

---

### 7. Company Profile Book Cover — More Premium

**What**: Upgrade the 3D book cover with richer gold foil effects, deeper shadows, and a more luxurious spine texture.

**Fix** (`src/components/books/CompanyProfileBrochure.tsx`):
- Enhance box-shadow with deeper gold glow layers
- Add gold foil shine line across top of cover
- Make spine gradient richer (black to dark gold)

---

### Files Summary
1. `src/pages/Index.tsx` — merge heroes, move verification banner, remove double divider, upgrade AI Home Finder 3D
2. `src/components/home/IntroHeroSection.tsx` — DELETE (content merged into Index hero)
3. `src/components/ModeSelectionModal.tsx` — force modal for logged-in users without mode
4. `src/components/books/CompanyProfileBrochure.tsx` — remove bottom line, upgrade premium cover
5. `src/components/home/ToolkitShowcaseCard.tsx` — add tool theme colors + CTA button

