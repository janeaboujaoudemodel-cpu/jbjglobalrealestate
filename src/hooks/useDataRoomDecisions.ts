/**
 * DATA ROOM DECISION WORKFLOW HOOK
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * React hook for accessing data room decision workflows.
 * Separate from general decision intelligence to maintain isolation.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DataRoomAccessRole } from '@/types/data-rooms';
import {
  type DecisionType,
  type DecisionInputs,
  type DecisionOutputs,
  type DecisionRecord,
  DECISION_TYPES,
  EXECUTION_MODELS,
  DECISION_STATUSES,
  DECISION_INTELLIGENCE_STATUS,
} from '@/config/decision-intelligence';
import {
  createNewDecision,
  reviewDecision,
  finalizeDecisionRecord,
  getDecision,
  getDecisionsForRole,
  getDecisionsByType,
  getDecisionAuditLog,
  getServiceStatus,
  subscribeToDecisionState,
} from '@/services/DecisionIntelligenceService';

export interface DataRoomDecisionState {
  decisions: DecisionRecord[];
  isLoading: boolean;
  error: string | null;
  serviceStatus: ReturnType<typeof getServiceStatus> | null;
}

export function useDataRoomDecisions(actorRole: DataRoomAccessRole = 'owner_founder') {
  const [state, setState] = useState<DataRoomDecisionState>({
    decisions: [],
    isLoading: true,
    error: null,
    serviceStatus: null,
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribeToDecisionState(() => {
      refreshData();
    });

    // Initial load
    refreshData();

    return unsubscribe;
  }, [actorRole]);

  const refreshData = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = getDecisionsForRole(actorRole);
      const status = getServiceStatus();

      setState({
        decisions: result.decisions,
        isLoading: false,
        error: result.success ? null : result.error || null,
        serviceStatus: status,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
    }
  }, [actorRole]);

  const createDecision = useCallback(
    async (params: {
      decision_type: DecisionType;
      title: string;
      description: string;
      inputs: DecisionInputs;
      actor_user_id: string;
      actor_email?: string;
    }) => {
      const result = createNewDecision({
        ...params,
        actor_role: actorRole,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.decision;
    },
    [actorRole]
  );

  const addReview = useCallback(
    async (params: {
      decision_id: string;
      reviewer_user_id: string;
      comments?: string;
    }) => {
      const result = reviewDecision({
        ...params,
        reviewer_role: actorRole,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.decision;
    },
    [actorRole]
  );

  const finalize = useCallback(
    async (params: {
      decision_id: string;
      outputs: DecisionOutputs;
      actor_user_id: string;
      actor_email?: string;
    }) => {
      const result = finalizeDecisionRecord({
        ...params,
        actor_role: actorRole,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.decision;
    },
    [actorRole]
  );

  const getDecisionById = useCallback(
    (decision_id: string) => {
      return getDecision(decision_id, actorRole);
    },
    [actorRole]
  );

  const getByType = useCallback(
    (decision_type: DecisionType) => {
      return getDecisionsByType(decision_type, actorRole);
    },
    [actorRole]
  );

  const getAuditLog = useCallback(
    (decision_id: string) => {
      return getDecisionAuditLog(decision_id, actorRole);
    },
    [actorRole]
  );

  return {
    // State
    ...state,
    
    // Actions
    refreshData,
    createDecision,
    addReview,
    finalize,
    getDecisionById,
    getByType,
    getAuditLog,

    // Constants
    decisionTypes: DECISION_TYPES,
    executionModels: EXECUTION_MODELS,
    decisionStatuses: DECISION_STATUSES,
    systemStatus: DECISION_INTELLIGENCE_STATUS,
  };
}
