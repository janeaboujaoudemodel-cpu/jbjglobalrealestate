

## JBJ Royal Tools Hub Page UI Fix - Match Homepage Section Style

### Overview

Update the `/toolkit` page (`RoyalToolsHub.tsx`) to match the exact champagne gold styling used in the homepage's "JBJ Royal Tools Hub" section (`ToolkitShowcaseCard.tsx`).

---

### Current State vs Target State

| Element | Current (Dark Theme) | Target (Champagne Gold Theme) |
|---------|---------------------|------------------------------|
| **Page Background** | `bg-black` | `bg-black` (keep) |
| **Main Container** | Dark zinc cards | Champagne gradient container: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` |
| **Header Section** | Dark with gold accents | Champagne gradient: `bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` |
| **Tool Cards** | Dark `bg-zinc-900` | Champagne: `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` |
| **Card Text** | White/zinc-300 | Black text with `text-zinc-600` descriptions |
| **Card Border** | `border-gold/40` | `border-2 border-gold/30 hover:border-gold` |
| **Icon Container** | Gold background | Transparent with `border-2 border-gold/50` |
| **CTA Button** | Text link "Open Tool →" | Full-width Button with `variant="primary"` |
| **Badge** | Gold/10 background | `bg-gold/20 border border-gold/40` |
| **Title** | White with gold accent | Black: `text-black` with Poppins font |

---

### Implementation Details

#### File: `src/pages/toolkit/RoyalToolsHub.tsx`

**1. Update Hero Section (Lines 158-215)**

Transform from dark video hero to champagne header matching homepage:

```tsx
{/* Hero Section - Matching Homepage Style */}
<section className="py-12 md:py-16 bg-black">
  <div className="jj-layer-2">
    <div 
      className="relative z-10 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl md:rounded-3xl border-2 border-gold/50 overflow-hidden"
      style={{ boxShadow: '0 12px 40px rgba(200,167,102,0.25)' }}
    >
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] p-6 md:p-8 border-b border-gold/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            AI-Powered Professional Toolkit
          </div>
        </div>
        
        <h1 
          className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-2"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          JBJ Royal Tools Hub
        </h1>
        
        <p className="text-zinc-600 text-sm md:text-base max-w-2xl">
          Professional-grade tools for images, videos, documents, and AI-powered analytics — all designed for real estate professionals.
        </p>
      </div>
      ...
```

**2. Update Search & Filters Section (Lines 217-258)**

Move search inside the champagne container and style to match:

```tsx
{/* Search & Filters - Inside Container */}
<div className="p-6 md:p-8 border-b border-gold/30">
  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
    {/* Search */}
    <div className="relative flex-1 max-w-md w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tools..."
        className="pl-10 bg-white/50 border-gold/30 text-black placeholder:text-zinc-500"
      />
    </div>
    
    {/* Category Filters - Champagne Pills */}
    <div className="flex flex-wrap gap-2 justify-center">
      {/* Pills with champagne active state */}
    </div>
  </div>
</div>
```

**3. Update ToolCard Component (Lines 58-120)**

Transform dark cards to champagne style matching homepage:

```tsx
const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const Icon = tool.icon;
  
  return (
    <Link to={tool.href} className="group block h-full">
      <div className="h-full flex flex-col bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-xl border-2 border-gold/30 hover:border-gold p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1">
        {/* Icon - Matching homepage style */}
        <div className="w-12 h-12 rounded-xl border-2 border-gold/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
          <Icon className="w-6 h-6 text-black" />
        </div>

        {/* Title - Black text */}
        <h4 
          className="text-base font-bold text-black mb-2 group-hover:text-gold transition-colors flex-shrink-0"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {tool.name}
        </h4>

        {/* Description - Zinc-600 */}
        <p className="text-sm text-zinc-600 mb-4 leading-relaxed flex-grow">
          {tool.description}
        </p>

        {/* CTA Button - Full width like homepage */}
        <Button variant="primary" size="sm" className="mt-auto w-full justify-center">
          Open Tool
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Link>
  );
};
```

**4. Update Category Headers (Lines 282-293)**

Style category headers for champagne theme:

```tsx
<div className="flex items-center gap-3 mb-6">
  <span className="text-2xl">{getCategoryIcon(category)}</span>
  <h2 
    className="text-2xl font-bold text-black"
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {categoryLabels[category]}
  </h2>
  <span className="px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-sm">
    {categoryTools.length} tools
  </span>
</div>
```

**5. Update Fair Usage Section (Lines 317-355)**

Style to match champagne theme:

```tsx
<div className="rounded-xl border-2 border-gold/30 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] p-6 md:p-8">
  <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
    <Shield className="h-5 w-5 text-gold" />
    Fair Usage & Privacy
  </h3>
  
  <div className="grid md:grid-cols-2 gap-6 text-sm text-zinc-600">
    ...
  </div>
</div>
```

---

### Visual Comparison

```text
BEFORE (Dark Theme):               AFTER (Champagne Gold Theme):
+---------------------------+      +---------------------------+
| ▓▓▓ Video Background ▓▓▓ |      | ████ Champagne Header ███ |
| ▓▓▓ White Text on Dark ▓ |      | ███ Black Text on Gold ██ |
+---------------------------+      +---------------------------+
| [Dark Card] [Dark Card]  |      | [Gold Card] [Gold Card]   |
| White text  White text   |      | Black text  Black text    |
| "Open Tool →"            |      | [Full Width Button]       |
+---------------------------+      +---------------------------+
```

---

### Key Style Tokens to Lock

| Token | Value | Usage |
|-------|-------|-------|
| Container BG | `from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` | Main wrapper |
| Header BG | `from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` | Top section |
| Card BG | `from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` | Tool cards |
| Border | `border-2 border-gold/30 hover:border-gold` | Cards |
| Hover Shadow | `hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)]` | Cards |
| Title | `text-black` + Poppins font | All headings |
| Description | `text-zinc-600` | Body text |
| Badge | `bg-gold/20 border-gold/40 text-gold` | Labels |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/toolkit/RoyalToolsHub.tsx` | Complete UI overhaul to match homepage champagne style |

---

### Summary

Transform the Royal Tools Hub page from a dark video-hero theme to match the exact champagne gold styling used in the homepage section, ensuring:

1. Same champagne gradient backgrounds
2. Same black text on light backgrounds
3. Same card styling with gold borders
4. Same button styling (full-width primary)
5. Same icon container styling (transparent with gold border)
6. Same badge styling (gold/20 background)

