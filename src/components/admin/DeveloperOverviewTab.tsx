import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ProjectStat {
  developer_name: string | null;
  developer_id: string | null;
  project_count: number;
  last_updated: string | null;
  last_project_name: string | null;
}

export default function DeveloperOverviewTab() {
  // Fetch all projects with developer info
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["admin-dev-overview-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, developer_name, developer_id, updated_at, created_at, is_published, source")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch change requests / alerts
  const { data: changeRequests = [] } = useQuery({
    queryKey: ["admin-dev-change-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_tasks")
        .select("id, title, description, status, priority, created_at, category")
        .in("category", ["developer_launch", "rep_profile_update", "project_correction", "project_deletion"])
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Fetch developer reps for attribution
  const { data: reps = [] } = useQuery({
    queryKey: ["admin-dev-reps-overview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_representatives")
        .select("id, full_name, developer_name, email, created_at");
      return data || [];
    },
  });

  // Group projects by developer
  const devStats = useMemo(() => {
    const map = new Map<string, ProjectStat>();
    for (const p of projects) {
      const key = p.developer_name || "Unknown";
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          developer_name: p.developer_name,
          developer_id: p.developer_id,
          project_count: 1,
          last_updated: p.updated_at,
          last_project_name: p.name,
        });
      } else {
        existing.project_count++;
        if (p.updated_at && (!existing.last_updated || p.updated_at > existing.last_updated)) {
          existing.last_updated = p.updated_at;
          existing.last_project_name = p.name;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.project_count - a.project_count);
  }, [projects]);

  // Rep lookup by developer name
  const repsByDev = useMemo(() => {
    const map = new Map<string, typeof reps>();
    for (const r of reps) {
      const key = r.developer_name || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [reps]);

  const pendingAlerts = changeRequests.filter(cr => cr.status === "pending");

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B89555]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-[#B89555]/20">
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-[#1A1A1A]">{devStats.length}</div>
            <p className="text-sm text-muted-foreground">Developers with Projects</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
            <p className="text-sm text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-[color:var(--emerald-1)]">{projects.filter(p => p.is_published).length}</div>
            <p className="text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-orange-500">{pendingAlerts.length}</div>
            <p className="text-sm text-muted-foreground">Pending Alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending alerts from reps */}
      {pendingAlerts.length > 0 && (
        <Card className="border-orange-300/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Pending Actions from Representatives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingAlerts.slice(0, 10).map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-200/30">
                <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                  {alert.category?.replace(/_/g, ' ')}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {alert.created_at ? format(new Date(alert.created_at), "MMM d, yyyy HH:mm") : ""}
                  </p>
                </div>
                <Badge variant={alert.priority === "high" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                  {alert.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Developer project breakdown */}
      <Card className="border-[#B89555]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Developer Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_80px_120px_180px_140px] gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
              <span>Developer</span>
              <span className="text-center">Projects</span>
              <span>Last Updated</span>
              <span>Last Project</span>
              <span>Representative</span>
            </div>
            {devStats.map((stat) => {
              const devReps = repsByDev.get(stat.developer_name || "") || [];
              return (
                <div
                  key={stat.developer_name}
                  className="grid grid-cols-[1fr_80px_120px_180px_140px] gap-2 px-3 py-2.5 text-sm items-center hover:bg-muted/50 rounded-md transition-colors"
                >
                  <span data-developer-name className="font-medium min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{stat.developer_name || "Unknown"}</span>
                  <span className="text-center">
                    <Badge variant="secondary" className="text-xs">{stat.project_count}</Badge>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stat.last_updated ? format(new Date(stat.last_updated), "MMM d, yyyy") : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{stat.last_project_name || "—"}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {devReps.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-[#1A1A1A]" />
                        {devReps[0].full_name}
                        {devReps.length > 1 && <span className="text-[10px]">+{devReps.length - 1}</span>}
                      </span>
                    ) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
