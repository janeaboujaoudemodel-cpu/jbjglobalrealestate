/**
 * TRUST & ADVISORY AUTHORITY LAYER
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Positions the company as a LICENSED, ADVISORY-LED REAL ESTATE BROKERAGE.
 * This is PUBLIC-FACING and TRUST-BUILDING.
 */

// ============================================================
// AUTHORITY POSITIONING (LOCKED)
// ============================================================

export const AUTHORITY_POSITIONING = {
  identity: {
    type: 'LICENSED_REAL_ESTATE_BROKERAGE',
    approach: 'ADVISORY_LED',
    foundation: 'MARKET_INTELLIGENCE_DRIVEN',
    philosophy: 'CLIENT_EDUCATION_FIRST',
  },

  brand: {
    name: 'JBJ GLOBAL REAL ESTATE',
    core_activities: 'BUY · SELL · RENT',
    prohibited_terms: ['leasing', 'lease', 'Lease', 'LEASE'],
  },

  /**
   * WHAT THE COMPANY DOES
   */
  capabilities: {
    advise_clients: {
      enabled: true,
      scope: ['BUY', 'SELL', 'RENT'],
      description: 'Advise clients on BUY · SELL · RENT decisions',
    },
    produce_market_reports: {
      enabled: true,
      description: 'Produce market reports and area intelligence',
    },
    analyze_trends: {
      enabled: true,
      data_sources: ['historical', 'current'],
      description: 'Analyze trends using historical and current data',
    },
    explain_government_plans: {
      enabled: true,
      topics: ['zoning', 'infrastructure', 'vision', 'master_planning'],
      description: 'Explain government plans, zoning, infrastructure, and vision',
    },
    guide_client_journey: {
      enabled: true,
      description: 'Guide clients step by step through the real estate journey',
    },
    interpret_public_data: {
      enabled: true,
      description: 'Interpret public and government-published data professionally',
    },
  },

  /**
   * WHAT THE COMPANY DOES NOT DO (STRICT BOUNDARIES)
   */
  restrictions: {
    guarantee_returns: {
      prohibited: true,
      reason: 'Cannot guarantee investment returns',
    },
    offer_financial_products: {
      prohibited: true,
      reason: 'Not a financial institution',
    },
    act_as_investment_fund: {
      prohibited: true,
      reason: 'Not an investment fund or bank',
    },
    replace_financial_advisors: {
      prohibited: true,
      reason: 'Cannot replace licensed financial advisors where required',
    },
    impersonate_regulators: {
      prohibited: true,
      reason: 'Cannot impersonate regulators or government bodies',
    },
  },
} as const;

// ============================================================
// TRUST & ADVISORY CONTENT CATEGORIES (MANDATORY)
// ============================================================

export type AdvisoryCategory = 
  | 'brokerage_advisory_authority'
  | 'market_intelligence_research'
  | 'government_data_interpretation'
  | 'governance_client_protection';

export const ADVISORY_CATEGORIES: Record<AdvisoryCategory, {
  id: AdvisoryCategory;
  name: string;
  description: string;
  scope: string[];
  boundaries: string[];
}> = {
  /**
   * CATEGORY 1: BROKERAGE ADVISORY AUTHORITY
   */
  brokerage_advisory_authority: {
    id: 'brokerage_advisory_authority',
    name: 'Brokerage Advisory Authority',
    description: 'Core advisory role in real estate transactions',
    scope: [
      'Explanation of advisory role',
      'Client guidance methodology',
      'BUY · SELL · RENT process education',
      'Risk-aware decision support',
    ],
    boundaries: [
      'Advisory within licensed brokerage scope only',
      'No financial product recommendations',
      'No investment guarantees',
    ],
  },

  /**
   * CATEGORY 2: MARKET INTELLIGENCE & RESEARCH
   */
  market_intelligence_research: {
    id: 'market_intelligence_research',
    name: 'Market Intelligence & Research',
    description: 'Data-driven market analysis and insights',
    scope: [
      'Historical market cycles',
      'Supply / demand analysis',
      'Area-by-area insights',
      'Trend discussions based on data',
      'Scenario-based outlooks (not guarantees)',
    ],
    boundaries: [
      'Historical and current data only',
      'No future predictions presented as facts',
      'No ROI or yield promises',
    ],
  },

  /**
   * CATEGORY 3: GOVERNMENT & OPEN DATA INTERPRETATION
   */
  government_data_interpretation: {
    id: 'government_data_interpretation',
    name: 'Government & Open Data Interpretation',
    description: 'Professional interpretation of public data sources',
    scope: [
      'Use of published government data',
      'Reference to initiatives (e.g. Agenda 33, infrastructure plans)',
      'Zoning, master planning, transport, airports',
      'Explanation of what data suggests — not promises',
    ],
    boundaries: [
      'Cannot claim official government endorsement',
      'Must attribute data sources',
      'Interpretation only, not official statements',
    ],
  },

  /**
   * CATEGORY 4: GOVERNANCE & CLIENT PROTECTION
   */
  governance_client_protection: {
    id: 'governance_client_protection',
    name: 'Governance & Client Protection',
    description: 'Regulatory compliance and client safeguards',
    scope: [
      'Licensing scope: BUY · SELL · RENT',
      'Conflict-of-interest controls',
      'Partner disclosure rules',
      'Clear advisory boundaries',
    ],
    boundaries: [
      'Transparent about service limitations',
      'Clear partner vs. brokerage distinction',
      'No hidden conflicts of interest',
    ],
  },
};

// No additional categories allowed - this is the complete set
export const ALLOWED_ADVISORY_CATEGORIES = Object.keys(ADVISORY_CATEGORIES) as AdvisoryCategory[];

// ============================================================
// VALIDATION
// ============================================================

export function isValidAdvisoryCategory(category: string): category is AdvisoryCategory {
  return ALLOWED_ADVISORY_CATEGORIES.includes(category as AdvisoryCategory);
}

export function getAdvisoryCategory(category: AdvisoryCategory) {
  return ADVISORY_CATEGORIES[category];
}

export function getAllAdvisoryCategories() {
  return Object.values(ADVISORY_CATEGORIES);
}

// ============================================================
// STATUS EXPORT
// ============================================================

export const ADVISORY_AUTHORITY_STATUS = {
  priority: 'P6-PART1',
  status: 'IMPLEMENTED',
  positioning: 'LICENSED_ADVISORY_LED_BROKERAGE',
  categories_defined: ALLOWED_ADVISORY_CATEGORIES.length,
  brand_compliance: {
    brand_name: 'JBJ GLOBAL REAL ESTATE',
    core_activities: 'BUY · SELL · RENT',
  },
} as const;
