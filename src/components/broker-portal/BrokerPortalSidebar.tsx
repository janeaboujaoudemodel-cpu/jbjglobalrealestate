import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, Briefcase, Database, ListChecks, Calendar, ListTodo,
  Handshake, BadgeDollarSign, FileText, FileSignature, GraduationCap, Sparkles,
  Brain, Bell, Settings, ChevronLeft, ChevronRight, ArrowLeft, Crown, Home, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Item = { to: string; label: string; icon: any };

// Full broker nav per the approved plan. Owner-only surfaces (e.g. global
// /owner/forms admin) are NOT listed here — brokers only see their own slice.
const ITEMS: Item[] = [
  { to: "/broker/portal",        label: "Dashboard",          icon: LayoutDashboard },
  { to: "/broker/leads",         label: "My Leads",           icon: Users },
  { to: "/broker/crm",           label: "CRM Pipeline",       icon: Briefcase },
  { to: "/broker/databases",     label: "Assigned Databases", icon: Database },
  { to: "/broker/listings",      label: "Listings",           icon: ListChecks },
  { to: "/broker/calendar",      label: "Calendar",           icon: Calendar },
  { to: "/broker/tasks",         label: "Tasks",              icon: ListTodo },
  { to: "/broker/deals",         label: "Deals",              icon: Handshake },
  { to: "/broker/commissions",   label: "Commissions",        icon: BadgeDollarSign },
  { to: "/broker/documents",     label: "Documents",          icon: FileText },
  { to: "/broker/forms",         label: "Forms & Agreements", icon: FileSignature },
  { to: "/broker/learning",      label: "JBJ Academy",        icon: GraduationCap },
  { to: "/broker-toolkit",       label: "Marketing Toolkit",  icon: Sparkles },
  { to: "/broker/ai",            label: "AI Sales Assistant", icon: Brain },
  { to: "/broker/notifications", label: "Notifications",      icon: Bell },
  { to: "/broker/settings",      label: "Settings",           icon: Settings },
];

interface Props {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

export default function BrokerPortalSidebar({ collapsed = false, onToggle, onNavigate }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isOwner } = useUserRole();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0" data-no-contrast-guard>
      {/* Logo row — height locked to --shell-header-h so divider aligns with top bar */}
      <div
        className="border-b border-[#B89555]/40 flex items-center justify-between px-3 flex-shrink-0 bg-[#F7F2EA]"
        style={{ height: "var(--shell-header-h)", minHeight: "var(--shell-header-h)", maxHeight: "var(--shell-header-h)" }}
      >
        {!collapsed ? (
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.22em] text-[#1A1A1A]/55 truncate">
              JBJ GLOBAL REAL ESTATE
            </div>
            <div className="text-sm font-semibold text-[#1A1A1A] mt-0.5 truncate">Broker Portal</div>
          </div>
        ) : (
          <span className="text-sm font-bold text-[#1A1A1A]">JBJ</span>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="h-7 w-7 grid place-items-center rounded-md border border-[#B89555]/30 text-[#1A1A1A]/80 hover:bg-[#EFE6D6] flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Nav — tight stack, scrolls if overflow */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-2 jj-scrollbar-gold space-y-1">
        {ITEMS.filter((it) => it.to !== "/broker/forms" || isOwner).map(({ to, label, icon: Icon }) => {
          const active =
            to === "/broker/portal" ? pathname === to : pathname === to || pathname.startsWith(to + "/");
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors border border-transparent outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
                "text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:border-[#B89555]/40",
                active && "text-[#1A1A1A] font-semibold border-[#B89555] bg-transparent",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>


      {/* Pinned footer — seals the sidebar (mirrors OwnerDashboardShell) */}
      <div className="p-3 border-t border-[#B89555]/40 flex-shrink-0 space-y-1 bg-[#F7F2EA]">
        {isOwner && (
          <Link
            to="/owner/crm"
            onClick={() => {
              try { sessionStorage.removeItem("jbj_broker_portal_preview"); } catch {}
              onNavigate?.();
            }}
            title={collapsed ? "Owner Backend" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-[#102540] text-white hover:bg-[#1a3d63]"
            data-allow-dark-cta
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">Owner Backend</span>}
            {!collapsed && <Crown className="h-3.5 w-3.5 ml-auto opacity-80" />}
          </Link>
        )}
        <Link
          to="/"
          onClick={onNavigate}
          title={collapsed ? "Return to Site" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-[#1A1A1A] bg-[#EFE6D6] hover:bg-[#E6DAC2] border border-[#B89555]/40"
        >
          <Home className="h-5 w-5 shrink-0 text-[#1A1A1A]" />
          {!collapsed && <span className="truncate">Return to Site</span>}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#1A1A1A] hover:!text-red-700 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
