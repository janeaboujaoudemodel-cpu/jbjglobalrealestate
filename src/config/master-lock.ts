/**
 * MASTER INSTITUTIONAL LOCK
 * JBJ GLOBAL REAL ESTATE - Enterprise Configuration
 * 
 * ⚠️ THIS FILE IS READ-ONLY ⚠️
 * DO NOT MODIFY WITHOUT EXPLICIT FOUNDER AUTHORIZATION
 * 
 * Version: 1.0.0
 * Lock Date: 2026-01-17
 * Status: LOCKED
 */

// ============================================
// A) BRAND & LANGUAGE LOCK (IMMUTABLE)
// ============================================

export const BRAND_LOCK = Object.freeze({
  COMPANY_NAME: 'JBJ GLOBAL REAL ESTATE',
  // LOCKED FOUNDER NAME - English (use for ALL English UI/pages)
  FOUNDER_NAME: 'Jane Bou Jaoude',
  // LOCKED FOUNDER NAME - Arabic (use for ALL Arabic UI/pages)
  FOUNDER_NAME_ARABIC: 'جاين بو جودة',
  FOUNDER_NAME_BILINGUAL: 'Jane Bou Jaoude (جاين بو جودة)',
  // LOCKED FOUNDER TITLE - English
  FOUNDER_TITLE: 'Founder & CEO',
  FOUNDER_TITLE_FULL: 'Founder & CEO JBJ Global Real Estate',
  // LOCKED FOUNDER TITLE - Arabic (FEMININE form with full diacritics)
  FOUNDER_TITLE_ARABIC: 'ٱلْمُؤَسِّسَةُ وَٱلرَّئِيسَةُ ٱلتَّنْفِيذِيَّةُ',
  FOUNDER_FULL_TITLE: 'Jane Bou Jaoude Founder & CEO JBJ Global Real Estate',
  CORE_SERVICES: 'BUY · SELL · RENT',
  DOMAIN: 'JBJ.ae',
  PRIMARY_EMAIL: 'contact@JBJ.ae',
  PRIVACY_EMAIL: 'privacy@JBJ.ae',
  PRIMARY_PHONE: '+971 56 591 1000',
});

// Forbidden terms - instant block if detected
export const FORBIDDEN_TERMS = Object.freeze([
  'leasing',
  'lease',
  'lessee',
  'lessor',
  'end-user',
  'enduser',
  'end user',
]);

// ============================================
// B) SERVICE SCOPE LOCK
// ============================================

export const SERVICE_SCOPE = Object.freeze({
  // Licensed activities (JBJ executes directly)
  LICENSED: Object.freeze(['BUY', 'SELL', 'RENT']),
  
  // Partner-only services (introductions only)
  PARTNER_ONLY: Object.freeze([
    'Mortgage',
    'Legal',
    'Visa',
    'Corporate Services',
    'Golden Visa',
    'Residency',
  ]),
  
  // Mandatory disclaimer
  PARTNER_DISCLAIMER: 'JBJ GLOBAL REAL ESTATE provides licensed real estate brokerage services for BUY, SELL and RENT. Other services are provided through independent licensed partners.',
});

// ============================================
// C) UI & CONTENT CHANGE CONTROL
// ============================================

export const CHANGE_CONTROL = Object.freeze({
  ALLOWED: Object.freeze([
    'text_correction_locked_terms',
    'data_refresh',
    'bug_fix',
    'security_patch',
  ]),
  
  FORBIDDEN: Object.freeze([
    'layout_change',
    'copy_rewrite',
    'ux_experimentation',
    'terminology_change',
    'branding_modification',
    'wording_improvement',
  ]),
  
  RULE: 'If not explicitly requested, it is forbidden.',
});

// ============================================
// D) AI HARD GOVERNANCE LOCK
// ============================================

export const AI_GOVERNANCE = Object.freeze({
  // Allowed AI actions
  ALLOWED_ACTIONS: Object.freeze([
    'explain',
    'summarize',
    'describe',
    'translate',
    'contextualize',
  ]),
  
  // Forbidden AI actions
  FORBIDDEN_ACTIONS: Object.freeze([
    'predict',
    'recommend',
    'advise',
    'promise',
    'rank_best',
    'suggest_urgency',
    'guarantee',
    'forecast',
  ]),
  
  // Mandatory disclosure (DO NOT MODIFY)
  MANDATORY_DISCLOSURE: 'This assistant is an AI system used to support information and operations. It does not replace licensed professionals.',
  
  // AI modes
  MODES: Object.freeze({
    PUBLIC: 'authority',
    CLIENT: 'advisory',
    INTERNAL: 'execution',
  }),
});

// ============================================
// E) DATA & INTEGRATION LOCK
// ============================================

export const DATA_LOCK = Object.freeze({
  // Allowed data sources
  ALLOWED_SOURCES: Object.freeze([
    'government_open_data',
    'partner_feeds',
    'internal_crm',
  ]),
  
  // Source restrictions
  SOURCE_RESTRICTIONS: Object.freeze({
    government_open_data: 'descriptive_only',
    partner_feeds: 'replaceable_non_exclusive',
    internal_crm: 'internal_only',
  }),
  
  // Forbidden practices
  FORBIDDEN_PRACTICES: Object.freeze([
    'ui_copying',
    'image_mirroring_without_rights',
    'brochure_duplication',
    'vendor_lock_in',
    'exclusive_inventory_dependency',
  ]),
});

// ============================================
// F) PARTNER POWER BALANCE LOCK
// ============================================

export const PARTNER_LOCK = Object.freeze({
  // Non-negotiable ownership
  JBJ_OWNS: Object.freeze([
    'client_relationship',
    'execution_authority',
    'analytics_data',
    'presentation_control',
  ]),
  
  // Allowed revenue models
  ALLOWED_REVENUE_MODELS: Object.freeze([
    'data_fee',
    'tracked_referrals',
    'hybrid_with_exit_clause',
  ]),
  
  // Commission rules
  COMMISSION_RULES: Object.freeze({
    DEFAULT_MAX: 0.30, // 30%
    EXCLUSIVE_MAX: 0.50, // 50% only with exclusive measurable upside
    REQUIRES_TRACKING: true,
    REQUIRES_EXIT_CLAUSE: true,
  }),
});

// ============================================
// G) SECURITY & RLS LOCK
// ============================================

export const SECURITY_LOCK = Object.freeze({
  ENFORCED: Object.freeze([
    'role_based_access',
    'no_cross_role_leakage',
    'mandatory_audit_logs',
    'ai_output_logging',
  ]),
  
  REVIEW_FREQUENCY: 'quarterly',
  
  BREACH_RESPONSE: Object.freeze([
    'immediate_freeze',
    'full_audit',
    'incident_report',
    'remediation_plan',
  ]),
});

// ============================================
// H) AUDIT & REGULATORY READINESS
// ============================================

export const AUDIT_READINESS = Object.freeze({
  ALWAYS_AVAILABLE: Object.freeze([
    'methodology_pages',
    'data_source_attribution',
    'ai_mode_separation',
    'disclosure_language',
    'versioned_reports',
    'archived_history',
  ]),
  
  COMPLIANCE_TARGETS: Object.freeze([
    'government_safe',
    'bank_safe',
    'media_safe',
    'regulator_ready',
  ]),
});

// ============================================
// I) DEVELOPER & AI BEHAVIOR RULE
// ============================================

export const BEHAVIOR_RULES = Object.freeze({
  IF_UNCERTAIN: Object.freeze([
    'STOP',
    'ASK',
    'DO_NOT_ASSUME',
  ]),
  
  NEVER_DO: Object.freeze([
    'improve_wording',
    'clarify_meaning',
    'optimize_branding',
    'standardize_spelling',
    'suggest_alternatives',
  ]),
  
  AUTHORITY: 'There is one authority.',
});

// ============================================
// SYSTEM STATUS
// ============================================

export const SYSTEM_STATUS = Object.freeze({
  VERSION: '1.0.0',
  LOCK_DATE: '2026-01-17',
  STATUS: 'LOCKED',
  INSTITUTION_READY: true,
  SCALABLE: true,
  
  CHECKS: Object.freeze({
    BRAND_LOCKED: true,
    NAME_LOCKED: true,
    SERVICES_ENFORCED: true,
    AI_GOVERNED: true,
    PARTNERS_OPTIONAL: true,
    COMPLIANCE_PERMANENT: true,
    PLATFORM_FUTURE_PROOF: true,
  }),
});

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validates text against forbidden terms
 */
export function validateText(text: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();
  
  FORBIDDEN_TERMS.forEach(term => {
    if (lowerText.includes(term.toLowerCase())) {
      violations.push(term);
    }
  });
  
  return { valid: violations.length === 0, violations };
}

/**
 * Validates AI action against governance rules
 */
export function validateAIAction(action: string): boolean {
  const lowerAction = action.toLowerCase();
  
  // Check if forbidden
  if (AI_GOVERNANCE.FORBIDDEN_ACTIONS.some(f => lowerAction.includes(f))) {
    return false;
  }
  
  return true;
}

/**
 * Validates change request against change control
 */
export function validateChangeRequest(changeType: string): { allowed: boolean; reason: string } {
  if (CHANGE_CONTROL.ALLOWED.includes(changeType as never)) {
    return { allowed: true, reason: 'Approved change type' };
  }
  
  if (CHANGE_CONTROL.FORBIDDEN.includes(changeType as never)) {
    return { allowed: false, reason: `Forbidden: ${changeType}` };
  }
  
  return { allowed: false, reason: CHANGE_CONTROL.RULE };
}

/**
 * Gets partner disclaimer
 */
export function getPartnerDisclaimer(): string {
  return SERVICE_SCOPE.PARTNER_DISCLAIMER;
}

/**
 * Gets AI disclosure
 */
export function getAIDisclosure(): string {
  return AI_GOVERNANCE.MANDATORY_DISCLOSURE;
}

/**
 * Checks if service requires partner introduction
 */
export function isPartnerService(service: string): boolean {
  return SERVICE_SCOPE.PARTNER_ONLY.some(
    p => p.toLowerCase() === service.toLowerCase()
  );
}

/**
 * Gets full system status
 */
export function getSystemStatus(): typeof SYSTEM_STATUS {
  return SYSTEM_STATUS;
}

// Export master lock object for read-only access
export const MASTER_LOCK = Object.freeze({
  BRAND: BRAND_LOCK,
  SERVICES: SERVICE_SCOPE,
  CHANGE_CONTROL,
  AI: AI_GOVERNANCE,
  DATA: DATA_LOCK,
  PARTNERS: PARTNER_LOCK,
  SECURITY: SECURITY_LOCK,
  AUDIT: AUDIT_READINESS,
  BEHAVIOR: BEHAVIOR_RULES,
  STATUS: SYSTEM_STATUS,
});

export default MASTER_LOCK;
