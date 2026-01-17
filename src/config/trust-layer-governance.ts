/**
 * TRUST LAYER GOVERNANCE
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Master governance configuration for Trust & Advisory Authority Layer.
 * Consolidates all advisory positioning, language rules, and AI safeguards.
 */

import {
  AUTHORITY_POSITIONING,
  ADVISORY_CATEGORIES,
  ALLOWED_ADVISORY_CATEGORIES,
  type AdvisoryCategory,
  isValidAdvisoryCategory,
  getAdvisoryCategory,
  getAllAdvisoryCategories,
  ADVISORY_AUTHORITY_STATUS,
} from './advisory-authority';

import {
  ALLOWED_LANGUAGE,
  FORBIDDEN_LANGUAGE,
  validateLanguage,
  containsForbiddenLanguage,
  auditContent,
  validateTone,
  LANGUAGE_RULES_STATUS,
} from './advisory-language-rules';

import {
  AI_CONTENT_PERMISSIONS,
  AI_OUTPUT_SAFEGUARDS,
  validateAIContent,
  getAIDisclosure,
  requiresHumanReview,
  assessAIContentRisk,
  AI_SAFEGUARDS_STATUS,
} from './ai-advisory-safeguards';

// ============================================================
// UNIFIED TRUST LAYER CONFIGURATION
// ============================================================

export const TRUST_LAYER_CONFIG = {
  /**
   * BRAND CONSTANTS (IMMUTABLE)
   */
  brand: {
    name: 'JBJ GLOBAL REAL ESTATE',
    core_activities: 'BUY · SELL · RENT',
    prohibited_terms: ['leasing', 'lease', 'Lease', 'LEASE', 'jbj', 'Jbj'],
  },

  /**
   * POSITIONING
   */
  positioning: AUTHORITY_POSITIONING,

  /**
   * ADVISORY CATEGORIES
   */
  categories: ADVISORY_CATEGORIES,

  /**
   * LANGUAGE RULES
   */
  language: {
    allowed: ALLOWED_LANGUAGE,
    forbidden: FORBIDDEN_LANGUAGE,
  },

  /**
   * AI GOVERNANCE
   */
  ai: {
    permissions: AI_CONTENT_PERMISSIONS,
    safeguards: AI_OUTPUT_SAFEGUARDS,
  },

  /**
   * ENFORCEMENT STATUS
   */
  enforcement: {
    language_validation: true,
    ai_content_filtering: true,
    mandatory_disclosures: true,
    human_oversight: true,
    brand_compliance: true,
  },
} as const;

// ============================================================
// UNIFIED VALIDATION
// ============================================================

export interface TrustLayerValidationResult {
  is_compliant: boolean;
  brand_check: {
    passed: boolean;
    violations: string[];
  };
  language_check: {
    passed: boolean;
    violations: string[];
  };
  ai_check: {
    passed: boolean;
    violations: string[];
    risk_level: 'low' | 'medium' | 'high';
  };
  category_check: {
    passed: boolean;
    category: AdvisoryCategory | null;
  };
  overall_recommendations: string[];
}

/**
 * Comprehensive validation against all Trust Layer rules
 */
export function validateAgainstTrustLayer(
  content: string,
  options?: {
    category?: AdvisoryCategory;
    is_ai_generated?: boolean;
    check_brand?: boolean;
  }
): TrustLayerValidationResult {
  const violations: string[] = [];
  const recommendations: string[] = [];

  // Brand check
  const brandViolations: string[] = [];
  const contentLower = content.toLowerCase();
  
  for (const term of TRUST_LAYER_CONFIG.brand.prohibited_terms) {
    if (content.includes(term)) {
      brandViolations.push(`Contains prohibited term: "${term}"`);
    }
  }

  // Check for incorrect brand casing
  if (contentLower.includes('jbj') && !content.includes('JBJ')) {
    brandViolations.push('Brand name must be "JBJ" (all caps)');
  }

  // Language check
  const languageResult = validateLanguage(content);

  // AI check (if applicable)
  const aiResult = options?.is_ai_generated 
    ? validateAIContent(content, { check_disclosures: true })
    : null;
  const riskResult = assessAIContentRisk(content);

  // Category check
  const categoryValid = options?.category 
    ? isValidAdvisoryCategory(options.category)
    : true;

  // Compile recommendations
  if (brandViolations.length > 0) {
    recommendations.push('Correct brand name usage to "JBJ GLOBAL REAL ESTATE"');
    recommendations.push('Replace "lease/leasing" with "RENT"');
  }
  if (!languageResult.is_valid) {
    recommendations.push(...languageResult.suggestions);
  }
  if (aiResult && !aiResult.is_compliant) {
    recommendations.push(...aiResult.recommendations);
  }
  if (riskResult.risk_level === 'high') {
    recommendations.push('Content requires human review before publication');
  }

  return {
    is_compliant: 
      brandViolations.length === 0 && 
      languageResult.is_valid && 
      (!aiResult || aiResult.is_compliant) &&
      categoryValid,
    brand_check: {
      passed: brandViolations.length === 0,
      violations: brandViolations,
    },
    language_check: {
      passed: languageResult.is_valid,
      violations: languageResult.violations,
    },
    ai_check: {
      passed: !aiResult || aiResult.is_compliant,
      violations: aiResult ? [
        ...aiResult.language_check.violations,
        ...aiResult.permission_check.violations,
      ] : [],
      risk_level: riskResult.risk_level,
    },
    category_check: {
      passed: categoryValid,
      category: options?.category || null,
    },
    overall_recommendations: recommendations,
  };
}

// ============================================================
// CONTENT COMPLIANCE HELPER
// ============================================================

/**
 * Quick compliance check for content
 */
export function isContentCompliant(content: string): boolean {
  return validateAgainstTrustLayer(content).is_compliant;
}

/**
 * Get compliance status summary
 */
export function getComplianceStatus(content: string): {
  compliant: boolean;
  issues: number;
  risk: 'low' | 'medium' | 'high';
} {
  const result = validateAgainstTrustLayer(content);
  const totalIssues = 
    result.brand_check.violations.length +
    result.language_check.violations.length +
    result.ai_check.violations.length;

  return {
    compliant: result.is_compliant,
    issues: totalIssues,
    risk: result.ai_check.risk_level,
  };
}

// ============================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================

export {
  // Advisory Authority
  AUTHORITY_POSITIONING,
  ADVISORY_CATEGORIES,
  ALLOWED_ADVISORY_CATEGORIES,
  isValidAdvisoryCategory,
  getAdvisoryCategory,
  getAllAdvisoryCategories,
  
  // Language Rules
  ALLOWED_LANGUAGE,
  FORBIDDEN_LANGUAGE,
  validateLanguage,
  containsForbiddenLanguage,
  auditContent,
  validateTone,
  
  // AI Safeguards
  AI_CONTENT_PERMISSIONS,
  AI_OUTPUT_SAFEGUARDS,
  validateAIContent,
  getAIDisclosure,
  requiresHumanReview,
  assessAIContentRisk,
};

export type { AdvisoryCategory };

// ============================================================
// TRUST LAYER STATUS
// ============================================================

export const TRUST_LAYER_STATUS = {
  priority: 'P6-PART1',
  status: 'IMPLEMENTED',
  components: {
    advisory_authority: ADVISORY_AUTHORITY_STATUS.status,
    language_rules: LANGUAGE_RULES_STATUS.status,
    ai_safeguards: AI_SAFEGUARDS_STATUS.status,
  },
  advisory_categories_count: ALLOWED_ADVISORY_CATEGORIES.length,
  forbidden_language_enforced: true,
  ai_safeguards_active: true,
  human_oversight_required: true,
  brand_compliance: {
    brand_name: 'JBJ GLOBAL REAL ESTATE',
    core_activities: 'BUY · SELL · RENT',
    leasing_prohibited: true,
  },
  validations: {
    positioning_implemented: true,
    categories_defined: ALLOWED_ADVISORY_CATEGORIES.length === 4,
    forbidden_language_blocked: true,
    ai_safeguards_enforced: true,
  },
} as const;
