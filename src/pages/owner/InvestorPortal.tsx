import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandedEmailsLauncherCard from "@/components/crm/BrandedEmailsLauncherCard";
import BrandedEmailDashboard from "@/components/crm/branded-emails/BrandedEmailDashboard";
import { Users, Loader2, Search } from "lucide-react";

import type { CanonicalStatus } from "@/components/crm/branded-emails/BrandedEmailDashboard";

function useClientStats() {
  return useQuery({
    queryKey: ["client-portal-stats-canonical"],
    queryFn: async () => {
      const invRes = await (supabase as any)
        .from("client_investors")
        .select("id,email,client_name,phone,project_name,unit_type,created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      const rows = (invRes.data as any[]) ?? [];
      return { total: rows.length, rows };
    },
  });
}

export default function InvestorPortal() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CanonicalStatus>("all");
  const q = useClientStats();
  const s = q.data;

  const visible = useMemo(() => {
    const rows = s?.rows ?? [];
    const t = search.trim().toLowerCase();
    if (!t) return rows.slice(0, 100);
    return rows
      .filter((r) => [r.client_name, r.email, r.phone, r.project_name, r.unit_type].some((v) => String(v ?? "").toLowerCase().includes(t)))
      .slice(0, 100);
  }, [s?.rows, search]);

  return (
      <div data-investor-portal className="space-y-5 max-w-full overflow-hidden">
      <style>{`
        [data-investor-portal] .ip-tabs [data-state="active"] {
          background: linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          box-shadow: none !important;
        }
      `}</style>

      <div className="rounded-[28px] border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] p-5 md:p-6 shadow-[0_24px_60px_-42px_rgba(26,26,26,0.45)]">
        <div className="flex items-start gap-4 min-w-0">
          <span data-surface="emerald" className="allow-white shrink-0 size-12 rounded-2xl jj-emerald-metallic flex items-center justify-center">
            <Users className="size-5 text-white" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] font-black text-[#B89555]">Owner Backend · Clients</p>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Client Portal</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">
              JBJ client pipeline for buyers and sellers, branded outreach and campaign tracking — mirrored with the brokerage and developer portals.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="email-status" className="w-full">
        <TabsList className="ip-tabs grid w-full grid-cols-3 bg-white border border-[#064E3B]/15 p-1 h-auto rounded-lg">
          <TabsTrigger value="pipeline" className="text-[#064E3B] font-black">Client pipeline</TabsTrigger>
          <TabsTrigger value="email-status" className="text-[#064E3B] font-black">Emails sent + replies</TabsTrigger>
          <TabsTrigger value="activity" className="text-[#064E3B] font-black">Campaign activity</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <Card className="p-5 bg-white border border-[#B89555]/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex items-center min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 size-4 text-[#064E3B]" style={{ top: "50%", transform: "translateY(-50%)" }} />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…" className="h-10 pl-10 pr-3 !bg-white !text-[#0F1A16] border-emerald-900/20" />
              </div>
              <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] ml-auto">
                {visible.length.toLocaleString()} of {(s?.total ?? 0).toLocaleString()}
              </Badge>
            </div>
            {q.isLoading ? (
              <div className="flex items-center gap-2 text-[#064E3B]"><Loader2 className="size-4 animate-spin" /> Loading…</div>
            ) : visible.length === 0 ? (
              <p className="text-sm text-[#1A1A1A]/60">No clients match this filter yet.</p>
            ) : (
              <div className="divide-y divide-[#B89555]/20">
                {visible.map((r) => (
                  <div key={r.id} className="py-2 flex items-center gap-3 flex-wrap">
                    <p className="text-sm font-black text-[#0F1A16] min-w-[220px]">{r.client_name || r.email || "—"}</p>
                    <p className="text-xs text-[#1A1A1A]/70">{r.email || "—"}</p>
                    <p className="text-xs text-[#1A1A1A]/60">{r.phone || ""}</p>
                    <Badge variant="outline" className="border-[#064E3B]/30 text-[#0F1A16] bg-[#F7F2EA] ml-auto">
                      {r.project_name || r.unit_type || "client"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="email-status" className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4 bg-[#F7F2EA] border border-[#B89555]/30"><p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#064E3B]">Seller section</p><p className="text-sm font-semibold text-[#0F1A16] mt-1">Seller follow-up campaigns and unanswered replies.</p></Card>
            <Card className="p-4 bg-[#F7F2EA] border border-[#B89555]/30"><p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#064E3B]">Buyer section</p><p className="text-sm font-semibold text-[#0F1A16] mt-1">Buyer follow-up campaigns and unanswered replies.</p></Card>
          </div>
          <BrandedEmailsLauncherCard variant="client" />
          <BrandedEmailDashboard kind="clients" filter={filter} onFilterChange={setFilter} />

        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <BrandedEmailDashboard kind="clients" filter={filter} onFilterChange={setFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
