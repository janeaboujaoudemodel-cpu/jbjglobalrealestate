/**
 * GOVERNMENT-SAFE MARKET INTELLIGENCE DESIGN RULES
 * PRIORITY 1 — STEP 3
 * 
 * Purpose: Prevent accidental regulatory violations through design, charts, wording, or AI outputs.
 * 
 * Design Principle: Charts explain the past. Humans decide the future.
 * 
 * STATUS: LOCKED — Do not modify without explicit authorization
 */

// ============================================
// ALLOWED METRICS (PUBLIC)
// ============================================

export const ALLOWED_METRICS = Object.freeze({
  /**
   * Market-Level Metrics
   * Safe when displayed directionally (trends, not targets)
   */
  MARKET_LEVEL: Object.freeze([
    {
      id: 'transaction_volume',
      name: 'Transaction Volume',
      displayType: 'trend_only',
      description: 'Total transactions over time periods',
      rule: 'Show direction, not prediction',
    },
    {
      id: 'avg_price_movement',
      name: 'Average Price Movement',
      displayType: 'directional',
      description: 'Change in average prices',
      rule: 'Historical comparison only',
    },
    {
      id: 'rent_movement',
      name: 'RENT Movement',
      displayType: 'directional',
      description: 'Rental price trends',
      rule: 'Direction, not destination',
    },
    {
      id: 'supply_demand_balance',
      name: 'Supply vs Demand Balance',
      displayType: 'high_level',
      description: 'General market equilibrium indicators',
      rule: 'Qualitative assessment only',
    },
    {
      id: 'time_on_market',
      name: 'Time on Market',
      displayType: 'aggregated',
      description: 'Average days to transaction',
      rule: 'Aggregated averages only',
    },
  ]),

  /**
   * Area-Level Metrics
   * Safe for neighborhood/community analysis
   */
  AREA_LEVEL: Object.freeze([
    {
      id: 'historical_price_ranges',
      name: 'Historical Price Ranges',
      displayType: 'range',
      description: 'Min/max prices over past periods',
    },
    {
      id: 'rent_trend_direction',
      name: 'RENT Trend Direction',
      displayType: 'directional',
      description: 'Rental movement direction',
    },
    {
      id: 'inventory_change',
      name: 'Inventory Change',
      displayType: 'categorical',
      options: ['up', 'stable', 'down'],
      description: 'Available stock movement',
    },
    {
      id: 'area_comparison',
      name: 'Area Comparison',
      displayType: 'non_ranked',
      description: 'Side-by-side without ranking',
      rule: 'Compare, do not rank',
    },
  ]),

  /**
   * Core Rule
   */
  CORE_RULE: 'Trends, not targets. Direction, not destination.',
});

// ============================================
// FORBIDDEN METRICS (PUBLIC)
// These must NEVER appear on public-facing pages
// ============================================

export const FORBIDDEN_METRICS = Object.freeze({
  NEVER_DISPLAY_PUBLICLY: Object.freeze([
    'future_prices',
    'forecast_curves',
    'roi',
    'yield',
    'cap_rates',
    'best_area_rankings',
    'deal_velocity_benchmarks',
    'lead_conversion_data',
    'investment_returns',
    'appreciation_forecasts',
    'rental_yield_calculations',
    'price_predictions',
  ]),

  LABELS: Object.freeze({
    future_prices: 'Future Prices',
    forecast_curves: 'Forecast Curves',
    roi: 'ROI (Return on Investment)',
    yield: 'Yield',
    cap_rates: 'Cap Rates',
    best_area_rankings: '"Best Area" Rankings',
    deal_velocity_benchmarks: 'Deal Velocity Benchmarks',
    lead_conversion_data: 'Lead Conversion Data',
    investment_returns: 'Investment Returns',
    appreciation_forecasts: 'Appreciation Forecasts',
    rental_yield_calculations: 'Rental Yield Calculations',
    price_predictions: 'Price Predictions',
  }),

  REASON: 'These metrics are internal only. Public display constitutes investment advice.',
});

// ============================================
// CHART & VISUAL RULES
// ============================================

export const CHART_RULES = Object.freeze({
  /**
   * Allowed Chart Types
   */
  ALLOWED: Object.freeze([
    {
      type: 'line',
      constraint: 'historical_only',
      description: 'Line charts showing past data points',
      rule: 'No forward projections',
    },
    {
      type: 'bar',
      constraint: 'past_comparisons',
      description: 'Bar charts comparing historical periods',
      rule: 'Compare past to past only',
    },
    {
      type: 'heatmap',
      constraint: 'non_ranked',
      description: 'Geographic or categorical heat distribution',
      rule: 'No "best/worst" color coding',
    },
    {
      type: 'range_band',
      constraint: 'historical',
      description: 'Min/max/average bands over time',
      rule: 'Historical ranges only',
    },
    {
      type: 'area',
      constraint: 'historical_only',
      description: 'Area charts for volume trends',
      rule: 'No future projections',
    },
  ]),

  /**
   * Forbidden Chart Elements
   */
  FORBIDDEN: Object.freeze([
    'projections',
    'trend_extrapolation_lines',
    'future_period_indicators',
    'forward_pointing_arrows',
    'performance_signals',
    'prediction_confidence_bands',
    'forecast_markers',
  ]),

  /**
   * Forbidden Visual Elements
   */
  FORBIDDEN_ELEMENTS: Object.freeze([
    '"Next 6 months" indicators',
    'Arrows pointing to future',
    'Green/red "performance" signals',
    'Growth/decline predictions',
    'Target price markers',
    '"Expected" range indicators',
  ]),

  /**
   * Design Principle
   */
  PRINCIPLE: 'Charts explain the past. Humans decide the future.',

  /**
   * Color Rules
   */
  COLOR_RULES: Object.freeze({
    avoid: ['Red/green performance coding', 'Traffic light indicators'],
    prefer: ['Neutral palette', 'Brand colors', 'Muted tones'],
    rule: 'Colors should inform, not influence decisions',
  }),
});

// ============================================
// LANGUAGE RULES (PUBLIC)
// ============================================

export const LANGUAGE_RULES = Object.freeze({
  /**
   * Allowed Phrases
   */
  ALLOWED_PHRASES: Object.freeze([
    'Data indicates…',
    'Historically…',
    'Observed trend…',
    'Context suggests…',
    'Past performance shows…',
    'Based on historical data…',
    'The data reflects…',
    'Records indicate…',
    'Analysis of past transactions…',
    'Historical patterns show…',
  ]),

  /**
   * Forbidden Phrases (NEVER USE)
   */
  FORBIDDEN_PHRASES: Object.freeze([
    'Will increase',
    'Will decrease',
    'Expected to rise',
    'Expected to fall',
    'Best time to buy',
    'Best time to sell',
    'Strong investment',
    'Weak investment',
    'Guaranteed demand',
    'Guaranteed returns',
    'Should invest',
    'Should buy',
    'Should sell',
    'Recommended area',
    'Hot market',
    'Cold market',
    'Can\'t lose',
    'Opportunity of a lifetime',
    'Act now',
    'Don\'t miss out',
  ]),

  /**
   * Replacement Guidance
   */
  REPLACEMENTS: Object.freeze({
    'will increase': 'has historically increased',
    'expected to rise': 'has shown upward movement',
    'best time': 'historical data indicates',
    'strong investment': 'area with consistent demand',
    'guaranteed': 'historically observed',
    'should buy': 'buyers have historically',
    'hot market': 'market with increased activity',
  }),

  /**
   * Core Rule
   */
  RULE: 'Replace certainty with context.',
});

// ============================================
// RENT DISPLAY RULES
// ============================================

export const RENT_DISPLAY_RULES = Object.freeze({
  /**
   * Treatment
   */
  TREATMENT: 'RENT is a market behavior, not an opportunity.',

  /**
   * Allowed RENT Displays
   */
  ALLOWED: Object.freeze([
    {
      id: 'rent_demand_direction',
      name: 'RENT Demand Direction',
      description: 'General direction of rental demand',
    },
    {
      id: 'rent_stability',
      name: 'RENT Stability',
      description: 'Consistency of rental prices over time',
    },
    {
      id: 'rent_pressure_indicators',
      name: 'RENT Pressure Indicators',
      constraint: 'high_level',
      description: 'Supply/demand pressure in rental market',
    },
    {
      id: 'rent_historical_trends',
      name: 'RENT Historical Trends',
      description: 'Past rental price movements',
    },
  ]),

  /**
   * Forbidden RENT Displays
   */
  FORBIDDEN: Object.freeze([
    'rent_return_comparisons',
    'rent_yield_language',
    'rent_optimization_language',
    'rental_roi_calculations',
    'landlord_return_metrics',
    'rent_vs_buy_recommendations',
  ]),

  /**
   * Forbidden Labels
   */
  FORBIDDEN_LABELS: Object.freeze([
    'Rental Yield',
    'ROI on Rent',
    'Rental Returns',
    'Rental Investment',
    'Passive Income',
    'Cash Flow',
    'Cap Rate',
  ]),
});

// ============================================
// AI VISUAL OUTPUT RULES
// ============================================

export const AI_OUTPUT_RULES = Object.freeze({
  /**
   * When AI generates charts, summaries, or captions
   */
  REQUIREMENTS: Object.freeze([
    'Reference historical data only',
    'Display "Last updated" timestamp',
    'Include appropriate disclaimer',
    'Avoid action language',
    'No forward-looking statements',
    'No recommendations',
  ]),

  /**
   * Suppress and Log Conditions
   * If AI output contains any of these, SUPPRESS + LOG
   */
  SUPPRESS_CONDITIONS: Object.freeze([
    'suggests_action',
    'predicts_outcome',
    'recommends_purchase',
    'recommends_sale',
    'forecasts_price',
    'advises_timing',
    'ranks_areas',
    'guarantees_returns',
  ]),

  /**
   * AI Output Labels (required)
   */
  REQUIRED_LABELS: Object.freeze({
    ai_generated: 'AI-Generated Summary',
    last_updated: 'Data as of: {date}',
    disclaimer: 'Historical and descriptive analysis only. Not investment advice.',
  }),

  /**
   * Validation Function
   */
  VALIDATION_CHECKS: Object.freeze([
    'Contains only historical references',
    'No future tense predictions',
    'No imperative language',
    'No superlatives (best, worst, etc.)',
    'No urgency indicators',
  ]),
});

// ============================================
// DISCLAIMER PLACEMENT RULES
// ============================================

export const DISCLAIMER_RULES = Object.freeze({
  /**
   * Required Placements
   */
  REQUIRED_LOCATIONS: Object.freeze([
    'below_charts',
    'report_footers',
    'market_intelligence_pages',
    'ai_generated_summaries',
    'area_comparison_sections',
    'trend_analysis_sections',
  ]),

  /**
   * Standard Disclaimers
   */
  DISCLAIMERS: Object.freeze({
    short: 'Data shown is historical and descriptive, based on aggregated official sources.',
    chart: 'Source: Official UAE Open Data. Historical data for informational purposes only.',
    ai: 'AI-generated summary based on historical data. Not investment advice.',
    report: 'This report presents historical market data for informational purposes only. It does not constitute investment advice.',
    full: 'Market insights are based on aggregated official government Open Data and are provided for informational purposes only. JBJ GLOBAL REAL ESTATE is a private licensed brokerage and is not affiliated with or endorsed by any government authority.',
  }),

  /**
   * Styling Rules
   */
  STYLING: Object.freeze({
    position: 'Below content, clearly visible',
    typography: 'Smaller font, muted color',
    spacing: 'Adequate whitespace separation',
  }),
});

// ============================================
// INTERNAL VS PUBLIC DESIGN SEPARATION
// ============================================

export const DESIGN_SEPARATION = Object.freeze({
  /**
   * Public UI Characteristics
   */
  PUBLIC_UI: Object.freeze({
    style: 'Clean, Editorial, Neutral, Minimal',
    elements: Object.freeze([
      'Simple trend charts',
      'Clear typography',
      'Generous whitespace',
      'Muted colors',
      'No action prompts',
    ]),
    forbidden: Object.freeze([
      'Dense data tables',
      'Performance metrics',
      'Conversion data',
      'Internal KPIs',
    ]),
  }),

  /**
   * Internal UI Characteristics
   */
  INTERNAL_UI: Object.freeze({
    style: 'Analytical, Dense, Signal-rich, Tactical',
    elements: Object.freeze([
      'Detailed data tables',
      'Performance dashboards',
      'Conversion metrics',
      'Lead analytics',
      'ROI calculations',
    ]),
    note: 'Internal visuals must NEVER appear on public pages',
  }),

  /**
   * Separation Rule
   */
  RULE: 'Never reuse internal visuals publicly.',
});

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Check if a metric is allowed for public display
 */
export function isMetricAllowed(metricId: string): boolean {
  const allAllowed = [
    ...ALLOWED_METRICS.MARKET_LEVEL.map(m => m.id),
    ...ALLOWED_METRICS.AREA_LEVEL.map(m => m.id),
  ];
  return allAllowed.includes(metricId);
}

/**
 * Check if a metric is forbidden for public display
 */
export function isMetricForbidden(metricId: string): boolean {
  return FORBIDDEN_METRICS.NEVER_DISPLAY_PUBLICLY.includes(metricId as never);
}

/**
 * Check if a chart type is allowed
 */
export function isChartTypeAllowed(chartType: string): boolean {
  return CHART_RULES.ALLOWED.some(c => c.type === chartType);
}

/**
 * Validate text for forbidden language
 */
export function validateLanguage(text: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();
  
  LANGUAGE_RULES.FORBIDDEN_PHRASES.forEach(phrase => {
    if (lowerText.includes(phrase.toLowerCase())) {
      violations.push(phrase);
    }
  });
  
  return { valid: violations.length === 0, violations };
}

/**
 * Validate RENT-related content
 */
export function validateRentContent(text: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();
  
  RENT_DISPLAY_RULES.FORBIDDEN_LABELS.forEach(label => {
    if (lowerText.includes(label.toLowerCase())) {
      violations.push(label);
    }
  });
  
  return { valid: violations.length === 0, violations };
}

/**
 * Get appropriate disclaimer for context
 */
export function getDisclaimer(type: 'short' | 'chart' | 'ai' | 'report' | 'full'): string {
  return DISCLAIMER_RULES.DISCLAIMERS[type] || DISCLAIMER_RULES.DISCLAIMERS.short;
}

/**
 * Check if AI output should be suppressed
 */
export function shouldSuppressAIOutput(output: string): { suppress: boolean; reason?: string } {
  const lowerOutput = output.toLowerCase();
  
  // Check for action language
  const actionPhrases = ['you should', 'we recommend', 'buy now', 'act now', 'best time to'];
  for (const phrase of actionPhrases) {
    if (lowerOutput.includes(phrase)) {
      return { suppress: true, reason: `Contains action language: "${phrase}"` };
    }
  }
  
  // Check for predictions
  const predictionPhrases = ['will increase', 'will decrease', 'expected to', 'forecast'];
  for (const phrase of predictionPhrases) {
    if (lowerOutput.includes(phrase)) {
      return { suppress: true, reason: `Contains prediction: "${phrase}"` };
    }
  }
  
  return { suppress: false };
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  ALLOWED_METRICS,
  FORBIDDEN_METRICS,
  CHART_RULES,
  LANGUAGE_RULES,
  RENT_DISPLAY_RULES,
  AI_OUTPUT_RULES,
  DISCLAIMER_RULES,
  DESIGN_SEPARATION,
  // Utilities
  isMetricAllowed,
  isMetricForbidden,
  isChartTypeAllowed,
  validateLanguage,
  validateRentContent,
  getDisclaimer,
  shouldSuppressAIOutput,
};
