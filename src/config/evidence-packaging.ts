/**
 * JBJ GLOBAL REAL ESTATE
 * PRIORITY 2 — STEP 3: DOCUMENTATION, EVIDENCE PACKAGING & EXTERNAL NARRATIVE
 * 
 * This configuration translates internal reality into verifiable external story
 * without hype, exaggeration, or credibility risk.
 * 
 * STATUS: LOCKED
 * VERSION: 1.0
 * DATE: 2026-01-17
 */

import { MASTER_LOCK } from './master-lock';
import { PRIMARY_POSITIONING } from './guinness-positioning';

// ============================================================================
// EXTERNAL NARRATIVE (APPROVED FRAMING)
// ============================================================================

export const EXTERNAL_NARRATIVE = {
  // What you NEVER say publicly
  FORBIDDEN_CLAIMS: [
    "We are the world's largest",
    "We hold a record",
    "No one compares to us",
    "The best platform",
    "Unmatched in the industry",
    "Leading the market",
    "Number one",
    "#1",
  ],

  // PRIMARY APPROVED STATEMENT (use this)
  PRIMARY_STATEMENT: `${MASTER_LOCK.BRAND.COMPANY_NAME} operates an integrated real estate brokerage intelligence platform that unifies brokerage operations, market intelligence, AI governance, and compliance within a single controlled system.`,

  // CONTEXTUAL STATEMENT (when appropriate)
  CONTEXTUAL_STATEMENT: "The platform has been designed to operate at a scale and integration depth that is uncommon within the real estate brokerage sector.",

  // Properties of approved statements
  STATEMENT_PROPERTIES: {
    FACTUAL: true,
    VERIFIABLE: true,
    NON_COMPETITIVE: true,
    SAFE: true,
  },

  // Short form for limited spaces
  SHORT_FORM: "Integrated Real Estate Brokerage Intelligence Platform",

  // Tagline (neutral, factual)
  TAGLINE: "BUY · SELL · RENT — Unified Intelligence",
} as const;

// ============================================================================
// PROOF PACKAGE (INTERNAL DOCUMENTS)
// ============================================================================

export const PROOF_PACKAGE = {
  // These documents are NEVER fully public
  VISIBILITY: 'INTERNAL_ONLY',

  DOCUMENTS: {
    // Document 1: System Architecture Dossier
    SYSTEM_ARCHITECTURE: {
      ID: 'DOC-001',
      TITLE: 'System Architecture Dossier',
      COLOR_CODE: '📘',
      CONTENTS: [
        'Full system map',
        'Module inventory',
        'Interconnection diagrams',
        'Access layer definitions',
        'AI mode specifications',
        'Data flow architecture',
        'Security layer overview',
      ],
      PURPOSE: [
        'Independent verification',
        'Institutional review',
        'Technical audit support',
      ],
      STATUS: 'PREPARED',
    },

    // Document 2: Governance & Compliance Dossier
    GOVERNANCE_COMPLIANCE: {
      ID: 'DOC-002',
      TITLE: 'Governance & Compliance Dossier',
      COLOR_CODE: '📗',
      CONTENTS: [
        'Methodology page reference',
        'AI governance rules',
        'Data ethics controls',
        'Audit & RLS structures',
        'Disclosure language standards',
        'Partner governance framework',
        'Media citation rules',
      ],
      PURPOSE: [
        'Regulatory confidence',
        'Risk mitigation',
        'Compliance demonstration',
      ],
      STATUS: 'PREPARED',
    },

    // Document 3: Measurement & Evidence Index
    MEASUREMENT_EVIDENCE: {
      ID: 'DOC-003',
      TITLE: 'Measurement & Evidence Index',
      COLOR_CODE: '📕',
      CONTENTS: [
        'Pillar definitions',
        'Metric specifications',
        'Evidence per metric',
        'URLs and access points',
        'Screenshots (redacted)',
        'Audit logs (sanitized)',
        'Timestamp records',
      ],
      PURPOSE: [
        'Guinness readiness',
        'Third-party audit',
        'Record verification',
      ],
      STATUS: 'PREPARED',
    },
  },
} as const;

// ============================================================================
// PUBLIC VS PRIVATE CONTENT RULES
// ============================================================================

export const CONTENT_VISIBILITY = {
  // What is PUBLIC
  PUBLIC: {
    ITEMS: [
      'Methodology page',
      'Market Intelligence pages',
      'Neutral descriptions of integration',
      'Reports (descriptive only)',
      'AI disclosure statements',
      'Partner governance disclaimers',
      'Media-safe summaries',
    ],
    RULE: 'Descriptive, factual, non-promotional',
  },

  // What is PRIVATE
  PRIVATE: {
    ITEMS: [
      'System counts',
      'Metrics and scores',
      'Internal scorecards',
      'Proof documents',
      'System architecture diagrams',
      'Audit logs',
      'Evidence index',
    ],
    RULE: 'Protects leverage and competitive advantage',
  },

  // The governing principle
  PRINCIPLE: 'Public content builds trust. Private content protects position.',
} as const;

// ============================================================================
// MEDIA & PARTNER LANGUAGE RULES
// ============================================================================

export const MEDIA_LANGUAGE = {
  // Common challenging question
  CHALLENGE_QUESTION: "Are you the largest platform?",

  // Approved response
  APPROVED_RESPONSE: "We operate a highly integrated brokerage intelligence platform. We focus on structure, governance, and compliance rather than size claims.",

  // Response properties
  RESPONSE_PROPERTIES: {
    NO_DEBATE: true,
    NO_COMPARISON: true,
    NEUTRAL: true,
    FACTUAL: true,
  },

  // Additional approved deflections
  APPROVED_DEFLECTIONS: {
    SIZE_QUESTIONS: "We measure success by integration depth and governance quality, not traditional size metrics.",
    COMPETITOR_QUESTIONS: "We focus on our own systems and standards rather than competitive comparisons.",
    RECORD_QUESTIONS: "We're focused on building verifiable, auditable systems. Any external recognition would follow that foundation.",
    FUTURE_QUESTIONS: "We don't make forward-looking claims. Our focus is on current, documented capabilities.",
  },

  // What to never engage with
  NEVER_ENGAGE: [
    'Competitive comparisons',
    'Size debates',
    'Record claims before verification',
    'Future predictions',
    'Investment advice framing',
  ],
} as const;

// ============================================================================
// GUINNESS CONTACT STRATEGY
// ============================================================================

export const GUINNESS_STRATEGY = {
  // Current status
  CONTACT_STATUS: 'NOT_YET',

  // What we do NOT do yet
  PROHIBITED_NOW: [
    'Contact Guinness directly',
    'Claim eligibility publicly',
    'Publish record language',
    'Use "world record" terminology',
    'Reference Guinness in marketing',
  ],

  // Why we wait
  RATIONALE: [
    'Claims must follow evidence maturity',
    'Guinness evaluates structure, not ambition',
    'Premature contact damages credibility',
    'Evidence must be independently reviewable',
  ],

  // Prerequisites before contact
  PREREQUISITES: {
    EVIDENCE_COMPLETE: true,
    INDEPENDENT_REVIEW_POSSIBLE: true,
    NARRATIVE_NEUTRAL: true,
    DOCUMENTATION_STRUCTURED: true,
  },

  // When we will approach
  APPROACH_CRITERIA: [
    'All evidence documents finalized',
    'Third-party verification available',
    'Legal review complete',
    'Spokesperson prepared',
    'Fallback narrative ready',
  ],

  // Contact approach (for future)
  FUTURE_APPROACH: {
    METHOD: 'Formal application through official channels',
    CATEGORY: 'Business/Technology Records',
    POSITIONING: 'Platform architecture, not promotional claims',
    EVIDENCE_TYPE: 'Structural documentation',
  },
} as const;

// ============================================================================
// INTERNAL READINESS CHECK
// ============================================================================

export const READINESS_CHECK = {
  CHECKLIST: {
    ALL_SYSTEMS_LIVE: { status: true, label: 'All systems live' },
    GOVERNANCE_LOCKED: { status: true, label: 'Governance locked' },
    MEASUREMENT_DEFINED: { status: true, label: 'Measurement defined' },
    DOCUMENTATION_STRUCTURED: { status: true, label: 'Documentation structured' },
    NARRATIVE_APPROVED: { status: true, label: 'Narrative approved' },
    PROOF_PACKAGE_PREPARED: { status: true, label: 'Proof package prepared' },
  },

  OVERALL_STATUS: 'POSITIONED_NOT_EXPOSED',

  // What this means
  INTERPRETATION: {
    POSITIONED: 'Clear, defensible, measurable positioning established',
    NOT_EXPOSED: 'No premature claims that could damage credibility',
    READY: 'Foundation complete for future external validation',
  },
} as const;

// ============================================================================
// PRIORITY 2 COMPLETION STATUS
// ============================================================================

export const PRIORITY_2_STATUS = {
  NAME: 'GUINNESS-SCALE PLATFORM POSITIONING',
  STATUS: 'COMPLETE',
  
  STEPS: [
    { step: 1, name: 'Positioning Framework', status: 'COMPLETE' },
    { step: 2, name: 'Measurement & Proof Framework', status: 'COMPLETE' },
    { step: 3, name: 'Documentation & Evidence Packaging', status: 'COMPLETE' },
  ],

  ACHIEVEMENTS: [
    'Positioning defined and locked',
    'Proof is measurable',
    'Narrative is safe',
    'Authority is defensible',
    'No premature claims',
    'Structure speaks for itself',
  ],

  NEXT_PRIORITY: {
    NUMBER: 3,
    NAME: 'GLOBAL EXPANSION PLAYBOOK',
    FOCUS: [
      'Country-by-country expansion strategy',
      'Legal and regulatory adaptation',
      'AI and data localization',
      'RENT rules by jurisdiction',
      'Platform unification globally',
    ],
  },
} as const;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a statement contains forbidden claims
 */
export function containsForbiddenClaim(text: string): boolean {
  const lowerText = text.toLowerCase();
  return EXTERNAL_NARRATIVE.FORBIDDEN_CLAIMS.some(claim => 
    lowerText.includes(claim.toLowerCase())
  );
}

/**
 * Get the approved primary statement
 */
export function getPrimaryStatement(): string {
  return EXTERNAL_NARRATIVE.PRIMARY_STATEMENT;
}

/**
 * Get the contextual statement
 */
export function getContextualStatement(): string {
  return EXTERNAL_NARRATIVE.CONTEXTUAL_STATEMENT;
}

/**
 * Check if content should be public or private
 */
export function isPublicContent(contentType: string): boolean {
  return CONTENT_VISIBILITY.PUBLIC.ITEMS.some(item => 
    item.toLowerCase().includes(contentType.toLowerCase())
  );
}

/**
 * Get approved response for media challenges
 */
export function getMediaResponse(questionType: keyof typeof MEDIA_LANGUAGE.APPROVED_DEFLECTIONS): string {
  return MEDIA_LANGUAGE.APPROVED_DEFLECTIONS[questionType] || MEDIA_LANGUAGE.APPROVED_RESPONSE;
}

/**
 * Check if Guinness contact is allowed
 */
export function isGuinnessContactAllowed(): boolean {
  return GUINNESS_STRATEGY.CONTACT_STATUS !== 'NOT_YET' &&
    Object.values(GUINNESS_STRATEGY.PREREQUISITES).every(v => v === true);
}

/**
 * Get readiness status
 */
export function getReadinessStatus(): { ready: boolean; incomplete: string[] } {
  const incomplete = Object.entries(READINESS_CHECK.CHECKLIST)
    .filter(([_, value]) => !value.status)
    .map(([_, value]) => value.label);
  
  return {
    ready: incomplete.length === 0,
    incomplete,
  };
}

/**
 * Validate external statement for safety
 */
export function validateExternalStatement(text: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (containsForbiddenClaim(text)) {
    issues.push('Contains forbidden claims');
  }
  
  // Check for forward-looking language
  const forwardLooking = ['will be', 'expected to', 'likely to', 'should be'];
  forwardLooking.forEach(phrase => {
    if (text.toLowerCase().includes(phrase)) {
      issues.push(`Contains forward-looking language: "${phrase}"`);
    }
  });
  
  // Check for superlatives
  const superlatives = ['best', 'greatest', 'most', 'largest', 'leading'];
  superlatives.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      issues.push(`Contains superlative: "${word}"`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get Priority 2 completion summary
 */
export function getPriority2Summary(): typeof PRIORITY_2_STATUS {
  return PRIORITY_2_STATUS;
}

// ============================================================================
// MASTER EXPORT
// ============================================================================

export const EVIDENCE_PACKAGING = {
  EXTERNAL_NARRATIVE,
  PROOF_PACKAGE,
  CONTENT_VISIBILITY,
  MEDIA_LANGUAGE,
  GUINNESS_STRATEGY,
  READINESS_CHECK,
  PRIORITY_2_STATUS,
} as const;

export default EVIDENCE_PACKAGING;
