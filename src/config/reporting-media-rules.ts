/**
 * GOVERNMENT-SAFE REPORTING & MEDIA CITATION RULES
 * PRIORITY 1 — STEP 4 (FINAL)
 * 
 * Purpose: Ensure everything published or said externally is safe, quotable, and institution-ready.
 * 
 * STATUS: LOCKED — Do not modify without explicit authorization
 * 
 * With this step complete, PRIORITY 1 (Government Co-Branding Strategy) is FULLY LOCKED.
 */

import { MASTER_LOCK } from './master-lock';

// ============================================
// REPORTING RULES (PUBLIC MARKET REPORTS)
// ============================================

export const REPORT_RULES = Object.freeze({
  /**
   * Report Types Covered
   */
  APPLIES_TO: Object.freeze([
    'monthly_briefs',
    'quarterly_reviews',
    'annual_summaries',
    'downloadable_pdfs',
    'market_update_pages',
    'area_reports',
    'trend_analyses',
  ]),

  /**
   * Mandatory Report Structure (LOCKED)
   * Every report MUST contain these sections in this order
   */
  REQUIRED_STRUCTURE: Object.freeze([
    {
      section: 'cover',
      requirement: 'Neutral, branded, date-stamped',
      mandatory: true,
    },
    {
      section: 'executive_summary',
      requirement: 'Descriptive only, no predictions',
      mandatory: true,
    },
    {
      section: 'market_context',
      requirement: 'Historical analysis only',
      mandatory: true,
    },
    {
      section: 'area_observations',
      requirement: 'Non-ranked, comparative only',
      mandatory: true,
    },
    {
      section: 'rent_trends',
      requirement: 'Directional, not yield-based',
      mandatory: true,
    },
    {
      section: 'methodology_reference',
      requirement: 'Link to /market-intelligence/methodology',
      mandatory: true,
    },
    {
      section: 'disclaimer_independence',
      requirement: 'Full independence statement',
      mandatory: true,
    },
  ]),

  /**
   * Report Metadata Requirements
   */
  METADATA_REQUIREMENTS: Object.freeze([
    'Publication date',
    'Data period covered',
    'Version number',
    'Author/Publisher attribution',
    'Methodology link',
  ]),

  /**
   * No Deviation Rule
   */
  RULE: 'No deviation from required structure permitted.',
});

// ============================================
// APPROVED REPORT LANGUAGE
// ============================================

export const REPORT_LANGUAGE = Object.freeze({
  /**
   * Allowed Phrasing (USE THESE)
   */
  ALLOWED: Object.freeze([
    'Data shows…',
    'Historical patterns indicate…',
    'Recent activity reflects…',
    'Observed behavior suggests…',
    'The market demonstrated…',
    'Transactions recorded…',
    'Historical comparison reveals…',
    'Past trends indicate…',
    'Analysis of historical data shows…',
    'Market activity during this period…',
  ]),

  /**
   * Forbidden Phrasing (NEVER USE)
   */
  FORBIDDEN: Object.freeze([
    'Expected to…',
    'Likely to increase…',
    'Likely to decrease…',
    'Best performing…',
    'Worst performing…',
    'Strong returns…',
    'Weak returns…',
    'Investors should…',
    'Buyers should…',
    'Sellers should…',
    'We recommend…',
    'We advise…',
    'Opportunity to…',
    'Now is the time…',
    'Don\'t miss…',
    'Act quickly…',
    'Market will…',
    'Prices will…',
  ]),

  /**
   * Core Rule
   */
  RULE: 'If it sounds like advice, it is forbidden.',
});

// ============================================
// MEDIA QUOTATION RULES
// ============================================

export const MEDIA_RULES = Object.freeze({
  /**
   * What Spokespersons CAN Say
   */
  ALLOWED_COMMENTARY: Object.freeze([
    'Explain what happened',
    'Explain historical context',
    'Explain why trends exist historically',
    'Describe observed patterns',
    'Reference official data sources',
    'Clarify methodology',
  ]),

  /**
   * What Spokespersons MUST NOT Say
   */
  FORBIDDEN_COMMENTARY: Object.freeze([
    'What will happen next',
    'Where to invest',
    'What people should do',
    'Any forward-looking claim',
    'Price predictions',
    'Market forecasts',
    'Investment recommendations',
    'Timing advice',
  ]),

  /**
   * Approved Spokesperson
   */
  APPROVED_SPOKESPERSON: Object.freeze({
    name: MASTER_LOCK.BRAND.FOUNDER_NAME,
    role: 'Founder & CEO',
    rule: 'Only approved spokesperson speaks officially',
  }),

  /**
   * Spokesperson Rules
   */
  SPOKESPERSON_RULES: Object.freeze([
    'Only JANE ABOU JAOUDÉ speaks officially',
    'No anonymous quotes',
    'No AI-generated quotes without review',
    'No junior staff commentary to media',
    'All media requests routed through founder',
  ]),
});

// ============================================
// STANDARD MEDIA ATTRIBUTION FORMAT
// ============================================

export const MEDIA_ATTRIBUTION = Object.freeze({
  /**
   * Approved Attribution Format (ONLY USE THIS)
   */
  APPROVED_FORMAT: `According to ${MASTER_LOCK.BRAND.COMPANY_NAME}, based on aggregated official government Open Data…`,

  /**
   * Alternate Approved Formats
   */
  APPROVED_ALTERNATIVES: Object.freeze([
    `${MASTER_LOCK.BRAND.COMPANY_NAME} market intelligence, based on official Open Data, indicates…`,
    `Analysis by ${MASTER_LOCK.BRAND.COMPANY_NAME} of government Open Data shows…`,
    `Historical data compiled by ${MASTER_LOCK.BRAND.COMPANY_NAME} reflects…`,
  ]),

  /**
   * Forbidden Attribution Formats (NEVER ALLOW)
   */
  FORBIDDEN_FORMATS: Object.freeze([
    `${MASTER_LOCK.BRAND.COMPANY_NAME} predicts…`,
    `${MASTER_LOCK.BRAND.COMPANY_NAME} advises…`,
    `${MASTER_LOCK.BRAND.COMPANY_NAME} recommends…`,
    `${MASTER_LOCK.BRAND.COMPANY_NAME} expects…`,
    `${MASTER_LOCK.BRAND.COMPANY_NAME} forecasts…`,
    'JBJ predicts…',
    'JBJ advises…',
    'JBJ recommends…',
  ]),

  /**
   * Correction Protocol
   */
  CORRECTION_PROTOCOL: 'If misquoted, issue formal correction request within 24 hours.',
});

// ============================================
// BANK & INSTITUTION USAGE RULES
// ============================================

export const INSTITUTION_RULES = Object.freeze({
  /**
   * Institution Types
   */
  APPLIES_TO: Object.freeze([
    'Banks',
    'Developers',
    'Investment Funds',
    'Government Entities',
    'Research Institutions',
    'Media Organizations',
  ]),

  /**
   * Required Inclusions When Sharing Reports
   */
  REQUIRED_INCLUSIONS: Object.freeze([
    {
      item: 'Full report',
      reason: 'No excerpts without context',
    },
    {
      item: 'Methodology page link',
      reason: 'Transparency on data sources',
    },
    {
      item: 'Disclaimer page',
      reason: 'Legal protection',
    },
    {
      item: 'Date stamp',
      reason: 'Temporal accuracy',
    },
  ]),

  /**
   * Purpose
   */
  PURPOSE: 'Prevents misuse and ensures proper attribution.',

  /**
   * Sharing Protocol
   */
  SHARING_PROTOCOL: Object.freeze([
    'Full report only (no excerpts without approval)',
    'Include methodology reference',
    'Include full disclaimer',
    'Include publication date',
    'Track who received what version',
  ]),
});

// ============================================
// SOCIAL MEDIA RULES
// ============================================

export const SOCIAL_MEDIA_RULES = Object.freeze({
  /**
   * Allowed Content
   */
  ALLOWED: Object.freeze([
    'Excerpts with source attribution',
    'Charts with disclaimers',
    'Neutral summaries',
    'Historical data points',
    'Methodology links',
    'Report announcements',
  ]),

  /**
   * Forbidden Content (NEVER POST)
   */
  FORBIDDEN: Object.freeze([
    'Market alert',
    'Opportunity',
    'Now is the time',
    'Don\'t miss',
    'Act now',
    'Hot market',
    'Best time to buy',
    'Prices rising fast',
    'Limited time',
    'Urgent',
    'Breaking',
  ]),

  /**
   * Hashtag Rules
   */
  HASHTAG_RULES: Object.freeze({
    allowed: ['#DubaiRealEstate', '#MarketData', '#UAERealEstate', '#PropertyMarket'],
    forbidden: ['#Investment', '#ROI', '#Returns', '#HotDeal', '#Opportunity'],
  }),

  /**
   * Core Rule
   */
  RULE: 'Social media is informational, not advisory.',

  /**
   * Required Disclaimers
   */
  REQUIRED_ELEMENTS: Object.freeze([
    'Source attribution on all data',
    'Disclaimer on charts/graphics',
    'Link to full report/methodology',
    'Date of data referenced',
  ]),
});

// ============================================
// ARCHIVING & VERSION CONTROL
// ============================================

export const ARCHIVING_RULES = Object.freeze({
  /**
   * Report Archiving Requirements
   */
  REQUIREMENTS: Object.freeze([
    'Date-stamped on publication',
    'Archived permanently',
    'Never overwritten',
    'Version tracked',
    'Access logged',
  ]),

  /**
   * Version Control
   */
  VERSION_CONTROL: Object.freeze({
    format: 'v{major}.{minor} - {YYYY-MM-DD}',
    example: 'v1.0 - 2026-01-17',
    major_change: 'New report period or significant methodology change',
    minor_change: 'Typo corrections or formatting',
  }),

  /**
   * Correction Protocol
   */
  CORRECTIONS: Object.freeze({
    method: 'Issued as addendum',
    rule: 'Never silent edits',
    format: 'Addendum to [Report Name] v{version} - Correction Notice',
    requirements: [
      'Original report remains unchanged',
      'Addendum clearly dated',
      'Correction reason stated',
      'Both versions archived',
    ],
  }),

  /**
   * Retention Policy
   */
  RETENTION: Object.freeze({
    minimum: '7 years',
    format: 'PDF/A for long-term preservation',
    storage: 'Secure, redundant storage',
  }),

  /**
   * Institutional Standard
   */
  STANDARD: 'This is how institutions operate.',
});

// ============================================
// PRIORITY 1 COMPLETION STATUS
// ============================================

export const PRIORITY_1_STATUS = Object.freeze({
  name: 'GOVERNMENT CO-BRANDING STRATEGY',
  status: 'COMPLETE',
  locked: true,
  
  steps: Object.freeze([
    {
      step: 1,
      name: 'Government Co-Branding Foundation',
      status: 'LOCKED',
      file: 'src/config/government-cobranding.ts',
    },
    {
      step: 2,
      name: 'Methodology & Disclosure Architecture',
      status: 'LOCKED',
      file: 'src/pages/market-intelligence/Methodology.tsx',
    },
    {
      step: 3,
      name: 'Market Intelligence Design Rules',
      status: 'LOCKED',
      file: 'src/config/market-intelligence-design-rules.ts',
    },
    {
      step: 4,
      name: 'Reporting & Media Citation Rules',
      status: 'LOCKED',
      file: 'src/config/reporting-media-rules.ts',
    },
  ]),

  achievements: Object.freeze([
    'Legal protection established',
    'Institutional credibility secured',
    'Media safety protocols locked',
    'Regulatory alignment confirmed',
    'Scalable authority framework complete',
  ]),

  next_priority: {
    number: 2,
    name: 'GUINNESS-SCALE PLATFORM POSITIONING',
    description: 'Define unmatchable category, prepare for records, awards, and institutional recognition',
  },
});

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate report language for forbidden phrases
 */
export function validateReportLanguage(text: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();
  
  REPORT_LANGUAGE.FORBIDDEN.forEach(phrase => {
    if (lowerText.includes(phrase.toLowerCase())) {
      violations.push(phrase);
    }
  });
  
  return { valid: violations.length === 0, violations };
}

/**
 * Validate social media content
 */
export function validateSocialContent(text: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();
  
  SOCIAL_MEDIA_RULES.FORBIDDEN.forEach(phrase => {
    if (lowerText.includes(phrase.toLowerCase())) {
      violations.push(phrase);
    }
  });
  
  return { valid: violations.length === 0, violations };
}

/**
 * Check if attribution format is approved
 */
export function isAttributionApproved(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check for forbidden formats
  for (const forbidden of MEDIA_ATTRIBUTION.FORBIDDEN_FORMATS) {
    if (lowerText.includes(forbidden.toLowerCase())) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate report version string
 */
export function generateReportVersion(major: number, minor: number): string {
  const date = new Date().toISOString().split('T')[0];
  return `v${major}.${minor} - ${date}`;
}

/**
 * Get Priority 1 completion status
 */
export function getPriority1Status() {
  return PRIORITY_1_STATUS;
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  REPORT_RULES,
  REPORT_LANGUAGE,
  MEDIA_RULES,
  MEDIA_ATTRIBUTION,
  INSTITUTION_RULES,
  SOCIAL_MEDIA_RULES,
  ARCHIVING_RULES,
  PRIORITY_1_STATUS,
  // Utilities
  validateReportLanguage,
  validateSocialContent,
  isAttributionApproved,
  generateReportVersion,
  getPriority1Status,
};
