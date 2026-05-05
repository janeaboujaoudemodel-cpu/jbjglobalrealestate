import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { Archive, Search, Download, FileSignature, Stamp, Upload, Sparkles, FileText } from "lucide-react";
import { AgreementUploadDrawer } from "@/components/owner/contracts/AgreementUploadDrawer";

interface SignedRow {
  signed_document_id: string;
  envelope_id: string;
  envelope_name: string;
  envelope_status: string;
  document_url: string;
  document_filename: string;
  signed_at: string;
  primary_recipient_name: string | null;
  primary_recipient_email: string | null;
  developer_name: string | null;
  emirate: string | null;
  area: string | null;
}

export default function ContractVault() {
  const [q, setQ] = useState("");
  const [emirate, setEmirate] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: agreements = [] } = useQuery({
    queryKey: ["external_agreements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_agreements" as any)
        .select("id, developer_id, developer_name_raw, contract_type, file_url, file_name, effective_date, expiry_date, commission_pct, ai_confidence, status, uploaded_at")
        .order("uploaded_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["signed_contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signed_contracts_index" as any)
        .select("*")
        .order("signed_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as SignedRow[];
    },
  });

  const emirates = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => r.emirate && set.add(r.emirate));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.filter((r) => {
      if (emirate !== "all" && r.emirate !== emirate) return false;
      if (!term) return true;
      return (
        r.envelope_name?.toLowerCase().includes(term) ||
        r.developer_name?.toLowerCase().includes(term) ||
        r.primary_recipient_name?.toLowerCase().includes(term) ||
        r.primary_recipient_email?.toLowerCase().includes(term) ||
        r.area?.toLowerCase().includes(term)
      );
    });
  }, [data, q, emirate]);

  return (
    <div className="p-6 space-y-6 bg-[#FDFBF7] min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <IconTile icon={Archive} tone="gold" />
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Contract Vault</h1>
            <p className="text-sm text-[#1A1A1A]/70">Every signed contract — searchable by developer, emirate, area.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setUploadOpen(true)} variant="gold">
            <Upload className="h-4 w-4 mr-2" />
            Upload Agreement
          </Button>
          <Button asChild variant="outline" className="border-gold/40 text-[#1A1A1A]">
            <Link to="/owner/sign">
              <Stamp className="h-4 w-4 mr-2" />
              Manage signature & stamp
            </Link>
          </Button>
        </div>
      </div>

      {/* External agreements (uploaded developer contracts) */}
      <Card className="bg-[#F7F2EA] border-gold/20">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-[#1A1A1A] text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--gold))]" />
            Developer Agreements
            <Badge variant="outline" className="border-gold/40 text-[#1A1A1A] ml-2">
              {agreements.length}
            </Badge>
          </CardTitle>
          <p className="text-xs text-[#1A1A1A]/60">AI-matched, filed by developer</p>
        </CardHeader>
        <CardContent className="p-0">
          {agreements.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#1A1A1A]/60">
              <FileText className="h-8 w-8 mx-auto mb-2 text-[#1A1A1A]/30" />
              No agreements uploaded yet. Drop a Sobha / Emaar / Damac contract — AI will file it for you.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Developer</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Effective</th>
                    <th className="text-left px-4 py-3 font-semibold">Expires</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-right px-4 py-3 font-semibold">File</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((a) => (
                    <tr key={a.id} className="border-t border-gold/15 hover:bg-[#FDFBF7]">
                      <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                        {a.developer_name_raw ?? "—"}
                        {a.ai_confidence != null && (
                          <span className="ml-2 text-[10px] text-[#1A1A1A]/50">
                            {Math.round(a.ai_confidence * 100)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#1A1A1A]/80">{a.contract_type ?? "—"}</td>
                      <td className="px-4 py-3 text-[#1A1A1A]/80">{a.effective_date ?? "—"}</td>
                      <td className="px-4 py-3 text-[#1A1A1A]/80">{a.expiry_date ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={a.status === "filed" ? "border-emerald-600/40 text-emerald-700" : "border-amber-500/50 text-amber-700"}>
                          {a.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="outline" className="border-gold/40 text-[#1A1A1A]">
                          <a href={a.file_url} target="_blank" rel="noreferrer">
                            <Download className="h-3 w-3 mr-1" />
                            Open
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#F7F2EA] border-gold/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#1A1A1A] text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/50" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search developer, area, recipient…"
              className="pl-9 bg-[#FDFBF7] border-gold/25 text-[#1A1A1A]"
            />
          </div>
          <select
            value={emirate}
            onChange={(e) => setEmirate(e.target.value)}
            className="h-10 px-3 rounded-md border border-gold/25 bg-[#FDFBF7] text-[#1A1A1A] text-sm"
          >
            <option value="all">All emirates</option>
            {emirates.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <Badge variant="outline" className="border-gold/40 text-[#1A1A1A]">
            {filtered.length} contract{filtered.length === 1 ? "" : "s"}
          </Badge>
        </CardContent>
      </Card>

      <Card className="bg-[#F7F2EA] border-gold/20">
        <CardContent className="p-0">
          {isLoading && <p className="p-6 text-sm text-[#1A1A1A]/60">Loading…</p>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-12 text-center">
              <FileSignature className="h-10 w-10 mx-auto text-[#1A1A1A]/30 mb-2" />
              <p className="text-sm text-[#1A1A1A]/70">No signed contracts yet.</p>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Document</th>
                    <th className="text-left px-4 py-3 font-semibold">Developer / Recipient</th>
                    <th className="text-left px-4 py-3 font-semibold">Emirate</th>
                    <th className="text-left px-4 py-3 font-semibold">Area</th>
                    <th className="text-left px-4 py-3 font-semibold">Signed</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.signed_document_id} className="border-t border-gold/15 hover:bg-[#FDFBF7]">
                      <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                        {row.envelope_name}
                        <div className="text-xs text-[#1A1A1A]/60">{row.document_filename}</div>
                      </td>
                      <td className="px-4 py-3 text-[#1A1A1A]">
                        {row.developer_name ?? row.primary_recipient_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#1A1A1A]/80">{row.emirate ?? "—"}</td>
                      <td className="px-4 py-3 text-[#1A1A1A]/80">{row.area ?? "—"}</td>
                      <td className="px-4 py-3 text-[#1A1A1A]/80">
                        {new Date(row.signed_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="sm" variant="outline" className="border-gold/40 text-[#1A1A1A]">
                            <a href={row.document_url} target="_blank" rel="noreferrer">
                              <Download className="h-3 w-3 mr-1" />
                              Open
                            </a>
                          </Button>
                          <Button asChild size="sm" variant="gold">
                            <Link to={`/owner/sign/${row.envelope_id}`}>
                              <Stamp className="h-3 w-3 mr-1" />
                              Sign again
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AgreementUploadDrawer open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
