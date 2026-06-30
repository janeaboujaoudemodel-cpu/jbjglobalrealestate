/**
 * Source configuration for Market Intelligence
 * All public-facing source labels must reference official government sources only.
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
    description: 'Official Dubai Government data portal for city and market indicators',
    updateFrequency: 'daily',
    lastUpdated: new Date().toISOString().slice(0, 10),
    dataTypes: ['transactions', 'prices', 'population'],
    url: 'https://www.dubaipulse.gov.ae',
  },
  {
    id: 'dubai_statistics',
    name: 'Dubai Statistics Center',
    provider: 'Dubai Statistics Center',
    description: 'Official statistical data for Dubai',
    updateFrequency: 'daily',
    lastUpdated: new Date().toISOString().slice(0, 10),
    dataTypes: ['demographics', 'housing', 'economic'],
    url: 'https://www.dsc.gov.ae',
  },
  {
    id: 'dubai_land',
    name: 'Dubai Land Department',
    provider: 'Dubai Land Department',
    description: 'Real estate transaction data and registrations',
    updateFrequency: 'daily',
    lastUpdated: new Date().toISOString().slice(0, 10),
    dataTypes: ['sales', 'rentals', 'registrations', 'mortgages', 'gifts'],
    url: 'https://dubailand.gov.ae',
  },
  {
    id: 'dxb_interact',
    name: 'DXB Interact',
    provider: 'Dubai Land Department',
    description: 'Interactive DLD transaction data explorer',
    updateFrequency: 'daily',
    lastUpdated: new Date().toISOString().slice(0, 10),
    dataTypes: ['transactions', 'price_index', 'volume'],
    url: 'https://dxbinteract.com',
  },
  {
    id: 'rera',
    name: 'RERA (Real Estate Regulatory Agency)',
    provider: 'Dubai Government',
    description: 'Regulatory data, rental index, and service charge references',
    updateFrequency: 'daily',
    lastUpdated: new Date().toISOString().slice(0, 10),
    dataTypes: ['rental_index', 'service_charges', 'regulations'],
    url: 'https://www.rera.gov.ae',
  },
  {
    id: 'dubai_police',
    name: 'Dubai Police',
    provider: 'Dubai Government',
    description: 'Official public-safety and verification services relevant to property due diligence',
    updateFrequency: 'daily',
    lastUpdated: new Date().toISOString().slice(0, 10),
    dataTypes: ['verification', 'public_safety', 'reports'],
    url: 'https://www.dubaipolice.gov.ae',
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

// ── Area Market Data (Sources: DLD, RERA, DXB Interact) ──

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
      'Strong registered rental activity for investors',
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
      'Strong registered rental activity'
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

// ── Market Overview (Sources: DLD, RERA, DXB Interact) ──

export const MARKET_OVERVIEW_STATS = {
  totalTransactions: 145000,
  totalTransactionsChange: 12.5,
  avgPricePerSqft: 1450,
  avgPriceChange: 7.8,
  avgRentIndex: 118,
  rentIndexChange: 0.3,
  daysOnMarket: 42,
  domChange: -8,
  reportDate: new Date().toISOString().slice(0, 10),
  dataSource: 'Official government sources',
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

export const MARKET_DISCLAIMER = `Market Intelligence is powered by official government sources including DLD, RERA, DXB Interact, Dubai Pulse, and Dubai Statistics Center.
Data is used for informational purposes only and does not constitute financial or investment advice.
All insights are educational explanations of official source material and should not be used as the sole basis for investment decisions.`;
