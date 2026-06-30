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
      if (authLoading) {
        brokerLog("guard", "waiting for auth", { authLoading });
        return;
      }

      if (!user) {
        brokerLog("guard", "no user → will redirect to /auth", { path: location.pathname }, "warn");
        setIsBroker(false);
        setIsLoading(false);
        return;
      }

      brokerLog("guard", "checking broker status", {
        userId: user.id,
        email: user.email,
        path: location.pathname,
      });

      try {
        // 1. Owner short-circuit
        const ownerResp = await supabase.functions.invoke('verify-owner');
        brokerLog("guard", "verify-owner returned", {
          isOwner: ownerResp.data?.isOwner,
          error: ownerResp.error?.message,
        });
        if (ownerResp.data?.isOwner) {
          setIsBroker(true);
          setIsLoading(false);
          return;
        }

        // 2. CRM-invited broker (with self-heal by email)
        let { data: brokerRow, error: brokerErr } = await supabase
          .from('crm_brokers')
          .select('id, blocked_at, is_active_broker')
          .eq('user_id', user.id)
          .maybeSingle();
        brokerLog("guard", "crm_brokers lookup", {
          found: !!brokerRow,
          blocked: !!brokerRow?.blocked_at,
          active: !!brokerRow?.is_active_broker,
          error: brokerErr?.message,
        }, brokerErr ? "warn" : "info");

        if (!brokerRow) {
          brokerLog("guard", "no crm_brokers row → attempting link_broker_entity_by_email");
          const linkResp = await supabase.rpc('link_broker_entity_by_email' as any);
          brokerLog("guard", "link_broker_entity_by_email returned", {
            error: linkResp.error?.message,
          }, linkResp.error ? "warn" : "info");

          const retry = await supabase
            .from('crm_brokers')
            .select('id, blocked_at, is_active_broker')
            .eq('user_id', user.id)
            .maybeSingle();
          brokerRow = retry.data as any;
          brokerLog("guard", "crm_brokers retry", {
            found: !!brokerRow,
            error: retry.error?.message,
          });
        }

        if (brokerRow?.blocked_at) {
          brokerLog("guard", "broker blocked → signing out", { blocked_at: brokerRow.blocked_at }, "warn");
          await supabase.auth.signOut();
          setIsBroker(false);
          setIsLoading(false);
          return;
        }

        if (brokerRow?.is_active_broker) {
          brokerLog("guard", "active broker via crm_brokers → allowed");
          setIsBroker(true);
          setIsLoading(false);
          return;
        }

        // 3. Legacy subscription fallback
        const subResp = await supabase
          .from('broker_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        const hasBrokerRole = !!subResp.data;
        brokerLog(
          "guard",
          hasBrokerRole
            ? "active broker via broker_subscriptions → allowed"
            : "no broker role found → will redirect to /403",
          { error: subResp.error?.message },
          hasBrokerRole ? "info" : "warn",
        );
        setIsBroker(hasBrokerRole);
      } catch (err) {
        brokerLog("guard", "broker verification threw", { err: String(err) }, "error");
        console.error('Broker verification failed:', err);
        setIsBroker(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkBrokerStatus();
  }, [user, authLoading, location.pathname]);


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
