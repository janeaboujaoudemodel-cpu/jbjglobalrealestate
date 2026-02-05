

# JBJ Royal Tools Hub - Homepage Card Redesign

## Overview

Redesign the `ToolkitShowcaseCard` component to match the premium champagne styling of `ExploreServicesCard` and `ServicesGrid`, rename it to "JBJ Royal Tools Hub", and display individual tools with unique CTAs instead of a single "Explore All Tools" button.

---

## Current State

**File:** `src/components/home/ToolkitShowcaseCard.tsx`

**Issues:**
1. Uses dark theme (`bg-black`, `bg-zinc-900`) instead of champagne gradient
2. Title says "JBJ RealEstate Toolkit" - should be "JBJ Royal Tools Hub"
3. Has a generic "Explore All Tools" button instead of individual tool CTAs
4. Only shows 4 tool cards in a 2x2 grid on the right side
5. Card styling doesn't match ServicesGrid champagne cards

---

## Proposed Changes

### 1. Rename Title
- Change "JBJ RealEstate Toolkit™" to "JBJ Royal Tools Hub"

### 2. Match Champagne Card Styling
Following `ServicesGrid` and `ExploreServicesCard` patterns:

```
Background: bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]
Border: border-2 border-gold/50
Shadow: shadow-[0_12px_40px_rgba(200,167,102,0.45)]
Header: bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]
Text: text-black (titles), text-zinc-600 (descriptions)
```

### 3. Individual Tool Cards with Unique CTAs

Display tools as a grid of cards, each with:
- Icon in gold-bordered container
- Tool name (bold, black)
- Short description
- Individual CTA button with tool-specific text

**Tool CTA Mapping:**

| Tool | CTA Text |
|------|----------|
| Property Evaluator | Get Evaluation |
| Property Comparison | Start Comparing |
| Mortgage Calculator | Calculate Now |
| AI Home Finder | Find My Home |
| Rental Index | Check Rates |
| AI Video Studio | Create Video |
| Voice Studio | Generate Voice |
| Background AI | Remove Background |
| Interior Design AI | Design Space |
| Business Card Scanner | Scan Card |

### 4. New Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: JBJ Royal Tools Hub + subtitle                      │
│ bg-gradient champagne, border-b border-gold/30              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Icon   │ │  Icon   │ │  Icon   │ │  Icon   │           │
│  │ Title   │ │ Title   │ │ Title   │ │ Title   │           │
│  │ Desc    │ │ Desc    │ │ Desc    │ │ Desc    │           │
│  │ [CTA]   │ │ [CTA]   │ │ [CTA]   │ │ [CTA]   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Icon   │ │  Icon   │ │  Icon   │ │  Icon   │           │
│  │ Title   │ │ Title   │ │ Title   │ │ Title   │           │
│  │ Desc    │ │ Desc    │ │ Desc    │ │ Desc    │           │
│  │ [CTA]   │ │ [CTA]   │ │ [CTA]   │ │ [CTA]   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- Each card is a Link to the tool's page
- Cards match ServicesGrid styling (champagne bg, gold border, hover effects)

---

## Tools to Display (Priority Selection)

From `royalToolsRegistry.ts`, select the most valuable active tools:

1. **Property Evaluator** - `/property-evaluator` - "Get Evaluation"
2. **Property Comparison** - `/compare` - "Start Comparing"
3. **Mortgage Calculator** - `/mortgage-calculator` - "Calculate Now"
4. **AI Home Finder** - `/quiz` - "Find My Home"
5. **Rental Index** - `/rental-index` - "Check Rates"
6. **AI Interior Design** - `/interior-design-ai` - "Design Space"
7. **AI Video Studio** - `/toolkit/ai-video-studio` - "Create Video"
8. **Voice Studio** - `/toolkit/voice-studio` - "Generate Voice"

---

## Technical Implementation

### File to Modify
`src/components/home/ToolkitShowcaseCard.tsx`

### Key Code Changes

**1. Update container styling:**
```tsx
// OLD (dark theme)
<section className="py-12 md:py-16 bg-black">
  <div className="... bg-gradient-to-br from-zinc-900 via-black to-zinc-800 ...">

// NEW (champagne theme)
<section className="py-12 md:py-16 jj-layer-2">
  <div className="... bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] ...">
```

**2. Update title:**
```tsx
// OLD
<h2>JBJ RealEstate Toolkit™</h2>

// NEW
<h2>JBJ Royal Tools Hub</h2>
```

**3. Update text colors:**
```tsx
// OLD
text-white, text-zinc-300, text-zinc-400

// NEW  
text-black, text-zinc-600, text-zinc-700
```

**4. New tools array with CTAs:**
```tsx
const royalTools = [
  { 
    id: "property-evaluator",
    name: "Property Evaluator", 
    description: "AI-powered property valuation",
    icon: Calculator, 
    href: "/property-evaluator",
    cta: "Get Evaluation"
  },
  { 
    id: "property-comparison",
    name: "Property Comparison", 
    description: "Compare properties side-by-side",
    icon: Layers, 
    href: "/compare",
    cta: "Start Comparing"
  },
  // ... 6 more tools
];
```

**5. Replace 2-column layout with full-width grid:**
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
  {royalTools.map((tool) => (
    <Link to={tool.href} key={tool.id} className="group block">
      <div className="h-full bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-xl border-2 border-gold/30 hover:border-gold p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1">
        <div className="w-12 h-12 rounded-xl border-2 border-gold/50 flex items-center justify-center mb-4">
          <tool.icon className="w-6 h-6 text-black" />
        </div>
        <h4 className="text-base font-bold text-black mb-2">{tool.name}</h4>
        <p className="text-sm text-zinc-600 mb-4">{tool.description}</p>
        <Button variant="primary" size="sm">
          {tool.cta}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Link>
  ))}
</div>
```

---

## Visual Comparison

**Before:**
- Dark zinc/black background
- "JBJ RealEstate Toolkit™" title
- 2-column layout (content left, 4 tools right)
- Single "Explore All Tools" button
- Tool cards have zinc/dark styling

**After:**
- Champagne gradient background matching ServicesGrid
- "JBJ Royal Tools Hub" title in black
- Full-width responsive grid (2/3/4 columns)
- 8 individual tool cards with unique CTAs
- Consistent hover effects and gold borders

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/home/ToolkitShowcaseCard.tsx` | Complete redesign with champagne styling, new title, individual tool CTAs |

---

## Expected Outcome

- ToolkitShowcaseCard matches ServicesGrid and ExploreServicesCard styling
- Title correctly shows "JBJ Royal Tools Hub"
- 8 tools displayed in responsive grid
- Each tool has its own descriptive CTA button
- Consistent champagne/gold premium theme throughout homepage

