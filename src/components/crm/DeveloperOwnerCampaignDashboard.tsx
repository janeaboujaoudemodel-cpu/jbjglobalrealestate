/**
 * DeveloperOwnerCampaignDashboard — canonical spine dashboard.
 *
 * Every KPI is read from `jbj_portal_counts_v1` (portal_entity='developer').
 * Tiles are fully interactive: clicking a tile filters the embedded
 * BrandedEmailDashboard to the exact dataset that produced that KPI.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import BrandedEmailsLauncherCard from "@/components/crm/BrandedEmailsLauncherCard";
import BrandedEmailDashboard, { CanonicalStatus } from "@/components/crm/branded-emails/BrandedEmailDashboard";
import { Building2, MailCheck, Reply, Eye, ShieldCheck, Loader2, Send, MousePointerClick, RotateCw, Ban, AlertTriangle, Bot } from "lucide-react";

type TileDef = {
  key: string;
  label: string;
  icon: JSX.Element;
  value: number | undefined;
  filter: CanonicalStatus | null; // null = non-filterable (e.g. Total / Registered)
};

function useDeveloperCampaignStats() {
  return useQuery({
    queryKey: ["developer-owner-campaign-stats"],
    queryFn: async () => {
      const [countRes, regRes] = await Promise.all([
        (supabase as any)
          .from("jbj_portal_counts_v1")
          .select("total,actual_contacted,provider_accepted,delivered,opened,clicked,human_reply,automated_reply,registered,pending_registration,pending_response,retry_eligible,permanently_excluded,temporary_failure")
          .eq("portal_entity", "developer")
          .maybeSingle(),
        (supabase as any)
          .from("developers")
          .select("id,registration_status")
          .eq("is_hidden", false)
          .limit(1200),
      ]);
      const c = countRes.data ?? {};
      const regs = (regRes.data as any[]) ?? [];
      return {
        total: Number(c.total ?? regs.length),
        registered: Number(c.registered ?? regs.filter((r) => r.registration_status === "registered").length),
        contacted: Number(c.actual_contacted ?? 0),
        sent: Number(c.provider_accepted ?? 0),
        delivered: Number(c.delivered ?? 0),
        opened: Number(c.opened ?? 0),
        clicked: Number(c.clicked ?? 0),
        responded: Number(c.human_reply ?? 0),
        autoReply: Number(c.automated_reply ?? 0),
        pending: Number(c.pending_response ?? 0),
        retry: Number(c.retry_eligible ?? 0),
        excluded: Number(c.permanently_excluded ?? 0),
        temporaryFailure: Number(c.temporary_failure ?? 0),
        rows: regs,
      };
    },
  });
}

export default function DeveloperOwnerCampaignDashboard() {
  const q = useDeveloperCampaignStats();
  const s = q.data;
  const [filter, setFilter] = useState<CanonicalStatus>("all");

  const statusCounts = useMemo(() => {
    const rows = s?.rows ?? [];
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = r.registration_status || "not_started";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [s?.rows]);

  const tiles: TileDef[] = [
    { key: "total",       label: "Total developers", value: s?.total,     icon: <Building2 className="size-4" />,        filter: null },
    { key: "contacted",   label: "Contacted",        value: s?.contacted, icon: <MailCheck className="size-4" />,        filter: "sent" },
    { key: "sent",        label: "Emails sent",      value: s?.sent,      icon: <Send className="size-4" />,             filter: "sent" },
    { key: "delivered",   label: "Delivered",        value: s?.delivered, icon: <MailCheck className="size-4" />,        filter: "delivered" },
    { key: "opened",      label: "Opened",           value: s?.opened,    icon: <Eye className="size-4" />,              filter: "opened" },
    { key: "clicked",     label: "Clicked",          value: s?.clicked,   icon: <MousePointerClick className="size-4" />, filter: "clicked" },
    { key: "responded",   label: "Human replies",    value: s?.responded, icon: <Reply className="size-4" />,            filter: "responded" },
    { key: "auto_reply",  label: "Auto replies",     value: s?.autoReply, icon: <Bot className="size-4" />,              filter: "auto_reply" },
    { key: "pending",     label: "Pending response", value: s?.pending,   icon: <MailCheck className="size-4" />,        filter: "pending" },
    { key: "retry",       label: "Retry eligible",   value: s?.retry,     icon: <RotateCw className="size-4" />,         filter: "retry_eligible" },
    { key: "excluded",    label: "Permanently excluded", value: s?.excluded, icon: <Ban className="size-4" />,           filter: "permanently_excluded" },
    { key: "temp_fail",   label: "Temporary failure", value: s?.temporaryFailure, icon: <AlertTriangle className="size-4" />, filter: "deferred" },
    { key: "registered",  label: "Registered",       value: s?.registered, icon: <ShieldCheck className="size-4" />,     filter: null },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] p-5 md:p-6 shadow-[0_18px_45px_-34px_rgba(6,78,59,0.35)]">
        <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#B89555]">Developer Portal · Campaigns</p>
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Developer campaign dashboard</h2>
        <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">
          Canonical JBJ campaign spine — click any KPI to filter the campaign log below.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map((t) => {
          const clickable = t.filter !== null;
          const active = clickable && filter === t.filter;
          return (
            <button
              key={t.key}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && setFilter(t.filter!)}
              className={`text-left rounded-lg transition-all ${clickable ? "hover:border-[#B89555] hover:shadow-md cursor-pointer" : "cursor-default"}`}
              aria-pressed={active}
            >
              <Card className={`p-4 border ${active ? "border-[#064E3B] ring-2 ring-[#064E3B]/30" : "border-[#B89555]/30"} bg-[#F7F2EA]`}>
                <div className="flex items-center gap-2 text-[#064E3B]">
                  {t.icon}
                  <p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#1A1A1A]/55">{t.label}</p>
                </div>
                <p className="mt-1 text-2xl font-black text-[#064E3B]">
                  {q.isLoading ? <Loader2 className="size-5 animate-spin" /> : typeof t.value === "number" ? t.value.toLocaleString() : "—"}
                </p>
              </Card>
            </button>
          );
        })}
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
          <BrandedEmailDashboard kind="developers" filter={filter} onFilterChange={setFilter} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <BrandedEmailDashboard kind="developers" filter={filter} onFilterChange={setFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
