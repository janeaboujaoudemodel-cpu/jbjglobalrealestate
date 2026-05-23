import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Building2, Users, ShieldCheck, MapPin, Sparkles, ImageOff, FolderKanban, Inbox } from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";
import { usePortalRole } from "@/hooks/usePortalRole";

interface Kpi { label: string; value: string | number; to: string; icon: any }

export default function PortalOverview() {
  const { role } = usePortalRole();

  const { data } = useQuery({
    queryKey: ["portal-overview"],
    queryFn: async () => {
      const [
        { count: totalDevelopers },
        { count: registered },
        { count: pending },
        { count: reps },
        { count: openAccess },
        { count: missingLogos },
      ] = await Promise.all([
        supabase.from("developers").select("*", { count: "exact", head: true }),
        supabase.from("developers").select("*", { count: "exact", head: true }).eq("registration_status", "registered"),
        supabase.from("developers").select("*", { count: "exact", head: true }).eq("registration_status", "pending"),
        supabase.from("developer_sales_reps").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("developer_rep_access_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("developers").select("*", { count: "exact", head: true }).or("logo_url.is.null,logo_url.eq."),
      ]);
      return {
        totalDevelopers: totalDevelopers ?? 0,
        registered: registered ?? 0,
        pending: pending ?? 0,
        reps: reps ?? 0,
        openAccess: openAccess ?? 0,
        missingLogos: missingLogos ?? 0,
      };
    },
  });

  const ownerKpis: Kpi[] = [
    { label: "Developers",      value: data?.totalDevelopers ?? "—", to: "/developers-portal/directory",        icon: Building2 },
    { label: "Registered",      value: data?.registered ?? "—",      to: "/developers-portal/directory?status=registered", icon: ShieldCheck },
    { label: "Pending",         value: data?.pending ?? "—",         to: "/developers-portal/directory?status=pending",    icon: Inbox },
    { label: "Active Sales Reps", value: data?.reps ?? "—",          to: "/developers-portal/reps",             icon: Users },
    { label: "Reps by Emirate", value: "Open",                       to: "/developers-portal/reps/by-emirate",  icon: MapPin },
    { label: "Access Requests", value: data?.openAccess ?? "—",      to: "/developers-portal/access-requests",  icon: ShieldCheck },
    { label: "Missing Logos",   value: data?.missingLogos ?? "—",    to: "/developers-portal/missing-logos",    icon: ImageOff },
    { label: "Site Rebuild",    value: "Open",                       to: "/developers-portal/enrichment",       icon: Sparkles },
    { label: "Projects",        value: "Open",                       to: "/developers-portal/projects",         icon: FolderKanban },
  ];

  const devKpis: Kpi[] = [
    { label: "My Sales Reps", value: data?.reps ?? "—", to: "/developers-portal/reps", icon: Users },
    { label: "Projects",      value: "Open",            to: "/developers-portal/projects", icon: FolderKanban },
    { label: "Calendar",      value: "Open",            to: "/developers-portal/calendar", icon: MapPin },
  ];

  const repKpis: Kpi[] = [
    { label: "My Profile",  value: "Open", to: "/developers-portal/reps/me",            icon: Users },
    { label: "My Calendar", value: "Open", to: "/developers-portal/calendar",           icon: MapPin },
    { label: "Assigned Projects", value: "Open", to: "/developers-portal/projects",     icon: FolderKanban },
  ];

  const kpis =
    role === "owner" ? ownerKpis :
    role === "portal_developer" ? devKpis :
    role === "portal_rep" ? repKpis : [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Developers Portal</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A] mt-1">Overview</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          One portal for every developer, sales representative, project, and access request.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to}>
            <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 hover:border-[#B89555] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">{k.label}</p>
                  <p className="text-3xl font-semibold mt-2 text-[#1A1A1A]">{k.value}</p>
                </div>
                <IconTile icon={k.icon} tone="gold" size="md" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
