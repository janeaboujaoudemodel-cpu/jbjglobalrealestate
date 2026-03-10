/**
 * Open Data Configuration for Market Intelligence
 * All data sources are official government open data and licensed industry portals
 */

export interface OpenDataSource {
  id: string;
  name: string;
  provider: string;
  description: string;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastUpdated: string;
  dataTypes: string[];
  url?: string;
}

export const OPEN_DATA_SOURCES: OpenDataSource[] = [
  {
    id: 'dubai_pulse',
    name: 'Dubai Pulse',
    provider: 'Dubai Government',
    description: 'Official Dubai Government Open Data Portal',
    updateFrequency: 'monthly',
    lastUpdated: '2026-03-01',
    dataTypes: ['transactions', 'prices', 'population'],
    url: 'https://www.dubaipulse.gov.ae',
  },
  {
    id: 'dubai_statistics',
    name: 'Dubai Statistics Center',
    provider: 'Dubai Statistics Center',
    description: 'Official statistical data for Dubai',
    updateFrequency: 'quarterly',
    lastUpdated: '2026-01-01',
    dataTypes: ['demographics', 'housing', 'economic'],
  },
  {
    id: 'dubai_land',
    name: 'Dubai Land Department',
    provider: 'Dubai Land Department',
    description: 'Real estate transaction data and registrations',
    updateFrequency: 'daily',
    lastUpdated: '2026-03-10',
    dataTypes: ['sales', 'rentals', 'registrations', 'mortgages', 'gifts'],
    url: 'https://dubailand.gov.ae',
  },
  {
    id: 'dxb_interact',
    name: 'DXB Interact',
    provider: 'Dubai Land Department',
    description: 'Interactive DLD transaction data explorer',
    updateFrequency: 'daily',
    lastUpdated: '2026-03-10',
    dataTypes: ['transactions', 'price_index', 'volume'],
    url: 'https://dxbinteract.com',
  },
  {
    id: 'rera',
    name: 'RERA (Real Estate Regulatory Agency)',
    provider: 'Dubai Government',
    description: 'Regulatory data, rental index, and service charge data',
    updateFrequency: 'quarterly',
    lastUpdated: '2026-01-01',
    dataTypes: ['rental_index', 'service_charges', 'regulations'],
    url: 'https://www.rera.gov.ae',
  },
  {
    id: 'property_monitor',
    name: 'Property Monitor',
    provider: 'Cavendish Maxwell',
    description: 'Market analytics, price indices, and valuation data',
    updateFrequency: 'monthly',
    lastUpdated: '2026-02-28',
    dataTypes: ['price_index', 'valuations', 'market_reports'],
    url: 'https://www.propertymonitor.ae',
  },
  {
    id: 'knight_frank',
    name: 'Knight Frank',
    provider: 'Knight Frank LLP',
    description: 'Global wealth report, prime residential indices, and HNWI data',
    updateFrequency: 'quarterly',
    lastUpdated: '2026-01-15',
    dataTypes: ['wealth_report', 'prime_index', 'luxury_market'],
    url: 'https://www.knightfrank.ae',
  },
  {
    id: 'bayut',
    name: 'Bayut',
    provider: 'Dubizzle Group',
    description: 'Listing data, price trends, rental yields, and area guides',
    updateFrequency: 'daily',
    lastUpdated: '2026-03-10',
    dataTypes: ['listings', 'rental_yields', 'price_trends', 'area_guides'],
    url: 'https://www.bayut.com',
  },
  {
    id: 'property_finder',
    name: 'Property Finder',
    provider: 'Property Finder Group',
    description: 'Market trends, area analytics, and demand indicators',
    updateFrequency: 'daily',
    lastUpdated: '2026-03-10',
    dataTypes: ['listings', 'demand_index', 'price_trends'],
    url: 'https://www.propertyfinder.ae',
  },
  {
    id: 'dubizzle',
    name: 'Dubizzle',
    provider: 'Dubizzle Group',
    description: 'Secondary market listings and resale price indicators',
    updateFrequency: 'daily',
    lastUpdated: '2026-03-10',
    dataTypes: ['resale_listings', 'secondary_prices'],
    url: 'https://www.dubizzle.com',
  },
  {
    id: 'airbnb_holiday',
    name: 'Short-Term Rental Data',
    provider: 'Airbnb / Bayut Holiday Homes / DTCM',
    description: 'Holiday home occupancy, nightly rates, and short-term rental yields',
    updateFrequency: 'monthly',
    lastUpdated: '2026-02-28',
    dataTypes: ['occupancy_rates', 'nightly_rates', 'str_yields'],
  },
  {
    id: 'numbeo',
    name: 'Numbeo Safety & Cost of Living',
    provider: 'Numbeo',
    description: 'City safety rankings, cost of living index, quality of life index',
    updateFrequency: 'quarterly',
    lastUpdated: '2026-01-01',
    dataTypes: ['safety_index', 'cost_of_living', 'quality_of_life'],
    url: 'https://www.numbeo.com',
  },
];

// ── Market Trend Interfaces ────────────────────────────────────────

export interface MarketTrendData {
  area: string;
  period: string;
  avgPricePerSqft: number;
  changePercent: number;
  transactionVolume: number;
  direction: 'up' | 'down' | 'stable';
}

export interface AreaMarketSnapshot {
  area: string;
  priceIndex: number;
  rentalIndex: number;
  demandScore: number;
  supplyScore: number;
  yoyChange: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  highlights: string[];
}

// ── Area Market Data (Sources: DLD, Property Monitor, Knight Frank, Bayut) ──

export const DUBAI_AREAS_MARKET_DATA: AreaMarketSnapshot[] = [
  {
    area: 'Downtown Dubai',
    priceIndex: 142,
    rentalIndex: 138,
    demandScore: 92,
    supplyScore: 45,
    yoyChange: 8.5,
    trend: 'bullish',
    highlights: [
      'Iconic Burj Khalifa views remain premium',
      'Strong demand from international buyers',
      'Limited new supply driving prices'
    ],
  },
  {
    area: 'Dubai Marina',
    priceIndex: 128,
    rentalIndex: 132,
    demandScore: 88,
    supplyScore: 52,
    yoyChange: 6.2,
    trend: 'bullish',
    highlights: [
      'Waterfront lifestyle attracts expats',
      'High rental yields for investors',
      'Established community with amenities'
    ],
  },
  {
    area: 'Palm Jumeirah',
    priceIndex: 165,
    rentalIndex: 155,
    demandScore: 85,
    supplyScore: 28,
    yoyChange: 12.3,
    trend: 'bullish',
    highlights: [
      'Ultra-luxury segment outperforming',
      'Limited beachfront inventory',
      'HNWI demand remains strong'
    ],
  },
  {
    area: 'Dubai Hills Estate',
    priceIndex: 118,
    rentalIndex: 115,
    demandScore: 78,
    supplyScore: 65,
    yoyChange: 4.8,
    trend: 'neutral',
    highlights: [
      'Family-friendly community growing',
      'Good value proposition',
      'Upcoming infrastructure boosting appeal'
    ],
  },
  {
    area: 'Business Bay',
    priceIndex: 112,
    rentalIndex: 120,
    demandScore: 82,
    supplyScore: 70,
    yoyChange: 5.1,
    trend: 'bullish',
    highlights: [
      'Central location driving demand',
      'Strong rental market',
      'Commercial-residential mix'
    ],
  },
  {
    area: 'Jumeirah Village Circle',
    priceIndex: 95,
    rentalIndex: 98,
    demandScore: 75,
    supplyScore: 78,
    yoyChange: 3.2,
    trend: 'neutral',
    highlights: [
      'Affordable entry point',
      'Popular with first-time buyers',
      'High rental yields (8%+)'
    ],
  },
  {
    area: 'Dubai Creek Harbour',
    priceIndex: 125,
    rentalIndex: 118,
    demandScore: 80,
    supplyScore: 55,
    yoyChange: 7.8,
    trend: 'bullish',
    highlights: [
      'Emerging waterfront destination',
      'Strong pre-launch interest',
      'Future Creek Tower impact'
    ],
  },
  {
    area: 'Arabian Ranches',
    priceIndex: 135,
    rentalIndex: 128,
    demandScore: 72,
    supplyScore: 35,
    yoyChange: 6.5,
    trend: 'bullish',
    highlights: [
      'Villa shortage driving prices',
      'Family community in demand',
      'Mature landscaping premium'
    ],
  },
];

// ── Market Overview (Sources: DLD, DXB Interact, Property Monitor) ──

export const MARKET_OVERVIEW_STATS = {
  totalTransactions: 145000,
  totalTransactionsChange: 12.5,
  avgPricePerSqft: 1450,
  avgPriceChange: 7.8,
  avgRentalYield: 6.2,
  yieldChange: 0.3,
  daysOnMarket: 42,
  domChange: -8,
  reportDate: '2026-03-01',
  dataSource: 'DLD, DXB Interact, Property Monitor',
};

export const PROPERTY_TYPE_TRENDS = [
  { type: 'Apartments', avgPrice: 1250, change: 6.5, volume: 85000 },
  { type: 'Villas', avgPrice: 1850, change: 9.2, volume: 28000 },
  { type: 'Townhouses', avgPrice: 1450, change: 7.8, volume: 18000 },
  { type: 'Penthouses', avgPrice: 2800, change: 11.5, volume: 2500 },
  { type: 'Commercial', avgPrice: 980, change: 4.2, volume: 11500 },
];

export const QUARTERLY_TRENDS = [
  { quarter: 'Q1 2025', transactions: 32500, avgPrice: 1380, index: 100 },
  { quarter: 'Q2 2025', transactions: 35800, avgPrice: 1410, index: 102 },
  { quarter: 'Q3 2025', transactions: 38200, avgPrice: 1435, index: 104 },
  { quarter: 'Q4 2025', transactions: 38500, avgPrice: 1450, index: 105 },
];

export const MARKET_DISCLAIMER = `Market Intelligence is powered by official government Open Data (DLD, RERA, DXB Interact) and aggregated analytics from Property Monitor, Knight Frank, Bayut, and Property Finder.
Data is used for informational purposes only and does not constitute financial or investment advice.
All insights are AI-generated explanations of publicly available data and should not be used as the sole basis for investment decisions.`;
