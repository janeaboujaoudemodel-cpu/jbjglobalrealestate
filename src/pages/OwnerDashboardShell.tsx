import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  BarChart3,
  MessageSquare,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsOwner } from "@/components/OwnerGuard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, path: "/owner" },
  { label: "Leads & CRM", icon: Users, path: "/owner/crm" },
  { label: "Properties", icon: Building2, path: "/owner/properties" },
  { label: "Analytics", icon: BarChart3, path: "/owner/analytics" },
  { label: "Documents", icon: FileText, path: "/owner/documents" },
  { label: "Messages", icon: MessageSquare, path: "/owner/messages" },
  { label: "Security", icon: Shield, path: "/owner/security" },
  { label: "Settings", icon: Settings, path: "/owner/settings" },
];

/**
 * OwnerDashboardShell - The main layout for Owner-only dashboard
 * 
 * Features:
 * - Collapsible sidebar navigation
 * - Owner identity display
 * - Quick actions in top bar
 * - Responsive design
 * 
 * This is the shell/layout component. Actual page content
 * is rendered via <Outlet /> (nested routes).
 */
const OwnerDashboardShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isOwner } = useIsOwner();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const isActivePath = (path: string) => {
    if (path === "/owner") {
      return location.pathname === "/owner" || location.pathname === "/owner/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300 z-40",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo Area */}
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4">
          {!sidebarCollapsed && (
            <span className="text-gold font-bold text-lg">JBJ Owner</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActivePath(item.path)
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-zinc-800">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Return to Site</span>}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Top Bar */}
        <header className="h-16 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-30 flex items-center justify-between px-6">
          <div>
            <h1 className="text-white font-semibold">Owner Dashboard</h1>
            <p className="text-zinc-500 text-xs">Owner-only access</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Owner Badge */}
            <div className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-lg px-3 py-1.5">
              <Shield className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium">Owner</span>
            </div>
            
            {/* User Email */}
            <div className="text-right">
              <p className="text-white text-sm font-medium">
                {user?.email?.split("@")[0]}
              </p>
              <p className="text-zinc-500 text-xs">Verified Owner</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboardShell;

/**
 * Default Owner Dashboard Overview
 * Shows key metrics and quick actions
 */
export const OwnerDashboardOverview = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-zinc-400">Here's an overview of your system.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Leads", value: "—", color: "text-blue-400" },
          { label: "Properties", value: "—", color: "text-green-400" },
          { label: "This Month", value: "—", color: "text-gold" },
          { label: "Pending", value: "—", color: "text-amber-400" },
        ].map((stat) => (
          <div 
            key={stat.label}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
          >
            <p className="text-zinc-500 text-sm mb-1">{stat.label}</p>
            <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for more content */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-500">
          Dashboard content will be populated based on your data.
        </p>
      </div>
    </div>
  );
};
