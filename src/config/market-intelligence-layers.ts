/**
 * JBJ GLOBAL REAL ESTATE — Market Intelligence Layer Separation
 * 
 * PRIORITY 4 — PART 4: PUBLIC vs INTERNAL MARKET INTELLIGENCE
 * 
 * Brand: JBJ GLOBAL REAL ESTATE
 * Core Activities: BUY · SELL · RENT
 * 
 * CRITICAL RULES:
 * - Public and Internal layers are logically & permission-isolated
 * - They NEVER share write access
 * - They NEVER expose the same depth of data
 * - Compliance firewall enforced at all times
 */

import type { DataRoomAccessRole } from '@/types/data-rooms';

// ============================================================================
// MARKET INTELLIGENCE LAYER IDENTIFIERS
// ============================================================================

export type MarketIntelligenceLayer = 'public' | 'internal';

// ============================================================================
// CONTENT TYPE DEFINITIONS
// ============================================================================

export type PublicContentType = 
  | 'market_snapshot'
  | 'price_range_historical'
  | 'supply_demand_indicator'
  | 'trend_historical'
  | 'methodology_summary'
  | 'data_source_attribution';

export type InternalContentType = 
  | 'full_dataset'
  | 'source_weighting'
  | 'confidence_scoring'
  | 'comparative_analytics'
  | 'internal_commentary'
  | 'jurisdiction_risk_notes';

// ============================================================================
// PUBLIC MARKET INTELLIGENCE LAYER
// ============================================================================

export const PUBLIC_MARKET_INTELLIGENCE = {
  LAYER_ID: 'public',
  NAME: 'Public Market Intelligence',
  DESCRIPTION: 'Public-facing authority without regulatory exposure. Informational only.',
  
  // PURPOSE
  PURPOSE: 'Public-facing authority without regulatory exposure',
  
  // ALLOWED CONTENT (EXHAUSTIVE LIST)
  ALLOWED_CONTENT: [
    'market_snapshot',
    'price_range_historical',
    'supply_demand_indicator',
    'trend_historical',
    'methodology_summary',
    'data_source_attribution',
  ] as PublicContentType[],
  
  ALLOWED_CONTENT_DESCRIPTIONS: {
    market_snapshot: 'High-level market overview with current state description',
    price_range_historical: 'Descriptive, historical price ranges only',
    supply_demand_indicator: 'Descriptive supply/demand indicators (past & present)',
    trend_historical: 'High-level trends (past & present only)',
    methodology_summary: 'Plain language methodology explanation',
    data_source_attribution: 'Attribution to public/open data sources',
  },
  
  // FORBIDDEN CONTENT (ABSOLUTE)
  FORBIDDEN_CONTENT: [
    'recommendations',
    'predictions',
    'forecasts',
    'investment_advice',
    'yield_promises',
    'best_time_to_buy_sell',
    'government_affiliation_claims',
    'roi_calculations',
    'future_price_projections',
    'financial_advice',
  ],
  
  FORBIDDEN_PHRASES: [
    'We recommend',
    'You should buy',
    'You should sell',
    'Best time to',
    'Expected to rise',
    'Expected to fall',
    'Will increase',
    'Will decrease',
    'Guaranteed return',
    'Investment opportunity',
    'High yield',
    'ROI of',
    'Official government',
    'Regulatory authority',
    'Government approved',
  ],
  
  // ACCESS RULES
  ACCESS: {
    visibility: 'public_or_logged_in',
    read_access: true,
    write_access: false,
    export_access: false,
  },
  
  // DATA DEPTH
  DATA_DEPTH: 'high_level_only',
  GRANULARITY: 'aggregated',
} as const;

// ============================================================================
// INTERNAL MARKET INTELLIGENCE LAYER
// ============================================================================

export const INTERNAL_MARKET_INTELLIGENCE = {
  LAYER_ID: 'internal',
  NAME: 'Internal Market Intelligence',
  DESCRIPTION: 'Decision support for JBJ GLOBAL REAL ESTATE leadership. Confidential.',
  
  // PURPOSE
  PURPOSE: 'Decision support for JBJ GLOBAL REAL ESTATE leadership',
  
  // ALLOWED CONTENT (COMPREHENSIVE)
  ALLOWED_CONTENT: [
    'full_dataset',
    'source_weighting',
    'confidence_scoring',
    'comparative_analytics',
    'internal_commentary',
    'jurisdiction_risk_notes',
  ] as InternalContentType[],
  
  ALLOWED_CONTENT_DESCRIPTIONS: {
    full_dataset: 'Complete datasets with full granularity',
    source_weighting: 'Data source reliability and weighting scores',
    confidence_scoring: 'Confidence levels for data points',
    comparative_analytics: 'Cross-market and cross-period comparisons',
    internal_commentary: 'Leadership notes and strategic observations',
    jurisdiction_risk_notes: 'Country/jurisdiction-specific risk assessments',
  },
  
  // ACCESS RULES (ROLE-BASED)
  ACCESS_BY_ROLE: {
    owner_founder: 'full_access',
    executive: 'read_only',
    investor: 'no_access',
    partner: 'no_access',
    internal_staff: 'no_access',
  } as Record<DataRoomAccessRole, 'full_access' | 'read_only' | 'no_access'>,
  
  // DATA DEPTH
  DATA_DEPTH: 'full_granularity',
  GRANULARITY: 'detailed',
} as const;

// ============================================================================
// LAYER SEPARATION RULES (NON-NEGOTIABLE)
// ============================================================================

export const LAYER_SEPARATION_RULES = {
  // Isolation
  LOGICALLY_ISOLATED: true,
  PERMISSION_ISOLATED: true,
  
  // Write access
  SHARED_WRITE_ACCESS: false, // NEVER share write access
  PUBLIC_WRITE_ACCESS: false,
  INTERNAL_WRITE_BY_OWNER_ONLY: true,
  
  // Data exposure
  SAME_DATA_DEPTH_EXPOSURE: false, // NEVER expose same depth
  PUBLIC_DATA_AGGREGATED: true,
  INTERNAL_DATA_GRANULAR: true,
  
  // Cross-layer rules
  PUBLIC_TO_INTERNAL_SYNC: false, // No sync from public to internal
  INTERNAL_TO_PUBLIC_SYNC: false, // No direct sync from internal to public
  MANUAL_PUBLICATION_REQUIRED: true, // Content must be manually published to public
} as const;

// ============================================================================
// COMPLIANCE FIREWALL (CRITICAL)
// ============================================================================

export const COMPLIANCE_FIREWALL = {
  // SAFEGUARD 1: No advisory content
  NO_ADVISORY_CONTENT: {
    ENABLED: true,
    RULE: 'No Market Intelligence content may sound advisory',
    FORBIDDEN_PATTERNS: [
      /\b(recommend|advise|suggest|should)\b/i,
      /\b(buy now|sell now|act now)\b/i,
      /\b(best time to|right time to)\b/i,
    ],
  },
  
  // SAFEGUARD 2: No predictive content
  NO_PREDICTIVE_CONTENT: {
    ENABLED: true,
    RULE: 'No Market Intelligence content may sound predictive',
    FORBIDDEN_PATTERNS: [
      /\b(will rise|will fall|will increase|will decrease)\b/i,
      /\b(expected to|projected to|forecast|prediction)\b/i,
      /\b(future price|price target|by 202\d)\b/i,
    ],
  },
  
  // SAFEGUARD 3: No governmental claims
  NO_GOVERNMENTAL_CLAIMS: {
    ENABLED: true,
    RULE: 'No Market Intelligence content may sound governmental',
    FORBIDDEN_PATTERNS: [
      /\b(official|government|regulatory authority)\b/i,
      /\b(ministry|department of|bureau of)\b/i,
      /\b(approved by|endorsed by|certified by)\b/i,
    ],
  },
  
  // SAFEGUARD 4: No regulatory authority implications
  NO_REGULATORY_AUTHORITY: {
    ENABLED: true,
    RULE: 'No content may imply regulatory authority',
    FORBIDDEN_PATTERNS: [
      /\b(we regulate|we authorize|we certify)\b/i,
      /\b(licensed by us|approved by us)\b/i,
    ],
  },
} as const;

// ============================================================================
// MANDATORY DISCLAIMERS
// ============================================================================

export const MANDATORY_DISCLAIMERS = {
  // Disclaimer 1: Informational only
  INFORMATIONAL_ONLY: {
    ID: 'disclaimer_informational',
    TEXT: 'Market Intelligence is provided for informational purposes only and does not constitute financial, investment, or legal advice.',
    REQUIRED_ON: ['public', 'internal'] as MarketIntelligenceLayer[],
    PLACEMENT: 'footer',
  },
  
  // Disclaimer 2: Private brokerage
  PRIVATE_BROKERAGE: {
    ID: 'disclaimer_private',
    TEXT: 'JBJ GLOBAL REAL ESTATE is a private real estate brokerage. We are not affiliated with any government authority or regulatory body.',
    REQUIRED_ON: ['public'] as MarketIntelligenceLayer[],
    PLACEMENT: 'footer',
  },
  
  // Disclaimer 3: Data sources
  DATA_SOURCES: {
    ID: 'disclaimer_sources',
    TEXT: 'Data is compiled from publicly available open sources and official government Open Data platforms. JBJ GLOBAL REAL ESTATE does not guarantee the accuracy or completeness of this information.',
    REQUIRED_ON: ['public'] as MarketIntelligenceLayer[],
    PLACEMENT: 'methodology_section',
  },
  
  // Disclaimer 4: Historical data
  HISTORICAL_DATA: {
    ID: 'disclaimer_historical',
    TEXT: 'All market data represents historical information. Past performance is not indicative of future results.',
    REQUIRED_ON: ['public'] as MarketIntelligenceLayer[],
    PLACEMENT: 'charts_and_data',
  },
} as const;

// ============================================================================
// AI SYSTEM RULES
// ============================================================================

export const AI_MARKET_INTELLIGENCE_RULES = {
  // Descriptive language only
  DESCRIPTIVE_LANGUAGE_REQUIRED: true,
  PREDICTIVE_LANGUAGE_FORBIDDEN: true,
  ADVISORY_LANGUAGE_FORBIDDEN: true,
  
  // AI output constraints
  AI_MUST: [
    'Use descriptive language only',
    'Reference historical data explicitly',
    'Avoid advice or predictions',
    'Adapt tone per jurisdiction rules',
    'Include appropriate disclaimers',
  ],
  
  AI_MUST_NOT: [
    'Provide investment advice',
    'Make price predictions',
    'Recommend buy/sell actions',
    'Claim governmental authority',
    'Promise returns or yields',
  ],
  
  // Jurisdiction adaptation
  ADAPT_TO_JURISDICTION: true,
  JURISDICTION_RULES: {
    UAE: {
      regulator: 'RERA',
      strict_mode: true,
      extra_disclaimers: true,
    },
    DEFAULT: {
      strict_mode: true,
      extra_disclaimers: false,
    },
  },
} as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate content against compliance firewall
 */
export function validateContentCompliance(content: string): {
  compliant: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // Check advisory patterns
  for (const pattern of COMPLIANCE_FIREWALL.NO_ADVISORY_CONTENT.FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      violations.push(`Advisory content detected: ${pattern.source}`);
    }
  }
  
  // Check predictive patterns
  for (const pattern of COMPLIANCE_FIREWALL.NO_PREDICTIVE_CONTENT.FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      violations.push(`Predictive content detected: ${pattern.source}`);
    }
  }
  
  // Check governmental patterns
  for (const pattern of COMPLIANCE_FIREWALL.NO_GOVERNMENTAL_CLAIMS.FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      violations.push(`Governmental claim detected: ${pattern.source}`);
    }
  }
  
  return {
    compliant: violations.length === 0,
    violations,
  };
}

/**
 * Check if content type is allowed in public layer
 */
export function isAllowedInPublicLayer(contentType: string): boolean {
  return PUBLIC_MARKET_INTELLIGENCE.ALLOWED_CONTENT.includes(contentType as PublicContentType);
}

/**
 * Check if role has access to internal layer
 */
export function hasInternalLayerAccess(role: DataRoomAccessRole): boolean {
  const access = INTERNAL_MARKET_INTELLIGENCE.ACCESS_BY_ROLE[role];
  return access !== 'no_access';
}

/**
 * Get access level for role in internal layer
 */
export function getInternalLayerAccess(role: DataRoomAccessRole): 'full_access' | 'read_only' | 'no_access' {
  return INTERNAL_MARKET_INTELLIGENCE.ACCESS_BY_ROLE[role];
}

/**
 * Validate layers are properly separated
 */
export function validateLayerSeparation(): boolean {
  return (
    LAYER_SEPARATION_RULES.LOGICALLY_ISOLATED === true &&
    LAYER_SEPARATION_RULES.PERMISSION_ISOLATED === true &&
    LAYER_SEPARATION_RULES.SHARED_WRITE_ACCESS === false &&
    LAYER_SEPARATION_RULES.SAME_DATA_DEPTH_EXPOSURE === false
  );
}

// ============================================================================
// MASTER EXPORT
// ============================================================================

export const MARKET_INTELLIGENCE_LAYERS = {
  PUBLIC: PUBLIC_MARKET_INTELLIGENCE,
  INTERNAL: INTERNAL_MARKET_INTELLIGENCE,
  SEPARATION_RULES: LAYER_SEPARATION_RULES,
  COMPLIANCE_FIREWALL,
  MANDATORY_DISCLAIMERS,
  AI_RULES: AI_MARKET_INTELLIGENCE_RULES,
} as const;

// ============================================================================
// PRIORITY 4 — PART 4 STATUS
// ============================================================================

export const MARKET_INTELLIGENCE_LAYERS_STATUS = {
  PRIORITY: 'PRIORITY 4 — PART 4',
  STATUS: 'COMPLETE',
  VERSION: '1.0.0',
  
  LAYERS_SEPARATED: {
    PUBLIC_LAYER: true,
    INTERNAL_LAYER: true,
    LOGICALLY_ISOLATED: true,
    PERMISSION_ISOLATED: true,
    NEVER_SHARED_WRITE: true,
    NEVER_SAME_DATA_DEPTH: true,
  },
  
  PUBLIC_LAYER_CONTENT: {
    ALLOWED: [
      'Market snapshots',
      'Price ranges (historical)',
      'Supply/demand indicators (descriptive)',
      'High-level trends (past & present)',
      'Methodology summary',
      'Data source attribution',
    ],
    FORBIDDEN: [
      'Recommendations',
      'Predictions',
      'Forecasts',
      'Investment advice',
      'Yield promises',
      'Best time to buy/sell',
      'Government affiliation claims',
    ],
    ACCESS: 'Public or logged-in, read-only, no export',
  },
  
  INTERNAL_LAYER_ACCESS: {
    owner_founder: 'full_access',
    executive: 'read_only',
    investor: 'no_access',
    partner: 'no_access',
    internal_staff: 'no_access',
  },
  
  COMPLIANCE_FIREWALL_ENFORCED: {
    NO_ADVISORY_CONTENT: true,
    NO_PREDICTIVE_CONTENT: true,
    NO_GOVERNMENTAL_CLAIMS: true,
    NO_REGULATORY_AUTHORITY: true,
    MANDATORY_DISCLAIMERS: true,
    AI_DESCRIPTIVE_ONLY: true,
  },
  
  BRAND_COMPLIANCE: {
    COMPANY_NAME: 'JBJ GLOBAL REAL ESTATE',
    CORE_ACTIVITIES: 'BUY · SELL · RENT',
    FORBIDDEN_TERMS: ['leasing', 'Lease'],
  },
  
  FILES_CREATED: [
    'src/config/market-intelligence-layers.ts',
  ],
  
  NOT_IMPLEMENTED: [
    'UI changes',
    'New routes',
    'New pages',
    'Content population',
    'Exports',
  ],
} as const;
