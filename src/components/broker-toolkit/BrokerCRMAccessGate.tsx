import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Lock, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrokerCRMAccessGateProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * BrokerCRMAccessGate - Restricts CRM access to registered brokers only
 * 
 * Checks if user:
 * 1. Is the verified Owner (from AuthContext - takes precedence)
 * 2. Is authenticated
 * 3. Has broker_member role in hr_user_roles table (meaning they've completed hiring process)
 * 
 * If not a registered broker, shows prompt to apply via HR/CV submission
 */
const BrokerCRMAccessGate = ({ children, fallbackPath = "/join" }: BrokerCRMAccessGateProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isOwner, ownerLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkBrokerAccess = async () => {
      // Wait for auth to finish
      if (authLoading || ownerLoading) return;

      if (!user) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      setUserEmail(user.email || null);

      // Owner override - if verified as Owner, allow immediately
      if (isOwner) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has broker_member role (completed hiring process)
        const { data: hrRole, error: hrError } = await supabase
          .from("hr_user_roles")
          .select("role, is_active")
          .eq("user_id", user.id)
          .eq("role", "broker_member")
          .eq("is_active", true)
          .maybeSingle();

        if (hrError) {
          console.error("HR role check error:", hrError);
        }

        // Also check for admin/owner roles who always have access
        const [adminResult, ownerResult] = await Promise.all([
          supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
          supabase.rpc("has_role", { _user_id: user.id, _role: "owner" }),
        ]);

        const isExecutive = 
          Boolean(adminResult.data) || 
          Boolean(ownerResult.data);

        const isRegisteredBroker = hrRole?.role === "broker_member" && hrRole?.is_active;

        setHasAccess(isExecutive || isRegisteredBroker);
      } catch (error) {
        console.error("Broker access check error:", error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkBrokerAccess();
  }, [user, authLoading, isOwner, ownerLoading]);

  if (authLoading || ownerLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[#1A1A1A] animate-pulse mx-auto mb-4" />
          <p className="text-white/70">Verifying broker registration...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Registered Brokers Only
          </h1>
          <p className="text-white/70 mb-6">
            The CRM dashboard is exclusively available to registered JBJ brokers who have completed the hiring process.
          </p>
          
          {userEmail && (
            <p className="text-white/90 text-sm mb-4">
              Logged in as: {userEmail}
            </p>
          )}

          <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-3">How to Get Access</h3>
            <ol className="text-left text-white/70 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#1A1A1A] font-bold">1.</span>
                Submit your CV through our HR portal
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1A1A1A] font-bold">2.</span>
                Complete the interview process
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1A1A1A] font-bold">3.</span>
                Sign your job offer
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1A1A1A] font-bold">4.</span>
                Access the full CRM dashboard
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(fallbackPath)}
              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Apply to Join
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-[#1A1A1A] text-white/85 hover:bg-[#1A1A1A]"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BrokerCRMAccessGate;
