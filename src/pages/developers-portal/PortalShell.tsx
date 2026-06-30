import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Home, Building2, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2 as BuildingIcon, Users, MapPin, FolderKanban,
  Inbox, Briefcase, Calendar, ShieldCheck, Sparkles, ImageOff, Settings, UserPlus,
} from "lucide-react";
import { usePortalRole } from "@/hooks/usePortalRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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

export default function PortalShell() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { role } = usePortalRole();
  const isMobile = useIsMobile();

  const roleLabel =
    role === "owner" ? "Owner Console"
    : role === "portal_developer" ? "Developer Workspace"
    : role === "portal_rep" ? "Sales Rep Workspace"
    : "Developers Portal";

  const visible = ITEMS.filter((i) => role && i.roles.includes(role));

  const handleSignOut = async () => {
    try { await signOut(); toast.success("Signed out"); navigate("/"); }
    catch { toast.error("Failed to sign out"); }
  };

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <aside
      data-backend-portal="developers"
      data-backend-sidebar="developers"
      data-surface="champagne"
      className="h-full bg-[#F7F2EA] border-r border-[#B89555]/40 flex flex-col shadow-xl shadow-[#B89555]/10"
    >
      <div className="h-[88px] px-5 border-b border-[#B89555]/40 flex items-center gap-3 shrink-0">
        <span data-backend-sidebar-icon-tile data-surface="emerald" className="allow-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[image:var(--jj-emerald-ombre)] border border-white/15 shadow-[0_10px_22px_-14px_rgba(6,78,59,0.9),inset_0_1px_0_rgba(255,255,255,0.18)]">
          <Building2 className="allow-white w-[17px] h-[17px]" strokeWidth={2.3} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#1A1A1A]/65 font-black">{roleLabel}</p>
          <h1 className="text-[17px] font-black text-[#1A1A1A] tracking-tight truncate">Developers Portal</h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 jj-scrollbar-gold">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            data-sidebar-owner-item
            className={({ isActive }) =>
              cn(
                "group min-h-12 w-full flex items-center gap-3.5 px-4 rounded-xl border text-[15px] font-extrabold transition-colors",
                isActive
                  ? "jj-emerald-metallic allow-white !text-white border-transparent shadow-[0_10px_22px_-12px_rgba(6,78,59,0.85)]"
                  : "bg-transparent !text-[#1A1A1A] border-transparent hover:border-[#B89555]/50 hover:bg-[#EFE6D6]/55"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span data-backend-sidebar-icon-tile data-surface="emerald" className="allow-white w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/15 bg-[image:var(--jj-emerald-ombre)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75),inset_0_1px_0_rgba(255,255,255,0.18)]">
                  <item.icon className="allow-white w-[13px] h-[13px]" strokeWidth={2.25} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                </span>
                <span className={cn("min-w-0 flex-1 text-left leading-[1.15]", isActive ? "text-white" : "text-[#1A1A1A]")}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#B89555]/40 space-y-2 shrink-0">
        <button
          onClick={() => { navigate("/"); onNavigate?.(); }}
          className="w-full min-h-11 flex items-center gap-3 px-4 rounded-xl border border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] text-[14px] font-extrabold hover:bg-[#EFE6D6]/65"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>Return to Site</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full min-h-11 flex items-center gap-3 px-4 rounded-xl border border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] text-[14px] font-extrabold hover:bg-[#EFE6D6]/65"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div data-backend-portal="developers" className="min-h-screen bg-[#FDFBF7]">
      {!isMobile && <div className="fixed inset-y-0 left-0 z-40 w-[320px]"><Sidebar /></div>}

      {isMobile && (
        <header className="sticky top-0 z-40 h-[72px] bg-[#F7F2EA] border-b border-[#B89555]/40 flex items-center px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" aria-label="Open developer portal navigation"><Menu className="w-4 h-4" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 bg-[#F7F2EA] border-r border-[#B89555]/40">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="ml-3 leading-tight">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/65 font-black">{roleLabel}</p>
            <span className="text-[#1A1A1A] font-black text-[16px]">Developers Portal</span>
          </div>
        </header>
      )}

      <main className={cn("min-h-screen", !isMobile && "ml-[320px]") }>
        <div className="w-full max-w-[1680px] mx-auto px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
