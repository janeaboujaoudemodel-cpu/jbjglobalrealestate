import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Broker CRM Tier System
 * 
 * CRM STANDARD (Standard Broker):
 * - Leads, Contacts, Notes, Status, Assigned leads, Basic follow-ups
 * - Own isolated CRM workspace
 * - Data mirrored to Owner backend
 * 
 * CRM PRO (Premium Broker / Internal Employee):
 * - Everything in Standard +
 * - AI assistance (drafts only)
 * - Smart follow-ups
 * - Templates
 * - Automation suggestions
 * 
 * OWNER CRM:
 * - Everything
 * - Cross-broker visibility
 * - AI orchestration
 * - Automation control
 * - Commission tracking
 * - Audit logs
 */

export type BrokerTier = 'standard' | 'premium' | null;
export type CRMAccessLevel = 'none' | 'standard' | 'pro' | 'owner';

interface BrokerCRMTier {
  tier: BrokerTier;
  crmAccess: CRMAccessLevel;
  isLoading: boolean;
  // Feature flags
  canAccessLeads: boolean;
  canAccessContacts: boolean;
  canAccessNotes: boolean;
  canAccessTasks: boolean;
  canAccessFollowUps: boolean;
  // Pro features
  canAccessAIDrafts: boolean;
  canAccessTemplates: boolean;
  canAccessAutomation: boolean;
  canAccessSmartFollowUps: boolean;
  // Owner features
  canAccessCrossBroker: boolean;
  canAccessCommissionTracking: boolean;
  canAccessAuditLogs: boolean;
  canAccessAIOrchestration: boolean;
  // Broker info
  brokerId: string | null;
  brokerType: 'internal' | 'external' | null;
  hasVerifiedDeal: boolean;
  refreshTier: () => Promise<void>;
}

export function useBrokerCRMTier(): BrokerCRMTier {
  const { user, isOwner } = useAuth();
  const [tier, setTier] = useState<BrokerTier>(null);
  const [crmAccess, setCRMAccess] = useState<CRMAccessLevel>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [brokerType, setBrokerType] = useState<'internal' | 'external' | null>(null);
  const [hasVerifiedDeal, setHasVerifiedDeal] = useState(false);

  const checkTier = useCallback(async () => {
    if (!user) {
      setTier(null);
      setCRMAccess('none');
      setIsLoading(false);
      return;
    }

    // Owner has full access
    if (isOwner) {
      setTier('premium');
      setCRMAccess('owner');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Check broker_profiles for broker type
      const { data: brokerProfile } = await supabase
        .from('broker_profiles')
        .select('id, broker_type, current_tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!brokerProfile) {
        // Not a broker
        setTier(null);
        setCRMAccess('none');
        setIsLoading(false);
        return;
      }

      setBrokerId(brokerProfile.id);
      const type = brokerProfile.broker_type as 'internal' | 'external' | null;
      setBrokerType(type);

      // Internal brokers (JBJ employees) get CRM Pro
      if (type === 'internal') {
        setTier('premium');
        setCRMAccess('pro');
        setIsLoading(false);
        return;
      }

      // External brokers (partners) start with Standard
      // but can unlock Pro after first verified deal
      const { data: verifiedDeal } = await supabase
        .from('deals')
        .select('id')
        .eq('broker_user_id', user.id)
        .eq('deal_status', 'verified')
        .limit(1)
        .maybeSingle();

      if (verifiedDeal) {
        setHasVerifiedDeal(true);
        setTier('premium');
        setCRMAccess('pro');
      } else {
        setHasVerifiedDeal(false);
        setTier('standard');
        setCRMAccess('standard');
      }
    } catch (error) {
      console.error('Error checking broker CRM tier:', error);
      setTier(null);
      setCRMAccess('none');
    } finally {
      setIsLoading(false);
    }
  }, [user, isOwner]);

  useEffect(() => {
    checkTier();
  }, [checkTier]);

  // CRM Standard features (all brokers)
  const canAccessLeads = crmAccess !== 'none';
  const canAccessContacts = crmAccess !== 'none';
  const canAccessNotes = crmAccess !== 'none';
  const canAccessTasks = crmAccess !== 'none';
  const canAccessFollowUps = crmAccess !== 'none';

  // CRM Pro features (premium brokers + owner)
  const canAccessAIDrafts = crmAccess === 'pro' || crmAccess === 'owner';
  const canAccessTemplates = crmAccess === 'pro' || crmAccess === 'owner';
  const canAccessAutomation = crmAccess === 'pro' || crmAccess === 'owner';
  const canAccessSmartFollowUps = crmAccess === 'pro' || crmAccess === 'owner';

  // Owner-only features
  const canAccessCrossBroker = crmAccess === 'owner';
  const canAccessCommissionTracking = crmAccess === 'owner';
  const canAccessAuditLogs = crmAccess === 'owner';
  const canAccessAIOrchestration = crmAccess === 'owner';

  return {
    tier,
    crmAccess,
    isLoading,
    canAccessLeads,
    canAccessContacts,
    canAccessNotes,
    canAccessTasks,
    canAccessFollowUps,
    canAccessAIDrafts,
    canAccessTemplates,
    canAccessAutomation,
    canAccessSmartFollowUps,
    canAccessCrossBroker,
    canAccessCommissionTracking,
    canAccessAuditLogs,
    canAccessAIOrchestration,
    brokerId,
    brokerType,
    hasVerifiedDeal,
    refreshTier: checkTier,
  };
}
