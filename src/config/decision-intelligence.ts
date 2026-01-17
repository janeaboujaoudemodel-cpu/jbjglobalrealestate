/**
 * DECISION INTELLIGENCE WORKFLOW
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Formal decision workflow for market entry, expansion approval,
 * partner onboarding, and model selection.
 * All decisions are logged, immutable after finalization, and reference source data.
 */

import type { DataRoomId, DataRoomAccessRole } from '@/types/data-rooms';

// ============================================================
// DECISION TYPES (LOCKED)
// ============================================================

export type DecisionType = 
  | 'market_entry'
  | 'expansion_approval'
  | 'partner_onboarding'
  | 'model_selection';

export const DECISION_TYPES: DecisionType[] = [
  'market_entry',
  'expansion_approval',
  'partner_onboarding',
  'model_selection',
];

// ============================================================
// DECISION STATUS (LOCKED)
// ============================================================

export type DecisionStatus = 'APPROVE' | 'HOLD' | 'REJECT';

export const DECISION_STATUSES: DecisionStatus[] = ['APPROVE', 'HOLD', 'REJECT'];

// ============================================================
// EXECUTION MODELS (LOCKED)
// ============================================================

export type ExecutionModel = 'A' | 'B' | 'C';

export const EXECUTION_MODELS: ExecutionModel[] = ['A', 'B', 'C'];

export const EXECUTION_MODEL_DESCRIPTIONS: Record<ExecutionModel, string> = {
  A: 'Full ownership and control model',
  B: 'Partnership and revenue sharing model',
  C: 'Licensing and franchise model',
};

// ============================================================
// DECISION ACCESS RULES (LOCKED)
// ============================================================

export const DECISION_ACCESS_BY_ROLE: Record<DataRoomAccessRole, {
  canCreate: boolean;
  canReview: boolean;
  canFinalize: boolean;
  visibility: 'full' | 'read_only' | 'none';
  requiresApproval: boolean;
}> = {
  owner_founder: {
    canCreate: true,
    canReview: true,
    canFinalize: true,
    visibility: 'full',
    requiresApproval: false,
  },
  executive: {
    canCreate: false,
    canReview: true,
    canFinalize: false,
    visibility: 'read_only',
    requiresApproval: false,
  },
  investor: {
    canCreate: false,
    canReview: false,
    canFinalize: false,
    visibility: 'read_only',
    requiresApproval: true, // Explicit approval required
  },
  partner: {
    canCreate: false,
    canReview: false,
    canFinalize: false,
    visibility: 'none',
    requiresApproval: false,
  },
  internal_staff: {
    canCreate: false,
    canReview: false,
    canFinalize: false,
    visibility: 'none',
    requiresApproval: false,
  },
};

// ============================================================
// MANDATORY DECISION INPUTS
// ============================================================

export interface DecisionInputs {
  /** References to data room evidence */
  data_room_evidence: {
    data_room_id: DataRoomId;
    document_ids?: string[];
    dataset_ids?: string[];
    section_references?: string[];
  }[];
  /** Jurisdiction readiness assessment */
  jurisdiction_readiness: {
    jurisdiction: string;
    score: number; // 0-100
    assessment_date: string;
    key_factors: string[];
    blockers?: string[];
  };
  /** Financial impact summary */
  financial_impact: {
    projected_investment: number;
    currency: string;
    roi_timeline_months: number;
    break_even_months: number;
    risk_adjusted_return: number;
    capital_requirements: number;
  };
  /** Risk exposure summary */
  risk_exposure: {
    overall_risk_score: number; // 0-100
    risk_categories: {
      category: string;
      score: number;
      mitigation_available: boolean;
    }[];
    unmitigated_risks: string[];
  };
  /** Client ownership impact */
  client_ownership_impact: {
    affected_clients: number;
    ownership_transfer_required: boolean;
    client_communication_plan: boolean;
    retention_risk_score: number; // 0-100
  };
}

// ============================================================
// MANDATORY DECISION OUTPUTS
// ============================================================

export interface DecisionOutputs {
  /** Final decision status */
  decision_status: DecisionStatus;
  /** Selected execution model */
  selected_model: ExecutionModel;
  /** Required safeguards before execution */
  required_safeguards: string[];
  /** Review timeline */
  review_timeline: {
    next_review_date: string;
    review_frequency: 'weekly' | 'monthly' | 'quarterly';
    escalation_triggers: string[];
  };
  /** Additional conditions */
  conditions?: string[];
  /** Approver notes */
  approver_notes?: string;
}

// ============================================================
// DECISION RECORD (IMMUTABLE AFTER FINALIZATION)
// ============================================================

export interface DecisionRecord {
  /** Unique decision ID */
  decision_id: string;
  /** Type of decision */
  decision_type: DecisionType;
  /** Decision title */
  title: string;
  /** Decision description */
  description: string;
  /** All mandatory inputs */
  inputs: DecisionInputs;
  /** All mandatory outputs (null until finalized) */
  outputs: DecisionOutputs | null;
  /** Decision workflow state */
  workflow_state: 'draft' | 'pending_review' | 'finalized';
  /** Is decision finalized (immutable) */
  is_finalized: boolean;
  /** Creator information */
  created_by: {
    user_id: string;
    role: DataRoomAccessRole;
    email?: string;
  };
  created_at: string;
  /** Finalizer information */
  finalized_by?: {
    user_id: string;
    role: DataRoomAccessRole;
    email?: string;
  };
  finalized_at?: string;
  /** Review history */
  reviews: {
    reviewer_id: string;
    reviewer_role: DataRoomAccessRole;
    reviewed_at: string;
    comments?: string;
  }[];
  /** Audit trail */
  audit_log: {
    action: string;
    actor_id: string;
    actor_role: DataRoomAccessRole;
    timestamp: string;
    details?: string;
  }[];
}

// ============================================================
// DECISION CONFIGURATION
// ============================================================

export const DECISION_CONFIGURATION = {
  /** Decisions are immutable after finalization */
  DECISIONS_ARE_IMMUTABLE: true,
  /** All decisions must reference source data */
  REQUIRE_DATA_ROOM_EVIDENCE: true,
  /** All decisions must include jurisdiction readiness */
  REQUIRE_JURISDICTION_READINESS: true,
  /** All decisions must include financial impact */
  REQUIRE_FINANCIAL_IMPACT: true,
  /** All decisions must include risk exposure */
  REQUIRE_RISK_EXPOSURE: true,
  /** All decisions are logged */
  DECISIONS_ARE_LOGGED: true,
  /** Decision retention period in days */
  DECISION_RETENTION_DAYS: 3650, // 10 years
} as const;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate a unique decision ID
 */
export function generateDecisionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DEC-${timestamp}-${random}`.toUpperCase();
}

/**
 * Check if a role can create decisions
 */
export function canRoleCreateDecision(role: DataRoomAccessRole): boolean {
  return DECISION_ACCESS_BY_ROLE[role].canCreate;
}

/**
 * Check if a role can review decisions
 */
export function canRoleReviewDecision(role: DataRoomAccessRole): boolean {
  return DECISION_ACCESS_BY_ROLE[role].canReview;
}

/**
 * Check if a role can finalize decisions
 */
export function canRoleFinalizeDecision(role: DataRoomAccessRole): boolean {
  return DECISION_ACCESS_BY_ROLE[role].canFinalize;
}

/**
 * Get visibility level for a role
 */
export function getDecisionVisibility(role: DataRoomAccessRole): 'full' | 'read_only' | 'none' {
  return DECISION_ACCESS_BY_ROLE[role].visibility;
}

/**
 * Check if role requires approval for decision access
 */
export function decisionAccessRequiresApproval(role: DataRoomAccessRole): boolean {
  return DECISION_ACCESS_BY_ROLE[role].requiresApproval;
}

/**
 * Create a new decision record (draft state)
 */
export function createDecisionRecord(params: {
  decision_type: DecisionType;
  title: string;
  description: string;
  inputs: DecisionInputs;
  created_by_user_id: string;
  created_by_role: DataRoomAccessRole;
  created_by_email?: string;
}): DecisionRecord {
  const decision_id = generateDecisionId();
  const timestamp = new Date().toISOString();

  return {
    decision_id,
    decision_type: params.decision_type,
    title: params.title,
    description: params.description,
    inputs: params.inputs,
    outputs: null,
    workflow_state: 'draft',
    is_finalized: false,
    created_by: {
      user_id: params.created_by_user_id,
      role: params.created_by_role,
      email: params.created_by_email,
    },
    created_at: timestamp,
    reviews: [],
    audit_log: [
      {
        action: 'DECISION_CREATED',
        actor_id: params.created_by_user_id,
        actor_role: params.created_by_role,
        timestamp,
        details: `Decision ${decision_id} created as draft`,
      },
    ],
  };
}

/**
 * Finalize a decision (makes it immutable)
 */
export function finalizeDecision(
  decision: DecisionRecord,
  outputs: DecisionOutputs,
  finalized_by_user_id: string,
  finalized_by_role: DataRoomAccessRole,
  finalized_by_email?: string
): DecisionRecord {
  if (decision.is_finalized) {
    throw new Error('Decision is already finalized and cannot be modified');
  }

  if (!canRoleFinalizeDecision(finalized_by_role)) {
    throw new Error(`Role ${finalized_by_role} is not authorized to finalize decisions`);
  }

  const timestamp = new Date().toISOString();

  return {
    ...decision,
    outputs,
    workflow_state: 'finalized',
    is_finalized: true,
    finalized_by: {
      user_id: finalized_by_user_id,
      role: finalized_by_role,
      email: finalized_by_email,
    },
    finalized_at: timestamp,
    audit_log: [
      ...decision.audit_log,
      {
        action: 'DECISION_FINALIZED',
        actor_id: finalized_by_user_id,
        actor_role: finalized_by_role,
        timestamp,
        details: `Decision finalized with status: ${outputs.decision_status}`,
      },
    ],
  };
}

/**
 * Add a review to a decision
 */
export function addDecisionReview(
  decision: DecisionRecord,
  reviewer_id: string,
  reviewer_role: DataRoomAccessRole,
  comments?: string
): DecisionRecord {
  if (decision.is_finalized) {
    throw new Error('Cannot add review to finalized decision');
  }

  if (!canRoleReviewDecision(reviewer_role)) {
    throw new Error(`Role ${reviewer_role} is not authorized to review decisions`);
  }

  const timestamp = new Date().toISOString();

  return {
    ...decision,
    workflow_state: 'pending_review',
    reviews: [
      ...decision.reviews,
      {
        reviewer_id,
        reviewer_role,
        reviewed_at: timestamp,
        comments,
      },
    ],
    audit_log: [
      ...decision.audit_log,
      {
        action: 'REVIEW_ADDED',
        actor_id: reviewer_id,
        actor_role: reviewer_role,
        timestamp,
        details: comments ? `Review added with comments` : 'Review added',
      },
    ],
  };
}

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate decision inputs are complete
 */
export function validateDecisionInputs(inputs: DecisionInputs): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!inputs.data_room_evidence || inputs.data_room_evidence.length === 0) {
    missing.push('data_room_evidence');
  }
  if (!inputs.jurisdiction_readiness) {
    missing.push('jurisdiction_readiness');
  }
  if (!inputs.financial_impact) {
    missing.push('financial_impact');
  }
  if (!inputs.risk_exposure) {
    missing.push('risk_exposure');
  }
  if (!inputs.client_ownership_impact) {
    missing.push('client_ownership_impact');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate decision outputs are complete
 */
export function validateDecisionOutputs(outputs: DecisionOutputs): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!outputs.decision_status) {
    missing.push('decision_status');
  }
  if (!outputs.selected_model) {
    missing.push('selected_model');
  }
  if (!outputs.required_safeguards || outputs.required_safeguards.length === 0) {
    missing.push('required_safeguards');
  }
  if (!outputs.review_timeline) {
    missing.push('review_timeline');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate that partner has no access
 */
export function validatePartnerNoDecisionAccess(): boolean {
  const partnerAccess = DECISION_ACCESS_BY_ROLE.partner;
  return (
    partnerAccess.canCreate === false &&
    partnerAccess.canReview === false &&
    partnerAccess.canFinalize === false &&
    partnerAccess.visibility === 'none'
  );
}

/**
 * Validate that only owner/founder can create decisions
 */
export function validateOnlyOwnerCanCreateDecisions(): boolean {
  return (
    DECISION_ACCESS_BY_ROLE.owner_founder.canCreate === true &&
    DECISION_ACCESS_BY_ROLE.executive.canCreate === false &&
    DECISION_ACCESS_BY_ROLE.investor.canCreate === false &&
    DECISION_ACCESS_BY_ROLE.partner.canCreate === false &&
    DECISION_ACCESS_BY_ROLE.internal_staff.canCreate === false
  );
}

// ============================================================
// DECISION INTELLIGENCE STATUS
// ============================================================

export const DECISION_INTELLIGENCE_STATUS = {
  priority: 'P4-PART5',
  status: 'IMPLEMENTED',
  decision_types: DECISION_TYPES,
  execution_models: EXECUTION_MODELS,
  decision_statuses: DECISION_STATUSES,
  features: {
    immutable_after_finalization: true,
    logged: true,
    source_data_referenced: true,
    audit_trail: true,
    review_workflow: true,
  },
  mandatory_inputs: [
    'data_room_evidence',
    'jurisdiction_readiness',
    'financial_impact',
    'risk_exposure',
    'client_ownership_impact',
  ],
  mandatory_outputs: [
    'decision_status',
    'selected_model',
    'required_safeguards',
    'review_timeline',
  ],
  access_rules: {
    creation: 'OWNER_FOUNDER_ONLY',
    review: 'EXECUTIVE_READ_ONLY',
    visibility_owner_founder: 'FULL',
    visibility_executive: 'READ_ONLY',
    visibility_investor: 'READ_ONLY_WITH_APPROVAL',
    visibility_partner: 'NONE',
  },
  validations: {
    partner_no_access: validatePartnerNoDecisionAccess(),
    owner_only_creates: validateOnlyOwnerCanCreateDecisions(),
  },
} as const;
