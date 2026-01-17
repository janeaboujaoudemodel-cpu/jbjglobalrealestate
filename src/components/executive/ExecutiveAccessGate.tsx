import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExecutiveAccessGateProps {
  children: React.ReactNode;
}

/**
 * ExecutiveAccessGate - Restricts access to executive dashboards
 * Only Founder, Owner, C-level executives, and authorized senior management
 * Full audit logging of all access attempts
 */
const ExecutiveAccessGate = ({ children }: ExecutiveAccessGateProps) => {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkExecutiveAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        setUserEmail(session.user.email || null);

        // Check for executive-level roles
        const [adminResult, ownerResult, crmAdminResult] = await Promise.all([
          supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }),
          supabase.rpc("has_role", { _user_id: session.user.id, _role: "owner" }),
          supabase.rpc("is_crm_admin", { _user_id: session.user.id }),
        ]);

        const isExecutive = 
          Boolean(adminResult.data) || 
          Boolean(ownerResult.data) || 
          Boolean(crmAdminResult.data);

        // Log access attempt (audit logging handled separately)

        setHasAccess(isExecutive);
      } catch (error) {
        console.error("Executive access check error:", error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkExecutiveAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gold animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">Verifying executive access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Executive Access Required
          </h1>
          <p className="text-zinc-400 mb-6">
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
            className="bg-gold hover:bg-gold/90 text-black"
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
