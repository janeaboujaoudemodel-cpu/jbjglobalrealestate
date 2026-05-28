import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, MessageSquare, Mail, Phone, TrendingUp, RefreshCw,
  Sparkles, ArrowRight,
} from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import AssistantLeadList, { type ListLead } from "@/components/ai-broker/AssistantLeadList";
import AssistantChat, { type ChatTurn } from "@/components/ai-broker/AssistantChat";
import AssistantInsights, { type Match } from "@/components/ai-broker/AssistantInsights";
import LeadFiltersPopover, { type LeadFilters } from "@/components/ai-broker/LeadFiltersPopover";

interface Lead extends ListLead {
  phone_e164?: string | null;
  whatsapp_e164?: string | null;
  preferred_language?: string | null;
}

interface WeekStats {
  leads: number;
  messages: number;
  emails: number;
  calls: number;
  conversions: number;
}

const KPI_CARDS: Array<{
  key: keyof WeekStats; label: string; href: string; Icon: any; tone: string;
}> = [
  { key: "leads",       label: "Total leads",  href: "/broker/leads",                    Icon: Users,         tone: "text-blue-600 border-blue-500" },
  { key: "messages",    label: "Messages",     href: "/broker/ai?tab=chat",              Icon: MessageSquare, tone: "text-emerald-600 border-emerald-500" },
  { key: "emails",      label: "Emails",       href: "/broker/inbox",                    Icon: Mail,          tone: "text-amber-600 border-amber-500" },
  { key: "calls",       label: "Calls",        href: "/broker/calendar?view=calls",      Icon: Phone,         tone: "text-[#102540] border-[#102540]" },
  { key: "conversions", label: "Conversions",  href: "/broker/deals?stage=won",          Icon: TrendingUp,    tone: "text-emerald-700 border-emerald-700" },
];

export default function AIBrokerWorkspace() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<LeadFilters>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<WeekStats>({ leads: 0, messages: 0, emails: 0, calls: 0, conversions: 0 });

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [insights, setInsights] = useState<{ score?: number; reason?: string; matches?: Match[]; next?: string }>({});

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/broker/ai");
  }, [user, authLoading, navigate]);

  useEffect(() => { if (user) bootstrap(); /* eslint-disable-next-line */ }, [user]);
  useEffect(() => { if (selectedId) loadChat(selectedId); }, [selectedId]);

  const bootstrap = async () => {
    setLoading(true);
    try {
      // Leads — owner sees all, broker sees own
      const { data: leadRows } = await supabase
        .from("crm_leads")
        .select("id, full_name, notes, pipeline_stage, source, created_at, ai_score, phone_e164, whatsapp_e164, preferred_language")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      const ls = (leadRows ?? []) as Lead[];
      setLeads(ls);
      if (ls.length && !selectedId) setSelectedId(ls[0].id);

      // Weekly stats (best-effort)
      try {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: weekLeads } = await supabase
          .from("crm_leads")
          .select("id, pipeline_stage, last_contacted_at, account_status")
          .gte("created_at", since);
        const wl = weekLeads ?? [];
        setStats({
          leads: wl.length,
          messages: wl.filter((l: any) => l.last_contacted_at).length,
          emails: 0,
          calls: 0,
          conversions: wl.filter((l: any) => ["won", "closed_won", "converted"].includes((l.pipeline_stage || "").toLowerCase())).length,
        });
      } catch { /* no-op */ }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (leadId: string) => {
    try {
      const { data } = await supabase
        .from("broker_ai_chats")
        .select("id, role, content, structured, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true })
        .limit(50);
      const rows = (data ?? []) as any[];
      setTurns(rows.map(r => ({
        id: r.id,
        role: r.role,
        content: r.content,
        draft_message: r.structured?.draft_message ?? null,
      })).filter(t => t.role === "user" || t.role === "assistant"));
      // Hydrate insights from last assistant turn
      const lastA = [...rows].reverse().find(r => r.role === "assistant" && r.structured);
      if (lastA?.structured) {
        setInsights({
          score: lastA.structured.score,
          reason: lastA.structured.score_reason,
          matches: lastA.structured.matches,
          next: lastA.structured.next_step,
        });
      } else {
        setInsights({});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await bootstrap();
    if (selectedId) await loadChat(selectedId);
    setRefreshing(false);
    toast.success("Refreshed");
  };

  const handleSend = async (message: string, mode = "freeform") => {
    if (!selectedId) return;
    const tempUserId = `u-${Date.now()}`;
    setTurns(t => [...t, { id: tempUserId, role: "user", content: message }]);
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("broker-ai-assistant", {
        body: { leadId: selectedId, message, mode },
      });
      if (error) throw error;
      const s = data?.structured;
      if (!s) throw new Error("No structured reply");
      setTurns(t => [...t, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: s.reply || "",
        draft_message: s.draft_message,
      }]);
      setInsights({ score: s.score, reason: s.score_reason, matches: s.matches, next: s.next_step });
    } catch (e: any) {
      console.error(e);
      const msg = e?.message?.includes("Rate limit") ? "Rate limit — try again shortly."
        : e?.message?.includes("credits") ? "AI credits exhausted. Add credits to continue."
        : "Assistant failed to reply.";
      toast.error(msg);
    } finally {
      setChatLoading(false);
    }
  };

  // Filtering
  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => l.source && set.add(l.source));
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const periodMs = filters.period === "today" ? 24 * 60 * 60 * 1000
      : filters.period === "7d" ? 7 * 24 * 60 * 60 * 1000
      : filters.period === "30d" ? 30 * 24 * 60 * 60 * 1000
      : null;
    return leads.filter(l => {
      if (q && !l.full_name?.toLowerCase().includes(q) && !(l.notes ?? "").toLowerCase().includes(q)) return false;
      if (filters.stage && (l.pipeline_stage || "new") !== filters.stage) return false;
      if (filters.source && l.source !== filters.source) return false;
      if (filters.hasNote && !l.notes?.trim()) return false;
      if (periodMs && now - new Date(l.created_at).getTime() > periodMs) return false;
      return true;
    });
  }, [leads, search, filters]);

  const selected = leads.find(l => l.id === selectedId) || null;

  if (authLoading || loading) {
    return <BrandedLoader text="Loading AI Sales Assistant…" className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA]" data-no-contrast-guard>
      <header className="bg-[#FDFBF7] border-b border-[#B89555]/30 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">JBJ GLOBAL REAL ESTATE</div>
            <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A] flex items-center gap-2 mt-0.5">
              <Sparkles className="h-4 w-4 text-[#B89555]" /> AI Sales Assistant
            </h1>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 w-9 grid place-items-center rounded-lg border border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-5 space-y-5">
        {/* KPI cards — clickable */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {KPI_CARDS.map(({ key, label, href, Icon, tone }) => (
            <Link
              key={key}
              to={href}
              className="group rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-3.5 hover:border-[#B89555] hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className={`h-8 w-8 rounded-lg border bg-transparent grid place-items-center ${tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#1A1A1A]/30 group-hover:text-[#1A1A1A] transition-colors" />
              </div>
              <div className="text-2xl font-bold text-[#1A1A1A] mt-2 tabular-nums">{stats[key]}</div>
              <div className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/60 mt-0.5">{label}</div>
              <div className="text-[10px] text-[#1A1A1A]/40 mt-0.5">Last 7 days</div>
            </Link>
          ))}
        </div>

        {/* Three-pane workspace */}
        <div className="flex flex-col lg:flex-row gap-4">
          <AssistantLeadList
            leads={filtered}
            selectedId={selectedId ?? undefined}
            onSelect={setSelectedId}
            search={search}
            onSearch={setSearch}
            rightSlot={
              <LeadFiltersPopover value={filters} onChange={setFilters} sourceOptions={sourceOptions} />
            }
          />

          <div className="flex-1 flex flex-col gap-3">
            {selected && (
              <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A1A1A] truncate">{selected.full_name}</div>
                  <div className="text-[11px] text-[#1A1A1A]/60 truncate">
                    {selected.pipeline_stage || "new"}
                    {selected.source ? ` · ${selected.source}` : ""}
                    {selected.preferred_language ? ` · prefers ${selected.preferred_language}` : ""}
                  </div>
                </div>
                <Link
                  to={`/broker/leads/${selected.id}`}
                  className="text-[11px] font-semibold text-[#102540] hover:underline inline-flex items-center gap-1"
                >
                  Open lead <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
            <AssistantChat
              turns={turns}
              loading={chatLoading}
              onSend={handleSend}
              leadName={selected?.full_name}
              leadPhone={selected?.phone_e164}
              leadWhatsapp={selected?.whatsapp_e164}
              disabled={!selectedId}
            />
          </div>

          <AssistantInsights
            score={insights.score}
            scoreReason={insights.reason}
            matches={insights.matches}
            nextStep={insights.next}
            onUseMatch={(m) => handleSend(`Draft a WhatsApp message to ${selected?.full_name?.split(" ")[0] || "the client"} proposing ${m.name} by ${m.developer}. Be warm and concise.`, "draft")}
          />
        </div>
      </div>
    </div>
  );
}
