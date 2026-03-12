import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Users, MessageSquare } from "lucide-react";
import EmployeesHub from "@/components/crm/EmployeesHub";
import ListingAdminManager from "@/components/crm/ListingAdminManager";

const CRMEmployees = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isCRMOwner, setIsCRMOwner] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    checkAccess();
  }, [authLoading, user, navigate]);

  const checkAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("crm_role, is_active")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        toast.error("Access denied. You must be a CRM user.");
        navigate("/crm");
        return;
      }

      if (!data.is_active) {
        toast.error("Your CRM account is inactive.");
        navigate("/crm");
        return;
      }

      const ownerRoles = ['owner_admin', 'founder'];
      setIsCRMOwner(ownerRoles.includes(data.crm_role));
    } catch (err) {
      console.error("Access check failed:", err);
      navigate("/crm");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 lg:top-[48px] z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/crm">
              <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CRM
              </Button>
            </Link>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Users className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Employees Hub</h1>
                <p className="text-xs text-zinc-500">HR, Brokers & Team Management</p>
              </div>
            </div>
          </div>
          
          {/* Chat Button */}
          <Link to="/employee-chat">
            <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with Team
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Listing Admin Manager - Only for Owner */}
        {isCRMOwner && <ListingAdminManager />}

        <Card className="border-zinc-200 bg-white">
          <CardContent className="p-6">
            <EmployeesHub userId={user?.id || ""} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CRMEmployees;
