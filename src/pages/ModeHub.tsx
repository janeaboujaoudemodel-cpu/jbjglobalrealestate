import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, Briefcase, Building2, User, TrendingUp } from "lucide-react";

const modeConfig: Record<string, { label: string; icon: typeof User; color: string }> = {
  investor: { label: "Investor", icon: User, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  broker: { label: "Broker", icon: Briefcase, color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  developer: { label: "Developer", icon: Building2, color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  investor_broker: { label: "Investor & Broker", icon: Users, color: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
};

const ModeHub = () => {
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["mode-hub-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("user_id, selected_mode, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const stats = preferences
    ? Object.entries(modeConfig).map(([mode, config]) => {
        const all = preferences.filter((p) => p.selected_mode === mode);
        const recent = all.filter((p) => new Date(p.created_at) >= sevenDaysAgo);
        return { mode, ...config, total: all.length, recent: recent.length };
      })
    : [];

  const totalUsers = preferences?.length || 0;
  const recentTotal = preferences?.filter((p) => new Date(p.created_at) >= sevenDaysAgo).length || 0;

  return (
    <>
      <SEOHead title="Mode Hub | Registration Analytics" description="Track user registrations by category." />
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5EBD7] to-[#D4C4A8] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mode Hub</h1>
            <p className="text-sm text-muted-foreground">Registration analytics by user category</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6]">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Users</p>
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto mt-1" /> : <p className="text-2xl font-bold text-foreground mt-1">{totalUsers}</p>}
              <p className="text-xs text-muted-foreground mt-1">+{recentTotal} this week</p>
            </CardContent>
          </Card>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.mode} className="border-2 border-gold/20">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Icon className="w-4 h-4 text-gold" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                  {isLoading ? <Skeleton className="h-8 w-12 mx-auto mt-1" /> : <p className="text-2xl font-bold text-foreground">{s.total}</p>}
                  <Badge variant="outline" className="mt-1 text-[10px]">+{s.recent} (7d)</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Registrations */}
        <Card className="border-2 border-gold/30">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="divide-y divide-gold/10">
                  {preferences?.slice(0, 50).map((p) => {
                    const config = modeConfig[p.selected_mode || "investor"] || modeConfig.investor;
                    const Icon = config.icon;
                    return (
                      <div key={p.user_id} className="flex items-center justify-between py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-gold" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground font-mono">{p.user_id.slice(0, 8)}...</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={config.color}>{config.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ModeHub;
