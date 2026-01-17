/**
 * AI INTELLIGENCE TIER ENFORCEMENT — JBJ GLOBAL REAL ESTATE
 * 
 * Ensures AI outputs respect tier boundaries and NEVER leak
 * internal intelligence to lower-access tiers.
 * 
 * CRITICAL: AI must generate outputs ONLY within permitted tier.
 */

import {
  IntelligenceTier,
  INTELLIGENCE_TIERS,
  TIER_ISOLATION_RULES,
  UserAccessContext,
  getMaxAccessibleTier,
  validateAITierRequest,
  BRAND_CONSTANTS,
} from './market-intelligence-layers';

// =============================================================================
// AI OUTPUT TIER RULES
// =============================================================================

export interface AIOutputTierRules {
  tier: IntelligenceTier;
  can_include: string[];
  must_exclude: string[];
  required_disclaimers: string[];
  output_validation: {
    check_forbidden_content: boolean;
    check_cross_tier_leakage: boolean;
    check_brand_compliance: boolean;
    require_human_review: boolean;
  };
}

export const AI_OUTPUT_RULES_BY_TIER: Record<IntelligenceTier, AIOutputTierRules> = {
  public: {
    tier: 'public',
    can_include: [
      'general_market_overview',
      'historical_trends_descriptive',
      'area_descriptions',
      'infrastructure_explanations',
      'educational_content',
      'market_cycle_context',
    ],
    must_exclude: [
      'specific_price_predictions',
      'roi_projections',
      'guaranteed_outcomes',
      'client_specific_data',
      'internal_metrics',
      'partner_performance',
      'lead_data',
      'conversion_rates',
    ],
    required_disclaimers: [
      'This information is for educational purposes only.',
      'Past performance does not guarantee future results.',
      `${BRAND_CONSTANTS.COMPANY_NAME} provides advisory services, not financial advice.`,
    ],
    output_validation: {
      check_forbidden_content: true,
      check_cross_tier_leakage: true,
      check_brand_compliance: true,
      require_human_review: false,
    },
  },
  
  registered_user: {
    tier: 'registered_user',
    can_include: [
      'extended_market_analysis',
      'area_comparisons',
      'yield_discussions_descriptive',
      'scenario_explanations',
      'absorption_rate_context',
    ],
    must_exclude: [
      'personalized_recommendations',
      'deal_specific_advice',
      'internal_metrics',
      'partner_data',
      'lead_intelligence',
      'guaranteed_returns',
    ],
    required_disclaimers: [
      'This analysis is based on historical data and market observations.',
      'Individual circumstances may vary. Consult with our advisors.',
      `${BRAND_CONSTANTS.COMPANY_NAME} is a licensed brokerage, not a financial institution.`,
    ],
    output_validation: {
      check_forbidden_content: true,
      check_cross_tier_leakage: true,
      check_brand_compliance: true,
      require_human_review: false,
    },
  },
  
  client_only: {
    tier: 'client_only',
    can_include: [
      'deal_specific_analysis',
      'property_comparisons',
      'personalized_scenarios',
      'risk_considerations',
      'strategy_discussions',
    ],
    must_exclude: [
      'internal_company_metrics',
      'partner_performance_data',
      'lead_conversion_data',
      'pricing_models',
      'competitive_intelligence_raw',
      'guaranteed_outcomes',
    ],
    required_disclaimers: [
      'This advisory is specific to your situation and should not be shared.',
      'Final decisions should be made in consultation with your assigned advisor.',
    ],
    output_validation: {
      check_forbidden_content: true,
      check_cross_tier_leakage: true,
      check_brand_compliance: true,
      require_human_review: true, // Broker review required
    },
  },
  
  internal_strategic: {
    tier: 'internal_strategic',
    can_include: [
      'all_internal_metrics',
      'pricing_models',
      'competitive_analysis',
      'partner_performance',
      'lead_intelligence',
      'revenue_projections',
      'strategic_recommendations',
    ],
    must_exclude: [
      'client_outcome_guarantees', // Even internally, no promises to share with clients
    ],
    required_disclaimers: [
      'INTERNAL USE ONLY - Do not share with clients or external parties.',
      'Strategic intelligence - Not for client-facing communications.',
    ],
    output_validation: {
      check_forbidden_content: true,
      check_cross_tier_leakage: true,
      check_brand_compliance: true,
      require_human_review: false,
    },
  },
};

// =============================================================================
// AI TIER BOUNDARY ENFORCEMENT
// =============================================================================

export interface AIBoundaryCheck {
  passed: boolean;
  violations: AIBoundaryViolation[];
  sanitized_output?: string;
  tier_applied: IntelligenceTier;
}

export interface AIBoundaryViolation {
  type: 'cross_tier_leakage' | 'forbidden_content' | 'brand_violation' | 'data_exposure';
  severity: 'critical' | 'high' | 'medium';
  description: string;
  content_flagged?: string;
}

/**
 * Patterns that indicate internal-only content
 */
const INTERNAL_ONLY_PATTERNS = [
  /conversion\s*rate/i,
  /lead\s*(conversion|intelligence|scoring)/i,
  /partner\s*performance/i,
  /inventory\s*velocity/i,
  /pricing\s*(model|sensitivity)/i,
  /internal\s*(metric|analytics|report)/i,
  /revenue\s*(projection|forecast)/i,
  /competitive\s*intelligence/i,
  /broker\s*performance/i,
  /campaign\s*effectiveness/i,
];

/**
 * Patterns that indicate client-only content
 */
const CLIENT_ONLY_PATTERNS = [
  /your\s*(specific|personal)\s*(situation|case)/i,
  /based\s*on\s*your\s*budget/i,
  /recommended\s*for\s*you/i,
  /your\s*investment\s*strategy/i,
  /deal\s*analysis\s*for/i,
];

/**
 * Patterns that are forbidden across all tiers (guarantees/promises)
 */
const FORBIDDEN_PATTERNS = [
  /guaranteed\s*(return|profit|outcome)/i,
  /risk[\s-]*free\s*investment/i,
  /sure\s*(profit|return|thing)/i,
  /best\s*investment\s*(opportunity|choice)/i,
  /will\s*(definitely|certainly)\s*(increase|appreciate)/i,
  /100%\s*(safe|secure|guaranteed)/i,
];

/**
 * Brand violation patterns
 */
const BRAND_VIOLATION_PATTERNS = [
  /\bleas(e|ing)\b/i, // "leasing" is forbidden
  /\bjbj\b(?!\s+GLOBAL)/i, // lowercase "jbj" without "GLOBAL"
];

/**
 * Checks AI output for tier boundary violations
 */
export function checkAIOutputBoundaries(
  output: string,
  targetTier: IntelligenceTier,
  userContext: UserAccessContext
): AIBoundaryCheck {
  const violations: AIBoundaryViolation[] = [];
  
  // 1. Verify user can access the target tier
  const maxTier = getMaxAccessibleTier(userContext);
  const tierHierarchy: IntelligenceTier[] = ['public', 'registered_user', 'client_only', 'internal_strategic'];
  
  if (tierHierarchy.indexOf(targetTier) > tierHierarchy.indexOf(maxTier)) {
    violations.push({
      type: 'cross_tier_leakage',
      severity: 'critical',
      description: `User tier '${maxTier}' cannot access '${targetTier}' content`,
    });
  }
  
  // 2. Check for internal-only content in non-internal tiers
  if (targetTier !== 'internal_strategic') {
    for (const pattern of INTERNAL_ONLY_PATTERNS) {
      const match = output.match(pattern);
      if (match) {
        violations.push({
          type: 'cross_tier_leakage',
          severity: 'critical',
          description: 'Internal-only content detected in non-internal tier',
          content_flagged: match[0],
        });
      }
    }
  }
  
  // 3. Check for client-only content in public/registered tiers
  if (targetTier === 'public' || targetTier === 'registered_user') {
    for (const pattern of CLIENT_ONLY_PATTERNS) {
      const match = output.match(pattern);
      if (match) {
        violations.push({
          type: 'cross_tier_leakage',
          severity: 'high',
          description: 'Client-only content detected in lower tier',
          content_flagged: match[0],
        });
      }
    }
  }
  
  // 4. Check for forbidden content (guarantees/promises) - all tiers
  for (const pattern of FORBIDDEN_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      violations.push({
        type: 'forbidden_content',
        severity: 'critical',
        description: 'Forbidden guarantee/promise language detected',
        content_flagged: match[0],
      });
    }
  }
  
  // 5. Check brand compliance
  for (const pattern of BRAND_VIOLATION_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      violations.push({
        type: 'brand_violation',
        severity: 'high',
        description: 'Brand terminology violation detected',
        content_flagged: match[0],
      });
    }
  }
  
  return {
    passed: violations.length === 0,
    violations,
    tier_applied: targetTier,
  };
}

// =============================================================================
// AI TIER PROMPT INJECTION
// =============================================================================

/**
 * Generates tier-specific system prompt additions
 */
export function getTierSystemPrompt(tier: IntelligenceTier): string {
  const rules = AI_OUTPUT_RULES_BY_TIER[tier];
  const tierDef = INTELLIGENCE_TIERS[tier];
  
  const basePrompt = `
=== INTELLIGENCE TIER ENFORCEMENT ===
Current Tier: ${tier.toUpperCase()}
Access Level: ${tierDef.access_level}

BRAND REQUIREMENTS:
- Company name MUST be: ${BRAND_CONSTANTS.COMPANY_NAME}
- Core activities MUST be: ${BRAND_CONSTANTS.CORE_ACTIVITIES}
- NEVER use: ${BRAND_CONSTANTS.FORBIDDEN_TERMS.join(', ')}

TIER RESTRICTIONS:
This output is for "${tierDef.name}" tier.
Purpose: ${tierDef.purpose}

YOU MUST INCLUDE ONLY:
${rules.can_include.map(c => `- ${c}`).join('\n')}

YOU MUST EXCLUDE:
${rules.must_exclude.map(c => `- ${c}`).join('\n')}

REQUIRED DISCLAIMERS (include at least one):
${rules.required_disclaimers.map(d => `- "${d}"`).join('\n')}

ABSOLUTE RULES:
- NEVER promise guaranteed returns or outcomes
- NEVER act as a regulator or government body
- NEVER combine internal metrics with public output
- ALWAYS position ${BRAND_CONSTANTS.COMPANY_NAME} as advisory-led brokerage
=== END TIER ENFORCEMENT ===
`;

  return basePrompt.trim();
}

// =============================================================================
// AI OUTPUT SANITIZER
// =============================================================================

/**
 * Sanitizes AI output to remove tier-violating content
 */
export function sanitizeAIOutput(
  output: string,
  targetTier: IntelligenceTier
): string {
  let sanitized = output;
  
  // Replace forbidden brand terms
  sanitized = sanitized.replace(/\bleasing\b/gi, 'rental');
  sanitized = sanitized.replace(/\blease\b/gi, 'rental agreement');
  sanitized = sanitized.replace(/\bjbj\b(?!\s+GLOBAL)/gi, 'JBJ GLOBAL REAL ESTATE');
  
  // Replace guarantee language with compliant alternatives
  sanitized = sanitized.replace(/guaranteed\s*returns?/gi, 'potential returns');
  sanitized = sanitized.replace(/risk[\s-]*free/gi, 'carefully considered');
  sanitized = sanitized.replace(/sure\s*(profit|return)/gi, 'potential $1');
  sanitized = sanitized.replace(/best\s*investment/gi, 'strong investment');
  sanitized = sanitized.replace(/will\s*definitely/gi, 'may potentially');
  sanitized = sanitized.replace(/will\s*certainly/gi, 'could potentially');
  
  // For non-internal tiers, redact internal-only language
  if (targetTier !== 'internal_strategic') {
    sanitized = sanitized.replace(/conversion\s*rate[\s\S]{0,50}/gi, '[internal metric redacted]');
    sanitized = sanitized.replace(/lead\s*intelligence[\s\S]{0,50}/gi, '[internal data redacted]');
    sanitized = sanitized.replace(/partner\s*performance[\s\S]{0,50}/gi, '[internal metric redacted]');
  }
  
  return sanitized;
}

// =============================================================================
// STATUS EXPORT
// =============================================================================

export const AI_TIER_ENFORCEMENT_STATUS = {
  module: 'AI Intelligence Tier Enforcement',
  priority: 'P6-PART2',
  status: 'ACTIVE',
  
  features: {
    tier_boundary_checking: true,
    cross_tier_leakage_prevention: true,
    forbidden_content_detection: true,
    brand_compliance_checking: true,
    output_sanitization: true,
    tier_specific_prompts: true,
  },
  
  patterns_enforced: {
    internal_only: INTERNAL_ONLY_PATTERNS.length,
    client_only: CLIENT_ONLY_PATTERNS.length,
    forbidden: FORBIDDEN_PATTERNS.length,
    brand_violation: BRAND_VIOLATION_PATTERNS.length,
  },
};
