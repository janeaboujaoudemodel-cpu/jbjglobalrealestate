import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Construction, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminBypassProps {
  children: React.ReactNode;
}

// Routes that are publicly accessible without admin check
const PUBLIC_ROUTES = [
  "/",           // Landing page
  "/card",       // Digital business card
  "/auth",       // Authentication
];

// Check if path matches any public route
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(route => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(route + "/");
  });
};

/**
 * AdminBypass - Shows "Coming Soon" portal for non-admins
 * Public routes (landing page, digital card, auth) are always accessible
 * All other routes require admin/owner role
 */
const AdminBypass = ({ children }: AdminBypassProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const isPublic = isPublicRoute(location.pathname);
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    // Public routes: render immediately
    if (isPublic) {
      setHasAccess(true);
      setIsChecking(false);
      return;
    }

    let cancelled = false;

    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!cancelled) {
            setHasAccess(false);
            setIsChecking(false);
          }
          return;
        }

        const userId = session.user.id;

        const [hasAdminRoleRes, hasOwnerRoleRes, isCrmAdminRes, hasListingAdminRoleRes] =
          await Promise.all([
            supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
            supabase.rpc("has_role", { _user_id: userId, _role: "owner" }),
            supabase.rpc("is_crm_admin", { _user_id: userId }),
            supabase.rpc("has_role", { _user_id: userId, _role: "listing_admin" }),
          ]);

        const hasAdminRole = hasAdminRoleRes.data;
        const hasOwnerRole = hasOwnerRoleRes.data;
        const isCrmAdmin = isCrmAdminRes.data;
        const hasListingAdminRole = hasListingAdminRoleRes.data;

        const hasFullAccess =
          Boolean(hasAdminRole) ||
          Boolean(hasOwnerRole) ||
          Boolean(isCrmAdmin) ||
          Boolean(hasListingAdminRole);

        if (!cancelled) {
          setHasAccess(hasFullAccess);
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Error checking access:", error);
        if (!cancelled) {
          setHasAccess(false);
          setIsChecking(false);
        }
      }
    };

    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [isPublic, location.pathname]);

  // Public routes: always render
  if (isPublic) return <>{children}</>;

  // Still checking access
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Has access: render content
  if (hasAccess) return <>{children}</>;

  // No access: show Coming Soon portal
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/30"
        >
          <Construction className="w-12 h-12 text-gold" />
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Coming Soon
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
          We're building something extraordinary. This section of{" "}
          <span className="text-gold font-semibold">JBJ Global Real Estate</span>{" "}
          is currently under development and will be available shortly.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <Lock className="w-4 h-4 text-gold/50" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        {/* Admin notice */}
        <p className="text-sm text-zinc-500 mb-6">
          Authorized team members can access this area by signing in.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            Return Home
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-gold hover:bg-gold/90 text-black font-semibold"
          >
            Admin Login
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Footer branding */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} JBJ Global Real Estate LLC. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminBypass;
