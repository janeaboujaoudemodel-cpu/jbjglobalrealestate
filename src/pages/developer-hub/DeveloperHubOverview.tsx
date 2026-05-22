import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, FolderKanban, PartyPopper, Users, FileSignature,
  CheckCircle2, Clock, AlertTriangle, Bell, FolderCheck, Sparkles, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DeveloperHubOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const { data: rep } = useQuery({
    queryKey: ["dev-rep", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_representatives")
        .select("id, status, current_developer_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: developer } = useQuery({
    queryKey: ["dev-trust", rep?.current_developer_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developers")
        .select("id, name, trust_level, approved_at")
        .eq("id", rep!.current_developer_id!)
        .maybeSingle();
      return data;
    },
    enabled: !!rep?.current_developer_id,
  });

  const trustLevel = (developer?.trust_level as string) ?? "pending";

  const trustBadge = () => {
    if (trustLevel === "auto_publish") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Live publishing enabled
        </span>
      );
    }
    if (trustLevel === "suspended") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <ShieldAlert className="w-3.5 h-3.5" /> Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5" /> Awaiting first approval
      </span>
    );
  };

  const { data: projectsSubmitted } = useQuery({
    queryKey: ["dev-projects-submitted", developer?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("developer_id", developer!.id);
      return count || 0;
    },
    enabled: !!developer?.id,
  });

  const { data: projectsPending } = useQuery({
    queryKey: ["dev-projects-pending", developer?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("developer_id", developer!.id)
        .eq("is_published", false);
      return count || 0;
    },
    enabled: !!developer?.id,
  });

  const statusBadge = (status?: string) => {
    const map: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
      approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
      submitted: { label: "Submitted", className: "bg-amber-50 text-amber-800 border-amber-200", icon: Clock },
      under_review: { label: "Under Review", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
      rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
      draft: { label: "Draft", className: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40", icon: Clock },
    };
    const s = map[status || "draft"] || map.draft;
    const Icon = s.icon;
    return (
      <Badge variant="outline" className={`${s.className} font-semibold`}>
        <Icon className="w-3 h-3 mr-1" /> {s.label}
      </Badge>
    );
  };

  const cards = [
    { title: "Company Profile", icon: Building2, value: registration ? statusBadge(registration.status) : statusBadge("draft"), path: "/developer-hub/company-registration" },
    { title: "My Projects", icon: FolderKanban, value: projectsSubmitted ?? 0, path: "/developer-hub/projects" },
    { title: "Pending Review", icon: FolderCheck, value: projectsPending ?? 0, path: "/developer-hub/projects" },
    { title: "Launch Events", icon: PartyPopper, value: 0, path: "/developer-hub/events" },
    { title: "CRM", icon: Users, value: "Open", path: "/developer-hub/crm" },
    { title: "Agreements", icon: FileSignature, value: "Manage", path: "/developer-hub/agreements" },
    { title: "Notifications", icon: Bell, value: 0, path: "/developer-hub/activity" },
  ];

  return (
    <div className="space-y-8">
      {/* Identity */}
      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
          {developer?.name || registration?.company_name || "Welcome"}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5">
          {registration && statusBadge(registration.status)}
          {trustBadge()}
        </div>
      </div>

      {/* Trust banner */}
      {trustLevel === "auto_publish" && (
        <div className="rounded-lg border border-[#B89555]/40 bg-[#F7F2EA] px-5 py-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
          <div className="text-sm text-[#1A1A1A]">
            <p className="font-semibold mb-0.5">You're cleared for live publishing.</p>
            <p className="text-[#1A1A1A]/70">
              Every project, edit, brochure, image or logo you submit goes live on the public portal immediately — no further approval needed.
            </p>
          </div>
        </div>
      )}

      {trustLevel === "pending" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50/60 px-5 py-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-800 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-0.5">Awaiting first owner approval.</p>
            <p className="text-amber-900/80">
              Submit your company profile + first project. After one-time approval, every future edit publishes live automatically.
            </p>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer min-h-[120px] bg-[#F7F2EA] border border-[#B89555]/40 hover:border-[#B89555] transition-colors group rounded-lg"
            onClick={() => navigate(card.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#1A1A1A]/70">{card.title}</CardTitle>
              <card.icon className="w-4 h-4 text-[#1A1A1A]/60 group-hover:text-[#1A1A1A] transition-colors" strokeWidth={1.75} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DeveloperHubOverview;
