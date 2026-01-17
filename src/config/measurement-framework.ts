/**
 * MEASUREMENT & PROOF FRAMEWORK (GUINNESS-READY)
 * PRIORITY 2 — STEP 2
 * 
 * Purpose: Turn positioning into verifiable facts.
 * Principle: No opinions. No marketing. Proof only.
 * 
 * Core Question: "How do you measure this—and can it be independently verified?"
 * 
 * STATUS: LOCKED — Do not modify without explicit authorization
 */

import { MASTER_LOCK } from './master-lock';
import { PRIMARY_POSITIONING } from './guinness-positioning';

// ============================================
// PRIMARY RECORD DEFINITION
// ============================================

export const RECORD_DEFINITION = Object.freeze({
  /**
   * Working Title
   */
  TITLE: PRIMARY_POSITIONING.TITLE,
  
  /**
   * Measurement Principle
   */
  PRINCIPLE: 'We measure integration depth, not traffic.',
  
  /**
   * What We Prove
   */
  PROVES: 'Structural scale and governance, not popularity or revenue.',
});

// ============================================
// PILLAR A — SYSTEM INTEGRATION COUNT
// ============================================

export const PILLAR_A_SYSTEMS = Object.freeze({
  id: 'system_integration',
  name: 'System Integration Count',
  description: 'Count distinct, live, interconnected systems under one brokerage entity.',
  
  /**
   * Included Systems (Verified)
   */
  INCLUDED_SYSTEMS: Object.freeze([
    {
      id: 'brokerage_ops',
      name: 'Brokerage Operations',
      description: `${MASTER_LOCK.BRAND.CORE_SERVICES} transaction management`,
      status: 'live',
    },
    {
      id: 'crm_revops',
      name: 'CRM & Revenue Operations',
      description: 'Lead management, pipeline, client lifecycle',
      status: 'live',
    },
    {
      id: 'market_intelligence_public',
      name: 'Market Intelligence (Public)',
      description: 'Descriptive market data, methodology, reports',
      status: 'live',
    },
    {
      id: 'market_intelligence_internal',
      name: 'Market Intelligence (Internal)',
      description: 'Tactical analytics, performance metrics',
      status: 'live',
    },
    {
      id: 'ai_governance',
      name: 'AI Governance System',
      description: 'Multi-mode AI with audit, logging, suppression',
      status: 'live',
    },
    {
      id: 'broker_training',
      name: 'Broker Training & Onboarding',
      description: 'Academy, modules, progress tracking, certification',
      status: 'live',
    },
    {
      id: 'executive_dashboards',
      name: 'Executive Dashboards',
      description: 'Founder hub, strategic analytics, command center',
      status: 'live',
    },
    {
      id: 'compliance_audit',
      name: 'Compliance & Audit Systems',
      description: 'RLS, audit logs, governance enforcement',
      status: 'live',
    },
    {
      id: 'partner_governance',
      name: 'Partner Governance Layer',
      description: 'Partner hub, consent tracking, service separation',
      status: 'live',
    },
    {
      id: 'client_intelligence',
      name: 'Client Intelligence Layer',
      description: 'Client profiles, preferences, journey tracking',
      status: 'live',
    },
    {
      id: 'reporting_media',
      name: 'Reporting & Media Outputs',
      description: 'Report generation, media-safe content, archives',
      status: 'live',
    },
    {
      id: 'hr_management',
      name: 'HR & Team Management',
      description: 'Employee profiles, hierarchy, role assignment',
      status: 'live',
    },
    {
      id: 'communication_hub',
      name: 'Communication Hub',
      description: 'Multi-channel messaging, AI assistants, chat',
      status: 'live',
    },
    {
      id: 'document_management',
      name: 'Document Management',
      description: 'PDF generation, contracts, watermarking',
      status: 'live',
    },
    {
      id: 'property_inventory',
      name: 'Property Inventory System',
      description: 'Listings, projects, communities, developers',
      status: 'live',
    },
  ]),

  /**
   * Metric Definition
   */
  METRIC: 'Number of operational systems that are live, documented, and interoperable.',
});

// ============================================
// PILLAR B — AI GOVERNANCE DEPTH
// ============================================

export const PILLAR_B_AI_GOVERNANCE = Object.freeze({
  id: 'ai_governance_depth',
  name: 'AI Governance Depth',
  description: 'Count AI systems under formal governance.',

  /**
   * Measurement Criteria
   */
  MEASURED_BY: Object.freeze([
    {
      id: 'ai_modes',
      name: 'AI Modes',
      description: 'Public / Client / Internal operational modes',
      examples: ['Public descriptive', 'Client contextual', 'Internal analytical'],
    },
    {
      id: 'logged_outputs',
      name: 'Logged Outputs',
      description: 'All AI outputs recorded with metadata',
    },
    {
      id: 'audit_trails',
      name: 'Audit Trails',
      description: 'Complete history of AI decisions and actions',
    },
    {
      id: 'disclosure_rules',
      name: 'Disclosure Rules',
      description: 'Mandatory AI identification in outputs',
    },
    {
      id: 'suppression_mechanisms',
      name: 'Suppression Mechanisms',
      description: 'Automatic blocking of non-compliant outputs',
    },
    {
      id: 'risk_detection',
      name: 'Risk Pattern Detection',
      description: 'Real-time scanning for forbidden language',
    },
    {
      id: 'human_escalation',
      name: 'Human Escalation Protocols',
      description: 'Automatic routing to human review',
    },
  ]),

  /**
   * AI Systems Under Governance
   */
  GOVERNED_SYSTEMS: Object.freeze([
    'Market Intelligence AI',
    'Client Chat Assistant',
    'Broker Assistant',
    'Voice AI (VAPI)',
    'Document Analysis AI',
    'Lead Classification AI',
    'Content Generation AI',
    'Translation AI',
  ]),

  /**
   * Metric Definition
   */
  METRIC: 'Number of AI processes operating under documented governance and audit controls.',
});

// ============================================
// PILLAR C — OPERATIONAL ROLE COVERAGE
// ============================================

export const PILLAR_C_ROLE_COVERAGE = Object.freeze({
  id: 'role_coverage',
  name: 'Operational Role Coverage',
  description: 'Count distinct operational roles supported by systems, not people.',

  /**
   * Supported Roles
   */
  SUPPORTED_ROLES: Object.freeze([
    {
      id: 'brokers',
      name: 'Brokers',
      systems: ['CRM', 'Training', 'Commission', 'Tasks'],
    },
    {
      id: 'clients',
      name: 'Clients',
      systems: ['Portal', 'Chat', 'Property Search', 'Inquiries'],
    },
    {
      id: 'executives',
      name: 'Executives',
      systems: ['Dashboards', 'Analytics', 'Reports', 'Command Center'],
    },
    {
      id: 'compliance',
      name: 'Compliance Officers',
      systems: ['Audit Logs', 'Policy Enforcement', 'Training Compliance'],
    },
    {
      id: 'hr',
      name: 'HR & People Operations',
      systems: ['Onboarding', 'Employee Management', 'Hierarchy'],
    },
    {
      id: 'training',
      name: 'Training & Development',
      systems: ['Academy', 'Modules', 'Certifications', 'Progress'],
    },
    {
      id: 'partners',
      name: 'Partners',
      systems: ['Partner Hub', 'Referral Tracking', 'Consent Management'],
    },
    {
      id: 'media',
      name: 'Media & Communications',
      systems: ['Press Materials', 'Reports', 'Media Kit'],
    },
    {
      id: 'data_ops',
      name: 'Data Operations',
      systems: ['Intelligence', 'ETL', 'Quality Control'],
    },
    {
      id: 'legal',
      name: 'Legal Counsel',
      systems: ['Contracts', 'Compliance', 'Documentation'],
    },
    {
      id: 'sales_leadership',
      name: 'Sales Leadership',
      systems: ['Pipeline', 'Team Performance', 'Forecasting'],
    },
    {
      id: 'marketing',
      name: 'Marketing',
      systems: ['Content', 'Campaigns', 'Analytics'],
    },
  ]),

  /**
   * Metric Definition
   */
  METRIC: 'Number of role-specific system layers with dedicated functionality.',
});

// ============================================
// PILLAR D — COMPLIANCE & DISCLOSURE LAYERS
// ============================================

export const PILLAR_D_COMPLIANCE = Object.freeze({
  id: 'compliance_layers',
  name: 'Compliance & Disclosure Layers',
  description: 'Count independent compliance layers, not policies.',

  /**
   * Compliance Mechanisms
   */
  COMPLIANCE_MECHANISMS: Object.freeze([
    {
      id: 'methodology_disclosure',
      name: 'Methodology Disclosure',
      description: 'Public transparency on data sources and methods',
      enforced: true,
    },
    {
      id: 'ai_disclosure',
      name: 'AI Disclosure',
      description: 'Mandatory AI identification in all outputs',
      enforced: true,
    },
    {
      id: 'data_ethics',
      name: 'Data Ethics Controls',
      description: 'Government data usage rules, forbidden metrics',
      enforced: true,
    },
    {
      id: 'partner_governance',
      name: 'Partner Governance',
      description: 'Service separation, consent tracking, disclaimers',
      enforced: true,
    },
    {
      id: 'audit_logging',
      name: 'Audit Logging',
      description: 'Comprehensive action tracking and history',
      enforced: true,
    },
    {
      id: 'rls_enforcement',
      name: 'RLS Enforcement',
      description: 'Row-level security on all sensitive data',
      enforced: true,
    },
    {
      id: 'brand_governance',
      name: 'Brand Governance',
      description: 'Terminology locks, name standards, positioning rules',
      enforced: true,
    },
    {
      id: 'media_citation',
      name: 'Media Citation Rules',
      description: 'Approved attribution formats, spokesperson rules',
      enforced: true,
    },
    {
      id: 'report_governance',
      name: 'Report Governance',
      description: 'Structure locks, archiving, version control',
      enforced: true,
    },
    {
      id: 'language_governance',
      name: 'Language Governance',
      description: 'Forbidden phrases, approved terminology',
      enforced: true,
    },
  ]),

  /**
   * Metric Definition
   */
  METRIC: 'Number of documented compliance mechanisms actively enforced.',
});

// ============================================
// EXPLICIT EXCLUSIONS
// ============================================

export const EXCLUSIONS = Object.freeze({
  /**
   * What We Explicitly DO NOT Measure
   */
  EXCLUDED_METRICS: Object.freeze([
    {
      metric: 'Website traffic',
      reason: 'Volatile, marketing-dependent',
    },
    {
      metric: 'User count',
      reason: 'Not structural, can be inflated',
    },
    {
      metric: 'Revenue',
      reason: 'Confidential, not architectural',
    },
    {
      metric: 'Geographic coverage',
      reason: 'Expansion-dependent, not integration',
    },
    {
      metric: 'Listings volume',
      reason: 'Inventory-dependent, not governance',
    },
    {
      metric: 'Transaction value',
      reason: 'Market-dependent, not structural',
    },
    {
      metric: 'Employee count',
      reason: 'Operational, not architectural',
    },
  ]),

  /**
   * Purpose
   */
  PURPOSE: 'Keeps the record structural, not promotional.',
});

// ============================================
// PROOF ARTIFACTS
// ============================================

export const PROOF_ARTIFACTS = Object.freeze({
  /**
   * Accepted Evidence Types
   */
  ACCEPTED_EVIDENCE: Object.freeze([
    {
      type: 'system_architecture_diagrams',
      name: 'System Architecture Diagrams',
      format: 'SVG, PNG, or interactive',
    },
    {
      type: 'live_urls',
      name: 'Live URLs',
      format: 'Restricted access for internal systems',
    },
    {
      type: 'screenshots',
      name: 'Access-Controlled Screenshots',
      format: 'Timestamped, watermarked',
    },
    {
      type: 'documentation_pages',
      name: 'Documentation Pages',
      format: 'Public or restricted access',
    },
    {
      type: 'audit_logs',
      name: 'Audit Logs',
      format: 'Redacted for PII, timestamped',
    },
    {
      type: 'sops',
      name: 'SOPs and Governance Documents',
      format: 'PDF, versioned',
    },
    {
      type: 'code_documentation',
      name: 'Code Documentation',
      format: 'Config files, type definitions',
    },
  ]),

  /**
   * Explicitly NOT Accepted
   */
  NOT_ACCEPTED: Object.freeze([
    'Marketing decks',
    'Sales presentations',
    'Testimonials',
    'Press releases',
    'Social media posts',
  ]),
});

// ============================================
// AUDITABILITY REQUIREMENTS
// ============================================

export const AUDITABILITY = Object.freeze({
  /**
   * Every Claim Must Be
   */
  REQUIREMENTS: Object.freeze([
    'Timestamped',
    'Versioned',
    'Independently reviewable',
    'Reproducible',
    'Documented in writing',
  ]),

  /**
   * Prepared Documents
   */
  PREPARED_DOCUMENTS: Object.freeze([
    {
      id: 'proof_index',
      name: 'Proof Index',
      description: 'Master list of all evidence with locations',
    },
    {
      id: 'system_map',
      name: 'System Map',
      description: 'Visual representation of all integrated systems',
    },
    {
      id: 'governance_dossier',
      name: 'Governance Dossier',
      description: 'Complete documentation of compliance frameworks',
    },
  ]),

  /**
   * Purpose
   */
  PURPOSE: 'These are what external reviewers verify.',
});

// ============================================
// INTERNAL SCORECARD
// ============================================

export const INTERNAL_SCORECARD = Object.freeze({
  /**
   * Current Counts (Updated as platform evolves)
   */
  PILLARS: Object.freeze([
    {
      pillar: 'System Integration',
      count: PILLAR_A_SYSTEMS.INCLUDED_SYSTEMS.length,
      status: 'LIVE',
      lastUpdated: '2026-01-17',
    },
    {
      pillar: 'AI Governance',
      count: PILLAR_B_AI_GOVERNANCE.GOVERNED_SYSTEMS.length,
      status: 'LIVE',
      lastUpdated: '2026-01-17',
    },
    {
      pillar: 'Role Coverage',
      count: PILLAR_C_ROLE_COVERAGE.SUPPORTED_ROLES.length,
      status: 'LIVE',
      lastUpdated: '2026-01-17',
    },
    {
      pillar: 'Compliance Layers',
      count: PILLAR_D_COMPLIANCE.COMPLIANCE_MECHANISMS.length,
      status: 'LIVE',
      lastUpdated: '2026-01-17',
    },
  ]),

  /**
   * Total Integration Score
   */
  get TOTAL_SCORE() {
    return {
      systems: PILLAR_A_SYSTEMS.INCLUDED_SYSTEMS.length,
      aiProcesses: PILLAR_B_AI_GOVERNANCE.GOVERNED_SYSTEMS.length,
      roles: PILLAR_C_ROLE_COVERAGE.SUPPORTED_ROLES.length,
      complianceLayers: PILLAR_D_COMPLIANCE.COMPLIANCE_MECHANISMS.length,
    };
  },
});

// ============================================
// WHY THIS WORKS
// ============================================

export const FRAMEWORK_JUSTIFICATION = Object.freeze({
  REASONS: Object.freeze([
    'Competitors cannot fake this',
    'It scales with architecture',
    'It survives market cycles',
    'It aligns with regulation',
    'It is Guinness-compatible',
  ]),

  CONCLUSION: 'This is defensible authority.',
});

// ============================================
// PRIORITY 2 STEP 2 STATUS
// ============================================

export const STEP_2_STATUS = Object.freeze({
  step: 2,
  name: 'Measurement & Proof Framework',
  status: 'COMPLETE',
  file: 'src/config/measurement-framework.ts',
  
  deliverables: Object.freeze([
    'Four measurement pillars defined',
    'Explicit exclusions documented',
    'Proof artifacts specified',
    'Auditability requirements set',
    'Internal scorecard created',
  ]),

  nextStep: {
    step: 3,
    name: 'Documentation, Evidence Packaging & External Narrative',
    description: 'How the record is described publicly, proof packaging, language standards, Guinness approach',
  },
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get current scorecard totals
 */
export function getScorecard() {
  return {
    systemIntegration: PILLAR_A_SYSTEMS.INCLUDED_SYSTEMS.length,
    aiGovernance: PILLAR_B_AI_GOVERNANCE.GOVERNED_SYSTEMS.length,
    roleCoverage: PILLAR_C_ROLE_COVERAGE.SUPPORTED_ROLES.length,
    complianceLayers: PILLAR_D_COMPLIANCE.COMPLIANCE_MECHANISMS.length,
    totalPillars: 4,
  };
}

/**
 * Get all pillar metrics
 */
export function getAllPillarMetrics() {
  return {
    a: { name: PILLAR_A_SYSTEMS.name, metric: PILLAR_A_SYSTEMS.METRIC },
    b: { name: PILLAR_B_AI_GOVERNANCE.name, metric: PILLAR_B_AI_GOVERNANCE.METRIC },
    c: { name: PILLAR_C_ROLE_COVERAGE.name, metric: PILLAR_C_ROLE_COVERAGE.METRIC },
    d: { name: PILLAR_D_COMPLIANCE.name, metric: PILLAR_D_COMPLIANCE.METRIC },
  };
}

/**
 * Check if a metric type is excluded
 */
export function isMetricExcluded(metric: string): boolean {
  return EXCLUSIONS.EXCLUDED_METRICS.some(
    ex => ex.metric.toLowerCase() === metric.toLowerCase()
  );
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  RECORD: RECORD_DEFINITION,
  PILLAR_A: PILLAR_A_SYSTEMS,
  PILLAR_B: PILLAR_B_AI_GOVERNANCE,
  PILLAR_C: PILLAR_C_ROLE_COVERAGE,
  PILLAR_D: PILLAR_D_COMPLIANCE,
  EXCLUSIONS,
  PROOF_ARTIFACTS,
  AUDITABILITY,
  SCORECARD: INTERNAL_SCORECARD,
  JUSTIFICATION: FRAMEWORK_JUSTIFICATION,
  STATUS: STEP_2_STATUS,
  // Utilities
  getScorecard,
  getAllPillarMetrics,
  isMetricExcluded,
};
