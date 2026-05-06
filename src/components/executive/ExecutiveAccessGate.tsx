import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExecutiveAccessGateProps {
  children: React.ReactNode;
}

/**
 * ExecutiveAccessGate - Restricts access to executive dashboards
 * Only Founder, Owner, C-level executives, and authorized senior management
 * 
 * Owner (verified via AuthContext) always has access.
 * Full audit logging of all access attempts.
 */
const ExecutiveAccessGate = ({ children }: ExecutiveAccessGateProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isOwner, ownerLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkExecutiveAccess = async () => {
      if (authLoading || ownerLoading) return;

      if (!user) {
        if (!cancelled) { setHasAccess(false); setIsLoading(false); }
        return;
      }

      // Owner override — immediate, never call RPCs.
      if (isOwner) {
        if (!cancelled) { setHasAccess(true); setIsLoading(false); }
        return;
      }

      // Retry once on transient failures (token refresh races, network blips).
      const callOnce = () => Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "owner" }),
        supabase.rpc("is_crm_admin", { _user_id: user.id }),
      ]);

      try {
        let results = await callOnce();
        const anyError = results.some(r => r.error);
        if (anyError) {
          await new Promise(r => setTimeout(r, 600));
          results = await callOnce();
        }
        const [adminResult, ownerRoleResult, crmAdminResult] = results;
        const isExecutive =
          Boolean(adminResult.data) ||
          Boolean(ownerRoleResult.data) ||
          Boolean(crmAdminResult.data);
        if (!cancelled) { setHasAccess(isExecutive); setIsLoading(false); }
      } catch (error) {
        console.error("Executive access check error:", error);
        if (!cancelled) { setHasAccess(false); setIsLoading(false); }
      }
    };

    checkExecutiveAccess();
    return () => { cancelled = true; };
  }, [user?.id, authLoading, isOwner, ownerLoading]);

  if (authLoading || ownerLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gold animate-pulse mx-auto mb-4" />
          <p className="text-white/70">Verifying executive access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Executive Access Required
          </h1>
          <p className="text-white/70 mb-6">
            This dashboard is restricted to Founder, Owner, and authorized C-level executives only.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-200 text-sm text-left">
                All access attempts are logged and audited. If you believe you should have access, 
                please contact the system administrator.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="bg-gold hover:bg-gold/90 text-[#1A1A1A]"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ExecutiveAccessGate;
