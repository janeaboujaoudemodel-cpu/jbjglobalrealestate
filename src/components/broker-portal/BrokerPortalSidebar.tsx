import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, Briefcase, Database, ListChecks, Calendar, ListTodo,
  Handshake, FileSignature, GraduationCap, Sparkles, Building2, Inbox, MessagesSquare,
  Brain, Bell, Settings, ChevronLeft, ChevronRight, ArrowLeft, Crown, Home, LogOut,
  KeyRound, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { toast } from "sonner";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";

type Item = { to: string; label: string; icon: any };

// Full broker nav per the approved plan. Owner-only surfaces (e.g. global
// /owner/forms admin) are NOT listed here — brokers only see their own slice.
// NOTE: "My Leads" and "Assigned Databases" are intentionally NOT in the
// sidebar — they live as tabs inside CRM Pipeline (/broker/crm) instead, to
// match the owner CRM hub pattern. Routes still exist for direct links.
const ITEMS: Item[] = [
  { to: "/broker/portal",            label: "Dashboard",          icon: LayoutDashboard },
  { to: "/broker/crm",               label: "CRM Pipeline",       icon: Briefcase },
  { to: "/broker/listings",          label: "Listings",           icon: ListChecks },
  { to: "/broker/email",             label: "Smart Inbox",        icon: Inbox },
  { to: "/broker/email/setup",       label: "Email Setup",        icon: KeyRound },
  { to: "/broker/messages",          label: "Team & HR",          icon: MessagesSquare },
  { to: "/broker/calendar",          label: "Calendar",           icon: Calendar },
  { to: "/broker/tasks",             label: "Tasks",              icon: ListTodo },
  { to: "/broker/deals",             label: "Deals & Commission", icon: Handshake },
  { to: "/broker/developer-visits",  label: "Developer Visits",   icon: Building2 },
  { to: "/broker/forms",             label: "Forms & Agreements", icon: FileSignature },
  { to: "/broker/learning",          label: "JBJ Academy",        icon: GraduationCap },
  { to: "/broker-toolkit",           label: "Marketing Toolkit",  icon: Sparkles },
  { to: "/broker/ai",                label: "AI Sales Assistant", icon: Brain },
  { to: "/broker/notifications",     label: "Notifications",      icon: Bell },
  { to: "/broker/brand",             label: "Brand Profile",      icon: Palette },
  { to: "/broker/settings",          label: "Settings",           icon: Settings },
];

interface Props {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

export default function BrokerPortalSidebar({ collapsed = false, onToggle, onNavigate }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isOwner: modeOwner } = useUserRole();
  const { isOwner: appOwner } = useIsAppOwner();
  const isOwner = modeOwner || appOwner;
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
      {/* Logo row — matches the front-end brand lockup: monogram left, wordmark on one line. */}
      <div
        className="border-b border-[#B89555]/40 flex items-center px-3 flex-shrink-0 bg-[#F7F2EA]"
        style={{ height: "var(--shell-header-h)", minHeight: "var(--shell-header-h)", maxHeight: "var(--shell-header-h)" }}
      >
        <Link
          to="/broker/portal"
          onClick={onNavigate}
          className={cn("flex items-center min-w-0 w-full", collapsed ? "justify-center" : "justify-start gap-2.5")}
          aria-label="JBJ Global Real Estate"
        >
          <img
            src={jbjMonogramNobuffer}
            alt="JBJ"
            width={collapsed ? 36 : 42}
            height={collapsed ? 36 : 42}
            className="object-contain flex-shrink-0"
            style={{ width: collapsed ? 36 : 42, height: collapsed ? 36 : 42 }}
          />
          {!collapsed && (
            <div className="min-w-0 text-[10px] uppercase tracking-[0.13em] text-[#1A1A1A] font-extrabold whitespace-nowrap leading-none text-left truncate">
              JBJ Global Real Estate L.L.C S.O.C.
            </div>
          )}
        </Link>
      </div>

      {/* Nav — tight stack, scrolls if overflow */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-2 jj-scrollbar-gold space-y-1">
        {ITEMS.filter((it) => it.to !== "/broker/forms" || isOwner).map(({ to, label, icon: Icon }) => {
          const active =
            to === "/broker/portal" || to === "/broker/email"
              ? pathname === to
              : pathname === to || pathname.startsWith(to + "/");
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              data-allow-dark-cta={active ? "" : undefined}
              data-emerald={active ? "true" : undefined}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all border outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
                active
                  ? "allow-white font-semibold border-[rgba(255,255,255,0.18)] shadow-[0_10px_22px_-12px_rgba(6,78,59,0.85)]"
                  : "border-transparent text-[#1A1A1A]/85 hover:text-[#1A1A1A] hover:border-[#B89555]/40 hover:bg-[#EFE6D6]/60",
              )}
              style={active ? { backgroundImage: "var(--jj-emerald-ombre)", color: "#FFFFFF" } : undefined}
            >
              <span data-backend-sidebar-icon-tile data-surface="emerald" className="allow-white w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-white/15 bg-[image:var(--jj-emerald-ombre)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75),inset_0_1px_0_rgba(255,255,255,0.18)]">
                <Icon
                  className="allow-white h-3.5 w-3.5 shrink-0 text-white"
                  strokeWidth={2.1}
                  style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
                />
              </span>
              {!collapsed && (
                <span className="truncate" style={active ? { color: "#FFFFFF" } : undefined}>
                  {label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>


      {/* Pinned footer — seals the sidebar. Collapse button lives at the very bottom
          BELOW Sign Out per owner directive — never at the top of the sidebar. */}
      <div className="p-3 border-t border-[#B89555]/40 flex-shrink-0 space-y-1 bg-[#F7F2EA]">
        {isOwner && (
          <Link
            to="/owner"
            onClick={() => {
              try { sessionStorage.removeItem("jbj_broker_portal_preview"); } catch {}
              onNavigate?.();
            }}
            title={collapsed ? "Back to JBJ Owner" : undefined}
            data-no-contrast-guard
            data-allow-dark-cta
            className="allow-white w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border border-[rgba(255,255,255,0.18)] shadow-[0_10px_22px_-12px_rgba(6,78,59,0.85)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgba(6,78,59,0.95),0_0_20px_rgba(52,211,153,0.25)] hover:brightness-110"
            style={{ backgroundImage: "var(--jj-emerald-ombre)", color: "#FFFFFF" }}
          >
            <ArrowLeft className="h-5 w-5 shrink-0" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            {!collapsed && <span className="truncate" style={{ color: "#FFFFFF" }}>Back to JBJ Owner</span>}
            {!collapsed && <Crown className="h-3.5 w-3.5 ml-auto opacity-90" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />}
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
          data-signout-action
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#DC2626] bg-[#FDFBF7] border border-[#DC2626]/30 hover:bg-red-50 hover:border-[#DC2626]/50 transition-colors"
        >
          <LogOut data-signout-icon className="h-5 w-5 shrink-0 jj-signout-icon" />
          {!collapsed && <span data-signout-label>Sign Out</span>}
        </button>

        {/* Collapse toggle — always at the very bottom, below Sign Out */}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
              "text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6] border border-[#B89555]/30",
              collapsed && "justify-center"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="truncate">Collapse</span>}
          </button>
        )}
      </div>
    </div>
  );
}
