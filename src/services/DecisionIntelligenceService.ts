/**
 * DECISION INTELLIGENCE SERVICE
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Service layer for managing decision intelligence workflows.
 * Provides methods for creating, reviewing, and finalizing decisions.
 */

import type { DataRoomAccessRole } from '@/types/data-rooms';
import {
  type DecisionType,
  type DecisionStatus,
  type ExecutionModel,
  type DecisionInputs,
  type DecisionOutputs,
  type DecisionRecord,
  createDecisionRecord,
  finalizeDecision,
  addDecisionReview,
  canRoleCreateDecision,
  canRoleReviewDecision,
  canRoleFinalizeDecision,
  getDecisionVisibility,
  decisionAccessRequiresApproval,
  validateDecisionInputs,
  validateDecisionOutputs,
  DECISION_CONFIGURATION,
} from '@/config/decision-intelligence';

// ============================================================
// SERVICE STATE (In-memory for now, DB integration ready)
// ============================================================

interface DecisionIntelligenceState {
  decisions: Map<string, DecisionRecord>;
  pendingApprovals: Map<string, string[]>; // decision_id -> user_ids awaiting approval
}

let state: DecisionIntelligenceState = {
  decisions: new Map(),
  pendingApprovals: new Map(),
};

// ============================================================
// STATE OBSERVERS
// ============================================================

type StateObserver = (state: DecisionIntelligenceState) => void;
const observers: Set<StateObserver> = new Set();

function notifyObservers() {
  observers.forEach((observer) => observer(state));
}

export function subscribeToDecisionState(observer: StateObserver): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

// ============================================================
// SERVICE METHODS
// ============================================================

/**
 * Create a new decision (draft state)
 */
export function createNewDecision(params: {
  decision_type: DecisionType;
  title: string;
  description: string;
  inputs: DecisionInputs;
  actor_user_id: string;
  actor_role: DataRoomAccessRole;
  actor_email?: string;
}): { success: boolean; decision?: DecisionRecord; error?: string } {
  // Validate role can create
  if (!canRoleCreateDecision(params.actor_role)) {
    return {
      success: false,
      error: `Role ${params.actor_role} is not authorized to create decisions. Only OWNER/FOUNDER can create decisions.`,
    };
  }

  // Validate inputs are complete
  const inputValidation = validateDecisionInputs(params.inputs);
  if (!inputValidation.valid) {
    return {
      success: false,
      error: `Missing required inputs: ${inputValidation.missing.join(', ')}`,
    };
  }

  // Create the decision record
  const decision = createDecisionRecord({
    decision_type: params.decision_type,
    title: params.title,
    description: params.description,
    inputs: params.inputs,
    created_by_user_id: params.actor_user_id,
    created_by_role: params.actor_role,
    created_by_email: params.actor_email,
  });

  // Store in state
  state.decisions.set(decision.decision_id, decision);
  notifyObservers();

  return { success: true, decision };
}

/**
 * Review a decision
 */
export function reviewDecision(params: {
  decision_id: string;
  reviewer_user_id: string;
  reviewer_role: DataRoomAccessRole;
  comments?: string;
}): { success: boolean; decision?: DecisionRecord; error?: string } {
  const decision = state.decisions.get(params.decision_id);

  if (!decision) {
    return { success: false, error: 'Decision not found' };
  }

  if (decision.is_finalized) {
    return { success: false, error: 'Cannot review a finalized decision' };
  }

  if (!canRoleReviewDecision(params.reviewer_role)) {
    return {
      success: false,
      error: `Role ${params.reviewer_role} is not authorized to review decisions`,
    };
  }

  try {
    const updatedDecision = addDecisionReview(
      decision,
      params.reviewer_user_id,
      params.reviewer_role,
      params.comments
    );

    state.decisions.set(params.decision_id, updatedDecision);
    notifyObservers();

    return { success: true, decision: updatedDecision };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Finalize a decision (makes it immutable)
 */
export function finalizeDecisionRecord(params: {
  decision_id: string;
  outputs: DecisionOutputs;
  actor_user_id: string;
  actor_role: DataRoomAccessRole;
  actor_email?: string;
}): { success: boolean; decision?: DecisionRecord; error?: string } {
  const decision = state.decisions.get(params.decision_id);

  if (!decision) {
    return { success: false, error: 'Decision not found' };
  }

  if (decision.is_finalized) {
    return { success: false, error: 'Decision is already finalized' };
  }

  if (!canRoleFinalizeDecision(params.actor_role)) {
    return {
      success: false,
      error: `Role ${params.actor_role} is not authorized to finalize decisions. Only OWNER/FOUNDER can finalize.`,
    };
  }

  // Validate outputs are complete
  const outputValidation = validateDecisionOutputs(params.outputs);
  if (!outputValidation.valid) {
    return {
      success: false,
      error: `Missing required outputs: ${outputValidation.missing.join(', ')}`,
    };
  }

  try {
    const finalizedDecision = finalizeDecision(
      decision,
      params.outputs,
      params.actor_user_id,
      params.actor_role,
      params.actor_email
    );

    state.decisions.set(params.decision_id, finalizedDecision);
    notifyObservers();

    return { success: true, decision: finalizedDecision };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get a decision by ID
 */
export function getDecision(
  decision_id: string,
  actor_role: DataRoomAccessRole
): { success: boolean; decision?: DecisionRecord; error?: string } {
  const visibility = getDecisionVisibility(actor_role);

  if (visibility === 'none') {
    return {
      success: false,
      error: `Role ${actor_role} does not have visibility to decisions`,
    };
  }

  const decision = state.decisions.get(decision_id);

  if (!decision) {
    return { success: false, error: 'Decision not found' };
  }

  // Check if approval is required
  if (decisionAccessRequiresApproval(actor_role)) {
    // In a real implementation, check if approval has been granted
    // For now, we'll note that approval is required
    return {
      success: false,
      error: 'Explicit approval required to access this decision',
    };
  }

  return { success: true, decision };
}

/**
 * Get all decisions visible to a role
 */
export function getDecisionsForRole(
  actor_role: DataRoomAccessRole
): { success: boolean; decisions: DecisionRecord[]; error?: string } {
  const visibility = getDecisionVisibility(actor_role);

  if (visibility === 'none') {
    return { success: true, decisions: [] };
  }

  if (decisionAccessRequiresApproval(actor_role)) {
    // Would need to filter to only approved decisions
    return { success: true, decisions: [] };
  }

  const decisions = Array.from(state.decisions.values());

  return { success: true, decisions };
}

/**
 * Get decisions by type
 */
export function getDecisionsByType(
  decision_type: DecisionType,
  actor_role: DataRoomAccessRole
): { success: boolean; decisions: DecisionRecord[]; error?: string } {
  const result = getDecisionsForRole(actor_role);

  if (!result.success) {
    return result;
  }

  const filtered = result.decisions.filter((d) => d.decision_type === decision_type);

  return { success: true, decisions: filtered };
}

/**
 * Get decision audit log
 */
export function getDecisionAuditLog(
  decision_id: string,
  actor_role: DataRoomAccessRole
): { success: boolean; audit_log?: DecisionRecord['audit_log']; error?: string } {
  const visibility = getDecisionVisibility(actor_role);

  if (visibility !== 'full') {
    return {
      success: false,
      error: 'Only OWNER/FOUNDER can access decision audit logs',
    };
  }

  const decision = state.decisions.get(decision_id);

  if (!decision) {
    return { success: false, error: 'Decision not found' };
  }

  return { success: true, audit_log: decision.audit_log };
}

/**
 * Get service configuration status
 */
export function getServiceStatus(): {
  configuration: typeof DECISION_CONFIGURATION;
  total_decisions: number;
  finalized_count: number;
  draft_count: number;
  pending_review_count: number;
} {
  const decisions = Array.from(state.decisions.values());

  return {
    configuration: DECISION_CONFIGURATION,
    total_decisions: decisions.length,
    finalized_count: decisions.filter((d) => d.is_finalized).length,
    draft_count: decisions.filter((d) => d.workflow_state === 'draft').length,
    pending_review_count: decisions.filter((d) => d.workflow_state === 'pending_review').length,
  };
}

/**
 * Reset service state (for testing)
 */
export function resetServiceState(): void {
  state = {
    decisions: new Map(),
    pendingApprovals: new Map(),
  };
  notifyObservers();
}
