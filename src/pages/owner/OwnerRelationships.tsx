import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Mail, ExternalLink, MapPin, Send } from "lucide-react";

const EMIRATES = ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"];

const cleanDomain = (url?: string | null) => {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};

type Row = Record<string, any>;

function DirectoryTable({ kind }: { kind: "developers" | "brokerages" }) {
  const table = kind === "developers" ? "rel_developers" : "rel_brokerages";
  const statusField = kind === "developers" ? "registration_status" : "onboarding_status";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [emirateFilter, setEmirateFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [campaigns, setCampaigns] = useState<Row[]>([]);
  const [campaignId, setCampaignId] = useState<string>("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from(table).select("*").order("name");
    setRows(data ?? []);
    const { data: c } = await (supabase as any).from("rel_email_campaigns")
      .select("*").eq("audience", kind);
    setCampaigns(c ?? []);
    if (c?.[0]) setCampaignId(c[0].id);
    setLoading(false);
  };
  useEffect(() => { load(); }, [kind]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (emirateFilter.length && !emirateFilter.includes(r.hq_emirate)) return false;
    if (statusFilter !== "all" && r[statusField] !== statusFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [rows, emirateFilter, statusFilter, search]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  };

  const sendCampaign = async (testOnly: boolean) => {
    if (!campaignId) { toast.error("Pick a campaign"); return; }
    setSending(true);
    try {
      const body: any = { campaign_id: campaignId };
      if (testOnly) {
        const email = prompt("Test recipient email:");
        if (!email) { setSending(false); return; }
        body.test_recipient = email;
      }
      const { data, error } = await (supabase as any).functions.invoke("rel-send-bulk-email", { body });
      if (error) throw error;
      toast.success(`Sent ${data.sent}/${data.total} (failed ${data.failed})`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Send failed");
    } finally { setSending(false); }
  };

  if (loading) return <div className="p-8 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 p-4 bg-[#F7F2EA] border border-[#B89555]/30 rounded-md">
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {EMIRATES.map((e) => (
            <button
              key={e}
              onClick={() => setEmirateFilter((s) => s.includes(e) ? s.filter((x) => x !== e) : [...s, e])}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                emirateFilter.includes(e)
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-white text-[#1A1A1A] border-[#B89555]/40 hover:bg-[#EFE6D6]"
              }`}
            >{e}</button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1 text-sm border border-[#B89555]/40 rounded bg-white"
        >
          <option value="all">All statuses</option>
          {kind === "developers"
            ? ["not_started","submitted","approved","rejected"].map((s) => <option key={s}>{s}</option>)
            : ["not_invited","invited","registered","active","paused"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="px-2 py-1 text-sm border border-[#B89555]/40 rounded bg-white"
        >
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Button onClick={() => sendCampaign(true)} variant="outline" disabled={sending}>
          <Send className="w-3.5 h-3.5 mr-1" /> Test send
        </Button>
        <Button onClick={() => sendCampaign(false)} disabled={sending} className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
          {sending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Mail className="w-3.5 h-3.5 mr-1" />}
          Send to all matching
        </Button>
      </div>

      <div className="text-xs text-[#1A1A1A]/70 px-1">
        {filtered.length} of {rows.length} · {selected.size} selected
      </div>

      <div className="overflow-auto border border-[#B89555]/30 rounded-md bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
            <tr>
              <th className="p-2 text-left w-8"></th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Emirate</th>
              <th className="p-2 text-left">Website</th>
              <th className="p-2 text-left">Address</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-[#B89555]/15 hover:bg-[#FDFBF7]">
                <td className="p-2"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td className="p-2 font-semibold text-[#1A1A1A]">{r.name}</td>
                <td className="p-2">{r.hq_emirate}</td>
                <td className="p-2">
                  {r.website && <a href={r.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#1A1A1A] underline decoration-[#B89555]/60 hover:decoration-[#B89555]">
                    {cleanDomain(r.website)} <ExternalLink className="w-3 h-3" />
                  </a>}
                </td>
                <td className="p-2 text-[#1A1A1A]/80">
                  {r.google_maps_url
                    ? <a href={r.google_maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-[#B89555]/40">
                        <MapPin className="w-3 h-3" /> {r.hq_address}
                      </a>
                    : r.hq_address}
                </td>
                <td className="p-2">
                  <Badge variant="outline" className="border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A]">
                    {r[statusField]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OwnerRelationships() {
  return (
    <div className="p-6 space-y-6 bg-[#FDFBF7] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Relationships Hub</h1>
          <p className="text-sm text-[#1A1A1A]/70">
            UAE developers we sell for · UAE brokerages selling Citi Developers
          </p>
        </div>
        <Link to="/owner/relationships/revenue">
          <Button variant="outline" className="border-[#B89555]/40">Revenue ledger →</Button>
        </Link>
      </div>

      <Tabs defaultValue="developers">
        <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30">
          <TabsTrigger value="developers">Developers</TabsTrigger>
          <TabsTrigger value="brokerages">Brokerages</TabsTrigger>
        </TabsList>
        <TabsContent value="developers" className="mt-4">
          <DirectoryTable kind="developers" />
        </TabsContent>
        <TabsContent value="brokerages" className="mt-4">
          <DirectoryTable kind="brokerages" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
