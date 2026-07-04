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
import { getUserInitials } from "@/lib/userInitials";


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
  const initials = getUserInitials({ displayName, email: user.email, isOwner });

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
    const inkStyle = { color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" };
    const iconStyle = { color: "#064E3B", stroke: "#064E3B" };

    const inner = (
      <span className="flex items-center gap-2.5 w-full" style={inkStyle}>
        <Icon
          className="w-5 h-5 shrink-0"
          strokeWidth={2.25}
          style={iconStyle}
        />
        <span
          className={`text-sm flex-1 ${active ? "font-semibold" : "font-medium"}`}
          style={inkStyle}
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
        data-account-menu-row="true"
        data-no-emerald-hover="true"
        asChild={!!to}
        onSelect={onClick ? () => onClick() : undefined}
        className="cursor-pointer rounded-md px-2.5 py-2 my-0.5 transition-none duration-0 text-[#1A1A1A] hover:bg-[#064E3B] hover:text-white focus:bg-[#064E3B] focus:text-white data-[highlighted]:bg-[#064E3B] data-[highlighted]:text-white"
        style={{ background: "transparent", backgroundImage: "none", borderColor: "transparent", boxShadow: "none" }}
      >
        {to ? (
          <Link
            to={to}
            data-account-menu-row="true"
            data-no-emerald-hover="true"
            style={{ background: "transparent", backgroundImage: "none", borderColor: "transparent", boxShadow: "none" }}
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
        data-jbj-fast-dropdown="true"
        data-surface="champagne"
        align="end"
        sideOffset={22}
        className="z-[10100] w-[280px] p-2 rounded-xl border border-[#B89555]/40 shadow-2xl text-[#1A1A1A]"
        style={{
          backgroundImage: "linear-gradient(180deg, #FDFBF7 0%, #F7F2EA 58%, #EFE6D6 100%)",
          color: "#1A1A1A",
          WebkitTextFillColor: "#1A1A1A",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-2 py-2.5" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>
          <JbjAvatar initials={initials} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>{displayName}</div>
            <div className="text-[11px] truncate" style={{ color: "rgba(26,26,26,0.72)", WebkitTextFillColor: "rgba(26,26,26,0.72)" }}>JBJ account</div>
            {roleLabel && (
              <span
                data-account-role-label
                data-surface="emerald"
                className="inline-flex items-center mt-1 px-2 py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] border border-white/40"
                style={{
                  background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                }}
              >
                {roleLabel}
              </span>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="bg-[#B89555]/25 my-1" />

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

        <div className="h-px mx-2 my-1 bg-[#B89555]/25" aria-hidden="true" />
        <Row to="/favorites" icon={Heart} label="Favorites" />
        <div className="h-px mx-2 my-1 bg-[#B89555]/25" aria-hidden="true" />
        <Row to="/favorites?tab=shortlist" icon={Star} label="Shortlist" />
        <div className="h-px mx-2 my-1 bg-[#B89555]/25" aria-hidden="true" />
        <Row to="/favorites?tab=designs" icon={PenTool} label="My Design" />


        <DropdownMenuSeparator className="bg-[#B89555]/25 my-1" />
        <DropdownMenuItem
          onSelect={handleSignOut}
          data-account-signout-row="true"
          data-account-menu-row="true"
          data-no-emerald-hover="true"
          className="cursor-pointer rounded-md px-2.5 py-2 my-0.5 text-[#1A1A1A] hover:bg-[#064E3B] hover:text-white focus:bg-[#064E3B] focus:text-white data-[highlighted]:bg-[#064E3B] data-[highlighted]:text-white"
          style={{ background: "transparent", backgroundImage: "none", borderColor: "transparent", boxShadow: "none" }}
        >
          <span className="flex items-center gap-2.5 w-full" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>
            <LogOut className="w-5 h-5" strokeWidth={2.25} style={{ color: "#064E3B", stroke: "#064E3B" }} />
            <span className="text-sm font-medium" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>Sign out</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
