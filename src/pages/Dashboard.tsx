import { lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useOwnerVerification } from "@/hooks/useOwnerVerification";
import VisitorDashboard from "@/components/dashboard/VisitorDashboard";
import { Loader2 } from "lucide-react";

// Mode-driven dashboard router (LOCKED RULE).
// Visitor (no auth)         -> VisitorDashboard
// Owner verified            -> Owner cockpit (handled by /owner; we just redirect target)
// Authenticated by mode:
//   investor   -> InvestorDashboard
//   broker     -> BrokerDashboard
//   developer  -> DeveloperDashboard
// Role is no longer used to pick the view; it is only used for permissions.
const InvestorDashboard  = lazy(() => import("@/pages/InvestorDashboard"));
const BrokerDashboard    = lazy(() => import("@/pages/BrokerDashboard"));
const DeveloperDashboard = lazy(() => import("@/pages/DeveloperDashboard"));

const Spinner = () => (
  <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-[#B89555] animate-spin" />
  </div>
);

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { mode, isLoading: modeLoading } = useUserModeContext();
  const { isOwner } = useOwnerVerification();

  if (authLoading || modeLoading) return <Spinner />;
  if (!user) return <VisitorDashboard />;

  // Owner cockpit lives at /owner; if owner lands on /dashboard, route them there.
  if (isOwner) {
    if (typeof window !== "undefined" && window.location.pathname === "/dashboard") {
      window.location.replace("/owner");
    }
    return <Spinner />;
  }

  const View =
    mode === "broker"    ? BrokerDashboard :
    mode === "developer" ? DeveloperDashboard :
                           InvestorDashboard;

  return (
    <Suspense fallback={<Spinner />}>
      <View />
    </Suspense>
  );
};

export default Dashboard;
