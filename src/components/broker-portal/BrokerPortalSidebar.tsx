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
import { useUserMode } from "@/hooks/useUserMode";
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
  const { mode } = useUserMode();
  // Owner-only chrome (Back-to-Owner pill) appears ONLY when the user is
  // actively in "owner" mode. When the app owner switches mode to "broker",
  // they want a pixel-true mirror of what a real broker sees — no owner
  // shortcuts. They can return via the mode switcher in the header.
  const showOwnerChrome = (modeOwner || appOwner) && mode === "owner";
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
            width={collapsed ? 44 : 56}
            height={collapsed ? 44 : 56}
            className="object-contain flex-shrink-0"
            style={{ width: collapsed ? 44 : 56, height: collapsed ? 44 : 56 }}
           loading="lazy" decoding="async" />
          {!collapsed && (
            <span className="min-w-0 text-[#1A1A1A] font-semibold text-[13px] tracking-[0.12em] uppercase leading-[1.15] whitespace-normal break-words [overflow-wrap:anywhere] text-left">
              Global Real Estate
            </span>
          )}

        </Link>
      </div>

      {/* Nav — tight stack, scrolls if overflow */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-2.5 jj-scrollbar-gold space-y-1.5">
        {ITEMS.filter((it) => it.to !== "/broker/forms" || isOwner).map(({ to, label, icon: Icon }) => {
          const active =
            to === "/broker/portal" || to === "/broker/email"
              ? pathname === to
              : pathname === to || pathname.startsWith(to + "/");
          // Force exact-match routes (`end`) for parents whose child routes
          // would otherwise trigger NavLink's default prefix match and double-
          // light the parent row. `/broker/email` is the canonical case —
          // `/broker/email/setup` was lighting both "Smart Inbox" and "Email
          // Setup". Always pass `end` so NavLink's internal `.active` class is
          // governed only by our explicit `active` boolean above.
          return (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              data-allow-dark-cta={active ? "" : undefined}
              data-emerald={active ? "true" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2 min-h-11 text-[14px] font-semibold transition-all border outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
                active
                  ? "allow-white font-semibold border-[rgba(255,255,255,0.18)] shadow-[0_10px_22px_-12px_rgba(6,78,59,0.85)]"
                  : "border-transparent text-[#1A1A1A]/85 hover:text-[#1A1A1A] hover:border-[#B89555]/40 hover:bg-[#EFE6D6]/60",
              )}
              style={active ? { backgroundImage: "var(--jj-emerald-ombre)", color: "#FFFFFF" } : undefined}
            >
              <span data-backend-sidebar-icon-tile data-surface="emerald" className="allow-white w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/15 bg-[image:var(--jj-emerald-ombre)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75),inset_0_1px_0_rgba(255,255,255,0.18)]">
                <Icon
                  className="allow-white shrink-0 text-white w-4 h-4"
                  strokeWidth={2.15}
                  absoluteStrokeWidth
                  style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "none", opacity: 1 }}
                />
              </span>
              {!collapsed && (
                 <span data-jbj-allow-shrink className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15]" style={active ? { color: "#FFFFFF" } : undefined}>
                  {label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>


      {/* Pinned footer — seals the sidebar. Collapse button lives at the very bottom
          BELOW Sign Out per owner directive — never at the top of the sidebar. */}
      <div className="p-2.5 border-t border-[#B89555]/40 flex-shrink-0 space-y-1.5 bg-[#F7F2EA]">
        <Link
          to="/"
          onClick={onNavigate}
          title={collapsed ? "Return to Site" : undefined}
          className="w-full flex items-center gap-2.5 px-3 min-h-10 rounded-xl text-[13px] font-semibold transition-colors text-[#1A1A1A] bg-[#EFE6D6] hover:bg-[#E6DAC2] border border-[#B89555]/40"
        >
          <Home className="h-3.5 w-3.5 shrink-0 text-[#1A1A1A]" />
          {!collapsed && <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15]">Return to Site</span>}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          data-signout-action
          className="w-full flex items-center gap-2.5 px-3 min-h-10 rounded-xl text-[13px] font-semibold text-[#DC2626] bg-[#FDFBF7] border border-[#DC2626]/30 hover:bg-red-50 hover:border-[#DC2626]/50 transition-colors"
        >
          <LogOut data-signout-icon className="h-3.5 w-3.5 shrink-0 jj-signout-icon" />
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
              "w-full flex items-center gap-2 px-3 min-h-10 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.2em] transition-colors",
              "text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6] border border-[#B89555]/30",
              collapsed && "justify-center"
            )}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            {!collapsed && <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15]">Collapse</span>}
          </button>
        )}
      </div>
    </div>
  );
}
