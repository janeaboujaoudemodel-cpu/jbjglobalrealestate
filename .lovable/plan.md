
# Merge Homepage "Find Your Starting Point" Cards

## Problem Summary
The current "Find Your Starting Point" section on the homepage has 11 cards in a single row, but the screenshot shows a 3-row layout with:
- **Row 1**: 7 audience cards (Buyers, Sellers, Rentals, Investors, Visitors, Referral, Careers)
- **Row 2**: 7 action cards with subtitles (Explore Properties, List Your Property, Market Report, Investor Hub, Legal Partners, Mortgage Partners, Design & Build)  
- **Row 3**: 2 large feature cards (JBJ Broker Hub, JBJ Investor Hub)

The current codebase is missing Row 2 (action cards) and Row 3 (feature cards).

## Analysis

### Current Cards in Codebase (11 cards, single row):
1. Buyers → `/buyer-guide`
2. Sellers → `/seller-guide`
3. Rentals → `/rent-guide`
4. Landlords → `/landlord-guide`
5. Tenants → `/tenant-guide`
6. Investors → `/ai-hub`
7. Visitors → `/quiz`
8. Partners → `/partners`
9. Golden Visa → `/guides/golden-visa-uae`
10. Referral → `/referral`
11. Careers → `/join`

### Cards from Screenshot to Merge:

**Row 1 (keep from current)**: Buyers, Sellers, Rentals, Investors, Visitors, Referral, Careers

**Row 2 (MISSING - need to add):**
| Card | Subtitle | Route | Icon |
|------|----------|-------|------|
| Explore Properties | Browse listings | `/properties` | Home |
| List Your Property | Sell or rent | `/list-property` | FileText |
| Market Report | Latest insights | `/market-report` | BarChart3 |
| Investor Hub | AI-powered tools | `/ai-hub` | Layers |
| Legal Partners | Legal services | `/partners/legal` | Scale |
| Mortgage Partners | Financing options | `/partners/mortgage` | Calculator |
| Design & Build | Construction & fit-out | `/services/design-build` | Palette |

**Row 3 (MISSING - need to add):**
| Card | Subtitle | Description | Route |
|------|----------|-------------|-------|
| JBJ Broker Hub | Professional Tools | Access AI-powered broker tools, training modules, CRM, marketing resources. | `/broker-toolkit` |
| JBJ Investor Hub | Free AI Tools | AI-powered property analysis, comparison, mortgage calculator, and productivity tools. | `/ai-hub` |

## Implementation Strategy

### Decision: Keep All Current Cards + Add Missing
The merged section will include:
- All 11 current cards (keeping Landlords, Tenants, Partners, Golden Visa that aren't in screenshot)
- Add the 7 action cards with subtitles (Row 2)
- Add the 2 large feature cards (Row 3)

This ensures no existing functionality is lost.

## Technical Implementation

### File to Modify
`src/pages/Index.tsx` - Lines 197-342

### Changes Required

1. **Keep Row 1 as-is** (11 small audience cards)

2. **Add Row 2** - Action cards with subtitles (7 cards)
   - Same champagne card styling as Row 1
   - Each card includes:
     - Icon in bordered circle
     - Title (bold)
     - Subtitle (smaller, muted text)
   - Grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7`

3. **Add Row 3** - Large feature cards (2 cards)
   - Larger cards with icon, title, subtitle, description, and CTA link
   - Uses existing champagne styling with larger padding
   - Grid: `grid-cols-1 md:grid-cols-2`
   - Icon in black circle with gold icon (consistent with ThemedIcon)

### New Icons to Import
Already imported in Index.tsx:
- `Home`, `Key`, `FileText`, `BarChart3`, `Layers`, `Scale`, `Calculator`, `Palette`

Additional icons needed:
- `Building2` - for Broker Hub icon
- `Coins` or keep `Layers` - for Investor Hub icon

### Translations Already Available
All required translations exist in `src/translations/en.ts`:
- `hero.exploreProperties`, `hero.browseListings`
- `hero.listYourProperty`, `hero.sellOrRent`
- `hero.marketReport`, `hero.latestInsights`
- `hero.investorHub`, `hero.aiTools`
- `hero.legalPartners`, `hero.legalServices`
- `hero.mortgagePartners`, `hero.financingOptions`
- `hero.designBuild`, `hero.constructionFitout`
- `hero.jbjBrokerHub`, `hero.professionalTools`
- `hero.jbjInvestorHub`, `hero.freeAiTools`

### Final Layout Structure

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ✨ FIND YOUR STARTING POINT                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Buyers] [Sellers] [Rentals] [Landlords] [Tenants] [Investors] [Visitors]  │
│ [Partners] [Golden Visa] [Referral] [Careers]                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Explore      ] [List Your   ] [Market     ] [Investor   ] [Legal     ]    │
│ [Properties   ] [Property    ] [Report     ] [Hub        ] [Partners  ]    │
│ [Browse       ] [Sell or     ] [Latest     ] [AI-powered ] [Legal     ]    │
│ [listings     ] [rent        ] [insights   ] [tools      ] [services  ]    │
│                                                                             │
│ [Mortgage     ] [Design &    ]                                              │
│ [Partners     ] [Build       ]                                              │
│ [Financing    ] [Construction]                                              │
│ [options      ] [& fit-out   ]                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────┐  ┌───────────────────────────────────┐   │
│ │  🏢 JBJ Broker Hub            │  │  📊 JBJ Investor Hub              │   │
│ │  Professional Tools           │  │  Free AI Tools                    │   │
│ │                               │  │                                   │   │
│ │  Access AI-powered broker     │  │  AI-powered property analysis,   │   │
│ │  tools, training modules,     │  │  comparison, mortgage calculator, │   │
│ │  CRM, marketing resources.    │  │  and productivity tools.          │   │
│ │                               │  │                                   │   │
│ │  Access Broker Hub →          │  │  Explore Investor Hub →           │   │
│ └───────────────────────────────┘  └───────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Routes Verification
All routes already exist in the application:
- `/properties` ✓
- `/list-property` ✓
- `/market-report` ✓
- `/ai-hub` ✓
- `/partners/legal` ✓
- `/partners/mortgage` ✓
- `/services/design-build` ✓
- `/broker-toolkit` ✓
