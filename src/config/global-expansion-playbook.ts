/**
 * JBJ GLOBAL REAL ESTATE
 * PRIORITY 3 — GLOBAL EXPANSION PLAYBOOK
 * STEP 1: EXPANSION PHILOSOPHY, CONTROL MODEL & NON-NEGOTIABLES
 * 
 * Defines how JBJ expands globally without breaking control, compliance, brand, or intelligence.
 * 
 * STATUS: LOCKED
 * VERSION: 1.0
 * DATE: 2026-01-17
 */

import { MASTER_LOCK } from './master-lock';

// ============================================================================
// EXPANSION PHILOSOPHY
// ============================================================================

export const EXPANSION_PHILOSOPHY = {
  // What the playbook IS NOT
  IS_NOT: [
    'A franchise model',
    'A copy-paste website strategy',
    'A marketing rollout',
    'A listing aggregation expansion',
  ],

  // What the playbook IS
  IS: [
    'A centralized intelligence + governance system',
    'With localized execution',
    'Under one global authority',
  ],

  // Core principle
  PRINCIPLE: 'One brain. Many jurisdictions. Zero chaos.',

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

  // Governance statement
  GOVERNANCE: 'Centralized Intelligence · Localized Execution',
} as const;

// ============================================================================
// NON-NEGOTIABLE GLOBAL CONSTANTS
// ============================================================================

export const GLOBAL_CONSTANTS = {
  // Brand & Language (never change)
  BRAND: {
    COMPANY_NAME: MASTER_LOCK.BRAND.COMPANY_NAME,
    FOUNDER_NAME: MASTER_LOCK.BRAND.FOUNDER_NAME,
    SERVICE_SCOPE: 'BUY · SELL · RENT',
    AI_DISCLOSURE: MASTER_LOCK.AI.MANDATORY_DISCLOSURE,
    DOMAIN_FORMAT: 'All Capital',
    LOCKED: true,
  },

  // AI Rules (universal)
  AI_RULES: {
    NO_PREDICTIONS: true,
    NO_ADVICE: true,
    NO_GUARANTEES: true,
    MODE_SEPARATION_ENFORCED: true,
    AUDIT_LOGGING_REQUIRED: true,
    DISCLOSURE_MANDATORY: true,
    RULES: [
      'No predictions in any jurisdiction',
      'No investment advice anywhere',
      'No guarantees of any kind',
      'Mode separation enforced globally',
      'All outputs logged and auditable',
    ],
  },

  // Data Ethics (universal)
  DATA_ETHICS: {
    NO_RAW_DATA_REDISTRIBUTION: true,
    NO_PII_LEAKAGE: true,
    OPEN_DATA_DESCRIPTIVE_ONLY: true,
    RULES: [
      'No raw data redistribution to any party',
      'No PII leakage under any circumstance',
      'Open Data used descriptively only',
      'Local data laws supersede when stricter',
    ],
  },

  // Compliance gate
  COMPLIANCE_GATE: 'If a country cannot comply with these constants → no expansion.',
} as const;

// ============================================================================
// EXPANSION MODELS
// ============================================================================

export const EXPANSION_MODELS = {
  // Model A: Direct Licensed Presence
  MODEL_A: {
    ID: 'A',
    NAME: 'Direct Licensed Presence',
    USED_WHEN: [
      'You obtain a local brokerage license',
      'You operate directly',
      'Full market commitment is strategic',
    ],
    CHARACTERISTICS: {
      CONTROL: 'Full',
      MARGIN: 'Full',
      SETUP_COST: 'Higher',
      AUTHORITY: 'Strongest',
      DATA_OWNERSHIP: 'Complete',
      CLIENT_OWNERSHIP: 'Complete',
    },
    BEST_FOR: [
      'GCC countries',
      'Strategic markets',
      'High-value jurisdictions',
      'Long-term presence markets',
    ],
    RISK_LEVEL: 'Low (after setup)',
  },

  // Model B: Licensed Local Partner
  MODEL_B: {
    ID: 'B',
    NAME: 'Licensed Local Partner (Execution Only)',
    USED_WHEN: [
      'Local licensing is complex',
      'Speed to market is priority',
      'Regulatory barriers exist',
    ],
    CHARACTERISTICS: {
      CONTROL: 'Platform & Intelligence',
      MARGIN: 'Commission split',
      SETUP_COST: 'Lower',
      AUTHORITY: 'Shared execution',
      DATA_OWNERSHIP: 'JBJ retains',
      CLIENT_OWNERSHIP: 'JBJ retains',
    },
    CRITICAL_RULES: [
      'JBJ owns platform & intelligence',
      'Partner executes deals only',
      'Clear commission split defined upfront',
      'JBJ controls entire client journey',
      'Partner NEVER owns the client',
      'Partner NEVER owns the data',
      'Exit clause always included',
    ],
    BEST_FOR: [
      'Complex regulatory markets',
      'Fast market entry',
      'Testing demand before Model A',
    ],
    RISK_LEVEL: 'Medium (partner dependency)',
  },

  // Model C: Intelligence-Only
  MODEL_C: {
    ID: 'C',
    NAME: 'Intelligence-Only Market Entry',
    USED_WHEN: [
      'Testing a market',
      'No execution initially',
      'Regulatory uncertainty',
      'Brand presence without commitment',
    ],
    CHARACTERISTICS: {
      CONTROL: 'Full (limited scope)',
      MARGIN: 'None (no execution)',
      SETUP_COST: 'Minimal',
      AUTHORITY: 'Intelligence only',
      DATA_OWNERSHIP: 'Complete',
      CLIENT_OWNERSHIP: 'N/A',
    },
    INCLUDES: [
      'Market Intelligence pages',
      'Educational content',
      'Brand presence',
    ],
    EXCLUDES: [
      'Listings execution',
      'Brokerage claims',
      'Transaction facilitation',
      'Local partner relationships',
    ],
    BEST_FOR: [
      'Market testing',
      'Building awareness',
      'Gathering intelligence before commitment',
      'Jurisdictions with unclear regulations',
    ],
    RISK_LEVEL: 'Lowest',
    NOTE: 'This is how institutions enter markets safely.',
  },
} as const;

// ============================================================================
// COUNTRY READINESS CHECK
// ============================================================================

export const COUNTRY_READINESS = {
  // Mandatory questions (all must be YES)
  MANDATORY_QUESTIONS: [
    {
      id: 'Q1',
      question: 'Is BUY · SELL · RENT legally definable?',
      explanation: 'Local law must recognize these transaction types',
      required_answer: true,
    },
    {
      id: 'Q2',
      question: 'Is data usage compliant?',
      explanation: 'Can we collect, store, and use data legally?',
      required_answer: true,
    },
    {
      id: 'Q3',
      question: 'Can AI disclosures be honored?',
      explanation: 'Can we maintain AI governance standards?',
      required_answer: true,
    },
    {
      id: 'Q4',
      question: 'Can partner dependency be avoided or managed?',
      explanation: 'Is Model A or controlled Model B possible?',
      required_answer: true,
    },
    {
      id: 'Q5',
      question: 'Can exit be clean?',
      explanation: 'Can we withdraw without legal entanglement?',
      required_answer: true,
    },
  ],

  // Gate rule
  GATE_RULE: 'If any answer is NO → PAUSE expansion to that country.',

  // Additional due diligence
  DUE_DILIGENCE: [
    'Regulatory environment stability',
    'Currency convertibility',
    'Repatriation of earnings',
    'Political risk assessment',
    'Market size viability',
    'Competitive landscape',
  ],
} as const;

// ============================================================================
// PLATFORM ARCHITECTURE REQUIREMENTS
// ============================================================================

export const PLATFORM_ARCHITECTURE = {
  REQUIREMENTS: [
    'Country selector (non-intrusive)',
    'Jurisdiction-aware disclosures',
    'Local compliance overlays',
    'Shared intelligence backbone',
    'Separate execution permissions',
    'Unified brand presentation',
    'Localized legal footers',
    'Currency handling per jurisdiction',
    'Language support per market',
  ],

  PRINCIPLE: 'One platform. Multiple rule-sets.',

  TECHNICAL_IMPLICATIONS: {
    DATABASE: 'Country-aware partitioning for compliance',
    AI_LAYER: 'Jurisdiction-specific disclosure injection',
    FRONTEND: 'Dynamic legal/compliance component loading',
    BACKEND: 'Geo-aware RLS policies where required',
    REPORTING: 'Country-segregated analytics',
  },
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
    'Data governance fails',
    'Exit becomes expensive',
  ],

  WITH_THIS_PLAYBOOK: [
    'Scale safely',
    'Stay in control',
    'Enter and exit markets cleanly',
    'Remain institution-ready',
    'Maintain unified brand authority',
    'Preserve data governance',
    'Protect regulatory standing',
  ],
} as const;

// ============================================================================
// PRIORITY 3 STATUS
// ============================================================================

export const PRIORITY_3_STATUS = {
  NAME: 'GLOBAL EXPANSION PLAYBOOK',
  STATUS: 'IN_PROGRESS',

  STEPS: [
    { step: 1, name: 'Expansion Philosophy & Control Model', status: 'COMPLETE' },
    { step: 2, name: 'Country Classification & Sequencing', status: 'PENDING' },
    { step: 3, name: 'Legal & Regulatory Framework', status: 'PENDING' },
    { step: 4, name: 'Technical Implementation Guide', status: 'PENDING' },
  ],

  NEXT_STEP: {
    NUMBER: 2,
    NAME: 'Country Classification & Expansion Sequencing',
    FOCUS: [
      'Classify countries into tiers',
      'Decide expansion order',
      'Match each country to right model (A/B/C)',
      'Avoid emotional or opportunistic expansion',
    ],
  },
} as const;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a country passes readiness check
 */
export function checkCountryReadiness(answers: Record<string, boolean>): {
  ready: boolean;
  failedQuestions: string[];
} {
  const failedQuestions: string[] = [];
  
  COUNTRY_READINESS.MANDATORY_QUESTIONS.forEach(q => {
    if (answers[q.id] !== q.required_answer) {
      failedQuestions.push(q.question);
    }
  });

  return {
    ready: failedQuestions.length === 0,
    failedQuestions,
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
  return 'A'; // Default to strongest model if conditions allow
}

/**
 * Validate expansion decision against non-negotiables
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
    issues.push(`Country fails readiness check: ${readiness.failedQuestions.join(', ')}`);
  }

  if (decision.model === 'B') {
    issues.push('WARNING: Model B requires strict partner governance controls');
  }

  return {
    valid: issues.length === 0 || (issues.length === 1 && issues[0].startsWith('WARNING')),
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
 * Get Priority 3 status
 */
export function getPriority3Status() {
  return PRIORITY_3_STATUS;
}

// ============================================================================
// MASTER EXPORT
// ============================================================================

export const GLOBAL_EXPANSION = {
  EXPANSION_PHILOSOPHY,
  GLOBAL_CONSTANTS,
  EXPANSION_MODELS,
  COUNTRY_READINESS,
  PLATFORM_ARCHITECTURE,
  RISK_PREVENTION,
  PRIORITY_3_STATUS,
} as const;

export default GLOBAL_EXPANSION;
