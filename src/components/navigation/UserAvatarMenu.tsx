import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BarChart3, Inbox, ClipboardList, StickyNote, Bell,
  Heart, SlidersHorizontal, Settings, LogOut, ChevronRight, User,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
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
 * UserAvatarMenu — mother-of-pearl circle with gold border and user initials.
 * Opens a dropdown housing everything that used to live in the header.
 */
export default function UserAvatarMenu({ onOpenFilters }: Props) {
  const { user, isOwner, signOut } = useAuth();
  const { mode } = useUserMode();
  const { data: alerts } = useUserAlerts();
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardHref = isOwner
    ? "/owner"
    : mode === "broker"
    ? "/broker-dashboard"
    : mode === "investor"
    ? "/investor-dashboard"
    : mode === "developer"
    ? "/developer-portal"
    : "/my-dashboard";

  const roleLabel = isOwner
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
  const initials = getInitials(displayName);

  const showCRM = isOwner || mode === "broker";
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
    const inner = (
      <span className="flex items-center gap-2.5 w-full">
        <Icon
          className={`w-4 h-4 shrink-0 ${active ? "text-[#1A1A1A]" : "text-[#1A1A1A]/70"}`}
          strokeWidth={active ? 2 : 1.75}
        />
        <span className={`text-sm flex-1 ${active ? "font-semibold text-[#1A1A1A]" : "font-medium text-[#1A1A1A]"}`}>
          {label}
        </span>
        {badge && badge > 0 ? (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
    );
    return (
      <DropdownMenuItem
        asChild={!!to}
        onSelect={onClick ? () => onClick() : undefined}
        className={`cursor-pointer rounded-md px-2.5 py-2 my-0.5 focus:bg-[#F7F2EA] data-[highlighted]:bg-[#F7F2EA] ${
          active ? "bg-[#F7F2EA] border border-[#B89555]/30" : ""
        }`}
      >
        {to ? <Link to={to}>{inner}</Link> : inner}
      </DropdownMenuItem>
    );
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="relative h-9 w-9 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] transition-transform hover:scale-[1.04]"
          style={{
            border: "1.5px solid hsl(var(--gold))",
            boxShadow:
              "0 0 0 1px rgba(184,149,85,0.35), 0 4px 14px -4px rgba(184,149,85,0.55)",
          }}
        >
          <span
            className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background:
                "radial-gradient(120% 120% at 30% 25%, #FFFDF8 0%, #F5ECDC 38%, #E8D8B8 70%, #D9C291 100%)",
            }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "conic-gradient(from 210deg at 50% 50%, rgba(255,255,255,0.35), rgba(255,255,255,0) 25%, rgba(184,149,85,0.18) 55%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0) 100%)",
                opacity: 0.5,
                mixBlendMode: "soft-light",
              }}
            />
            <span
              className="relative text-[12px] font-bold text-[#1A1A1A] tracking-[-0.01em]"
              style={{ textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
            >
              {initials}
            </span>
          </span>
          {activityCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[#1A1A1A] text-white text-[9px] font-bold flex items-center justify-center px-1 border border-[#FDFBF7]">
              {activityCount > 9 ? "9+" : activityCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="z-[10100] w-[280px] p-2 rounded-xl border border-[#EFE6D6] bg-[#FDFBF7] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-2 py-2.5">
          <span
            className="relative h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              border: "1.5px solid hsl(var(--gold))",
              background:
                "radial-gradient(120% 120% at 30% 25%, #FFFDF8 0%, #F5ECDC 38%, #E8D8B8 70%, #D9C291 100%)",
            }}
          >
            <span className="text-[13px] font-bold text-[#1A1A1A]">{initials}</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[#1A1A1A] truncate">{displayName}</div>
            <div className="text-[11px] text-[#1A1A1A]/55 truncate">{user.email}</div>
            {roleLabel && (
              <span className="inline-flex items-center mt-1 px-1.5 py-[1px] rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1A1A1A] bg-[#EFE6D6] border border-[#B89555]/40">
                {roleLabel}
              </span>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="bg-[#EFE6D6] my-1" />

        {/* Dashboard — direct link to user's role/mode-aware dashboard */}
        <Row to={dashboardHref} icon={LayoutDashboard} label="Dashboard" badge={activityCount} />

        <DropdownMenuSeparator className="bg-[#EFE6D6] my-1" />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="cursor-pointer rounded-md px-2.5 py-2 my-0.5 focus:bg-[#F7F2EA] data-[highlighted]:bg-[#F7F2EA]"
        >
          <span className="flex items-center gap-2.5 w-full">
            <LogOut className="w-4 h-4 text-[#1A1A1A]/70" strokeWidth={1.75} />
            <span className="text-sm font-medium text-[#1A1A1A]">Sign out</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
