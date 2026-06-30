import { ReactNode, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useBrokerSessionTracking } from "@/hooks/useBrokerSessionTracking";
import { brokerLog, installBrokerNetworkLogger } from "@/utils/brokerAuthDebug";

// Install the global 4xx network logger as soon as this module loads.
installBrokerNetworkLogger();


/**
 * Routes a pure broker (non-owner) is NEVER allowed to reach.
 * Owners always bypass this list because verify-owner returns isOwner=true
 * before this check runs.
 */
const BROKER_FORBIDDEN_PREFIXES = [
  "/owner",
  "/admin",
  "/internal",
  "/jbj-",
  "/developer",
  "/agency",
  "/agencies",
  "/relationships",
  "/hr",
  "/finance",
];

interface BrokerGuardProps {
  children: ReactNode;
  /** If true, shows loading spinner while checking auth. Default: true */
  showLoading?: boolean;
}

/**
 * BrokerGuard - Restricts routes to authenticated users with broker role
 * 
 * Identity model:
 * - BROKER (verified via profiles table role) → allowed
 * - OWNER (always has broker access) → allowed
 * - VISITOR (no session) → redirect to /auth with redirect-back
 * - AUTHENTICATED but NOT BROKER → redirect to /403 (AccessDenied)
 * 
 * NOTE: This is UI-layer protection only.
 * Server-side enforcement is mandatory in Edge Functions + RLS.
 */
const BrokerGuard = ({ children, showLoading = true }: BrokerGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isBroker, setIsBroker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function checkBrokerStatus() {
      if (authLoading) return;
      
      if (!user) {
        setIsBroker(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is owner (owner has all broker privileges)
        const { data: ownerData } = await supabase.functions.invoke('verify-owner');
        if (ownerData?.isOwner) {
          setIsBroker(true);
          setIsLoading(false);
          return;
        }

        // CRM-invited broker (crm_brokers.user_id link) — self-heal by email if needed
        let { data: brokerRow } = await supabase
          .from('crm_brokers')
          .select('id, blocked_at, is_active_broker')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!brokerRow) {
          // Try to link by email (idempotent)
          await supabase.rpc('link_broker_entity_by_email' as any);
          const retry = await supabase
            .from('crm_brokers')
            .select('id, blocked_at, is_active_broker')
            .eq('user_id', user.id)
            .maybeSingle();
          brokerRow = retry.data as any;
        }

        if (brokerRow?.blocked_at) {
          await supabase.auth.signOut();
          setIsBroker(false);
          setIsLoading(false);
          return;
        }

        if (brokerRow?.is_active_broker) {
          setIsBroker(true);
          setIsLoading(false);
          return;
        }

        // Fallback: legacy broker subscription
        const { data: subscriptionData } = await supabase
          .from('broker_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        const hasBrokerRole = !!subscriptionData;
        setIsBroker(hasBrokerRole);
      } catch (err) {
        console.error('Broker verification failed:', err);
        setIsBroker(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkBrokerStatus();
  }, [user, authLoading]);

  // Auto-track broker session (heartbeats + blocked-device enforcement)
  useBrokerSessionTracking(isBroker && !isLoading && !!user);



  // Show loading state while checking auth or broker status
  if ((authLoading || isLoading) && showLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // VISITOR (no session) → redirect to auth with returnTo (standardized param)
  if (!user) {
    const fullPath = location.pathname + location.search;
    try { sessionStorage.setItem("jbj_post_login_redirect", fullPath); } catch {}
    const returnTo = encodeURIComponent(fullPath);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  // Pure-broker path guard: brokers hitting an owner/admin area get bounced
  // to their workspace instead of an AccessDenied page.
  // Note: this only fires for routes wrapped in BrokerGuard. Owner routes
  // use OwnerGuard separately. The list is exported for cross-checking.
  if (
    user &&
    isBroker &&
    BROKER_FORBIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))
  ) {
    return <Navigate to="/broker/crm" replace />;
  }

  // AUTHENTICATED but NOT BROKER → AccessDenied
  if (!isBroker) {
    return <Navigate to="/403" replace />;
  }

  // BROKER → allowed
  return <>{children}</>;
};

export default BrokerGuard;

/**
 * Hook to check if current user is a Broker
 * Use this for conditional rendering in components
 */
export function useIsBroker(): { isBroker: boolean; isLoading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [isBroker, setIsBroker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkBrokerStatus() {
      if (authLoading) return;
      
      if (!user) {
        setIsBroker(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is owner
        const { data: ownerData } = await supabase.functions.invoke('verify-owner');
        if (ownerData?.isOwner) {
          setIsBroker(true);
          setIsLoading(false);
          return;
        }

        // Check for active broker subscription
        const { data: subscriptionData } = await supabase
          .from('broker_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        setIsBroker(!!subscriptionData);
      } catch (err) {
        console.error('Broker check failed:', err);
        setIsBroker(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkBrokerStatus();
  }, [user, authLoading]);

  return { isBroker, isLoading };
}
