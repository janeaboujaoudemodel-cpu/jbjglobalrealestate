

# Phase B Continuation - Footer/CTA De-duplication

## Status
- **Previously completed:** ~40 pages cleaned
- **Remaining:** 60 pages with Footer imports + 5 with DirectContactCTA

---

## Remaining Files to Clean (60 files)

### Batch 1 - Core Pages (12 files)
| File | Remove |
|------|--------|
| `Philanthropy.tsx` | Footer |
| `BrokerDashboard.tsx` | Footer |
| `Privacy.tsx` | Footer |
| `AIFinancialAdvisor.tsx` | Footer |
| `ScanSignDocuments.tsx` | Footer |
| `PropertyEvaluator.tsx` | Footer |
| `Partners.tsx` | Footer |
| `Awards.tsx` | Footer |
| `InvestorServices.tsx` | Footer |
| `CompanyProfile.tsx` | Footer |
| `Terms.tsx` | Footer |
| `PropertyMeasurement.tsx` | Footer |

### Batch 2 - Market Intelligence (7 files)
| File | Remove |
|------|--------|
| `market-intelligence/AreaDetail.tsx` | Footer |
| `market-intelligence/MarketOverview.tsx` | Footer |
| `market-intelligence/AnnualMarketSummary.tsx` | Footer |
| `market-intelligence/internal/BrokerIntelligence.tsx` | Footer |
| + other market-intelligence pages | Footer |

### Batch 3 - Pages with DirectContactCTA (5 files)
| File | Remove |
|------|--------|
| `Founder.tsx` | Footer + DirectContactCTA |
| `Contact.tsx` | Footer + DirectContactCTA |
| `RentGuide.tsx` | Footer + DirectContactCTA |
| `services/Architecture.tsx` | Footer + DirectContactCTA |
| `services/DesignBuild.tsx` | Footer + DirectContactCTA |

### Batch 4 - Remaining Pages (~40 files)
- News.tsx
- Pricing.tsx
- Onboarding.tsx (multiple Footer instances)
- CustomerHappiness.tsx
- All remaining pages with Footer imports

---

## Changes Per File
For each file:
1. Remove `import Footer from "@/components/Footer";`
2. Remove `<Footer />` JSX (search for closing tag)
3. If applicable, remove `import DirectContactCTA...` and `<DirectContactCTA ... />`
4. Keep all other content intact

---

## Expected Outcome
- **0 pages** with local Footer imports
- **0 pages** with local DirectContactCTA imports
- Global Footer/CTA rendered only via MainLayout.tsx

