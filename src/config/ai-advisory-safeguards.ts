/**
 * AI ADVISORY SAFEGUARDS
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Safeguards for AI-generated content in advisory context.
 * Human brokerage advisory always remains primary.
 */

import { validateLanguage, containsForbiddenLanguage } from './advisory-language-rules';

// ============================================================
// AI CONTENT PERMISSIONS
// ============================================================

export const AI_CONTENT_PERMISSIONS = {
  /**
   * ALLOWED: What AI MAY do in advisory content
   */
  allowed: {
    summarize_market_data: {
      enabled: true,
      description: 'Summarize market data',
      requires_source_citation: true,
    },
    explain_trends: {
      enabled: true,
      description: 'Explain trends and cycles',
      historical_only: true,
    },
    compare_historical_periods: {
      enabled: true,
      description: 'Compare historical periods',
      future_predictions: false,
    },
    describe_government_plans: {
      enabled: true,
      description: 'Describe government-published plans',
      requires_attribution: true,
    },
    support_advisory_conversations: {
      enabled: true,
      description: 'Support advisory conversations',
      human_oversight_required: true,
    },
  },

  /**
   * PROHIBITED: What AI MUST NOT do
   */
  prohibited: {
    promise_outcomes: {
      blocked: true,
      description: 'Promise outcomes',
      reason: 'Cannot guarantee future results',
    },
    guarantee_performance: {
      blocked: true,
      description: 'Guarantee performance',
      reason: 'All investments carry risk',
    },
    rank_investments: {
      blocked: true,
      description: 'Rank investments as "best"',
      reason: 'Subjective and potentially misleading',
    },
    replace_human_judgment: {
      blocked: true,
      description: 'Replace licensed human advisory judgment',
      reason: 'Human advisory is primary',
    },
    provide_financial_advice: {
      blocked: true,
      description: 'Provide financial or investment advice',
      reason: 'Outside licensed brokerage scope',
    },
    claim_official_status: {
      blocked: true,
      description: 'Claim official government status',
      reason: 'Cannot impersonate authorities',
    },
  },
} as const;

// ============================================================
// AI OUTPUT SAFEGUARDS
// ============================================================

export const AI_OUTPUT_SAFEGUARDS = {
  /**
   * MANDATORY DISCLOSURES
   */
  mandatory_disclosures: {
    ai_generated: {
      required: true,
      text: 'This content is AI-generated for informational purposes.',
    },
    not_advice: {
      required: true,
      text: 'For legal or mortgage matters, we can connect you with our licensed partners.',
    },
    consult_professional: {
      required: true,
      text: 'Contact us via the Contact page for partner introductions.',
    },
    data_limitations: {
      required: true,
      text: 'Based on available data which may not reflect current conditions.',
    },
  },

  /**
   * CONTENT FILTERS
   */
  content_filters: {
    block_guarantees: true,
    block_predictions_as_facts: true,
    block_roi_promises: true,
    block_urgency_language: true,
    block_superlatives: true,
    require_source_attribution: true,
  },

  /**
   * HUMAN OVERSIGHT
   */
  human_oversight: {
    required_for_client_advice: true,
    review_before_publication: true,
    escalation_for_complex_queries: true,
    human_final_authority: true,
  },
} as const;

// ============================================================
// AI CONTENT VALIDATION
// ============================================================

export interface AIContentValidationResult {
  is_compliant: boolean;
  language_check: {
    passed: boolean;
    violations: string[];
  };
  permission_check: {
    passed: boolean;
    violations: string[];
  };
  disclosure_check: {
    passed: boolean;
    missing_disclosures: string[];
  };
  recommendations: string[];
}

/**
 * Validate AI-generated content for advisory compliance
 */
export function validateAIContent(
  content: string,
  options?: {
    check_disclosures?: boolean;
    content_type?: 'summary' | 'analysis' | 'advice' | 'general';
  }
): AIContentValidationResult {
  const languageResult = validateLanguage(content);
  const permissionViolations: string[] = [];
  const missingDisclosures: string[] = [];
  const recommendations: string[] = [];

  const contentLower = content.toLowerCase();

  // Check for prohibited patterns
  if (contentLower.includes('will definitely') || contentLower.includes('will certainly')) {
    permissionViolations.push('Contains outcome promises');
  }
  if (contentLower.includes('best investment') || contentLower.includes('top investment')) {
    permissionViolations.push('Contains investment ranking');
  }
  if (contentLower.includes('guaranteed') || contentLower.includes('guarantee')) {
    permissionViolations.push('Contains performance guarantees');
  }
  if (contentLower.includes('you should invest') || contentLower.includes('you must buy')) {
    permissionViolations.push('Contains direct investment advice');
  }

  // Check for required disclosures if enabled
  if (options?.check_disclosures) {
    const disclosurePatterns = [
      { key: 'ai_generated', patterns: ['ai-generated', 'ai generated', 'generated by ai'] },
      { key: 'not_advice', patterns: ['not advice', 'not financial advice', 'not investment advice'] },
      { key: 'consult_professional', patterns: ['consult', 'professional', 'advisor'] },
    ];

    for (const disclosure of disclosurePatterns) {
      const hasDisclosure = disclosure.patterns.some(p => contentLower.includes(p));
      if (!hasDisclosure) {
        missingDisclosures.push(disclosure.key);
      }
    }
  }

  // Generate recommendations
  if (!languageResult.is_valid) {
    recommendations.push('Review and remove forbidden language');
  }
  if (permissionViolations.length > 0) {
    recommendations.push('Reframe content to be descriptive rather than prescriptive');
  }
  if (missingDisclosures.length > 0) {
    recommendations.push('Add required AI disclosure statements');
  }
  if (!contentLower.includes('based on') && !contentLower.includes('according to')) {
    recommendations.push('Consider adding source attribution');
  }

  return {
    is_compliant: languageResult.is_valid && permissionViolations.length === 0,
    language_check: {
      passed: languageResult.is_valid,
      violations: languageResult.violations,
    },
    permission_check: {
      passed: permissionViolations.length === 0,
      violations: permissionViolations,
    },
    disclosure_check: {
      passed: missingDisclosures.length === 0,
      missing_disclosures: missingDisclosures,
    },
    recommendations,
  };
}

/**
 * Generate standard AI disclosure text
 */
export function getAIDisclosure(type: 'full' | 'compact' | 'minimal' = 'full'): string {
  switch (type) {
    case 'full':
      return `This content is AI-generated by JBJ GLOBAL REAL ESTATE for informational purposes. Market conditions change and past performance does not guarantee future results. For legal or mortgage matters, we can connect you with our licensed partners. Contact us via the Contact page for partner introductions.`;
    case 'compact':
      return `AI-generated content for information. For legal/mortgage matters, contact us for partner introductions.`;
    case 'minimal':
      return `AI-generated | JBJ Global Real Estate`;
    default:
      return getAIDisclosure('full');
  }
}

/**
 * Check if AI content requires human review
 */
export function requiresHumanReview(content: string, contentType: string): boolean {
  // Always require human review for advice-type content
  if (contentType === 'advice') return true;

  // Check for potentially sensitive content
  const sensitivePatterns = [
    /recommend/i,
    /suggest you/i,
    /should consider/i,
    /advise you to/i,
    /investment/i,
    /return/i,
    /profit/i,
  ];

  return sensitivePatterns.some(pattern => pattern.test(content));
}

// ============================================================
// AI RISK FILTER
// ============================================================

export interface AIRiskFilterResult {
  content: string;
  was_filtered: boolean;
  filtered_elements: string[];
  risk_level: 'low' | 'medium' | 'high';
}

/**
 * Filter high-risk elements from AI content
 * Note: This flags but does not modify content - human review required
 */
export function assessAIContentRisk(content: string): AIRiskFilterResult {
  const filtered_elements: string[] = [];
  let risk_level: 'low' | 'medium' | 'high' = 'low';

  const highRiskPatterns = [
    { pattern: /guarantee/i, element: 'guarantee language' },
    { pattern: /risk.?free/i, element: 'risk-free claims' },
    { pattern: /best investment/i, element: 'investment ranking' },
    { pattern: /sure profit/i, element: 'profit promises' },
    { pattern: /will increase/i, element: 'future predictions' },
    { pattern: /must buy/i, element: 'urgent investment pressure' },
  ];

  const mediumRiskPatterns = [
    { pattern: /recommend/i, element: 'recommendation language' },
    { pattern: /should invest/i, element: 'investment suggestions' },
    { pattern: /expected return/i, element: 'return expectations' },
  ];

  for (const { pattern, element } of highRiskPatterns) {
    if (pattern.test(content)) {
      filtered_elements.push(element);
      risk_level = 'high';
    }
  }

  if (risk_level !== 'high') {
    for (const { pattern, element } of mediumRiskPatterns) {
      if (pattern.test(content)) {
        filtered_elements.push(element);
        risk_level = 'medium';
      }
    }
  }

  return {
    content,
    was_filtered: filtered_elements.length > 0,
    filtered_elements,
    risk_level,
  };
}

// ============================================================
// STATUS EXPORT
// ============================================================

export const AI_SAFEGUARDS_STATUS = {
  priority: 'P6-PART1',
  status: 'IMPLEMENTED',
  allowed_operations: Object.keys(AI_CONTENT_PERMISSIONS.allowed).length,
  prohibited_operations: Object.keys(AI_CONTENT_PERMISSIONS.prohibited).length,
  mandatory_disclosures: Object.keys(AI_OUTPUT_SAFEGUARDS.mandatory_disclosures).length,
  human_oversight_required: AI_OUTPUT_SAFEGUARDS.human_oversight.required_for_client_advice,
  human_final_authority: AI_OUTPUT_SAFEGUARDS.human_oversight.human_final_authority,
  brand_compliance: {
    brand_name: 'JBJ GLOBAL REAL ESTATE',
    core_activities: 'BUY · SELL · RENT',
  },
} as const;
