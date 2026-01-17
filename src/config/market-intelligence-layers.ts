/**
 * JBJ GLOBAL REAL ESTATE — Market Intelligence Layer Separation
 * 
 * PRIORITY 4 — PART 4: PUBLIC vs INTERNAL MARKET INTELLIGENCE
 * PRIORITY 6 — PART 2: 4-TIER INTELLIGENCE STRUCTURE
 * 
 * Brand: JBJ GLOBAL REAL ESTATE
 * Core Activities: BUY · SELL · RENT
 * 
 * CRITICAL RULES:
 * - Public and Internal layers are logically & permission-isolated
 * - They NEVER share write access
 * - They NEVER expose the same depth of data
 * - Compliance firewall enforced at all times
 * - 4-tier access control: Public → Registered → Client → Internal
 */

import type { DataRoomAccessRole } from '@/types/data-rooms';

// ============================================================================
// BRAND CONSTANTS (LOCKED — PRIORITY 6)
// ============================================================================

export const BRAND_CONSTANTS = {
  COMPANY_NAME: 'JBJ GLOBAL REAL ESTATE',
  CORE_ACTIVITIES: 'BUY · SELL · RENT',
  FORBIDDEN_TERMS: ['leasing', 'lease', 'jbj', 'Jbj', 'JBj', 'jBJ'],
} as const;

// ============================================================================
// MARKET INTELLIGENCE LAYER IDENTIFIERS (LEGACY — PRIORITY 4)
// ============================================================================

export type MarketIntelligenceLayer = 'public' | 'internal';

// ============================================================================
// 4-TIER INTELLIGENCE STRUCTURE (PRIORITY 6 — PART 2)
// ============================================================================

export type IntelligenceTier = 
  | 'public'
  | 'registered_user'
  | 'client_only'
  | 'internal_strategic';

export type TierAccessLevel = 'open' | 'authenticated' | 'client' | 'admin_executive';

export interface IntelligenceTierDefinition {
  id: IntelligenceTier;
  name: string;
  purpose: string;
  access_level: TierAccessLevel;
  allowed_content: string[];
  forbidden_content: string[];
  access_rules: {
    requires_auth: boolean;
    requires_client_status: boolean;
    requires_admin_role: boolean;
    allowed_roles: DataRoomAccessRole[];
    broker_mediated: boolean;
    auditable: boolean;
  };
  data_exposure: {
    can_show_prices: boolean;
    can_show_yields: boolean;
    can_show_forecasts: boolean;
    can_show_deal_specific: boolean;
    can_show_internal_metrics: boolean;
    can_personalize: boolean;
  };
}

// ============================================================================
// TIER 1: PUBLIC MARKET INTELLIGENCE
// ============================================================================

export const PUBLIC_INTELLIGENCE: IntelligenceTierDefinition = {
  id: 'public',
  name: 'Public Market Intelligence',
  purpose: 'Trust-building, education, authority demonstration',
  access_level: 'open',
  
  allowed_content: [
    'market_overviews',
    'historical_price_movements_descriptive',
    'supply_demand_commentary',
    'area_profiles',
    'infrastructure_explanations',
    'master_plan_explanations',
    'government_initiatives_published',
    'market_cycle_education',
    'high_level_trend_discussion',
    'general_market_context',
    'educational_content',
  ],
  
  forbidden_content: [
    'forecasts_as_guarantees',
    'deal_specific_advice',
    'personalized_recommendations',
    'internal_metrics',
    'client_data',
    'pricing_models',
    'conversion_data',
    'partner_performance',
    'inventory_velocity',
    'lead_intelligence',
  ],
  
  access_rules: {
    requires_auth: false,
    requires_client_status: false,
    requires_admin_role: false,
    allowed_roles: ['viewer', 'prospect', 'broker', 'investor', 'developer_rep', 'executive', 'owner'],
    broker_mediated: false,
    auditable: false,
  },
  
  data_exposure: {
    can_show_prices: true, // Historical only, descriptive
    can_show_yields: false,
    can_show_forecasts: false,
    can_show_deal_specific: false,
    can_show_internal_metrics: false,
    can_personalize: false,
  },
};

// ============================================================================
// TIER 2: REGISTERED USER INTELLIGENCE
// ============================================================================

export const REGISTERED_USER_INTELLIGENCE: IntelligenceTierDefinition = {
  id: 'registered_user',
  name: 'Registered User Intelligence',
  purpose: 'Deeper engagement and lead qualification',
  access_level: 'authenticated',
  
  allowed_content: [
    ...PUBLIC_INTELLIGENCE.allowed_content,
    'extended_reports',
    'area_comparison_tables',
    'buyer_seller_market_context',
    'absorption_rate_explanations',
    'rental_yield_discussion_descriptive',
    'scenario_explanations_non_guaranteed',
    'market_timing_general',
    'investment_considerations_educational',
  ],
  
  forbidden_content: [
    'deal_specific_advice',
    'personalized_investment_recommendations',
    'internal_metrics',
    'pricing_models',
    'partner_performance',
    'lead_intelligence',
    'guaranteed_outcomes',
    'specific_roi_projections',
  ],
  
  access_rules: {
    requires_auth: true,
    requires_client_status: false,
    requires_admin_role: false,
    allowed_roles: ['prospect', 'broker', 'investor', 'developer_rep', 'executive', 'owner'],
    broker_mediated: false,
    auditable: true,
  },
  
  data_exposure: {
    can_show_prices: true,
    can_show_yields: true, // Descriptive only
    can_show_forecasts: false,
    can_show_deal_specific: false,
    can_show_internal_metrics: false,
    can_personalize: false,
  },
};

// ============================================================================
// TIER 3: CLIENT-ONLY ADVISORY INTELLIGENCE
// ============================================================================

export const CLIENT_ONLY_INTELLIGENCE: IntelligenceTierDefinition = {
  id: 'client_only',
  name: 'Client-Only Advisory Intelligence',
  purpose: 'Direct brokerage advisory support',
  access_level: 'client',
  
  allowed_content: [
    ...REGISTERED_USER_INTELLIGENCE.allowed_content,
    'deal_specific_analysis',
    'property_comparisons',
    'budget_alignment_discussions',
    'risk_considerations',
    'area_suitability_analysis',
    'buy_sell_rent_strategy_discussions',
    'personalized_market_context',
    'client_specific_scenarios',
    'negotiation_context',
  ],
  
  forbidden_content: [
    'internal_metrics',
    'pricing_models',
    'partner_performance',
    'lead_intelligence',
    'inventory_velocity',
    'conversion_rates',
    'company_strategy',
    'guaranteed_returns',
  ],
  
  access_rules: {
    requires_auth: true,
    requires_client_status: true,
    requires_admin_role: false,
    allowed_roles: ['investor', 'executive', 'owner'],
    broker_mediated: true,
    auditable: true,
  },
  
  data_exposure: {
    can_show_prices: true,
    can_show_yields: true,
    can_show_forecasts: false, // Still no guarantees
    can_show_deal_specific: true,
    can_show_internal_metrics: false,
    can_personalize: true,
  },
};

// ============================================================================
// TIER 4: INTERNAL STRATEGIC INTELLIGENCE (STRICT)
// ============================================================================

export const INTERNAL_STRATEGIC_INTELLIGENCE: IntelligenceTierDefinition = {
  id: 'internal_strategic',
  name: 'Internal Strategic Intelligence',
  purpose: 'Company strategy and decision-making',
  access_level: 'admin_executive',
  
  allowed_content: [
    ...CLIENT_ONLY_INTELLIGENCE.allowed_content,
    'internal_analytics',
    'pricing_sensitivity_models',
    'inventory_velocity',
    'partner_performance',
    'lead_conversion_intelligence',
    'market_timing_insights_internal',
    'competitive_analysis',
    'revenue_projections',
    'strategic_planning_data',
    'broker_performance_metrics',
    'campaign_effectiveness',
  ],
  
  forbidden_content: [
    'guaranteed_client_returns', // Even internally, we don't promise client outcomes
  ],
  
  access_rules: {
    requires_auth: true,
    requires_client_status: false,
    requires_admin_role: true,
    allowed_roles: ['executive', 'owner'],
    broker_mediated: false,
    auditable: true,
  },
  
  data_exposure: {
    can_show_prices: true,
    can_show_yields: true,
    can_show_forecasts: true, // Internal forecasting only
    can_show_deal_specific: true,
    can_show_internal_metrics: true,
    can_personalize: true,
  },
};

// ============================================================================
// TIER REGISTRY
// ============================================================================

export const INTELLIGENCE_TIERS: Record<IntelligenceTier, IntelligenceTierDefinition> = {
  public: PUBLIC_INTELLIGENCE,
  registered_user: REGISTERED_USER_INTELLIGENCE,
  client_only: CLIENT_ONLY_INTELLIGENCE,
  internal_strategic: INTERNAL_STRATEGIC_INTELLIGENCE,
};

// ============================================================================
// USER ACCESS CONTEXT (PRIORITY 6 — PART 2)
// ============================================================================

export interface UserAccessContext {
  is_authenticated: boolean;
  is_active_client: boolean;
  is_admin: boolean;
  is_executive: boolean;
  is_owner: boolean;
  role?: DataRoomAccessRole;
}

/**
 * Determines the maximum intelligence tier a user can access
 */
export function getMaxAccessibleTier(context: UserAccessContext): IntelligenceTier {
  // Owner/Executive = Internal Strategic
  if (context.is_owner || context.is_executive) {
    return 'internal_strategic';
  }
  
  // Admin without executive role = Client-Only (can assist clients)
  if (context.is_admin) {
    return 'client_only';
  }
  
  // Active client = Client-Only
  if (context.is_authenticated && context.is_active_client) {
    return 'client_only';
  }
  
  // Authenticated = Registered User
  if (context.is_authenticated) {
    return 'registered_user';
  }
  
  // Default = Public
  return 'public';
}

/**
 * Checks if a user can access a specific tier
 */
export function canAccessTier(
  context: UserAccessContext,
  requestedTier: IntelligenceTier
): boolean {
  const tierHierarchy: IntelligenceTier[] = [
    'public',
    'registered_user',
    'client_only',
    'internal_strategic',
  ];
  
  const maxTier = getMaxAccessibleTier(context);
  const maxIndex = tierHierarchy.indexOf(maxTier);
  const requestedIndex = tierHierarchy.indexOf(requestedTier);
  
  return requestedIndex <= maxIndex;
}

/**
 * Checks if specific content type is allowed in a tier
 */
export function isContentAllowedInTier(
  contentType: string,
  tier: IntelligenceTier
): boolean {
  const tierDef = INTELLIGENCE_TIERS[tier];
  
  // Check if explicitly forbidden
  if (tierDef.forbidden_content.includes(contentType)) {
    return false;
  }
  
  // Check if explicitly allowed
  return tierDef.allowed_content.includes(contentType);
}

/**
 * Gets the appropriate tier for a content type
 */
export function getMinimumTierForContent(contentType: string): IntelligenceTier | null {
  const tierOrder: IntelligenceTier[] = [
    'public',
    'registered_user',
    'client_only',
    'internal_strategic',
  ];
  
  for (const tier of tierOrder) {
    if (isContentAllowedInTier(contentType, tier)) {
      return tier;
    }
  }
  
  return null;
}

// ============================================================================
// TIER ISOLATION RULES (PRIORITY 6 — PART 2)
// ============================================================================

export const TIER_ISOLATION_RULES = {
  // Internal data NEVER flows to lower tiers
  internal_to_public: {
    allowed: false,
    reason: 'Internal strategic intelligence must NEVER be exposed publicly',
  },
  
  internal_to_registered: {
    allowed: false,
    reason: 'Internal strategic intelligence must NEVER be exposed to registered users',
  },
  
  internal_to_client: {
    allowed: false,
    reason: 'Internal strategic intelligence must NEVER be exposed to clients',
  },
  
  // Client data flows down only with explicit broker mediation
  client_to_public: {
    allowed: false,
    reason: 'Client-specific intelligence must NEVER be exposed publicly',
  },
  
  client_to_registered: {
    allowed: false,
    reason: 'Client-specific intelligence requires active client status',
  },
  
  // Registered content can inform public (generalized)
  registered_to_public: {
    allowed: true,
    condition: 'Must be generalized, no user-specific data',
  },
  
  // AI MUST respect these boundaries
  ai_cross_tier_combination: {
    allowed: false,
    reason: 'AI must NEVER combine internal + public data in one output',
  },
} as const;

// ============================================================================
// INTELLIGENCE ACCESS LOG (PRIORITY 6 — PART 2)
// ============================================================================

export interface IntelligenceAccessLog {
  timestamp: string;
  user_id: string | null;
  tier_accessed: IntelligenceTier;
  content_types: string[];
  access_granted: boolean;
  denial_reason?: string;
  ip_address?: string;
  user_agent?: string;
  broker_id?: string;
}

/**
 * Creates an access log entry
 */
export function createAccessLogEntry(
  userId: string | null,
  tier: IntelligenceTier,
  contentTypes: string[],
  granted: boolean,
  denialReason?: string
): IntelligenceAccessLog {
  return {
    timestamp: new Date().toISOString(),
    user_id: userId,
    tier_accessed: tier,
    content_types: contentTypes,
    access_granted: granted,
    denial_reason: denialReason,
  };
}

// ============================================================================
// AI TIER VALIDATION (PRIORITY 6 — PART 2)
// ============================================================================

export interface AITierContext {
  current_tier: IntelligenceTier;
  user_context: UserAccessContext;
  content_types_requested: string[];
}

export interface AITierValidation {
  is_valid: boolean;
  violations: string[];
  allowed_content: string[];
  blocked_content: string[];
  tier_used: IntelligenceTier;
}

/**
 * Validates AI output request against tier boundaries
 */
export function validateAITierRequest(context: AITierContext): AITierValidation {
  const violations: string[] = [];
  const allowed_content: string[] = [];
  const blocked_content: string[] = [];
  
  // Verify user can access requested tier
  if (!canAccessTier(context.user_context, context.current_tier)) {
    violations.push(`User cannot access tier: ${context.current_tier}`);
    return {
      is_valid: false,
      violations,
      allowed_content: [],
      blocked_content: context.content_types_requested,
      tier_used: getMaxAccessibleTier(context.user_context),
    };
  }
  
  // Check each content type
  for (const contentType of context.content_types_requested) {
    if (isContentAllowedInTier(contentType, context.current_tier)) {
      allowed_content.push(contentType);
    } else {
      blocked_content.push(contentType);
      violations.push(`Content type '${contentType}' not allowed in tier '${context.current_tier}'`);
    }
  }
  
  return {
    is_valid: violations.length === 0,
    violations,
    allowed_content,
    blocked_content,
    tier_used: context.current_tier,
  };
}

// ============================================================================
// CONTENT TYPE DEFINITIONS (LEGACY — PRIORITY 4)
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
// PUBLIC MARKET INTELLIGENCE LAYER (LEGACY — PRIORITY 4)
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
// INTERNAL MARKET INTELLIGENCE LAYER (LEGACY — PRIORITY 4)
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
    'Respect intelligence tier boundaries',
  ],
  
  AI_MUST_NOT: [
    'Provide investment advice',
    'Make price predictions',
    'Recommend buy/sell actions',
    'Claim governmental authority',
    'Promise returns or yields',
    'Combine internal + public data in one output',
    'Surface internal intelligence publicly',
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
// MARKET INTELLIGENCE PURPOSE (PRIORITY 6 — PART 2)
// ============================================================================

export const MARKET_INTELLIGENCE_PURPOSE = {
  exists_to: [
    'Support brokerage advisory',
    'Educate clients and investors',
    'Demonstrate authority and depth',
    `Enable better ${BRAND_CONSTANTS.CORE_ACTIVITIES} decisions`,
    'Support internal strategy and negotiations',
  ],
  
  must_never: [
    'Act as a regulator',
    'Act as a government portal',
    'Promise outcomes or returns',
    'Replace human brokerage advisory',
  ],
  
  brand_enforcement: {
    company_name: BRAND_CONSTANTS.COMPANY_NAME,
    core_activities: BRAND_CONSTANTS.CORE_ACTIVITIES,
    forbidden_terms: BRAND_CONSTANTS.FORBIDDEN_TERMS,
  },
} as const;

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
  // Priority 6 additions
  TIERS: INTELLIGENCE_TIERS,
  PURPOSE: MARKET_INTELLIGENCE_PURPOSE,
  BRAND: BRAND_CONSTANTS,
} as const;

// ============================================================================
// STATUS EXPORT
// ============================================================================

export const MARKET_INTELLIGENCE_LAYERS_STATUS = {
  PRIORITY: 'PRIORITY 6 — PART 2',
  STATUS: 'COMPLETE',
  VERSION: '2.0.0',
  
  FOUR_TIER_STRUCTURE: {
    tier_1_public: {
      name: 'Public Market Intelligence',
      purpose: 'Trust-building, education, authority',
      access: 'open',
    },
    tier_2_registered: {
      name: 'Registered User Intelligence',
      purpose: 'Deeper engagement and lead qualification',
      access: 'authenticated',
    },
    tier_3_client: {
      name: 'Client-Only Advisory Intelligence',
      purpose: 'Direct brokerage advisory support',
      access: 'client + broker_mediated',
    },
    tier_4_internal: {
      name: 'Internal Strategic Intelligence',
      purpose: 'Company strategy and decision-making',
      access: 'admin_executive',
    },
  },
  
  ACCESS_CONTROL: {
    rbac_enforced: true,
    tier_separation: true,
    privilege_escalation_blocked: true,
    api_exposure_controlled: true,
    ai_leakage_prevented: true,
  },
  
  AI_SAFEGUARDS: {
    tier_boundary_enforcement: true,
    cross_tier_combination_blocked: true,
    internal_never_public: true,
    client_data_protected: true,
  },
  
  BRAND_COMPLIANCE: {
    COMPANY_NAME: 'JBJ GLOBAL REAL ESTATE',
    CORE_ACTIVITIES: 'BUY · SELL · RENT',
    FORBIDDEN_TERMS: ['leasing', 'lease'],
  },
  
  FILES_MODIFIED: [
    'src/config/market-intelligence-layers.ts',
    'src/config/ai-intelligence-tier-enforcement.ts',
    'src/hooks/useIntelligenceTierAccess.ts',
  ],
} as const;
