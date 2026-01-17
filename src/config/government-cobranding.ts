/**
 * GOVERNMENT CO-BRANDING STRATEGY
 * Foundation Layer for Institutional Legitimacy
 * 
 * Status: Government-Compatible, NOT Government-Owned
 */

// ============================================
// OFFICIAL POSTURE
// ============================================

export const GOVERNMENT_POSTURE = Object.freeze({
  OFFICIAL_STATEMENT: 'A licensed private real estate brokerage using aggregated official Open Data for descriptive market intelligence and transparency.',
  
  // Key positioning words (USE THESE)
  APPROVED_TERMS: Object.freeze([
    'Private',
    'Aggregated',
    'Descriptive',
    'Transparency',
    'Informational',
    'Licensed brokerage',
  ]),
  
  // Forbidden positioning words (NEVER USE)
  FORBIDDEN_TERMS: Object.freeze([
    'Predictive',
    'Advisory',
    'Official',
    'Regulatory',
    'Government-endorsed',
    'Authorized by',
  ]),
});

// ============================================
// APPROVED DATA SOURCES (UAE-FIRST)
// ============================================

export const APPROVED_DATA_SOURCES = Object.freeze([
  {
    id: 'dld',
    name: 'Dubai Land Department',
    shortName: 'DLD',
    dataType: 'Transaction statistics',
    website: 'https://dubailand.gov.ae',
    usage: 'Aggregated transaction volumes and trends',
    restrictions: ['No raw data redistribution', 'Cite source always'],
  },
  {
    id: 'uae_open_data',
    name: 'UAE Open Data Portal',
    shortName: 'UAE Open Data',
    dataType: 'Public datasets',
    website: 'https://opendata.fcsc.gov.ae',
    usage: 'Population, demographics, economic indicators',
    restrictions: ['Attribution required', 'Descriptive use only'],
  },
  {
    id: 'scad',
    name: 'Statistics Centre Abu Dhabi',
    shortName: 'SCAD',
    dataType: 'Population & housing statistics',
    website: 'https://www.scad.gov.ae',
    usage: 'Demographic context and housing data',
    restrictions: ['No commercial redistribution', 'Aggregate only'],
  },
  {
    id: 'dsc',
    name: 'Dubai Statistics Center',
    shortName: 'DSC',
    dataType: 'Economic and social statistics',
    website: 'https://www.dsc.gov.ae',
    usage: 'Market context and population trends',
    restrictions: ['Citation required', 'Descriptive interpretation'],
  },
  {
    id: 'rera',
    name: 'Real Estate Regulatory Authority',
    shortName: 'RERA',
    dataType: 'Rental index references',
    website: 'https://www.dubailand.gov.ae/en/rera',
    usage: 'High-level rental index context',
    restrictions: ['Reference only', 'No price guidance claims'],
  },
  {
    id: 'upc',
    name: 'Urban Planning Council',
    shortName: 'UPC',
    dataType: 'Planning & zoning public data',
    website: 'https://www.upc.gov.ae',
    usage: 'Development context and area planning',
    restrictions: ['Public information only', 'No internal documents'],
  },
]);

// ============================================
// USAGE PERMISSIONS
// ============================================

export const DATA_USAGE_RULES = Object.freeze({
  // Where government data references ARE allowed
  ALLOWED_LOCATIONS: Object.freeze([
    'market_intelligence_pages',
    'methodology_pages',
    'market_reports',
    'media_facing_insights',
    'educational_explanations',
    'area_context_sections',
  ]),
  
  // Where government data references are NOT allowed
  FORBIDDEN_LOCATIONS: Object.freeze([
    'property_listings',
    'calls_to_action',
    'pricing_suggestions',
    'broker_pitches',
    'ai_chat_selling_language',
    'promotional_content',
  ]),
  
  // Data handling rules
  RULES: Object.freeze([
    'Cite, do not copy raw datasets',
    'Aggregate, do not redistribute',
    'Interpret descriptively, not instructively',
    'Always include last updated timestamp',
    'Never imply official endorsement',
  ]),
});

// ============================================
// MANDATORY DISCLOSURES
// ============================================

export const GOVERNMENT_DISCLOSURES = Object.freeze({
  // Primary disclosure (REQUIRED on all government data pages)
  PRIMARY: 'Market insights are based on aggregated official government Open Data and are provided for informational purposes only. JBJ GLOBAL REAL ESTATE is a private licensed brokerage and is not affiliated with or endorsed by any government authority.',
  
  // Short disclosure (for footnotes)
  SHORT: 'Data sourced from official UAE government Open Data portals. Provided for informational purposes only.',
  
  // AI + Government data disclosure
  AI_COMBINED: 'This content uses aggregated official Open Data processed by AI systems for descriptive market intelligence. It does not constitute advice and is not endorsed by any government authority.',
  
  // Report disclaimer
  REPORT: 'This report is prepared by JBJ GLOBAL REAL ESTATE, a private licensed brokerage. Data is aggregated from official government Open Data sources for informational purposes. This publication is not affiliated with or endorsed by any government authority.',
});

// ============================================
// VISUAL & UX RULES
// ============================================

export const VISUAL_RULES = Object.freeze({
  // Forbidden visual elements
  FORBIDDEN: Object.freeze([
    'Government logos (unless explicitly permitted)',
    'National flags',
    'Government seals',
    'Official emblems',
    'Any imagery suggesting government affiliation',
  ]),
  
  // Required visual elements
  REQUIRED: Object.freeze([
    'Neutral, professional charts',
    'Clear source footnotes',
    'Last updated timestamps',
    'Private brokerage branding only',
    'Attribution links to source websites',
  ]),
  
  // Chart styling guidelines
  CHART_GUIDELINES: Object.freeze({
    colors: 'Use brand colors, not government colors',
    style: 'Professional, editorial presentation',
    sources: 'Always show "Source: [Name]" below charts',
    dates: 'Include "Data as of: [Date]" on all visualizations',
  }),
});

// ============================================
// COMPLIANCE STATUS
// ============================================

export const COMPLIANCE_STATUS = Object.freeze({
  READY_FOR: Object.freeze([
    'Media citations',
    'Bank references',
    'Government entity review',
    'Institutional partnerships',
    'International expansion',
  ]),
  
  PROTECTED_AGAINST: Object.freeze([
    'Regulatory risk at scale',
    'Misrepresentation claims',
    'Government entity concerns',
    'Advisory liability',
    'Unauthorized use claims',
  ]),
});

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Check if a location is allowed for government data display
 */
export function isAllowedLocation(location: string): boolean {
  return DATA_USAGE_RULES.ALLOWED_LOCATIONS.includes(location as never);
}

/**
 * Check if a location is forbidden for government data display
 */
export function isForbiddenLocation(location: string): boolean {
  return DATA_USAGE_RULES.FORBIDDEN_LOCATIONS.includes(location as never);
}

/**
 * Get appropriate disclosure for context
 */
export function getDisclosure(type: 'primary' | 'short' | 'ai' | 'report'): string {
  switch (type) {
    case 'primary':
      return GOVERNMENT_DISCLOSURES.PRIMARY;
    case 'short':
      return GOVERNMENT_DISCLOSURES.SHORT;
    case 'ai':
      return GOVERNMENT_DISCLOSURES.AI_COMBINED;
    case 'report':
      return GOVERNMENT_DISCLOSURES.REPORT;
    default:
      return GOVERNMENT_DISCLOSURES.PRIMARY;
  }
}

/**
 * Get data source by ID
 */
export function getDataSource(id: string) {
  return APPROVED_DATA_SOURCES.find(source => source.id === id);
}

/**
 * Validate content doesn't contain forbidden positioning terms
 */
export function validatePositioning(content: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const lowerContent = content.toLowerCase();
  
  GOVERNMENT_POSTURE.FORBIDDEN_TERMS.forEach(term => {
    if (lowerContent.includes(term.toLowerCase())) {
      violations.push(term);
    }
  });
  
  return { valid: violations.length === 0, violations };
}

export default {
  POSTURE: GOVERNMENT_POSTURE,
  DATA_SOURCES: APPROVED_DATA_SOURCES,
  USAGE_RULES: DATA_USAGE_RULES,
  DISCLOSURES: GOVERNMENT_DISCLOSURES,
  VISUAL_RULES,
  COMPLIANCE_STATUS,
};
