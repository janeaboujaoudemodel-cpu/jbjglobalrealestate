/**
 * JBJ GLOBAL REAL ESTATE
 * PRIORITY 3 — GLOBAL EXPANSION PLAYBOOK
 * 
 * Defines how JBJ GLOBAL REAL ESTATE expands globally without losing control, compliance, intelligence, or brand authority.
 * Expansion is system-driven, not opportunistic.
 * 
 * STATUS: LOCKED
 * VERSION: 2.0
 * DATE: 2026-01-17
 */

import { MASTER_LOCK } from './master-lock';

// ============================================================================
// STEP 1 — EXPANSION PHILOSOPHY & CONTROL MODEL
// ============================================================================

export const EXPANSION_PHILOSOPHY = {
  // Core principle (LOCKED)
  PRINCIPLE: 'Centralized Intelligence · Localized Execution',

  // What this means
  MEANING: {
    CENTRALIZED: [
      'Market Intelligence',
      'AI governance',
      'Brand, language, and compliance',
    ],
    LOCALIZED: [
      'Execution (brokerage, licensing, partners)',
      'Per jurisdiction, under JBJ control',
    ],
  },

  // Control model
  CONTROL_MODEL: {
    CENTRALIZED: [
      'Market Intelligence',
      'AI governance',
      'Compliance rules',
      'Brand & language',
      'Data ethics',
      'Methodology',
      'Reporting standards',
    ],
    LOCALIZED: [
      'Brokerage execution',
      'Legal compliance',
      'Licensing',
      'Partners',
      'Local market operations',
      'Jurisdiction-specific disclosures',
    ],
  },
} as const;

// ============================================================================
// NON-NEGOTIABLE GLOBAL CONSTANTS
// ============================================================================

export const GLOBAL_CONSTANTS = {
  // These NEVER change in any country
  BRAND: {
    COMPANY_NAME: MASTER_LOCK.BRAND.COMPANY_NAME, // JBJ GLOBAL REAL ESTATE
    FOUNDER_NAME: MASTER_LOCK.BRAND.FOUNDER_NAME, // JANE ABOU JAOUDÉ
    SERVICE_SCOPE: 'BUY · SELL · RENT',
    UNCHANGED: true,
  },

  // AI Rules (universal, non-negotiable)
  AI_RULES: {
    DESCRIPTIVE_ONLY: true,
    NO_PREDICTIONS: true,
    NO_ADVICE: true,
    ENFORCED_GLOBALLY: true,
  },

  // Data Rules (universal)
  DATA_RULES: {
    GOVERNMENT_OPEN_DATA_DESCRIPTIVE_ONLY: true,
    NO_RAW_DATA_REDISTRIBUTION: true,
  },

  // Client Ownership Rule
  CLIENT_OWNERSHIP: {
    OWNER: 'JBJ GLOBAL REAL ESTATE',
    ALWAYS: true,
  },

  // Compliance gate (HARD RULE)
  COMPLIANCE_GATE: 'If a country cannot comply → it is NOT activated.',
} as const;

// ============================================================================
// EXPANSION MODELS (SELECTED PER COUNTRY)
// ============================================================================

export const EXPANSION_MODELS = {
  // MODEL A — Direct Licensed Presence
  MODEL_A: {
    ID: 'A',
    NAME: 'Direct Licensed Presence',
    DESCRIPTION: 'JBJ holds or obtains a local brokerage license and executes directly.',
    CHARACTERISTICS: {
      CONTROL: 'Full',
      MARGIN: 'Full',
      SETUP_COST: 'Higher',
      AUTHORITY: 'Strongest',
    },
  },

  // MODEL B — Licensed Local Partner (Execution Only)
  MODEL_B: {
    ID: 'B',
    NAME: 'Licensed Local Partner (Execution Only)',
    DESCRIPTION: 'A local licensed partner executes transactions.',
    RULES: [
      'JBJ controls platform, clients, data, and intelligence',
      'Partner executes deals only',
      'Strict governance and commission tracking',
      'Partner NEVER owns the client',
    ],
  },

  // MODEL C — Intelligence-Only Presence
  MODEL_C: {
    ID: 'C',
    NAME: 'Intelligence-Only Market Entry',
    DESCRIPTION: 'No execution. No brokerage claims.',
    INCLUDES: [
      'Market Intelligence only',
      'Data, reports, and authority',
    ],
    EXCLUDES: [
      'Brokerage execution',
      'Transaction facilitation',
    ],
    LEGAL_EXPOSURE: 'Zero',
  },
} as const;

// ============================================================================
// STEP 2 — COUNTRY CLASSIFICATION & EXPANSION SEQUENCING
// ============================================================================

export const COUNTRY_CLASSIFICATION = {
  // Classification principle (NON-NEGOTIABLE)
  PRINCIPLE: 'Expansion is NOT based on: Noise, Introductions, Ego, Opportunistic deals.',
  BASED_ON: 'Structured evaluation ONLY.',

  // Mandatory Country Evaluation Criteria (ALL must pass)
  MANDATORY_CRITERIA: [
    {
      id: 'LICENSING_CLARITY',
      question: 'Is BUY · SELL · RENT legally definable and executable?',
      required: true,
    },
    {
      id: 'DATA_AVAILABILITY',
      question: 'Does public or government-recognized real estate data exist?',
      required: true,
    },
    {
      id: 'AI_COMPLIANCE',
      question: 'Is descriptive AI usage legally acceptable?',
      required: true,
    },
    {
      id: 'PARTNER_DEPENDENCY_RISK',
      question: 'Can the platform avoid relying on a single vendor or data source?',
      required: true,
    },
    {
      id: 'EXIT_SAFETY',
      question: 'Can JBJ GLOBAL REAL ESTATE exit cleanly without exposure?',
      required: true,
    },
  ],

  // Gate rule
  GATE_RULE: 'If any one fails → country is REJECTED.',
} as const;

// ============================================================================
// COUNTRY TIERS (LOCKED)
// ============================================================================

export const COUNTRY_TIERS = {
  // TIER 1 — CORE MARKETS
  TIER_1: {
    NAME: 'CORE MARKETS',
    EXECUTION_MODEL: ['A', 'B'],
    CHARACTERISTICS: [
      'Clear licensing',
      'Strong Open Data',
      'High regulatory trust',
      'Strategic long-term value',
    ],
    PURPOSE: 'Anchor authority and credibility.',
  },

  // TIER 2 — STRATEGIC GROWTH MARKETS
  TIER_2: {
    NAME: 'STRATEGIC GROWTH MARKETS',
    EXECUTION_MODEL: ['B'],
    CHARACTERISTICS: [
      'High demand',
      'More complex regulation',
      'Strong partner ecosystems',
    ],
    PURPOSE: 'Controlled growth without overexposure.',
  },

  // TIER 3 — INTELLIGENCE-ONLY MARKETS
  TIER_3: {
    NAME: 'INTELLIGENCE-ONLY MARKETS',
    EXECUTION_MODEL: ['C'],
    CHARACTERISTICS: [
      'Limited execution clarity',
      'Acceptable data availability',
    ],
    PURPOSE: 'Visibility, learning, zero execution risk.',
  },
} as const;

// ============================================================================
// EXPANSION SEQUENCING (MANDATORY ORDER)
// ============================================================================

export const EXPANSION_SEQUENCING = {
  // The platform must prevent skipping phases
  SKIP_PREVENTION: true,

  PHASES: [
    {
      phase: 1,
      name: 'Strengthen Tier 1',
      actions: [
        'Compliance hardened',
        'AI governance locked',
        'Intelligence stabilized',
        'Execution perfected',
      ],
      prerequisite: null,
    },
    {
      phase: 2,
      name: 'Activate Tier 2',
      actions: [
        'Partners onboarded under governance',
        'Limited execution scope',
        'Client and data ownership enforced',
      ],
      prerequisite: 'Phase 1 complete',
    },
    {
      phase: 3,
      name: 'Deploy Tier 3',
      actions: [
        'Intelligence only',
        'No execution',
        'No brokerage representation',
      ],
      prerequisite: 'Phase 2 complete',
    },
  ],
} as const;

// ============================================================================
// STEP 3 — GLOBAL PLATFORM ARCHITECTURE & JURISDICTION LAYER
// ============================================================================

export const PLATFORM_ARCHITECTURE = {
  DESCRIPTION: 'One global platform with multiple jurisdictional rule sets.',
  
  MUST_SUPPORT: [
    'Country-aware routing',
    'Jurisdiction-specific disclosures',
    'Local compliance overlays',
    'Permission-based execution access',
    'Centralized intelligence with localized execution rules',
  ],
} as const;

// ============================================================================
// STEP 4 — GOVERNANCE & ENFORCEMENT
// ============================================================================

export const GOVERNANCE_ENFORCEMENT = {
  SYSTEM_MUST_ENFORCE: [
    'Expansion model selection per country',
    'Compliance checks before activation',
    'AI mode separation per jurisdiction',
    'Partner governance rules',
    'Clean exit mechanisms',
  ],

  MANUAL_OVERRIDES: false,
} as const;

// ============================================================================
// STEP 5 — DATA SOURCE INDEPENDENCE & REDUNDANCY (NON-NEGOTIABLE)
// ============================================================================

export const DATA_SOURCE_INDEPENDENCE = {
  OBJECTIVE: 'Ensure JBJ GLOBAL REAL ESTATE is NEVER dependent on a single data source, platform, partner, or API for listings or market intelligence.',

  // Every country must have these
  COUNTRY_REQUIREMENTS: {
    PRIMARY_DATA_SOURCE: true,
    SECONDARY_DATA_SOURCE: true,
    FALLBACK_SOURCE: true, // Manual or public
  },

  // Prohibited dependencies
  NO_EXECUTION_MAY_RELY_ON: [
    'A single private platform',
    'A revocable API without fallback',
    'Exclusive data ownership by a partner',
  ],

  // Removal handling
  DATA_SOURCE_REMOVAL_RULES: [
    'Platform must continue operating',
    'Listings may degrade gracefully but NEVER disappear entirely',
    'Market Intelligence remains active using alternative sources',
  ],

  // Internal tracking statuses
  DATA_SOURCE_STATUSES: ['active', 'degraded', 'disabled'] as const,

  // Gate rule
  GATE_RULE: 'No country activation is allowed without redundancy.',
} as const;

export type DataSourceStatus = typeof DATA_SOURCE_INDEPENDENCE.DATA_SOURCE_STATUSES[number];

// ============================================================================
// PRIORITY 3 STATUS RULE
// ============================================================================

export const PRIORITY_3_STATUS = {
  NAME: 'GLOBAL EXPANSION PLAYBOOK',
  STATUS: 'LOCKED',
  VERSION: '2.0',

  EXECUTION_PREREQUISITES: [
    'All critical security patches completed',
    'Verification accepted',
    'RLS and access controls confirmed',
  ],

  RULE: 'Expansion without security acceptance is FORBIDDEN.',

  STEPS: [
    { step: 1, name: 'Expansion Philosophy & Control Model', status: 'COMPLETE' },
    { step: 2, name: 'Country Classification & Sequencing', status: 'COMPLETE' },
    { step: 3, name: 'Global Platform Architecture', status: 'COMPLETE' },
    { step: 4, name: 'Governance & Enforcement', status: 'COMPLETE' },
    { step: 5, name: 'Data Source Independence & Redundancy', status: 'COMPLETE' },
  ],
} as const;

// ============================================================================
// RISK PREVENTION
// ============================================================================

export const RISK_PREVENTION = {
  WITHOUT_THIS_PLAYBOOK: [
    'Expansion becomes messy',
    'Compliance breaks silently',
    'Brand fractures across markets',
    'AI becomes risky',
    'Authority collapses',
  ],

  WITH_THIS_PLAYBOOK: [
    'Scale safely',
    'Stay in control',
    'Enter and exit markets cleanly',
    'Remain institution-ready',
  ],
} as const;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a country passes all mandatory criteria
 */
export function checkCountryReadiness(answers: Record<string, boolean>): {
  ready: boolean;
  failedCriteria: string[];
} {
  const failedCriteria: string[] = [];
  
  COUNTRY_CLASSIFICATION.MANDATORY_CRITERIA.forEach(criterion => {
    if (answers[criterion.id] !== criterion.required) {
      failedCriteria.push(criterion.question);
    }
  });

  return {
    ready: failedCriteria.length === 0,
    failedCriteria,
  };
}

/**
 * Get recommended expansion model based on criteria
 */
export function getRecommendedModel(criteria: {
  hasLocalLicense: boolean;
  complexRegulations: boolean;
  testingMarket: boolean;
  strategicPriority: boolean;
}): 'A' | 'B' | 'C' {
  if (criteria.testingMarket) return 'C';
  if (criteria.hasLocalLicense && criteria.strategicPriority) return 'A';
  if (criteria.complexRegulations) return 'B';
  return 'A';
}

/**
 * Validate expansion decision
 */
export function validateExpansionDecision(decision: {
  countryName: string;
  model: 'A' | 'B' | 'C';
  readinessAnswers: Record<string, boolean>;
}): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  const readiness = checkCountryReadiness(decision.readinessAnswers);
  if (!readiness.ready) {
    issues.push(`Country fails readiness: ${readiness.failedCriteria.join(', ')}`);
  }

  // Check security prerequisites
  // Priority 3 execution requires security acceptance
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get expansion model details
 */
export function getModelDetails(modelId: 'A' | 'B' | 'C') {
  switch (modelId) {
    case 'A': return EXPANSION_MODELS.MODEL_A;
    case 'B': return EXPANSION_MODELS.MODEL_B;
    case 'C': return EXPANSION_MODELS.MODEL_C;
  }
}

/**
 * Check if expansion can proceed (security gate)
 */
export function canProceedWithExpansion(securityAccepted: boolean): boolean {
  return securityAccepted;
}

// ============================================================================
// MASTER EXPORT
// ============================================================================

export const GLOBAL_EXPANSION = {
  EXPANSION_PHILOSOPHY,
  GLOBAL_CONSTANTS,
  EXPANSION_MODELS,
  COUNTRY_CLASSIFICATION,
  COUNTRY_TIERS,
  EXPANSION_SEQUENCING,
  PLATFORM_ARCHITECTURE,
  GOVERNANCE_ENFORCEMENT,
  DATA_SOURCE_INDEPENDENCE,
  RISK_PREVENTION,
  PRIORITY_3_STATUS,
} as const;

export default GLOBAL_EXPANSION;
