/**
 * AI Governance Hook
 * Provides governance controls, risk filtering, and audit logging for AI operations
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AIMode = 'public' | 'client' | 'internal';

export interface AIGovernanceConfig {
  mode: AIMode;
  dataSourceType: 'open_data' | 'aggregated' | 'internal' | 'crm';
  requiresHumanReview: boolean;
}

export interface AIAuditLog {
  timestamp: string;
  mode: AIMode;
  dataSourceType: string;
  userRole: string;
  promptCategory: string;
  wasFiltered: boolean;
  filterReason?: string;
}

export interface RiskCheckResult {
  passed: boolean;
  violations: string[];
  filteredContent?: string;
}

// Prohibited patterns for AI outputs
const RISK_PATTERNS = {
  prediction: [
    /will (increase|decrease|rise|fall|grow)/i,
    /expect(ed)? to (reach|hit|exceed)/i,
    /forecast(ed|ing)? (price|value|return)/i,
    /predict(ed|ing)? (growth|decline|appreciation)/i
  ],
  returns: [
    /guarantee(d)? return/i,
    /\d+%? (roi|return|yield|appreciation)/i,
    /investment return/i,
    /profit potential/i
  ],
  recommendation: [
    /you should (buy|sell|invest|rent)/i,
    /we recommend/i,
    /best (choice|option|investment)/i,
    /must (buy|act|invest) now/i
  ],
  comparison: [
    /best investment/i,
    /top pick/i,
    /outperform(s|ing)?/i,
    /superior (returns|value)/i
  ],
  certainty: [
    /definitely will/i,
    /guaranteed to/i,
    /without doubt/i,
    /absolutely certain/i,
    /100% sure/i
  ]
};

// Mode-specific restrictions
const MODE_RESTRICTIONS: Record<AIMode, {
  allowedDataSources: string[];
  allowsPersonalization: boolean;
  requiresDisclosure: boolean;
  canAccessCRM: boolean;
}> = {
  public: {
    allowedDataSources: ['open_data', 'aggregated'],
    allowsPersonalization: false,
    requiresDisclosure: true,
    canAccessCRM: false
  },
  client: {
    allowedDataSources: ['open_data', 'aggregated'],
    allowsPersonalization: false,
    requiresDisclosure: true,
    canAccessCRM: false
  },
  internal: {
    allowedDataSources: ['open_data', 'aggregated', 'internal', 'crm'],
    allowsPersonalization: true,
    requiresDisclosure: true,
    canAccessCRM: true
  }
};

export function useAIGovernance(config: AIGovernanceConfig) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAuditId, setLastAuditId] = useState<string | null>(null);

  const getModeRestrictions = useCallback(() => {
    return MODE_RESTRICTIONS[config.mode];
  }, [config.mode]);

  const checkRisks = useCallback((content: string): RiskCheckResult => {
    const violations: string[] = [];
    let filteredContent = content;

    Object.entries(RISK_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          violations.push(category);
        }
      });
    });

    // Remove duplicates
    const uniqueViolations = [...new Set(violations)];

    return {
      passed: uniqueViolations.length === 0,
      violations: uniqueViolations,
      filteredContent: uniqueViolations.length > 0 ? undefined : content
    };
  }, []);

  const validateDataSource = useCallback((dataSource: string): boolean => {
    const restrictions = getModeRestrictions();
    return restrictions.allowedDataSources.includes(dataSource);
  }, [getModeRestrictions]);

  const logAudit = useCallback(async (
    promptCategory: string,
    wasFiltered: boolean,
    filterReason?: string,
    additionalDetails?: Record<string, unknown>
  ): Promise<string | null> => {
    try {
      // Log to console for now - audit_logs table has specific action_type enum
      console.log('AI Audit Log:', {
        timestamp: new Date().toISOString(),
        mode: config.mode,
        dataSourceType: config.dataSourceType,
        promptCategory,
        wasFiltered,
        filterReason,
        requiresHumanReview: config.requiresHumanReview,
        userId: user?.id,
        ...additionalDetails
      });

      // Store in ai_usage_logs which accepts our data
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .insert({
          function_name: `ai_governance_${config.mode}`,
          model: 'governance',
          success: !wasFiltered,
          user_id: user?.id || null,
          error_type: wasFiltered ? filterReason : null
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to log AI audit:', error);
        return null;
      }

      setLastAuditId(data.id);
      return data.id;
    } catch (err) {
      console.error('Audit logging error:', err);
      return null;
    }
  }, [config, user]);

  const processAIOutput = useCallback(async (
    output: string,
    promptCategory: string
  ): Promise<{
    content: string | null;
    wasFiltered: boolean;
    violations: string[];
    auditId: string | null;
  }> => {
    setIsProcessing(true);

    try {
      // Validate data source
      if (!validateDataSource(config.dataSourceType)) {
        await logAudit(promptCategory, true, 'invalid_data_source');
        return {
          content: null,
          wasFiltered: true,
          violations: ['invalid_data_source'],
          auditId: lastAuditId
        };
      }

      // Check for risk patterns
      const riskResult = checkRisks(output);

      // Log the audit
      const auditId = await logAudit(
        promptCategory,
        !riskResult.passed,
        riskResult.violations.join(', ')
      );

      return {
        content: riskResult.passed ? output : null,
        wasFiltered: !riskResult.passed,
        violations: riskResult.violations,
        auditId
      };
    } finally {
      setIsProcessing(false);
    }
  }, [config, validateDataSource, checkRisks, logAudit, lastAuditId]);

  const requestHumanReview = useCallback(async (
    content: string,
    reason: string
  ): Promise<void> => {
    await logAudit('human_review_requested', false, undefined, {
      reviewReason: reason,
      contentPreview: content.substring(0, 200)
    });
  }, [logAudit]);

  const reportIncident = useCallback(async (
    incidentType: string,
    details: Record<string, unknown>
  ): Promise<void> => {
    await logAudit('ai_incident', true, incidentType, {
      severity: 'high',
      requiresReview: true,
      ...details
    });
  }, [logAudit]);

  return {
    isProcessing,
    lastAuditId,
    getModeRestrictions,
    checkRisks,
    validateDataSource,
    processAIOutput,
    logAudit,
    requestHumanReview,
    reportIncident,
    modeConfig: MODE_RESTRICTIONS[config.mode]
  };
}

export default useAIGovernance;
