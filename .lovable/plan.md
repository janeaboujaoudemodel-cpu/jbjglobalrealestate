

## Comprehensive Toolkit & Property Evaluator Overhaul Plan

### Executive Summary

This plan addresses all user requirements in a prioritized manner:

1. **Toolkit Page Hero Section** - Add AI integration with robot/AI video scene
2. **Button Readability** - Add background layers to all tool cards and fix button contrast
3. **Remove "Coming Soon"** - Develop the 6 tools marked as coming-soon with real API implementations
4. **Grouped Tool Categories** - Organize tools by function (Property, Video, Photo) with clear sections
5. **Property Evaluator Page** - Add hero section with video, fix UI and tab contrast issues

---

### Part 1: Toolkit Page Hero with AI Video Scene

**Current State**: `src/pages/toolkit/RoyalToolsHub.tsx` has a basic hero with radial gradient background only.

**Target**: Full-screen hero with AI/robot-themed video background (similar to BrokerDashboard hero pattern).

**Implementation**:

**New Video Asset Needed**: Create or source an AI/robot themed video. For now, we can use existing `dubai-landmarks-hero.mp4` or create a placeholder with fallback to a premium gradient effect.

**Changes to RoyalToolsHub.tsx (Lines 122-162)**:

```tsx
// Add import at top
import toolkitHeroVideo from "@/assets/videos/dubai-landmarks-hero.mp4";

// Replace hero section background
<section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
  {/* Video Background */}
  <video 
    autoPlay 
    loop 
    muted 
    playsInline
    className="absolute inset-0 w-full h-full object-cover opacity-40"
  >
    <source src={toolkitHeroVideo} type="video/mp4" />
  </video>
  
  {/* AI Particle Overlay Effect */}
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/20 via-transparent to-transparent animate-pulse" />
  
  {/* Dark gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
  
  {/* Content (existing) */}
  <div className="relative max-w-6xl mx-auto text-center px-4 py-24">
    ...
  </div>
</section>
```

---

### Part 2: Button & Card Readability - Background Layers

**Issue**: Tool cards lack sufficient background contrast; buttons are not readable.

**Files to Update**:
- `src/pages/toolkit/RoyalToolsHub.tsx` - ToolCard component
- `src/components/broker-toolkit/BrokerToolkitTools.tsx` - Tool cards
- `src/pages/toolkit/ToolkitLanding.tsx` - If still used

**Solution - RoyalToolsHub.tsx ToolCard (Lines 27-92)**:

Add explicit dark background layer behind all cards:

```tsx
const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const Icon = tool.icon;
  const isActive = tool.status === 'active';
  
  return (
    <Link 
      to={isActive ? tool.href : '#'}
      onClick={(e) => !isActive && e.preventDefault()}
      className={`group relative block rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 ${
        tool.isFlagship 
          ? 'border-gold bg-zinc-900/95 shadow-[0_0_30px_rgba(200,167,102,0.25)]' 
          : 'border-gold/40 bg-zinc-900/90 hover:border-gold hover:shadow-[0_0_20px_rgba(200,167,102,0.2)]'
      }`}
    >
      {/* Remove COMING SOON badge - all tools will be active */}
      {tool.isNew && (
        <span className="absolute -top-2 -right-2 bg-gold text-black text-xs font-bold px-2 py-0.5 rounded-full z-10">
          NEW
        </span>
      )}
      
      <div className="p-5">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 border-2 bg-gold/10 ${
          tool.isFlagship 
            ? 'border-gold' 
            : 'border-gold/50 group-hover:border-gold'
        } transition-colors`}>
          <Icon className="h-6 w-6 text-gold" />
        </div>
        
        {/* White text for readability on dark backgrounds */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold transition-colors">
          {tool.name}
        </h3>
        
        <p className="text-zinc-300 text-sm mb-4 line-clamp-2">
          {tool.description}
        </p>
        
        {/* Tags with dark background */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tool.tags.slice(0, 3).map((tag, i) => (
            <span 
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-gold/20"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center text-gold text-sm font-medium group-hover:gap-2 transition-all">
          Open Tool
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
```

---

### Part 3: Remove "Coming Soon" - Develop 6 Missing AI Tools

Per `src/config/royalToolsRegistry.ts`, the following 6 tools are `status: 'coming-soon'`:

| Tool | Route | Edge Function Status | Action Needed |
|------|-------|---------------------|---------------|
| AI Virtual Staging | /virtual-staging-ai | `interior-design-generate` exists | Wire existing function |
| AI Client Matcher | /ai-client-matcher | None | Create new edge function |
| AI Investment Report | /ai-investment-report | `ai-market-report` can be extended | Wire with investment params |
| AI Email Generator | /ai-email-generator | `ai-document-generator` exists | Wire with email templates |
| AI Social Media | /ai-social-media | None | Create new edge function |
| AI Description Writer | /ai-description-writer | `ai-property-analyzer` exists | Wire with description mode |

**Implementation Strategy**:

#### 3.1 AI Virtual Staging (`/virtual-staging-ai`)

**Current State**: Route exists but status is coming-soon.

**Fix**: Update status to 'active' in registry. Page component already uses `interior-design-generate` edge function.

**File**: `src/config/royalToolsRegistry.ts` (Line 202)
```tsx
status: 'active',  // Was 'coming-soon'
```

#### 3.2 AI Client Matcher (`/ai-client-matcher`)

**Create New Edge Function**: `supabase/functions/ai-client-matcher/index.ts`

```typescript
// Uses LOVABLE_API_KEY to match client preferences with available listings
// Input: clientPreferences (budget, location, type, features)
// Output: ranked list of matching properties with match scores
```

**Create New Page**: `src/pages/AIClientMatcherPage.tsx`

#### 3.3 AI Investment Report (`/ai-investment-report`)

**Leverage Existing**: Wire to `ai-market-report` with `reportType: 'investment'` parameter.

**Create Page**: `src/pages/AIInvestmentReportPage.tsx` using existing premium layout pattern.

#### 3.4 AI Email Generator (`/ai-email-generator`)

**Create Edge Function**: `supabase/functions/ai-email-generator/index.ts`

```typescript
// Uses LOVABLE_API_KEY for email content generation
// Input: emailType (follow-up, introduction, offer, etc.), context
// Output: professional email content with subject line
```

**Create Page**: `src/pages/AIEmailGeneratorPage.tsx`

#### 3.5 AI Social Media (`/ai-social-media`)

**Create Edge Function**: `supabase/functions/ai-social-media/index.ts`

```typescript
// Uses LOVABLE_API_KEY for social content
// Input: platform, propertyDetails, contentType
// Output: platform-optimized posts with hashtags
```

**Create Page**: `src/pages/AISocialMediaPage.tsx`

#### 3.6 AI Description Writer (`/ai-description-writer`)

**Leverage Existing**: Wire to `ai-property-analyzer` with description mode.

**Create Page**: `src/pages/AIDescriptionWriterPage.tsx`

---

### Part 4: Grouped Tool Categories on Toolkit Page

**Implement Visual Category Sections**:

Add clear category headers with grouped tools in `RoyalToolsHub.tsx`:

```tsx
{/* Category Sections */}
{categories.map(category => {
  const categoryTools = filteredTools.filter(t => t.category === category);
  if (categoryTools.length === 0) return null;
  
  return (
    <div key={category} className="mb-12">
      {/* Category Header with colored accent */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${getCategoryGradient(category)}`} />
        <h2 className="text-2xl font-bold text-white">
          {categoryLabels[category]}
        </h2>
        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">
          {categoryTools.length} tools
        </Badge>
      </div>
      
      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categoryTools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
})}
```

**Category Color Mapping**:
```tsx
const getCategoryGradient = (category: ToolCategory): string => {
  const gradients: Record<ToolCategory, string> = {
    media: 'from-gold to-amber-600',           // Videos & Photos
    creative: 'from-pink-500 to-rose-600',     // Creative Suite
    'ai-property': 'from-blue-500 to-cyan-600', // Property Tools
    'ai-sales': 'from-purple-500 to-violet-600',// Sales & CRM
    'ai-reports': 'from-emerald-500 to-green-600',// Reports
    'ai-communication': 'from-teal-500 to-cyan-600',// Communication
    'ai-content': 'from-lime-500 to-green-600', // Content
    productivity: 'from-indigo-500 to-blue-600',// Productivity
  };
  return gradients[category] || 'from-gold to-amber-600';
};
```

---

### Part 5: Property Evaluator Page - Hero + UI Fixes

**File**: `src/pages/PropertyEvaluator.tsx`

#### 5.1 Add Video Hero Section (Lines 316-345)

**Current**: Simple gradient header with text.

**Target**: Full-screen hero with video background, matching other premium pages.

```tsx
{/* Hero Section with Video */}
<section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden min-h-[50vh]">
  {/* Video Background */}
  <video 
    autoPlay 
    loop 
    muted 
    playsInline
    className="absolute inset-0 w-full h-full object-cover opacity-30"
  >
    <source src="/videos/dubai-landmarks-hero.mp4" type="video/mp4" />
  </video>
  
  {/* Overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-black/70 to-black" />
  
  {/* Content */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative text-center px-4"
  >
    <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/40 rounded-full px-4 py-2 mb-6">
      <Sparkles className="w-5 h-5 text-blue-400" />
      <span className="text-blue-300 text-sm font-semibold">AI-Powered Valuation</span>
    </div>
    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
      Property <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Evaluator</span>
    </h1>
    <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
      Get an AI-powered property valuation based on DLD transaction data, comparable sales, and market analysis.
    </p>
  </motion.div>
</section>
```

#### 5.2 Fix Tab Trigger Contrast (Line 350-361)

**Issue**: `data-[state=active]:bg-blue-500 data-[state=active]:text-white` - white on blue may not be readable.

**Fix**: Use black text on active blue background for better contrast:

```tsx
<TabsTrigger 
  value="property" 
  className="data-[state=active]:bg-blue-500 data-[state=active]:text-black text-zinc-400"
>
  Property Details
</TabsTrigger>
```

Apply to all 4 tab triggers (property, modifications, owner, results).

---

### Part 6: Fix White Text on Active Color Backgrounds (Global)

**Pattern Issue**: Many components use `data-[state=active]:text-white` which creates poor contrast on lighter accent colors.

**Files Affected**: 62 files identified with this pattern.

**Global Fix Strategy**:

For **gold backgrounds**: Use `data-[state=active]:text-black`
For **blue/purple backgrounds**: Use `data-[state=active]:text-black` or `data-[state=active]:text-white` based on shade

**Priority Files to Fix**:
1. `src/pages/PropertyEvaluator.tsx` - blue tabs
2. `src/pages/toolkit/VideoResizePack.tsx` - gold tabs
3. All premium AI tool pages with tabs

---

### Files to Create (New)

| File | Purpose |
|------|---------|
| `supabase/functions/ai-client-matcher/index.ts` | Client matching edge function |
| `supabase/functions/ai-email-generator/index.ts` | Email generation edge function |
| `supabase/functions/ai-social-media/index.ts` | Social content edge function |
| `src/pages/AIClientMatcherPage.tsx` | Client matcher UI |
| `src/pages/AIInvestmentReportPage.tsx` | Investment report UI |
| `src/pages/AIEmailGeneratorPage.tsx` | Email generator UI |
| `src/pages/AISocialMediaPage.tsx` | Social media UI |
| `src/pages/AIDescriptionWriterPage.tsx` | Description writer UI |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/toolkit/RoyalToolsHub.tsx` | Video hero, dark card backgrounds, grouped categories |
| `src/pages/toolkit/ToolkitLanding.tsx` | Dark card backgrounds |
| `src/config/royalToolsRegistry.ts` | Update all 6 tools to status: 'active' |
| `src/pages/PropertyEvaluator.tsx` | Video hero, fix tab contrast |
| `src/App.tsx` | Add routes for 5 new pages |

---

### Implementation Order

**Phase 1 - Quick Wins (UI Fixes)**:
1. Fix tab trigger contrast in PropertyEvaluator
2. Add dark backgrounds to toolkit cards
3. Remove "Coming Soon" labels from RoyalToolsHub

**Phase 2 - Hero Sections**:
4. Add video hero to RoyalToolsHub
5. Add video hero to PropertyEvaluator

**Phase 3 - Missing Tools (Backend)**:
6. Create ai-client-matcher edge function
7. Create ai-email-generator edge function  
8. Create ai-social-media edge function
9. Update royalToolsRegistry to mark all as 'active'

**Phase 4 - Missing Tools (Frontend)**:
10. Create AIClientMatcherPage
11. Create AIInvestmentReportPage
12. Create AIEmailGeneratorPage
13. Create AISocialMediaPage
14. Create AIDescriptionWriterPage
15. Add routes to App.tsx

**Phase 5 - Category Organization**:
16. Implement grouped category view in RoyalToolsHub

---

### Summary

| Category | Count | Action |
|----------|-------|--------|
| Hero sections | 2 pages | Add video backgrounds |
| Card backgrounds | 2 files | Dark bg + better contrast |
| Tab contrast | 3+ files | Black text on active |
| Coming Soon tools | 6 tools | Create edge functions + pages |
| Category grouping | 1 file | Organize by function |

**Total New Files**: 8 (3 edge functions + 5 pages)
**Total Modified Files**: ~8 files
**Edge Functions**: Use existing `LOVABLE_API_KEY` for AI capabilities

