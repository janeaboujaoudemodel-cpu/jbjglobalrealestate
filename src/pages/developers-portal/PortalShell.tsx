import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Home, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2 as BuildingIcon, Users, MapPin, FolderKanban,
  Inbox, Briefcase, Calendar, ShieldCheck, Sparkles, ImageOff, Settings, UserPlus,
} from "lucide-react";
import { usePortalRole } from "@/hooks/usePortalRole";

type Item = { to: string; label: string; icon: any; end?: boolean; roles: Array<"owner" | "portal_developer" | "portal_rep"> };

const ITEMS: Item[] = [
  { to: "/developers-portal", end: true, label: "Overview", icon: LayoutDashboard, roles: ["owner", "portal_developer", "portal_rep"] },
  { to: "/developers-portal/directory", label: "Developers", icon: BuildingIcon, roles: ["owner"] },
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

/**
 * PortalShell — single shell for the standalone Developers Portal.
 * Horizontal button-row nav (no vertical sidebar, no empty top header).
 */
export default function PortalShell() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { role } = usePortalRole();

  const roleLabel =
    role === "owner" ? "Owner Console"
    : role === "portal_developer" ? "Developer Workspace"
    : role === "portal_rep" ? "Sales Rep Workspace"
    : "Developers Portal";

  const visible = ITEMS.filter((i) => role && i.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Sticky top bar — brand + horizontal button nav + actions */}
      <header className="sticky top-0 z-40 bg-[#F7F2EA]/95 backdrop-blur border-b border-[#B89555]/40">
        <div className="max-w-[1500px] mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5 pr-4 border-r border-[#B89555]/30">
            <Building2 className="w-4 h-4 text-[#1A1A1A]" />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">{roleLabel}</p>
              <span className="text-[#1A1A1A] font-semibold text-[14px] tracking-tight">Developers Portal</span>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {visible.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-colors border",
                    isActive
                      ? "bg-[#EFE6D6] text-[#1A1A1A] font-semibold border-[#B89555]/60"
                      : "text-[#1A1A1A]/75 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/70 border-transparent"
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 pl-2 border-l border-[#B89555]/30">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/70 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Site</span>
            </button>
            <button
              onClick={async () => {
                try { await signOut(); toast.success("Signed out"); navigate("/"); }
                catch { toast.error("Failed to sign out"); }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/70 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-[1500px] mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
