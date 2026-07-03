import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import PageLoader from "@/components/PageLoader";

/**
 * "My Calendar" resolver — sends the user to the correct backend calendar
 * based on their role. Never redirects to /ai-hub or /toolkit.
 */
const MyCalendarRedirect = () => {
  const { user, loading: authLoading } = useAuth() as any;
  const { role, isLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || isLoading) return;
    if (!user) {
      navigate("/auth?redirect=/my-calendar", { replace: true });
      return;
    }
    let target = "/my-dashboard#calendar";
    if (role === "broker_jbj") target = "/owner/calendar";
    else if (role === "broker" || role === "broker_partner") target = "/broker/calendar";
    else if (role === "owner") target = "/owner/calendar";
    navigate(target, { replace: true });
  }, [authLoading, isLoading, user, role, navigate]);

  return <PageLoader />;
};

export default MyCalendarRedirect;
