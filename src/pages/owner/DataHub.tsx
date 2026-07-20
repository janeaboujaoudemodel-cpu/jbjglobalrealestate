/**
 * Data Hub — Phase 3
 * Central place to view databases, the unassigned lead pool, and to distribute
 * leads to brokers with AI scoring.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Sparkles, Users, Database, Send, RefreshCw, Phone, Star } from "lucide-react";
import CallDetailSheet from "@/components/broker-crm/CallDetailSheet";

type Broker = { user_id: string; display_name: string | null; current_tier: string | null };
import LeadCallButton from "@/components/crm/LeadCallButton";
type LeadRow = { id: string; full_name: string | null; source: string | null; preferred_location: string | null; created_at: string; phone_e164?: string | null; phone_normalized?: string | null; email_normalized?: string | null };
type CallRow = { id: string; lead_id: string | null; phone_number: string | null; duration_seconds: number | null; call_status: string | null; ai_summary: string | null; ai_score: number | null; ai_processed_at: string | null; created_at: string; user_id: string; lead_name?: string | null; broker_name?: string | null };

export default function DataHub() {
  const [tab, setTab] = useState<"pool" | "distribution" | "databases" | "calls">("distribution");
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [openCallId, setOpenCallId] = useState<string | null>(null);
  const [openCallLead, setOpenCallLead] = useState<string | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [pool, setPool] = useState<LeadRow[]>([]);
  const [poolCount, setPoolCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [count, setCount] = useState<number>(20);
  const [showContact, setShowContact] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [dbCounts, setDbCounts] = useState<Record<string, number>>({});

  async function refresh() {
    setLoading(true);
    const [{ data: b }, { data: assigned }, { count: leadsTotal }] = await Promise.all([
      supabase.from("broker_profiles").select("user_id, display_name, current_tier").eq("is_active", true).order("display_name").limit(500),
      supabase.from("crm_lead_assignments").select("lead_id").is("unassigned_at", null).not("status", "in", "(returned,junk,lost)"),
      supabase.from("crm_leads").select("id", { count: "exact", head: true }).is("deleted_at", null),
    ]);
    const assignedSet = new Set((assigned ?? []).map((r: any) => r.lead_id));
    const { data: leads } = await supabase
      .from("crm_leads")
      .select("id, full_name, source, preferred_location, created_at, phone_e164, phone_normalized, email_normalized")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    const unassigned = (leads ?? []).filter((l: any) => !assignedSet.has(l.id));
    setBrokers((b ?? []) as any);
    setPool(unassigned as any);
    setPoolCount((leadsTotal ?? 0) - assignedSet.size);

    // DB counts (quick sample of registries)
    const dbs = ["crm_leads", "broker_profiles", "crm_brokerages", "developers", "client_investors"];
    const results = await Promise.all(dbs.map((t) => supabase.from(t as any).select("id", { count: "exact", head: true })));
    const counts: Record<string, number> = {};
    dbs.forEach((t, i) => (counts[t] = results[i].count ?? 0));
    setDbCounts(counts);

    // Recent AI-analyzed calls
    const { data: callData } = await supabase
      .from("broker_call_logs")
      .select("id, lead_id, phone_number, duration_seconds, call_status, ai_summary, ai_score, ai_processed_at, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(50);
    const leadIds = Array.from(new Set((callData ?? []).map((c: any) => c.lead_id).filter(Boolean)));
    const brokerIds = Array.from(new Set((callData ?? []).map((c: any) => c.user_id).filter(Boolean)));
    const [{ data: leadNames }, { data: brokerNames }] = await Promise.all([
      leadIds.length ? supabase.from("crm_leads").select("id, full_name").in("id", leadIds) : Promise.resolve({ data: [] as any[] }),
      brokerIds.length ? supabase.from("broker_profiles").select("user_id, display_name").in("user_id", brokerIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const lm = new Map((leadNames ?? []).map((r: any) => [r.id, r.full_name]));
    const bm = new Map((brokerNames ?? []).map((r: any) => [r.user_id, r.display_name]));
    setCalls(((callData ?? []) as any[]).map((c) => ({ ...c, lead_name: lm.get(c.lead_id) ?? null, broker_name: bm.get(c.user_id) ?? null })));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function distribute() {
    if (!selectedBroker) return toast.error("Pick a broker first");
    setDistributing(true);
    try {
      const { data, error } = await supabase.functions.invoke("distribute-leads", {
        body: { brokerId: selectedBroker, count, showContactDetails: showContact },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Distributed ${(data as any).count} leads${(data as any).ai_used ? " (AI-scored)" : ""}`);
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Distribution failed");
    } finally {
      setDistributing(false);
    }
  }

  const dbList = useMemo(() => [
    { key: "crm_leads", label: "Leads (CRM)", icon: Users },
    { key: "broker_profiles", label: "Brokers", icon: Users },
    { key: "crm_brokerages", label: "Brokerage Agencies", icon: Database },
    { key: "developers", label: "Developers", icon: Database },
    { key: "client_investors", label: "Investors", icon: Users },
  ], []);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Full-bleed emerald hero — data-surface="emerald" opts elements out of the champagne ink coercion */}
      <div data-surface="emerald" data-on-dark data-no-contrast-guard className="w-full" style={{ background: "linear-gradient(180deg,#064E3B 0%,#042c1c 60%,#000 100%)" }}>
        <div className="max-w-[1400px] mx-auto px-6 py-10" data-surface="emerald" data-on-dark>
          <h1 data-surface="emerald" data-on-dark className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: "#ffffff" }}>Data Hub</h1>
          <p data-surface="emerald" data-on-dark className="mt-2 max-w-2xl" style={{ color: "rgba(255,255,255,0.85)" }}>Central databases, unassigned lead pool, and AI-driven distribution to your brokers.</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3" data-surface="emerald" data-on-dark>
            <StatTile label="Unassigned leads" value={poolCount} />
            <StatTile label="Active brokers" value={brokers.length} />
            <StatTile label="Total leads" value={dbCounts.crm_leads ?? 0} />
            <StatTile label="Developers" value={dbCounts.developers ?? 0} />
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="bg-white border">
            <TabsTrigger value="distribution"><Sparkles className="h-4 w-4 mr-2" />AI Distribution</TabsTrigger>
            <TabsTrigger value="pool"><Users className="h-4 w-4 mr-2" />Lead Pool</TabsTrigger>
            <TabsTrigger value="databases"><Database className="h-4 w-4 mr-2" />Databases</TabsTrigger>
            <TabsTrigger value="calls"><Phone className="h-4 w-4 mr-2" />AI Calls</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="mt-6">
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Broker</Label>
                    <select
                      value={selectedBroker}
                      onChange={(e) => setSelectedBroker(e.target.value)}
                      className="w-full mt-1 h-10 rounded-md border px-3 bg-white"
                    >
                      <option value="">Select a broker…</option>
                      {brokers.map((b) => (
                        <option key={b.user_id} value={b.user_id}>
                          {b.display_name ?? b.user_id.slice(0, 8)} {b.current_tier ? `· ${b.current_tier}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Number of leads</Label>
                    <div className="flex gap-2 mt-1">
                      {[10, 20, 40, 100].map((n) => (
                        <Button key={n} type="button" variant={count === n ? "default" : "outline"} size="sm" onClick={() => setCount(n)}>
                          {n}
                        </Button>
                      ))}
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={count}
                        onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value || "1", 10))))}
                        className="w-24"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={showContact} onChange={(e) => setShowContact(e.target.checked)} />
                    Show contact details to broker
                  </label>
                  <Button
                    onClick={distribute}
                    disabled={distributing || !selectedBroker || poolCount === 0}
                    className="bg-[#064E3B] hover:bg-[#053a2c] !text-white"
                  >
                    {distributing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Distribute {count} leads with AI
                  </Button>
                </div>
                <div className="text-sm text-neutral-700 space-y-2">
                  <p><strong>How it works:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Pulls {count} leads from the unassigned pool.</li>
                    <li>Lovable AI scores each lead against the broker's specializations and tier.</li>
                    <li>Locks the top matches to the broker until they mark them contacted, closed, or junk.</li>
                    <li>Junk-flagged leads return to the pool automatically.</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pool" className="mt-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Unassigned leads ({poolCount})</h3>
                <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
              </div>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : pool.length === 0 ? (
                <p className="text-sm text-neutral-600 py-8 text-center">Pool is empty — every lead is currently assigned.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left">
                      <tr><th className="p-2">Name</th><th className="p-2">Source</th><th className="p-2">Location</th><th className="p-2">Created</th><th className="p-2">Action</th></tr>
                    </thead>
                    <tbody>
                      {pool.slice(0, 100).map((l) => (
                        <tr key={l.id} className="border-t">
                          <td className="p-2">{l.full_name ?? "—"}</td>
                          <td className="p-2">{l.source ?? "—"}</td>
                          <td className="p-2">{l.preferred_location ?? "—"}</td>
                          <td className="p-2 text-neutral-500">{new Date(l.created_at).toLocaleDateString()}</td>
                          <td className="p-2">
                            <LeadCallButton
                              lead={{
                                id: l.id,
                                full_name: l.full_name,
                                phone: l.phone_e164 ?? l.phone_normalized ?? null,
                                email: l.email_normalized ?? null,
                              }}
                              onSaved={refresh}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="databases" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {dbList.map((d) => (
                <Card key={d.key} className="p-5">
                  <div className="flex items-center gap-2 text-neutral-500 text-sm"><d.icon className="h-4 w-4" />{d.label}</div>
                  <div className="text-3xl font-semibold mt-2">{(dbCounts[d.key] ?? 0).toLocaleString()}</div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div data-surface="emerald" data-on-dark className="rounded-lg border border-white/15 bg-white/5 backdrop-blur px-4 py-3">
      <div data-surface="emerald" data-on-dark className="text-xs uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</div>
      <div data-surface="emerald" data-on-dark className="text-2xl font-semibold mt-1" style={{ color: "#ffffff" }}>{value.toLocaleString()}</div>
    </div>
  );
}
