import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, FolderKanban, PartyPopper, Users, FileSignature, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
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
      approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
      submitted: { label: "Submitted", className: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock },
      under_review: { label: "Under Review", className: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Clock },
      rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
      draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border", icon: Clock },
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
    { title: "Company Registration", icon: Building2, value: registration ? statusBadge(registration.status) : "Not Started", path: "/developer-hub/company-registration" },
    { title: "Launch Events", icon: PartyPopper, value: eventsCount ?? 0, path: "/developer-hub/events" },
    { title: "CRM Contacts", icon: Users, value: contactsCount ?? 0, path: "/developer-hub/crm" },
    { title: "Agreements", icon: FileSignature, value: "Manage", path: "/developer-hub/agreements" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome to your Developer Hub</h1>
        <p className="text-muted-foreground mt-1">Manage your company, projects, events, and contacts from one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
            onClick={() => navigate(card.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
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
