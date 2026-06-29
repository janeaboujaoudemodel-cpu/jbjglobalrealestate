import { useEffect, useState } from "react";
import { Shield, Crown, Eye, FileText, Building2, RefreshCw, ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getVaultSignedUrl, formatAed, VIP_LABEL } from "@/lib/vault";
import OwnerGuard from "@/components/OwnerGuard";
import { toast } from "sonner";

type Row = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  total_invested_aed: number;
  property_count: number;
  verified_count: number;
  vip_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  rank_position: number;
};

const TIER_BADGE: Record<Row["vip_tier"], string> = {
  diamond:  "bg-[#1A1A1A] text-white",
  platinum: "bg-[#064E3B] text-white",
  gold:     "bg-[#B89555] text-white",
  silver:   "bg-[#94a3b8] text-white",
  bronze:   "bg-[#a16207] text-white",
};

export default function OwnerVaultPanel() {
  return (
    <OwnerGuard>
      <Inner />
    </OwnerGuard>
  );
}

function Inner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data: rankings, error } = await supabase
        .from("vault_investor_ranking")
        .select("*")
        .order("rank_position", { ascending: true });
      if (error) throw error;

      const ids = (rankings ?? []).map((r: any) => r.user_id);
      let profiles: Record<string, { full_name: string | null; email: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ids);
        for (const p of (profs ?? []) as any[]) profiles[p.id] = { full_name: p.full_name, email: p.email };
      }
      setRows((rankings ?? []).map((r: any) => ({
        ...r,
        full_name: profiles[r.user_id]?.full_name ?? null,
        email:     profiles[r.user_id]?.email     ?? null,
      })));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (selected) {
    return <ClientFolder row={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <div
          className="rounded-2xl p-6 text-white"
          style={{ backgroundImage: "var(--jj-emerald-ombre, linear-gradient(135deg,#064E3B,#042c1c))" }}
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] opacity-90">
            <Shield className="w-3.5 h-3.5" /> Owner · Encrypted Client Vault
          </div>
          <h1 className="text-2xl font-semibold mt-1">Investors ranked by total invested (AED)</h1>
          <p className="text-sm opacity-90 mt-1 max-w-2xl">
            Every uploaded passport, Emirates ID, visa, title deed and contract is here, organised
            per client. Files open through 60-second signed links — every view is audit-logged.
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-[#1A1A1A]/60">{rows.length} client{rows.length === 1 ? "" : "s"} with vault data</div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F2EA] text-[11px] uppercase tracking-wide text-[#1A1A1A]/70">
                <tr>
                  <th className="text-left p-3">Rank</th>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">Tier</th>
                  <th className="text-right p-3">Invested</th>
                  <th className="text-right p-3">Properties</th>
                  <th className="text-right p-3">Verified</th>
                  <th className="text-right p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-t border-[#B89555]/15 hover:bg-[#F7F2EA]/40">
                    <td className="p-3 font-semibold text-[#064E3B]">#{r.rank_position}</td>
                    <td className="p-3">
                      <div className="font-semibold text-[#1A1A1A]">{r.full_name ?? "—"}</div>
                      <div className="text-[11px] text-[#1A1A1A]/55">{r.email ?? r.user_id.slice(0, 8)}</div>
                    </td>
                    <td className="p-3">
                      <Badge className={`${TIER_BADGE[r.vip_tier]} text-[10px]`}>
                        <Crown className="w-3 h-3 mr-1" /> {VIP_LABEL[r.vip_tier]}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-semibold">{formatAed(Number(r.total_invested_aed))}</td>
                    <td className="p-3 text-right">{r.property_count}</td>
                    <td className="p-3 text-right">{r.verified_count}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> Open folder
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-[#1A1A1A]/55">No vault data yet.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientFolder({ row, onBack }: { row: Row; onBack: () => void }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    setLoading(true);
    try {
      const [{ data: d }, { data: p }] = await Promise.all([
        supabase.from("vault_documents").select("*").eq("user_id", row.user_id).order("category"),
        supabase.from("vault_properties").select("*").eq("user_id", row.user_id).order("purchase_price_aed", { ascending: false }),
      ]);
      setDocs(d ?? []); setProps(p ?? []);
    } finally { setLoading(false); }
  })(); }, [row.user_id]);

  async function view(id: string) {
    try {
      const { url } = await getVaultSignedUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) { toast.error((e as Error).message); }
  }

  const grouped = docs.reduce<Record<string, any[]>>((acc, d) => {
    (acc[d.category] ??= []).push(d); return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <Button size="sm" variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back to rankings</Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#064E3B]" /> {row.full_name ?? row.email ?? row.user_id}
            </CardTitle>
            <div className="text-xs text-[#1A1A1A]/60 mt-1">
              Rank #{row.rank_position} · {VIP_LABEL[row.vip_tier]} · {formatAed(Number(row.total_invested_aed))} invested
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-[#064E3B]" /> Properties</CardTitle></CardHeader>
          <CardContent>
            {props.length === 0 ? <div className="text-sm text-[#1A1A1A]/55">No properties added.</div> : (
              <div className="space-y-2">
                {props.map((p) => (
                  <div key={p.id} className="flex justify-between border border-[#B89555]/20 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-sm font-semibold">{p.project_name} {p.unit_number ? `· #${p.unit_number}` : ""}</div>
                      <div className="text-[11px] text-[#1A1A1A]/60">{[p.developer_name, p.area, p.emirate].filter(Boolean).join(" · ")}</div>
                    </div>
                    <div className="text-sm font-semibold text-[#064E3B]">{formatAed(Number(p.purchase_price_aed))}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {Object.entries(grouped).map(([cat, list]) => (
          <Card key={cat}>
            <CardHeader><CardTitle className="text-base capitalize flex items-center gap-2"><FileText className="w-4 h-4 text-[#064E3B]" /> {cat}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {list.map((d) => (
                  <button key={d.id} onClick={() => view(d.id)} className="text-left border border-[#B89555]/20 rounded-lg p-3 hover:bg-[#F7F2EA]/50 transition">
                    <div className="text-sm font-semibold truncate">{d.display_name}</div>
                    <div className="text-[11px] text-[#1A1A1A]/55">{d.mime_type} · {(d.size_bytes / 1024).toFixed(0)} KB</div>
                    <div className="text-[11px] text-[#064E3B] mt-1 inline-flex items-center gap-1"><Eye className="w-3 h-3" /> View securely</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && docs.length === 0 && (
          <Card><CardContent className="p-8 text-center text-sm text-[#1A1A1A]/55">No documents uploaded by this client.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
