// Market Intelligence Engine Configuration & Types

// Data source types
export type MarketDataSourceType = 
  | 'dld' | 'dsc' | 'uae_central_bank' | 'property_finder' | 'bayut'
  | 'knight_frank' | 'jll' | 'imf' | 'world_bank' | 'news_feed' | 'custom';

export type MarketTrendDirection = 'rising' | 'falling' | 'stable' | 'volatile';

export type MarketAlertPriority = 'low' | 'medium' | 'high' | 'critical';

export type OpportunityStatus = 'new' | 'evaluated' | 'pursued' | 'passed' | 'converted';

// Core interfaces
export interface MarketDataSource {
  id: string;
  name: string;
  source_type: MarketDataSourceType;
  api_endpoint?: string;
  is_active: boolean;
  fetch_frequency_hours: number;
  last_fetched_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MarketDataPoint {
  id: string;
  source_id?: string;
  data_type: string;
  location?: string;
  metric_name: string;
  metric_value?: number;
  metric_unit?: string;
  period_start?: string;
  period_end?: string;
  raw_data?: Record<string, unknown>;
  created_at: string;
}

export interface MarketPrediction {
  id: string;
  prediction_type: string;
  location?: string;
  property_type?: string;
  current_value?: number;
  predicted_value?: number;
  change_percent?: number;
  trend_direction: MarketTrendDirection;
  confidence_score?: number;
  forecast_period_days: number;
  model_used?: string;
  supporting_data?: Record<string, unknown>;
  business_recommendation?: string;
  created_at: string;
  valid_until?: string;
}

export interface MarketOpportunity {
  id: string;
  title: string;
  description?: string;
  opportunity_type: string;
  location?: string;
  developer_id?: string;
  project_name?: string;
  estimated_value_aed?: number;
  expected_roi_percent?: number;
  risk_level?: 'low' | 'medium' | 'high';
  ai_score?: number;
  status: OpportunityStatus;
  source_data?: Record<string, unknown>;
  expires_at?: string;
  created_at: string;
}

export interface MarketAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  priority: MarketAlertPriority;
  category?: string;
  location?: string;
  impact_assessment?: string;
  recommended_action?: string;
  source_url?: string;
  is_read: boolean;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  expires_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface InvestorBehaviorInsight {
  id: string;
  investor_segment: string;
  source_country?: string;
  preferred_locations?: string[];
  preferred_property_types?: string[];
  avg_budget_min_aed?: number;
  avg_budget_max_aed?: number;
  payment_preference?: string;
  inquiry_trend?: MarketTrendDirection;
  conversion_rate_percent?: number;
  insight_summary?: string;
  data_period_start?: string;
  data_period_end?: string;
  sample_size?: number;
  created_at: string;
}

export interface EconomicIndicator {
  id: string;
  indicator_name: string;
  indicator_type: string;
  value?: number;
  previous_value?: number;
  change_percent?: number;
  trend_direction?: MarketTrendDirection;
  source?: string;
  region: string;
  impact_on_realestate?: string;
  report_date: string;
  created_at: string;
}

export interface MarketBriefing {
  id: string;
  briefing_type: 'daily' | 'weekly' | 'monthly' | 'special';
  title: string;
  summary: string;
  key_metrics?: Record<string, unknown>;
  trending_areas?: string[];
  opportunities_count: number;
  alerts_count: number;
  sentiment_score?: number;
  ai_insights?: string[];
  recommendations?: string[];
  briefing_date: string;
  generated_by: string;
  created_at: string;
}

export interface ProjectAIScore {
  id: string;
  project_id?: string;
  project_name: string;
  developer_name?: string;
  location?: string;
  market_timing_score?: number;
  developer_reputation_score?: number;
  location_growth_score?: number;
  investor_interest_score?: number;
  overall_score?: number;
  risk_level?: 'low' | 'medium' | 'high';
  recommendation?: string;
  analysis_details?: Record<string, unknown>;
  valid_until?: string;
  created_at: string;
}

// Configuration constants
export const DATA_SOURCES_CONFIG: Record<MarketDataSourceType, {
  name: string;
  description: string;
  frequency: string;
  reliability: number;
}> = {
  dld: {
    name: 'Dubai Land Department',
    description: 'Official property transactions and registrations',
    frequency: 'Daily',
    reliability: 0.99,
  },
  dsc: {
    name: 'Dubai Statistics Center',
    description: 'Economic indicators, GDP, employment data',
    frequency: 'Monthly',
    reliability: 0.98,
  },
  uae_central_bank: {
    name: 'UAE Central Bank',
    description: 'Interest rates, mortgage rates, monetary policy',
    frequency: 'Weekly',
    reliability: 0.99,
  },
  property_finder: {
    name: 'Property Finder',
    description: 'Listing trends, demand analysis, price indexes',
    frequency: 'Daily',
    reliability: 0.92,
  },
  bayut: {
    name: 'Bayut',
    description: 'Market reports, area analytics, rental yields',
    frequency: 'Daily',
    reliability: 0.91,
  },
  knight_frank: {
    name: 'Knight Frank',
    description: 'Premium market analysis, investor reports',
    frequency: 'Quarterly',
    reliability: 0.95,
  },
  jll: {
    name: 'JLL',
    description: 'Commercial real estate insights, market outlook',
    frequency: 'Quarterly',
    reliability: 0.95,
  },
  imf: {
    name: 'IMF',
    description: 'Global economic outlook, regional forecasts',
    frequency: 'Monthly',
    reliability: 0.97,
  },
  world_bank: {
    name: 'World Bank',
    description: 'Economic development indicators, housing indexes',
    frequency: 'Quarterly',
    reliability: 0.97,
  },
  news_feed: {
    name: 'News Aggregator',
    description: 'Real-time news sentiment and market signals',
    frequency: 'Real-time',
    reliability: 0.75,
  },
  custom: {
    name: 'Custom Source',
    description: 'User-defined data sources',
    frequency: 'Variable',
    reliability: 0.80,
  },
};

export const PREDICTION_MODELS = {
  price_forecast: {
    name: 'Price Forecast Model',
    type: 'time_series',
    algorithm: 'Prophet + ARIMA Ensemble',
    confidence_range: [75, 95],
  },
  demand_prediction: {
    name: 'Demand Prediction Model',
    type: 'classification',
    algorithm: 'Random Forest',
    confidence_range: [70, 90],
  },
  sentiment_analysis: {
    name: 'Market Sentiment Model',
    type: 'nlp',
    algorithm: 'Transformer-based',
    confidence_range: [80, 92],
  },
  risk_assessment: {
    name: 'Risk Assessment Model',
    type: 'scoring',
    algorithm: 'Multi-factor Analysis',
    confidence_range: [85, 95],
  },
};

export const DUBAI_AREAS = [
  'Downtown Dubai',
  'Dubai Marina',
  'Palm Jumeirah',
  'Business Bay',
  'JBR',
  'Dubai Hills Estate',
  'Emaar Beachfront',
  'Dubai Creek Harbour',
  'Jumeirah Village Circle',
  'Arabian Ranches',
  'DAMAC Hills',
  'Mohammed Bin Rashid City',
  'Dubai South',
  'Al Barsha',
  'Jumeirah',
  'DIFC',
  'Palm Jebel Ali',
  'Tilal Al Ghaf',
  'Sobha Hartland',
  'Bluewaters Island',
];

export const PROPERTY_TYPES = [
  'Apartment',
  'Villa',
  'Townhouse',
  'Penthouse',
  'Studio',
  'Duplex',
  'Plot',
  'Office',
  'Retail',
  'Warehouse',
];

export const ECONOMIC_INDICATOR_TYPES = [
  'interest_rate',
  'mortgage_rate',
  'inflation',
  'gdp_growth',
  'employment_rate',
  'oil_price',
  'gold_price',
  'currency_exchange',
  'consumer_confidence',
  'construction_index',
];

export const ALERT_CATEGORIES = [
  'market_shift',
  'regulatory_change',
  'developer_activity',
  'price_movement',
  'supply_demand',
  'economic_indicator',
  'opportunity',
  'risk_warning',
  'global_event',
];

// AI Analyst personality
export const AYAAN_AI_PERSONALITY = {
  name: 'Ayaan',
  role: 'Senior Market Analyst',
  avatar: 'A',
  tone: 'Confident, analytical, data-driven',
  specialization: 'Real estate economics & forecasting',
  greeting: "Good day. I'm Ayaan, your Senior Market Analyst. I monitor Dubai's real estate market 24/7, analyzing trends, predicting movements, and identifying opportunities. What would you like to know about the market today?",
  capabilities: [
    'Market trend analysis',
    'Price predictions',
    'Investment opportunity identification',
    'Risk assessment',
    'Economic indicator interpretation',
    'Competitor monitoring',
    'Regulatory updates',
    'Global market correlation',
  ],
};

// Sentiment thresholds
export const SENTIMENT_THRESHOLDS = {
  very_positive: 0.6,
  positive: 0.2,
  neutral_upper: 0.2,
  neutral_lower: -0.2,
  negative: -0.6,
  very_negative: -1.0,
};

// Risk levels configuration
export const RISK_LEVEL_CONFIG = {
  low: {
    color: 'green',
    icon: '+',
    description: 'Favorable conditions, low volatility',
    action: 'Proceed with confidence',
  },
  medium: {
    color: 'yellow',
    icon: '!',
    description: 'Some uncertainty, monitor closely',
    action: 'Proceed with caution',
  },
  high: {
    color: 'red',
    icon: '!!',
    description: 'High volatility, significant risks',
    action: 'Wait or hedge positions',
  },
};

// Scoring weights for project AI scores
export const PROJECT_SCORING_WEIGHTS = {
  market_timing: 0.25,
  developer_reputation: 0.20,
  location_growth: 0.30,
  investor_interest: 0.25,
};

// Helper functions
export function getTrendIcon(direction: MarketTrendDirection): string {
  switch (direction) {
    case 'rising': return 'UP';
    case 'falling': return 'DOWN';
    case 'stable': return 'STABLE';
    case 'volatile': return 'MIXED';
  }
}

export function getPriorityColor(priority: MarketAlertPriority): string {
  switch (priority) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
  }
}

export function getSentimentLabel(score: number): { label: string; color: string; icon: string } {
  if (score >= SENTIMENT_THRESHOLDS.very_positive) {
    return { label: 'Very Positive', color: 'text-green-600', icon: 'UP' };
  } else if (score >= SENTIMENT_THRESHOLDS.positive) {
    return { label: 'Positive', color: 'text-green-500', icon: 'UP' };
  } else if (score >= SENTIMENT_THRESHOLDS.neutral_lower) {
    return { label: 'Neutral', color: 'text-gray-500', icon: '--' };
  } else if (score >= SENTIMENT_THRESHOLDS.negative) {
    return { label: 'Negative', color: 'text-orange-500', icon: 'DOWN' };
  } else {
    return { label: 'Very Negative', color: 'text-red-600', icon: 'ALERT' };
  }
}

export function calculateOverallScore(scores: {
  market_timing?: number;
  developer_reputation?: number;
  location_growth?: number;
  investor_interest?: number;
}): number {
  const weights = PROJECT_SCORING_WEIGHTS;
  let total = 0;
  let weightSum = 0;

  if (scores.market_timing !== undefined) {
    total += scores.market_timing * weights.market_timing;
    weightSum += weights.market_timing;
  }
  if (scores.developer_reputation !== undefined) {
    total += scores.developer_reputation * weights.developer_reputation;
    weightSum += weights.developer_reputation;
  }
  if (scores.location_growth !== undefined) {
    total += scores.location_growth * weights.location_growth;
    weightSum += weights.location_growth;
  }
  if (scores.investor_interest !== undefined) {
    total += scores.investor_interest * weights.investor_interest;
    weightSum += weights.investor_interest;
  }

  return weightSum > 0 ? Math.round((total / weightSum) * 10) / 10 : 0;
}

export function formatCurrency(value: number, currency: string = 'AED'): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentChange(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}
