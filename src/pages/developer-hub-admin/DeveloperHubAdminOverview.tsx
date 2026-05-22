import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Building2, ImageOff, Sparkles, Inbox, Briefcase, Calendar } from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";

interface Kpi {
  label: string;
  value: string | number;
  to: string;
  icon: typeof Building2;
}

export default function DeveloperHubAdminOverview() {
  const { data } = useQuery({
    queryKey: ["dev-hub-admin-overview"],
    queryFn: async () => {
      const [{ count: total }, { count: missing }, { count: staged }] = await Promise.all([
        supabase.from("developers").select("*", { count: "exact", head: true }),
        supabase.from("developers").select("*", { count: "exact", head: true }).or("logo_url.is.null,logo_url.eq."),
        supabase.from("developer_enrichment_log").select("*", { count: "exact", head: true }).eq("status", "staged"),
      ]);
      return { total: total ?? 0, missing: missing ?? 0, staged: staged ?? 0 };
    },
  });

  const kpis: Kpi[] = [
    { label: "Developers", value: data?.total ?? "—", to: "/developer-hub-admin/directory", icon: Building2 },
    { label: "Missing Logos", value: data?.missing ?? "—", to: "/developer-hub-admin/missing-logos", icon: ImageOff },
    { label: "Pending Approvals", value: data?.staged ?? "—", to: "/developer-hub-admin/enrichment", icon: Sparkles },
    { label: "Briefings Inbox", value: "—", to: "/developer-hub-admin/briefings", icon: Inbox },
    { label: "Active Deals", value: "—", to: "/developer-hub-admin/deals", icon: Briefcase },
    { label: "Calendar", value: "Open", to: "/developer-hub-admin/calendar", icon: Calendar },
  ];

  return (
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
  );
}
