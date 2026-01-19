/**
 * ADVISORY LANGUAGE RULES
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Language governance for Trust & Advisory Authority Layer.
 * Ensures professional, educational, transparent, client-centric communication.
 */

// ============================================================
// ALLOWED LANGUAGE (APPROVED FOR USE)
// ============================================================

export const ALLOWED_LANGUAGE = {
  terms: [
    'advise',
    'guide',
    'analyze',
    'explain',
    'interpret data',
    'market outlook',
    'historical trends',
    'based on available data',
    'according to published sources',
    'market analysis',
    'area insights',
    'trend analysis',
    'data suggests',
    'historical performance',
    'market conditions',
    'advisory guidance',
    'professional assessment',
    'informed decision',
    'client-centric',
    'transparent',
    'educational',
  ],

  phrases: [
    'based on our analysis',
    'historical data indicates',
    'market trends suggest',
    'according to available information',
    'our advisory assessment',
    'we recommend considering',
    'factors to evaluate include',
    'from a market perspective',
    'our professional guidance',
    'as your advisory partner',
  ],

  tone_requirements: {
    professional: true,
    educational: true,
    transparent: true,
    client_centric: true,
    balanced: true,
    factual: true,
  },
} as const;

// ============================================================
// FORBIDDEN LANGUAGE (STRICTLY PROHIBITED)
// ============================================================

export const FORBIDDEN_LANGUAGE = {
  terms: [
    'guaranteed',
    'guarantee',
    'guarantees',
    'risk-free',
    'riskless',
    'no risk',
    'zero risk',
    'best investment',
    'sure profit',
    'certain return',
    'official government source',
    'approved by authorities',
    'government endorsed',
    'authority approved',
    'financial advice',
    'investment advice',
    'leasing',
    'lease',
    'Lease',
    'LEASE',
  ],

  phrases: [
    'guaranteed returns',
    'guaranteed profit',
    'guaranteed appreciation',
    'risk-free investment',
    'sure thing',
    'can\'t lose',
    'will definitely',
    '100% certain',
    'absolutely will',
    'promise you',
    'we guarantee',
    'official government',
    'government approved',
    'authority sanctioned',
    'best investment opportunity',
    'once in a lifetime',
    'act now or miss out',
    'limited time guaranteed',
  ],

  patterns: [
    /guarante/i,
    /risk.?free/i,
    /sure.?profit/i,
    /certain.?return/i,
    /official.?government/i,
    /authority.?approved/i,
    /best.?investment/i,
    /can'?t.?lose/i,
    /100%.?certain/i,
    /leas(e|ing)/i,
  ],

  reasons: {
    guaranteed: 'Cannot guarantee investment outcomes',
    risk_free: 'All investments carry risk',
    best_investment: 'Subjective and potentially misleading',
    official_government: 'Cannot claim government endorsement',
    financial_advice: 'Outside brokerage scope - we provide buying, selling, and rental services only',
    leasing: 'Brand terminology requires "RENT" only',
  },
} as const;

// ============================================================
// LANGUAGE VALIDATION ENGINE
// ============================================================

export interface LanguageValidationResult {
  is_valid: boolean;
  violations: string[];
  violation_details: Array<{
    term: string;
    reason: string;
    position?: number;
  }>;
  suggestions: string[];
}

/**
 * Validate content against forbidden language rules
 */
export function validateLanguage(content: string): LanguageValidationResult {
  const violations: string[] = [];
  const violation_details: Array<{ term: string; reason: string; position?: number }> = [];
  const suggestions: string[] = [];

  const contentLower = content.toLowerCase();

  // Check forbidden terms
  for (const term of FORBIDDEN_LANGUAGE.terms) {
    if (contentLower.includes(term.toLowerCase())) {
      violations.push(term);
      violation_details.push({
        term,
        reason: getViolationReason(term),
        position: contentLower.indexOf(term.toLowerCase()),
      });
    }
  }

  // Check forbidden phrases
  for (const phrase of FORBIDDEN_LANGUAGE.phrases) {
    if (contentLower.includes(phrase.toLowerCase())) {
      violations.push(phrase);
      violation_details.push({
        term: phrase,
        reason: 'Forbidden phrase detected',
        position: contentLower.indexOf(phrase.toLowerCase()),
      });
    }
  }

  // Check forbidden patterns
  for (const pattern of FORBIDDEN_LANGUAGE.patterns) {
    const match = content.match(pattern);
    if (match) {
      const matchedTerm = match[0];
      if (!violations.includes(matchedTerm)) {
        violations.push(matchedTerm);
        violation_details.push({
          term: matchedTerm,
          reason: 'Pattern-matched forbidden content',
          position: match.index,
        });
      }
    }
  }

  // Generate suggestions for violations
  if (violations.length > 0) {
    suggestions.push('Consider using approved terminology such as:');
    suggestions.push('- "based on available data" instead of guarantees');
    suggestions.push('- "market outlook" instead of predictions');
    suggestions.push('- "historical trends" for data-based statements');
    suggestions.push('- "RENT" instead of "lease" or "leasing"');
  }

  return {
    is_valid: violations.length === 0,
    violations,
    violation_details,
    suggestions,
  };
}

/**
 * Get reason for a specific violation
 */
function getViolationReason(term: string): string {
  const termLower = term.toLowerCase();
  
  if (termLower.includes('guarant')) return FORBIDDEN_LANGUAGE.reasons.guaranteed;
  if (termLower.includes('risk')) return FORBIDDEN_LANGUAGE.reasons.risk_free;
  if (termLower.includes('best investment')) return FORBIDDEN_LANGUAGE.reasons.best_investment;
  if (termLower.includes('official') || termLower.includes('government')) {
    return FORBIDDEN_LANGUAGE.reasons.official_government;
  }
  if (termLower.includes('financial advice')) return FORBIDDEN_LANGUAGE.reasons.financial_advice;
  if (termLower.includes('leas')) return FORBIDDEN_LANGUAGE.reasons.leasing;
  
  return 'Prohibited term in advisory content';
}

/**
 * Check if content contains any forbidden language
 */
export function containsForbiddenLanguage(content: string): boolean {
  return !validateLanguage(content).is_valid;
}

/**
 * Sanitize content by flagging forbidden terms (does not modify, only reports)
 */
export function auditContent(content: string): {
  content: string;
  audit_result: LanguageValidationResult;
  is_compliant: boolean;
} {
  const audit_result = validateLanguage(content);
  return {
    content,
    audit_result,
    is_compliant: audit_result.is_valid,
  };
}

// ============================================================
// TONE VALIDATION
// ============================================================

export interface ToneValidationResult {
  meets_requirements: boolean;
  assessment: {
    professional: boolean;
    educational: boolean;
    transparent: boolean;
    client_centric: boolean;
  };
  recommendations: string[];
}

/**
 * Validate tone requirements (basic heuristic check)
 */
export function validateTone(content: string): ToneValidationResult {
  const contentLower = content.toLowerCase();
  const recommendations: string[] = [];

  // Basic heuristic checks
  const hasEducationalIndicators = 
    contentLower.includes('understand') ||
    contentLower.includes('learn') ||
    contentLower.includes('explain') ||
    contentLower.includes('guide');

  const hasClientCentricIndicators =
    contentLower.includes('you') ||
    contentLower.includes('your') ||
    contentLower.includes('client');

  const hasTransparentIndicators =
    contentLower.includes('data') ||
    contentLower.includes('source') ||
    contentLower.includes('based on');

  const hasProfessionalIndicators =
    !contentLower.includes('!!!') &&
    !contentLower.includes('amazing') &&
    !contentLower.includes('incredible');

  if (!hasEducationalIndicators) {
    recommendations.push('Consider adding educational context');
  }
  if (!hasClientCentricIndicators) {
    recommendations.push('Consider using client-focused language');
  }
  if (!hasTransparentIndicators) {
    recommendations.push('Consider referencing data sources');
  }

  return {
    meets_requirements: hasProfessionalIndicators,
    assessment: {
      professional: hasProfessionalIndicators,
      educational: hasEducationalIndicators,
      transparent: hasTransparentIndicators,
      client_centric: hasClientCentricIndicators,
    },
    recommendations,
  };
}

// ============================================================
// STATUS EXPORT
// ============================================================

export const LANGUAGE_RULES_STATUS = {
  priority: 'P6-PART1',
  status: 'IMPLEMENTED',
  allowed_terms_count: ALLOWED_LANGUAGE.terms.length,
  forbidden_terms_count: FORBIDDEN_LANGUAGE.terms.length,
  forbidden_phrases_count: FORBIDDEN_LANGUAGE.phrases.length,
  forbidden_patterns_count: FORBIDDEN_LANGUAGE.patterns.length,
  brand_compliance: {
    brand_name: 'JBJ GLOBAL REAL ESTATE',
    core_activities: 'BUY · SELL · RENT',
  },
} as const;
