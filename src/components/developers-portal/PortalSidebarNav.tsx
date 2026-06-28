import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, Users, MapPin, FolderKanban,
  Inbox, Briefcase, Calendar, ShieldCheck, Sparkles, ImageOff, Settings, UserPlus,
} from "lucide-react";
import { usePortalRole } from "@/hooks/usePortalRole";

type Item = { to: string; label: string; icon: any; end?: boolean; roles: Array<"owner" | "portal_developer" | "portal_rep"> };

const ITEMS: Item[] = [
  { to: "/developers-portal", end: true, label: "Overview", icon: LayoutDashboard, roles: ["owner", "portal_developer", "portal_rep"] },
  { to: "/developers-portal/directory", label: "Developers", icon: Building2, roles: ["owner"] },
  { to: "/developers-portal/reps", label: "Sales Reps", icon: Users, roles: ["owner", "portal_developer"] },
  { to: "/developers-portal/reps/by-emirate", label: "By Emirate", icon: MapPin, roles: ["owner", "portal_developer"] },
  { to: "/developers-portal/reps/me", label: "My Profile", icon: UserPlus, roles: ["portal_rep"] },
  { to: "/developers-portal/projects", label: "Projects", icon: FolderKanban, roles: ["owner", "portal_developer", "portal_rep"] },
  { to: "/developers-portal/briefings", label: "Briefings", icon: Inbox, roles: ["owner"] },
  { to: "/developers-portal/deals", label: "Deals", icon: Briefcase, roles: ["owner"] },
  { to: "/developers-portal/calendar", label: "Calendar", icon: Calendar, roles: ["owner", "portal_developer", "portal_rep"] },
  { to: "/developers-portal/access-requests", label: "Access Requests", icon: ShieldCheck, roles: ["owner"] },
  { to: "/developers-portal/enrichment", label: "Site Rebuild", icon: Sparkles, roles: ["owner"] },
  { to: "/developers-portal/missing-logos", label: "Missing Logos", icon: ImageOff, roles: ["owner"] },
  { to: "/developers-portal/settings", label: "Settings", icon: Settings, roles: ["owner"] },
];

export default function PortalSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = usePortalRole();
  const visible = ITEMS.filter((i) => role && i.roles.includes(role));

  return (
    <nav className="p-2 space-y-0.5">
      {visible.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "w-full flex items-center gap-3 px-3 py-2 min-h-10 rounded-md text-sm transition-colors border",
              isActive
                ? "bg-[#EFE6D6] text-[#1A1A1A] font-semibold border-[#B89555]/60"
                : "text-[#1A1A1A]/75 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/60 border-transparent"
            )
          }
        >
          <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15]">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
