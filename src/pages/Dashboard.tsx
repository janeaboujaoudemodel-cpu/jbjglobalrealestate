import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import VisitorDashboard from "@/components/dashboard/VisitorDashboard";
import StandardUserDashboard from "@/components/dashboard/StandardUserDashboard";
import { Loader2 } from "lucide-react";

/**
 * Dashboard Router
 * 
 * Logic:
 * - Visitor (not logged in) → VisitorDashboard
 * - Logged in + no role → StandardUserDashboard (with role selection)
 * - Logged in + investor → redirect to /investor-dashboard
 * - Logged in + owner → redirect to /owner-dashboard
 * - Logged in + broker_partner → redirect to /broker-partner-dashboard
 * - Logged in + internal roles (admin assignment) → redirect to respective dashboards
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, isLoading: roleLoading, hasSelectedRole } = useUserRole();

  useEffect(() => {
    // Wait for both auth and role to load
    if (authLoading || roleLoading) return;

    // If user has selected a role, redirect to appropriate dashboard
    if (user && hasSelectedRole && role) {
      switch (role) {
        case 'investor':
          navigate('/investor-dashboard', { replace: true });
          break;
        case 'owner':
          navigate('/owner', { replace: true });
          break;
        case 'broker_partner':
          navigate('/broker-partner-dashboard', { replace: true });
          break;
        case 'broker':
          // Legacy broker role - redirect to broker partner
          navigate('/broker-partner-dashboard', { replace: true });
          break;
        case 'visitor':
          // Stay on dashboard, show explorer content
          break;
        default:
          // Unknown role - stay on dashboard
          break;
      }
    }
  }, [user, role, hasSelectedRole, authLoading, roleLoading, navigate]);

  // Show loading state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin" />
      </div>
    );
  }

  // Not logged in → Visitor Dashboard
  if (!user) {
    return <VisitorDashboard />;
  }

  // Logged in but no role selected → Standard User Dashboard with role selection
  if (!hasSelectedRole || !role || role === 'visitor') {
    return <StandardUserDashboard />;
  }

  // If we reach here, user has a role but hasn't been redirected yet
  // Show loading while redirect happens
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin" />
    </div>
  );
};

export default Dashboard;
