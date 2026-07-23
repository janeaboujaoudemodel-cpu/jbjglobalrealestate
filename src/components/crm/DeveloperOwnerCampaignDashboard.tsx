/**
 * DeveloperOwnerCampaignDashboard
 *
 * Mirrors the Brokerage Portal's campaign dashboard layout: insight tiles
 * (contacted, sent, opened, responded, registered) + tabbed body
 * (Registration status | Emails sent + replies | Campaign activity).
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import BrandedEmailsLauncherCard from "@/components/crm/BrandedEmailsLauncherCard";
import BrandedEmailDashboard from "@/components/crm/branded-emails/BrandedEmailDashboard";
import { Building2, MailCheck, Reply, Eye, ShieldCheck, Loader2 } from "lucide-react";

function useDeveloperCampaignStats() {
  return useQuery({
    queryKey: ["developer-owner-campaign-stats"],
    queryFn: async () => {
      const [regRes, logRes, openRes] = await Promise.all([
        (supabase as any)
          .from("crm_developer_registry")
          .select("id,registration_status")
          .limit(5000),
        (supabase as any)
          .from("crm_relationship_email_log")
          .select("direction,to_emails,entity_id")
          .eq("entity_type", "developer_registry")
          .limit(2000),
        (supabase as any)
          .from("crm_campaign_recipients")
          .select("email,opened_at")
          .not("opened_at", "is", null)
          .limit(2000),
      ]);

      const regs = (regRes.data as any[]) ?? [];
      const logs = (logRes.data as any[]) ?? [];
      const opens = (openRes.data as any[]) ?? [];

      const contacted = new Set<string>();
      let sentCount = 0;
      let respondedEntities = new Set<string>();
      for (const l of logs) {
        if (l.direction === "outbound") {
          sentCount++;
          if (l.entity_id) contacted.add(l.entity_id);
        }
        if (l.direction === "inbound" && l.entity_id) {
          respondedEntities.add(l.entity_id);
        }
      }
      return {
        totalDevelopers: regs.length,
        registered: regs.filter((r) => r.registration_status === "registered").length,
        contacted: contacted.size,
        sent: sentCount,
        opened: opens.length,
        responded: respondedEntities.size,
        rows: regs,
      };
    },
  });
}

export default function DeveloperOwnerCampaignDashboard() {
  const q = useDeveloperCampaignStats();
  const s = q.data;

  const statusCounts = useMemo(() => {
    const rows = s?.rows ?? [];
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = r.registration_status || "not_started";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [s?.rows]);

  const tiles: Array<[string, number | undefined, JSX.Element]> = [
    ["Total developers", s?.totalDevelopers, <Building2 className="size-4" />],
    ["Contacted", s?.contacted, <MailCheck className="size-4" />],
    ["Emails sent", s?.sent, <MailCheck className="size-4" />],
    ["Opened", s?.opened, <Eye className="size-4" />],
    ["Responded", s?.responded, <Reply className="size-4" />],
    ["Registered", s?.registered, <ShieldCheck className="size-4" />],
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] p-5 md:p-6 shadow-[0_18px_45px_-34px_rgba(6,78,59,0.35)]">
        <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#B89555]">Developer Portal · Campaigns</p>
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Developer campaign dashboard</h2>
        <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">
          JBJ outreach to developers — insights, branded templates, and campaign tracking in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map(([label, value, icon]) => (
          <Card key={label} className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
            <div className="flex items-center gap-2 text-[#064E3B]">
              {icon}
              <p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#1A1A1A]/55">{label}</p>
            </div>
            <p className="mt-1 text-2xl font-black text-[#064E3B]">
              {q.isLoading ? <Loader2 className="size-5 animate-spin" /> : typeof value === "number" ? value.toLocaleString() : "—"}
            </p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="email-status" className="w-full">
        <TabsList className="dp-tabs grid w-full grid-cols-3 bg-white border border-[#064E3B]/15 p-1 h-auto rounded-lg">
          <TabsTrigger value="registration" className="text-[#064E3B] font-black">Registration status</TabsTrigger>
          <TabsTrigger value="email-status" className="text-[#064E3B] font-black">Emails sent + replies</TabsTrigger>
          <TabsTrigger value="activity" className="text-[#064E3B] font-black">Campaign activity</TabsTrigger>
        </TabsList>

        <TabsContent value="registration" className="mt-4">
          <Card className="p-5 bg-white border border-[#B89555]/30">
            <p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#B89555] mb-3">Registration breakdown</p>
            {q.isLoading ? (
              <div className="flex items-center gap-2 text-[#064E3B]"><Loader2 className="size-4 animate-spin" /> Loading…</div>
            ) : statusCounts.length === 0 ? (
              <p className="text-sm text-[#1A1A1A]/60">No developer registry records yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {statusCounts.map(([status, count]) => (
                  <Badge key={status} variant="outline" className="border-[#064E3B]/30 text-[#0F1A16] bg-[#F7F2EA]">
                    <span className="font-black mr-1">{count.toLocaleString()}</span>
                    <span className="opacity-70">{status.replace(/_/g, " ")}</span>
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="email-status" className="mt-4 space-y-4">
          <BrandedEmailsLauncherCard variant="developer" />
          <BrandedEmailDashboard kind="developers" />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <BrandedEmailDashboard kind="developers" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
