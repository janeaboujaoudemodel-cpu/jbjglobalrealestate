import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, FolderKanban, PartyPopper, Users, FileSignature,
  CheckCircle2, Clock, AlertTriangle, Bell, FolderCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DeveloperHubOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Registration data (company name + status)
  const { data: registration } = useQuery({
    queryKey: ["dev-registration", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_registrations")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Projects submitted
  const { data: projectsSubmitted } = useQuery({
    queryKey: ["dev-projects-submitted", registration?.company_name],
    queryFn: async () => {
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("developer_name", registration!.company_name!);
      return count || 0;
    },
    enabled: !!registration?.company_name,
  });

  // Projects pending (not published)
  const { data: projectsPending } = useQuery({
    queryKey: ["dev-projects-pending", registration?.company_name],
    queryFn: async () => {
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("developer_name", registration!.company_name!)
        .eq("is_published", false);
      return count || 0;
    },
    enabled: !!registration?.company_name,
  });

  const { data: eventsCount } = useQuery({
    queryKey: ["dev-events-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("launch_events")
        .select("*", { count: "exact", head: true })
        .eq("developer_user_id", user!.id);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: contactsCount } = useQuery({
    queryKey: ["dev-contacts-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("developer_contacts")
        .select("*", { count: "exact", head: true })
        .eq("developer_user_id", user!.id);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const statusBadge = (status?: string) => {
    const map: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
      approved: { label: "Approved", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
      submitted: { label: "Submitted", className: "bg-amber-500/20 text-[#1A1A1A] border-amber-500/30", icon: Clock },
      under_review: { label: "Under Review", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
      rejected: { label: "Rejected", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
      draft: { label: "Draft", className: "bg-[#FDFBF7]/10 text-[#ECE2D2]/60 border-white/20", icon: Clock },
    };
    const s = map[status || "draft"] || map.draft;
    const Icon = s.icon;
    return (
      <Badge className={s.className}>
        <Icon className="w-3 h-3 mr-1" />
        {s.label}
      </Badge>
    );
  };

  const cards = [
    { title: "Company Registration", icon: Building2, value: registration ? statusBadge(registration.status) : statusBadge("draft"), path: "/developer-hub/company-registration" },
    { title: "Projects Submitted", icon: FolderKanban, value: projectsSubmitted ?? 0, path: "/developer-hub/projects" },
    { title: "Projects Pending", icon: FolderCheck, value: projectsPending ?? 0, path: "/developer-hub/projects" },
    { title: "Launch Events", icon: PartyPopper, value: eventsCount ?? 0, path: "/developer-hub/events" },
    { title: "CRM Contacts", icon: Users, value: contactsCount ?? 0, path: "/developer-hub/crm" },
    { title: "Agreements", icon: FileSignature, value: "Manage", path: "/developer-hub/agreements" },
    { title: "Notifications", icon: Bell, value: 0, path: "/developer-hub" },
  ];

  return (
    <div className="space-y-8">
      {/* Developer Identity Block */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-[#ECE2D2]">Developer Hub</h1>
        <p className="text-[#1A1A1A] font-medium text-lg">
          {registration?.company_name || "Complete your company registration"}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[#ECE2D2]/50 text-sm">{user?.email}</span>
          {registration && statusBadge(registration.status)}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer min-h-[120px] bg-[hsl(38,35%,14%)]/80 border-[#B89555]/20 hover:border-[#B89555]/40 transition-all group"
            onClick={() => navigate(card.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#ECE2D2]/60">{card.title}</CardTitle>
              <card.icon className="w-5 h-5 text-[#1A1A1A]/70 group-hover:text-[#1A1A1A] transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1A1A1A]">
                {typeof card.value === "number" ? card.value : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DeveloperHubOverview;
