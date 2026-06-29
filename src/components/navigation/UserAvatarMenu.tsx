import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BarChart3, Inbox, ClipboardList, StickyNote, Bell,
  Heart, SlidersHorizontal, Settings, LogOut, ChevronRight, User, Palette,
  Star, PenTool,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { JbjAvatar, NotificationBadge } from "@/components/ui/ds";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMode } from "@/hooks/useUserMode";
import { useUserAlerts } from "@/hooks/useUserAlerts";
import { supabase } from "@/integrations/supabase/client";

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("") || "U";

interface Props {
  onOpenFilters?: () => void;
}

/**
 * UserAvatarMenu — emerald metallic circle with white JB initials.
 * Opens a dropdown housing everything that used to live in the header.
 */
export default function UserAvatarMenu({ onOpenFilters }: Props) {
  const { user, isOwner, signOut } = useAuth();
  const { mode } = useUserMode();
  const { data: alerts } = useUserAlerts();
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardHref =
    mode === "broker"
      ? "/broker-dashboard"
      : mode === "investor"
      ? "/investor-dashboard"
      : mode === "developer"
      ? "/developers-portal"
    : isOwner && mode === "owner"
      ? "/owner"
      : "/my-dashboard";

  const roleLabel = isOwner && mode === "owner"
    ? "Owner"
    : mode === "broker"
    ? "Broker"
    : mode === "investor"
    ? "Investor"
    : mode === "developer"
    ? "Developer"
    : null;

  const currentFull = location.pathname + location.search + location.hash;
  const isRowActive = (to?: string) => {
    if (!to) return false;
    // exact match on path+hash; for query/hash variants just check startsWith on the path part
    const [toPath] = to.split(/[?#]/);
    if (to.includes("#") || to.includes("?")) return currentFull === to || currentFull.startsWith(to);
    return location.pathname === toPath;
  };

  const { data: crmProfile } = useQuery({
    queryKey: ["crm-profile-name", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("crm_users_profile")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    (crmProfile as any)?.display_name ||
    (typeof meta.full_name === "string" ? meta.full_name : null) ||
    (typeof meta.name === "string" ? meta.name : null) ||
    user.email?.split("@")[0] ||
    "User";
  const initials = "JB";

  const showCRM = (isOwner && mode === "owner") || mode === "broker";
  const pendingTasks = alerts?.pendingTasks || 0;
  const activityCount = pendingTasks + (alerts?.totalNotificationAlerts || 0);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const Row = ({
    to, icon: Icon, label, badge, onClick,
  }: {
    to?: string;
    icon: any;
    label: string;
    badge?: number;
    onClick?: () => void;
  }) => {
    const active = isRowActive(to);
    const activeInkStyle = active
      ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }
      : { color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" };
    const activeIconStyle = active
      ? { color: "#FFFFFF", stroke: "#FFFFFF" }
      : { color: "#1A1A1A", stroke: "#1A1A1A" };

    const inner = (
      <span className="flex items-center gap-2.5 w-full" style={activeInkStyle}>
        <Icon
          className="w-5 h-5 shrink-0"
          strokeWidth={2.25}
          style={activeIconStyle}
        />
        <span
          className={`text-sm flex-1 ${active ? "font-semibold" : "font-medium"}`}
          style={activeInkStyle}
        >
          {label}
        </span>
        {badge && badge > 0 ? (
          <span data-no-contrast-guard className="shrink-0 text-white [color:#FFFFFF] [-webkit-text-fill-color:#FFFFFF]">
            <NotificationBadge count={badge} />
          </span>
        ) : null}
      </span>
    );
    return (
      <DropdownMenuItem
        asChild={!!to}
        active={active}
        onSelect={onClick ? () => onClick() : undefined}
        className="cursor-pointer rounded-md px-2.5 py-2 my-0.5"
      >
        {to ? (
          <Link
            to={to}
            data-surface={active ? "emerald" : undefined}
            data-on-dark={active ? "true" : undefined}
          >
            {inner}
          </Link>
        ) : inner}
      </DropdownMenuItem>
    );
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          data-no-contrast-guard
          data-allow-dark-cta
          data-on-dark
          data-header-control-family="circle"
          className="jj-header-icon-control jj-header-premium-control allow-white relative h-11 w-11 rounded-full border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-[filter] hover:brightness-110"
          style={{
            border: 0,
            background: "transparent",
            boxShadow: "none",
          }}
        >
          <JbjAvatar initials={initials} size="md" />
          <NotificationBadge count={activityCount} floating />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-account-menu-content
        align="end"
        sideOffset={12}
        className="z-[10100] w-[280px] p-2 rounded-xl border border-[#EFE6D6] bg-[#FDFBF7] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-2 py-2.5">
          <JbjAvatar initials={initials} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[#1A1A1A] truncate">{displayName}</div>
            <div className="text-[11px] text-[#1A1A1A]/55 truncate">JBJ account</div>
            {roleLabel && (
              <span
                data-account-role-label
                className="inline-flex items-center mt-1 px-2 py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] text-white border border-[#B89555]/40"
                style={{
                  background: "var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%))",
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                  boxShadow: "0 6px 14px -10px rgba(6,78,59,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                {roleLabel}
              </span>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="bg-[#EFE6D6] my-1" />

        {/* Dashboard — direct link to user's role/mode-aware dashboard */}
        <Row to={dashboardHref} icon={LayoutDashboard} label="Dashboard" badge={activityCount} />
        <Row to="/profile" icon={User} label="My Profile" />
        {(mode === "broker" || (isOwner && mode === "owner")) && (
          <Row to="/broker/brand" icon={Palette} label="Brand Profile" />
        )}
        {mode === "developer" && (
          <Row to="/developers-portal/company-registration" icon={Palette} label="Brand Profile" />
        )}
        <Row to="/profile?tab=settings" icon={Settings} label="Settings" />

        <div className="h-px mx-2 my-1 bg-[#EFE6D6]" aria-hidden="true" />
        <Row to="/favorites" icon={Heart} label="Favorites" />
        <div className="h-px mx-2 my-1 bg-[#EFE6D6]" aria-hidden="true" />
        <Row to="/favorites?tab=shortlist" icon={Star} label="Shortlist" />
        <div className="h-px mx-2 my-1 bg-[#EFE6D6]" aria-hidden="true" />
        <Row to="/favorites?tab=designs" icon={PenTool} label="My Design" />


        <DropdownMenuSeparator className="bg-[#EFE6D6] my-1" />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="cursor-pointer rounded-md px-2.5 py-2 my-0.5 focus:bg-[#F7F2EA] data-[highlighted]:bg-[#F7F2EA]"
        >
          <span className="flex items-center gap-2.5 w-full">
            <LogOut className="w-5 h-5 text-[#064E3B]" strokeWidth={2.25} />
            <span className="text-sm font-medium text-[#1A1A1A]">Sign out</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
