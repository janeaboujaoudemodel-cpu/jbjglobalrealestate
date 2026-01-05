import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ComingSoon from "@/pages/ComingSoon";

interface AdminBypassProps {
  children: React.ReactNode;
}

const AdminBypass = ({ children }: AdminBypassProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Check if user has admin role (uses backend function to avoid RLS blocking)
        const { data: hasAdminRole, error: roleError } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "admin" });

        if (roleError) throw roleError;

        setIsAdmin(Boolean(hasAdminRole));
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Public users see Coming Soon
  if (!isAdmin) {
    return <ComingSoon />;
  }

  // Admins see the full site
  return <>{children}</>;
};

export default AdminBypass;
