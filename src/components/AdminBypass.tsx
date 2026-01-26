import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Construction, Lock, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import jbjFullLogoLight from "@/assets/jbj-fulllogo-light.png";

interface AdminBypassProps {
  children: React.ReactNode;
}

// Routes that are publicly accessible without any authentication
const PUBLIC_ROUTES = [
  "/",           // Coming Soon landing page - public
  "/auth",       // Authentication page - always accessible
  "/card",       // Digital business card - public
];

// Check if path matches any public route
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(route => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(route + "/");
  });
};

/**
 * AdminBypass - Shows "Coming Soon" landing page for unauthenticated users
 * 
 * NEW BEHAVIOR:
 * - Public routes (/auth, /card) are always accessible to everyone
 * - All other routes (including /) require authentication
 * - Authenticated users with any team role get full access
 * - Unauthenticated users see a beautiful Coming Soon landing page
 */
const AdminBypass = ({ children }: AdminBypassProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isPublic = isPublicRoute(location.pathname);

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
          // Not authenticated - show Coming Soon landing page
          if (!cancelled) {
            setIsAuthenticated(false);
            setHasAccess(false);
            setIsChecking(false);
          }
          return;
        }

        // User is authenticated - check if they have any team role
        const userId = session.user.id;
        setIsAuthenticated(true);

        const [hasAdminRoleRes, hasOwnerRoleRes, isCrmAdminRes, hasListingAdminRoleRes, hasBrokerRoleRes] =
          await Promise.all([
            supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
            supabase.rpc("has_role", { _user_id: userId, _role: "owner" }),
            supabase.rpc("is_crm_admin", { _user_id: userId }),
            supabase.rpc("has_role", { _user_id: userId, _role: "listing_admin" }),
            supabase.rpc("has_role", { _user_id: userId, _role: "broker" }),
          ]);

        const hasAdminRole = hasAdminRoleRes.data;
        const hasOwnerRole = hasOwnerRoleRes.data;
        const isCrmAdmin = isCrmAdminRes.data;
        const hasListingAdminRole = hasListingAdminRoleRes.data;
        const hasBrokerRole = hasBrokerRoleRes.data;

        // Any team member gets full access
        const hasFullAccess =
          Boolean(hasAdminRole) ||
          Boolean(hasOwnerRole) ||
          Boolean(isCrmAdmin) ||
          Boolean(hasListingAdminRole) ||
          Boolean(hasBrokerRole);

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

  // No access: show Coming Soon landing page
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Hero Section with Coming Soon */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full text-center relative z-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <img 
              src={jbjFullLogoLight} 
              alt="JBJ Global Real Estate" 
              className="h-16 md:h-20 mx-auto"
            />
          </motion.div>

          {/* Construction Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/30"
          >
            <Building2 className="w-12 h-12 text-gold" />
          </motion.div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Coming <span className="text-gold">Soon</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-zinc-400 mb-8 leading-relaxed max-w-lg mx-auto"
          >
            We're crafting an extraordinary digital experience for Dubai's premier real estate platform.
          </motion.p>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-4 mb-10 max-w-md mx-auto"
          >
            {[
              { icon: Sparkles, label: "AI-Powered" },
              { icon: Building2, label: "Premium Listings" },
              { icon: Lock, label: "Secure Portal" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-zinc-900 border border-gold/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-gold" />
                </div>
                <span className="text-xs text-zinc-500">{item.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            <Lock className="w-4 h-4 text-gold/50" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>

          {/* Team Login Notice */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-zinc-500 mb-6"
          >
            {isAuthenticated 
              ? "Your account doesn't have team access. Please contact an administrator."
              : "JBJ Team members can sign in to access the full platform."
            }
          </motion.p>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-base"
            >
              Team Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="py-6 border-t border-zinc-900">
        <p className="text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} JBJ Global Real Estate LLC. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminBypass;